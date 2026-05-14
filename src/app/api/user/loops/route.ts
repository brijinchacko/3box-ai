import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { isValidEmployer, isNonJobTitle } from '@/lib/jobs/filters';

/* GET /api/user/loops — List all search profiles */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profiles = await prisma.searchProfile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      jobTitle: true,
      location: true,
      remote: true,
      workArrangement: true,
      active: true,
      jobsFound: true,
      appliedCount: true,
      createdAt: true,
      experienceLevel: true,
      boards: true,
      includeKeywords: true,
      excludeKeywords: true,
      excludeCompanies: true,
      matchTolerance: true,
      autoApply: true,
      autoSearch: true,
    },
  });

  // Compute per-profile applied/jobsFound counts.
  //
  // Approach: fetch ScoutJobs, apply the SAME quality filter every other
  // route uses (so legacy "Unknown Company" rows don't inflate the
  // counts), then match each surviving job to the profile(s) whose role
  // title appears as a substring of the job title.
  //
  // Previously we filtered out PORTAL_NAMES companies but NOT
  // placeholders ("Unknown Company", "Confidential", etc.), so any
  // legacy auto-applied row with status APPLIED/EMAILED kept inflating
  // the per-profile "X applied" badge to numbers the user couldn't
  // see in the board.
  const allJobs = await prisma.scoutJob.findMany({
    where: { userId: session.user.id },
    select: { company: true, title: true, status: true },
    take: 2000,
  });

  const STATUS_PRIORITY: Record<string, number> = {
    'WITHDRAWN': 0, 'EXPIRED': 0, 'NEW': 1, 'SKIPPED': 1,
    'SCORED': 2, 'SAVED': 3, 'READY': 4,
    'FORGE_PENDING': 5, 'FORGE_READY': 6,
    'QUEUED': 7, 'APPLYING': 8,
    'APPLIED': 9, 'EMAILED': 10, 'SCREENED': 11, 'INTERVIEW': 12, 'OFFER': 13,
  };

  // Single source of truth for "is this a real job we'd render?".
  // Description / URL / postedAt aren't selected (would balloon the
  // query); isValidEmployer + isNonJobTitle catch the vast majority
  // of legacy garbage with just two cheap fields.
  const visible = allJobs.filter((j) =>
    isValidEmployer(j.company) && !isNonJobTitle(j.title)
  );

  // Dedupe by (company+title) and keep the highest-priority status,
  // mirroring the board endpoint. Result: array of {title, status}.
  const dedup = new Map<string, { title: string; status: string }>();
  for (const j of visible) {
    const compLower = (j.company || '').toLowerCase();
    const key = `${compLower.replace(/[^a-z0-9]/g, '').slice(0, 20)}-${(j.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30)}`;
    const current = dedup.get(key);
    if (!current || (STATUS_PRIORITY[j.status] || 0) > (STATUS_PRIORITY[current.status] || 0)) {
      dedup.set(key, { title: j.title || '', status: j.status });
    }
  }
  const dedupedJobs = Array.from(dedup.values());

  // Per-profile match: a job belongs to a profile when the profile's
  // normalized jobTitle appears as a substring of the job's normalized
  // title. Same logic Archer uses at apply time, so the counts here
  // agree with what the auto-apply path actually targets.
  const normalize = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const enrichedProfiles = profiles.map((p) => {
    const roleNorm = normalize(p.jobTitle);
    if (!roleNorm || roleNorm.length < 2) {
      return { ...p, appliedCount: 0, jobsFound: 0 };
    }
    let appliedCount = 0;
    let jobsFound = 0;
    for (const j of dedupedJobs) {
      const titleNorm = normalize(j.title);
      if (!titleNorm.includes(roleNorm)) continue;
      jobsFound++;
      if (j.status === 'APPLIED' || j.status === 'EMAILED') appliedCount++;
    }
    return { ...p, appliedCount, jobsFound };
  });

  return NextResponse.json({ profiles: enrichedProfiles });
}

/* POST /api/user/loops — Create a new search profile and sync automation config */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const {
      name,
      jobTitle,
      location,
      remote = false,
      workArrangement,
      experienceLevel,
      boards,
      includeKeywords,
      excludeKeywords,
      excludeCompanies,
      matchTolerance = 70,
      autoApply = false,
      autoSearch = true,
    } = body;

    // Sanitize work-arrangement field.
    const validArrangements = ['onsite', 'hybrid', 'remote'];
    const wa: string | null = typeof workArrangement === 'string' && validArrangements.includes(workArrangement)
      ? workArrangement
      : null;
    // Keep `remote` boolean in sync with workArrangement when provided so
    // legacy code (analytics, board hints) keeps working unchanged.
    const remoteFlag: boolean = wa ? wa === 'remote' : !!remote;

    if (!jobTitle?.trim()) {
      return NextResponse.json({ error: 'Job title is required' }, { status: 400 });
    }

    // Verify resume exists before allowing search setup
    const resume = await prisma.resume.findFirst({
      where: { userId, OR: [{ isFinalized: true }, { approvalStatus: 'ready' }, { approvalStatus: 'approved' }] },
      select: { id: true },
    });

    if (!resume) {
      // If no verified resume but not requesting auto-apply, allow search profile creation
      // (user may just want to browse jobs without auto-applying)
      if (autoApply) {
        return NextResponse.json({ error: 'Please verify your resume before enabling auto-apply.' }, { status: 400 });
      }
      // Create a placeholder so search can proceed
      await prisma.resume.create({
        data: { userId, title: 'My Resume', content: {}, isFinalized: false, approvalStatus: 'ready' },
      }).catch(() => {}); // Ignore if already exists
    }

    // 1. Create the search profile
    const profile = await prisma.searchProfile.create({
      data: {
        userId,
        name: name || `${jobTitle}${location ? ` in ${location}` : ''}`,
        jobTitle: jobTitle.trim(),
        location: location?.trim() || null,
        remote: remoteFlag,
        workArrangement: wa,
        experienceLevel: experienceLevel || null,
        boards: boards || null,
        includeKeywords: includeKeywords?.trim() || null,
        excludeKeywords: excludeKeywords?.trim() || null,
        excludeCompanies: excludeCompanies?.trim() || null,
        matchTolerance,
        autoApply,
        autoSearch,
      },
    });

    // 2. Aggregate ALL active search profiles → sync to AutoApplyConfig
    //    (LoopCV-style: each "loop" feeds the automation engine)
    await syncAutoApplyConfig(userId);

    // 3. Trigger an immediate Scout run in the background so the user gets results fast
    if (autoSearch) {
      triggerScoutRun(userId, jobTitle.trim(), location?.trim() || '').catch(() => {});
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name,
        jobTitle: profile.jobTitle,
        location: profile.location || '',
        remote: profile.remote,
        active: profile.active,
        jobsFound: profile.jobsFound,
        appliedCount: profile.appliedCount,
        createdAt: profile.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[loops/POST]', err);
    return NextResponse.json({ error: 'Failed to create search profile' }, { status: 500 });
  }
}

/* PATCH /api/user/loops — Bulk pause/resume all profiles */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { action } = await req.json();

    if (action === 'pause_all') {
      await prisma.searchProfile.updateMany({
        where: { userId, active: true },
        data: { active: false },
      });
    } else if (action === 'resume_all') {
      await prisma.searchProfile.updateMany({
        where: { userId, active: false },
        data: { active: true },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await syncAutoApplyConfig(userId);

    const profiles = await prisma.searchProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, jobTitle: true, location: true,
        remote: true, active: true, jobsFound: true, appliedCount: true, createdAt: true,
      },
    });

    return NextResponse.json({ profiles, action });
  } catch (err) {
    console.error('[loops/PATCH]', err);
    return NextResponse.json({ error: 'Failed to update profiles' }, { status: 500 });
  }
}

/* ─── Helpers ──────────────────────────────────────────── */

/**
 * Aggregate all active search profiles into AutoApplyConfig
 * so Scout/Archer automation picks up the correct targets.
 */
async function syncAutoApplyConfig(userId: string) {
  const activeProfiles = await prisma.searchProfile.findMany({
    where: { userId, active: true },
    select: {
      jobTitle: true,
      location: true,
      remote: true,
      excludeKeywords: true,
      excludeCompanies: true,
      matchTolerance: true,
      autoApply: true,
      autoSearch: true,
    },
  });

  // Merge all profiles into unified config
  const targetRoles = [...new Set(activeProfiles.map(p => p.jobTitle))];
  const targetLocations = [...new Set(
    activeProfiles.map(p => p.location).filter(Boolean) as string[]
  )];
  const preferRemote = activeProfiles.some(p => p.remote);
  const minMatchScore = activeProfiles.length > 0
    ? Math.min(...activeProfiles.map(p => p.matchTolerance))
    : 60;

  // Merge exclude lists
  const excludeKeywordsSet = new Set<string>();
  const excludeCompaniesSet = new Set<string>();
  for (const p of activeProfiles) {
    if (p.excludeKeywords) {
      p.excludeKeywords.split(',').map((k: string) => k.trim()).filter(Boolean).forEach((k: string) => excludeKeywordsSet.add(k));
    }
    if (p.excludeCompanies) {
      p.excludeCompanies.split(',').map((k: string) => k.trim()).filter(Boolean).forEach((k: string) => excludeCompaniesSet.add(k));
    }
  }

  const hasAutoSearch = activeProfiles.some(p => p.autoSearch);
  const hasAutoApply = activeProfiles.some(p => p.autoApply);

  // Wizard's Auto-Apply toggle is the single source of truth: when no
  // active profile has autoApply=true, force-disable the Smart-Auto
  // path too. Otherwise a previously-enabled smart-auto setting would
  // keep applying behind the user's back.
  const smartAutoUpdate = hasAutoApply ? {} : { autoApplyEnabled: false };

  await prisma.autoApplyConfig.upsert({
    where: { userId },
    update: {
      enabled: hasAutoSearch || hasAutoApply,
      targetRoles,
      targetLocations,
      preferRemote,
      minMatchScore,
      excludeKeywords: [...excludeKeywordsSet],
      excludeCompanies: [...excludeCompaniesSet],
      scoutEnabled: hasAutoSearch,
      scoutAutoMode: hasAutoSearch,
      archerEnabled: hasAutoApply,
      ...smartAutoUpdate,
    },
    create: {
      userId,
      enabled: hasAutoSearch || hasAutoApply,
      automationMode: 'autopilot',
      targetRoles,
      targetLocations,
      preferRemote,
      minMatchScore,
      excludeKeywords: [...excludeKeywordsSet],
      excludeCompanies: [...excludeCompaniesSet],
      scoutEnabled: hasAutoSearch,
      scoutAutoMode: hasAutoSearch,
      archerEnabled: hasAutoApply,
      autoApplyEnabled: hasAutoApply,
    },
  });
}

/**
 * Fire-and-forget: trigger Scout to run immediately with the new profile's criteria.
 */
async function triggerScoutRun(userId: string, targetRole: string, location: string) {
  try {
    const { runScout, persistScoutJobs } = await import('@/lib/agents/scout');

    const result = await runScout({
      userId,
      targetRoles: [targetRole],
      targetLocations: location ? [location] : [],
      preferRemote: false,
      minMatchScore: 50,
      excludeCompanies: [],
      excludeKeywords: [],
      limit: 20,
    });

    const { newCount } = await persistScoutJobs(userId, result.jobs, undefined);

    // Update the profile's jobsFound counter
    if (newCount > 0) {
      await prisma.searchProfile.updateMany({
        where: { userId, jobTitle: targetRole, active: true },
        data: { jobsFound: { increment: newCount } },
      });
    }

    // Log activity
    await prisma.agentActivity.create({
      data: {
        userId,
        agent: 'scout',
        action: 'auto_search',
        summary: `Scout found ${result.totalFound} jobs for "${targetRole}"${location ? ` in ${location}` : ''} (${newCount} new)`,
        details: { totalFound: result.totalFound, newJobs: newCount, sources: result.sources },
        creditsUsed: 0,
      },
    });
  } catch (err) {
    console.error('[loops/triggerScout]', err);
  }
}
