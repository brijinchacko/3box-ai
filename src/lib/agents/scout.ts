/**
 * Scout Agent — Job Hunter
 * Discovers jobs matching user profile from multiple sources
 */
import { prisma } from '@/lib/db/prisma';
import { discoverJobs, DiscoveredJob } from '@/lib/jobs/discovery';
import { filterScamJobs } from '@/lib/jobs/scamDetector';
import { type AgentContext, getContextSummary, logActivity } from './context';

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
    limit = 30,
  } = config;

  // Get user profile for match scoring
  let userProfile = { targetRole: targetRoles[0] || '', skills: [] as string[], location: targetLocations[0] || '' };
  
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

  // Log agent activity
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
