import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { computeDedupeKey } from '@/lib/agents/scout';

/**
 * Hard cap (in days) on how old a job's REAL posting date may be before
 * we hide it from the live board. Mirrors the freshness cutoff used in
 * lib/jobs/discovery.ts so insertion + read paths stay aligned. Stale
 * rows remain in the DB and are queryable via ?archived=true.
 */
const STALE_JOB_CUTOFF_DAYS = 21;

/**
 * Best-effort parse of the postedAt string we persist on ScoutJob. It can be
 * an ISO date, a relative phrase ("5 days ago", "yesterday"), or empty
 * when the source didn't supply one. Returns null on anything we can't
 * confidently date — caller treats null as "unknown" (NOT stale).
 */
function parsePostedAtServer(postedAt: string | null | undefined): Date | null {
  if (!postedAt) return null;
  const s = String(postedAt).trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  const now = Date.now();
  if (/^today$/.test(lower)) return new Date(now);
  if (/^yesterday$/.test(lower)) return new Date(now - 86_400_000);
  const m = lower.match(/^(\d+)\s*(minute|hour|day|week|month|year)s?\s*ago/);
  if (m) {
    const n = parseInt(m[1], 10);
    const ms: Record<string, number> = {
      minute: 60_000, hour: 3_600_000, day: 86_400_000,
      week: 604_800_000, month: 2_592_000_000, year: 31_536_000_000,
    };
    return new Date(now - n * (ms[m[2]] || 0));
  }
  const ts = Date.parse(s);
  if (!Number.isNaN(ts)) return new Date(ts);
  return null;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const period = url.searchParams.get('period'); // day, week, month, all
  // ?archived=true → return ONLY archived rows (Archive tab).
  // Default → only LIVE rows (archivedAt is null).
  const archived = url.searchParams.get('archived') === 'true';

  // Build date filter
  let dateFilter: Date | undefined;
  if (period === 'day') {
    dateFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
  } else if (period === 'week') {
    dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'month') {
    dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  const jobs = await prisma.scoutJob.findMany({
    where: {
      userId: session.user.id,
      ...(dateFilter ? { discoveredAt: { gte: dateFilter } } : {}),
      // Live board hides archived rows; archive tab shows only those.
      archivedAt: archived ? { not: null } : null,
    },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      source: true,
      matchScore: true,
      jobUrl: true,
      postedAt: true,
      discoveredAt: true,
      appliedAt: true,
      archivedAt: true,
      status: true,
    },
    orderBy: archived
      ? { archivedAt: 'desc' }
      : { discoveredAt: 'desc' },
    take: 500,
  });

  // Deduplicate: keep the most advanced status for each company+title combo
  const jobMap = new Map<string, typeof jobs[0]>();
  const statusPriority: Record<string, number> = {
    'WITHDRAWN': 0, 'NEW': 1, 'SCORED': 2, 'SAVED': 3, 'READY': 4,
    'FORGE_PENDING': 5, 'FORGE_READY': 6, 'QUEUED': 7, 'APPLYING': 8,
    'APPLIED': 9, 'EMAILED': 10, 'SCREENED': 11, 'INTERVIEW': 12, 'OFFER': 13,
    'SKIPPED': 1, 'EXPIRED': 0,
  };
  for (const job of jobs) {
    const key = `${job.company.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}-${job.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30)}`;
    const existing = jobMap.get(key);
    if (!existing || (statusPriority[job.status] || 0) > (statusPriority[existing.status] || 0)) {
      jobMap.set(key, job);
    }
  }
  const dedupedJobs = Array.from(jobMap.values());

  // Filter out:
  //   1. Job portal names appearing as companies (Indeed, LinkedIn, etc.)
  //   2. "Unknown Company" / "Unknown" placeholders — these are unactionable
  //      (no real employer name → no cover letters, no targeted matching).
  //      Affects legacy DB rows from before the parsers were tightened.
  //   3. Stale postings whose REAL posted date is older than the cutoff —
  //      these stay in the DB (still in Archive) but never appear on the
  //      live board. Skipped for the Archive tab itself.
  const portalNames = ['shine.com', 'whatjobs', 'whatjobs direct', 'jooble', 'indeed', 'linkedin', 'naukri', 'glassdoor', 'remoteok', 'adzuna', 'dice', 'monster'];
  const placeholderCompanies = new Set(['unknown', 'unknown company', 'confidential', 'na', 'n/a', '']);
  const staleCutoffMs = STALE_JOB_CUTOFF_DAYS * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const cleanedJobs = dedupedJobs.filter(job => {
    const companyRaw = (job.company || '').trim();
    const companyLower = companyRaw.toLowerCase();
    if (portalNames.some(p => companyLower === p || companyLower === `${p}.com`)) return false;
    if (placeholderCompanies.has(companyLower)) return false;

    // Stale-job hide (only on the live board; Archive tab is unaffected).
    if (!archived) {
      const postedDate = parsePostedAtServer(job.postedAt);
      // Only hide when we're CONFIDENT the posting is stale. Unknown
      // dates are kept (some sources just don't supply one) — the UI
      // labels them "Recently posted" and renders neutral coloring.
      if (postedDate && nowMs - postedDate.getTime() > staleCutoffMs) return false;
    }
    return true;
  });

  // Compute status summary for the graph
  const statusCounts: Record<string, number> = {};
  for (const job of cleanedJobs) {
    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
  }

  return NextResponse.json({ jobs: cleanedJobs, statusCounts, total: cleanedJobs.length });
}

/* POST /api/user/board-jobs — Save a job to the board from search results */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, company, jobUrl, location, source, matchScore, description, status, postedAt } = body;

    if (!title || !company || !jobUrl) {
      return NextResponse.json({ error: 'title, company, and jobUrl are required' }, { status: 400 });
    }

    // Build dedupeKey via the centralized helper so board-jobs entries
    // collide with Scout-discovered + quick-apply records for the same job.
    const dedupeKey = computeDedupeKey(company, title, jobUrl, description || '');

    // Preserve the original posting date when supplied. Empty / undefined
    // becomes null so the freshness filter treats it as unknown rather
    // than as "right now". NEVER fabricate a date here.
    const postedAtClean = typeof postedAt === 'string' && postedAt.trim() ? postedAt.trim() : null;

    // Upsert — if already exists, just update status (and backfill
    // postedAt if we now know it but didn't before).
    const job = await prisma.scoutJob.upsert({
      where: {
        userId_dedupeKey: {
          userId: session.user.id,
          dedupeKey,
        },
      },
      create: {
        userId: session.user.id,
        title,
        company,
        jobUrl,
        dedupeKey,
        location: location || '',
        description: description || '',
        source: source || 'Manual',
        matchScore: matchScore || null,
        status: status || 'SAVED',
        postedAt: postedAtClean,
      },
      update: {
        status: status || 'SAVED',
        // Backfill only — never overwrite a known date with null.
        ...(postedAtClean ? { postedAt: postedAtClean } : {}),
      },
    });

    return NextResponse.json({ job });
  } catch (err) {
    console.error('[board-jobs/POST]', err);
    return NextResponse.json({ error: 'Failed to save job' }, { status: 500 });
  }
}

/* PUT /api/user/board-jobs — Bulk save jobs from live search results */
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { jobs } = body as { jobs: Array<{ title: string; company: string; url: string; location?: string; source?: string; matchScore?: number; description?: string; postedAt?: string }> };

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'jobs array is required' }, { status: 400 });
    }

    // Skip placeholder-company rows at INSERT time so the DB doesn't keep
    // accumulating "Unknown Company" garbage. Cross-checked with the
    // GET-side filter — keeping the two in sync is what prevents new
    // bad rows from leaking through after a re-discovery.
    const placeholderCompanies = new Set(['unknown', 'unknown company', 'confidential', 'na', 'n/a']);

    let saved = 0;
    // Process in parallel batches of 5 to avoid overwhelming the DB
    for (let i = 0; i < jobs.length; i += 5) {
      const batch = jobs.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(async (job) => {
          if (!job.title || !job.company || !job.url) return null;
          if (placeholderCompanies.has(job.company.trim().toLowerCase())) return null;

          const dedupeKey = computeDedupeKey(job.company, job.title, job.url, job.description || '');
          const postedAtClean = typeof job.postedAt === 'string' && job.postedAt.trim() ? job.postedAt.trim() : null;

          return prisma.scoutJob.upsert({
            where: {
              userId_dedupeKey: {
                userId: session.user.id,
                dedupeKey,
              },
            },
            create: {
              userId: session.user.id,
              title: job.title,
              company: job.company,
              jobUrl: job.url,
              dedupeKey,
              location: job.location || '',
              description: job.description || '',
              source: job.source || 'Live Search',
              matchScore: job.matchScore || null,
              status: 'NEW',
              postedAt: postedAtClean,
            },
            // Don't overwrite status if job already exists (user may have changed it).
            // Backfill postedAt only when we now know it; never clobber a known date.
            update: postedAtClean ? { postedAt: postedAtClean } : {},
          });
        }),
      );
      saved += results.filter((r) => r.status === 'fulfilled' && r.value).length;
    }

    return NextResponse.json({ saved, total: jobs.length });
  } catch (err) {
    console.error('[board-jobs/PUT bulk]', err);
    return NextResponse.json({ error: 'Failed to bulk save' }, { status: 500 });
  }
}

/* PATCH /api/user/board-jobs — Update board job status (e.g. Withdraw) */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const existing = await prisma.scoutJob.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    await prisma.scoutJob.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[board-jobs/PATCH]', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

/**
 * DELETE /api/user/board-jobs — Clear the Application Pipeline.
 *
 * Stamps `archivedAt` on every non-archived ScoutJob for this user.
 * Rows are NEVER deleted — they stay queryable via the Archive tab
 * (?archived=true). Application history, applied dates, statuses are
 * all preserved. Future Scout runs still dedupe by the same key, so
 * a re-discovered job won't reappear on the live board if it's
 * already archived (and that's fine — user explicitly cleared it).
 *
 * Optional ?id=<scoutJobId> archives a single row instead of all.
 */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const idParam = url.searchParams.get('id');

    if (idParam) {
      // Single-row archive
      const existing = await prisma.scoutJob.findFirst({
        where: { id: idParam, userId: session.user.id },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      await prisma.scoutJob.update({
        where: { id: idParam },
        data: { archivedAt: new Date() },
      });
      return NextResponse.json({ success: true, archived: 1 });
    }

    // Bulk archive: every still-live row for this user
    const result = await prisma.scoutJob.updateMany({
      where: { userId: session.user.id, archivedAt: null },
      data: { archivedAt: new Date() },
    });
    return NextResponse.json({ success: true, archived: result.count });
  } catch (err) {
    console.error('[board-jobs/DELETE]', err);
    return NextResponse.json({ error: 'Failed to clear board' }, { status: 500 });
  }
}
