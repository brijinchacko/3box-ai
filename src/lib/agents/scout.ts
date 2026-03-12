/**
 * Scout Agent — Job Hunter
 * Discovers jobs matching user profile from multiple sources
 */
import { prisma } from '@/lib/db/prisma';
import { discoverJobs, DiscoveredJob } from '@/lib/jobs/discovery';
import { filterScamJobs } from '@/lib/jobs/scamDetector';
import { type AgentContext, getContextSummary, logActivity } from './context';
// Token system removed — AI operations are unlimited, only applications are limited.

export interface ScoutConfig {
  userId: string;
  targetRoles: string[];
  targetLocations: string[];
  preferRemote: boolean;
  minMatchScore: number;
  excludeCompanies: string[];
  excludeKeywords: string[];
  limit?: number;
  /** Optional platform filter — only search these sources */
  platforms?: string[];
  /** Burst mode — skip credit checks, limit to 20 results, search all platforms */
  burstMode?: boolean;
}

export interface ScoutResult {
  jobs: DiscoveredJob[];
  totalFound: number;
  totalFiltered: number;
  scamJobsFiltered: number;
  sources: string[];
}

export async function runScout(config: ScoutConfig, ctx?: AgentContext): Promise<ScoutResult> {
  const {
    userId,
    targetRoles,
    targetLocations,
    preferRemote,
    minMatchScore,
    excludeCompanies,
    excludeKeywords,
    limit = config.burstMode ? 20 : 30,
    burstMode = false,
  } = config;

  // Get user profile for match scoring
  let userProfile = { targetRole: targetRoles[0] || '', skills: [] as string[], location: targetLocations[0] || '' };

  // In burst mode, skip careerTwin lookup (no real user profile exists)
  if (!burstMode) {
    try {
      const careerTwin = await prisma.careerTwin.findUnique({
        where: { userId },
        select: { targetRoles: true, skillSnapshot: true },
      });
      if (careerTwin) {
        const skills = careerTwin.skillSnapshot as any;
        const skillList = Array.isArray(skills)
          ? skills.map((s: any) => typeof s === 'string' ? s : s.skill || s.name || '')
          : (typeof skills === 'object' && skills !== null ? Object.keys(skills) : []);
        userProfile = { targetRole: targetRoles[0] || '', skills: skillList, location: targetLocations[0] || '' };
      }
    } catch {}
  }

  // Discover jobs — request extra to ensure at least 20 after filtering
  const MIN_JOBS = 20;
  const requestLimit = Math.max(limit, MIN_JOBS + 15); // Buffer for filtering losses
  const allJobs = await discoverJobs({
    roles: targetRoles,
    locations: targetLocations,
    preferRemote,
    limit: requestLimit,
    excludeCompanies,
    excludeKeywords,
    platforms: config.platforms,
    userProfile,
  });

  // Filter by minimum match score — relax threshold if too few results
  let qualifiedJobs = allJobs.filter(j => (j.matchScore || 0) >= minMatchScore);
  if (qualifiedJobs.length < MIN_JOBS && allJobs.length > qualifiedJobs.length) {
    // Relax to 10% threshold to ensure enough results
    qualifiedJobs = allJobs.filter(j => (j.matchScore || 0) >= Math.min(minMatchScore, 10));
  }

  // ── Scam Detection — filter out fake/scam jobs ──
  const scamResult = filterScamJobs(qualifiedJobs);
  let cleanJobs = scamResult.clean;
  const scamJobsFiltered = scamResult.stats.scam;

  // If still below minimum after scam filtering, include lower-scored scam jobs (borderline)
  if (cleanJobs.length < MIN_JOBS && scamResult.filtered.length > 0) {
    // Sort filtered by scam score ascending (least scammy first) and include borderline ones
    const borderline = scamResult.filtered
      .filter(j => j.scamScore < 70) // Only include borderline, not obvious scams
      .slice(0, MIN_JOBS - cleanJobs.length);
    cleanJobs = [...cleanJobs, ...borderline];
  }

  // Collect unique sources
  const sources = [...new Set(allJobs.map(j => j.source))];

  // Log agent activity (skip in burst mode — no real user to log for)
  if (!burstMode) {
    await prisma.agentActivity.create({
      data: {
        userId,
        agent: 'scout',
        action: 'discovered_jobs',
        summary: `Found ${allJobs.length} jobs, ${cleanJobs.length} qualified (${scamJobsFiltered} scam filtered)`,
        details: {
          totalFound: allJobs.length,
          qualified: cleanJobs.length,
          scamFiltered: scamJobsFiltered,
          suspiciousCount: scamResult.stats.suspicious,
          sources,
          topMatch: cleanJobs[0] ? { title: cleanJobs[0].title, company: cleanJobs[0].company, score: cleanJobs[0].matchScore } : null,
        },
      },
    });
  }

  // Log to shared agent context
  if (ctx) {
    logActivity(ctx, 'scout', 'discovered_jobs', `Found ${allJobs.length} jobs, ${cleanJobs.length} qualified, ${scamJobsFiltered} scam jobs filtered. Sources: ${sources.join(', ')}`);
  }

  return {
    jobs: cleanJobs,
    totalFound: allJobs.length,
    totalFiltered: cleanJobs.length,
    scamJobsFiltered,
    sources,
  };
}

// ── Deduplication helpers ──────────────────────────

/**
 * Compute a deduplication key for a job.
 * Format: normalizedCompany::normalizedTitle::urlDomain
 */
export function computeDedupeKey(company: string, title: string, url: string): string {
  const normalizedCompany = company.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {}
  return `${normalizedCompany}::${normalizedTitle}::${domain}`;
}

/**
 * Persist an array of DiscoveredJobs to the ScoutJob table with deduplication.
 * Returns counts of new vs duplicate jobs.
 */
export async function persistScoutJobs(
  userId: string,
  jobs: DiscoveredJob[],
  scoutRunId?: string,
): Promise<{ newCount: number; dupCount: number }> {
  let newCount = 0;
  let dupCount = 0;

  for (const job of jobs) {
    const dedupeKey = computeDedupeKey(job.company, job.title, job.url);
    try {
      await prisma.scoutJob.create({
        data: {
          userId,
          title: job.title,
          company: job.company,
          jobUrl: job.url,
          dedupeKey,
          location: job.location || null,
          description: job.description || '',
          salary: job.salary || null,
          source: job.source,
          remote: job.remote || false,
          postedAt: job.postedAt || null,
          matchScore: job.matchScore || null,
          status: 'NEW',
          scoutRunId: scoutRunId || null,
        },
      });
      newCount++;
    } catch (err: any) {
      // Unique constraint violation (P2002) = duplicate, silently skip
      if (err.code === 'P2002') {
        dupCount++;
      } else {
        console.error('[Scout] Failed to persist job:', job.title, err.message);
      }
    }
  }

  return { newCount, dupCount };
}

// ── Independent Scout (runs on its own schedule) ──

export interface IndependentScoutConfig {
  targetRoles: string[];
  targetLocations: string[];
  preferRemote: boolean;
  minMatchScore: number;
  excludeCompanies: string[];
  excludeKeywords: string[];
  platforms?: string[];
}

export interface IndependentScoutResult {
  runId: string;
  jobsDiscovered: number;
  jobsNew: number;
  jobsDuplicate: number;
  creditsUsed: number;
  sources: string[];
}

/**
 * Run Scout independently — discovers jobs and persists them to the ScoutJob table.
 * Used by the cron scheduler and can also be called manually.
 */
export async function runIndependentScout(
  userId: string,
  config: IndependentScoutConfig,
): Promise<IndependentScoutResult> {
  // 1. Create run record
  const run = await prisma.autoApplyRun.create({
    data: {
      userId,
      status: 'running',
      agentType: 'scout',
      summary: `Scout searching: ${config.targetRoles.join(', ')}`,
    },
  });

  try {
    // 2. Run Scout discovery
    const scoutResult = await runScout({
      userId,
      targetRoles: config.targetRoles,
      targetLocations: config.targetLocations,
      preferRemote: config.preferRemote,
      minMatchScore: config.minMatchScore,
      excludeCompanies: config.excludeCompanies,
      excludeKeywords: config.excludeKeywords,
      platforms: config.platforms,
      limit: 40,
    });

    // 3. Persist to ScoutJob table with dedup
    const { newCount, dupCount } = await persistScoutJobs(userId, scoutResult.jobs, run.id);

    // 4. Update run record + lastRunAt
    await Promise.all([
      prisma.autoApplyRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          jobsFound: scoutResult.totalFound,
          creditsUsed: 0,
          summary: `Scout found ${scoutResult.totalFound} jobs, ${newCount} new, ${dupCount} duplicates (${scoutResult.scamJobsFiltered} scam filtered) from ${scoutResult.sources.join(', ')}`,
          details: JSON.parse(JSON.stringify({
            totalFound: scoutResult.totalFound,
            newJobs: newCount,
            duplicates: dupCount,
            scamFiltered: scoutResult.scamJobsFiltered,
            sources: scoutResult.sources,
          })),
        },
      }),
      prisma.autoApplyConfig.update({
        where: { userId },
        data: { scoutLastRunAt: new Date() },
      }),
    ]);

    return {
      runId: run.id,
      jobsDiscovered: scoutResult.totalFound,
      jobsNew: newCount,
      jobsDuplicate: dupCount,
      creditsUsed: 0,
      sources: scoutResult.sources,
    };
  } catch (err) {
    await prisma.autoApplyRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        summary: `Scout failed: ${(err as Error).message}`,
      },
    });
    throw err;
  }
}
