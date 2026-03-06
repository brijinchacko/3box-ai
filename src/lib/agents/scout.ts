/**
 * Scout Agent — Job Hunter
 * Discovers jobs matching user profile from multiple sources
 */
import { prisma } from '@/lib/db/prisma';
import { discoverJobs, DiscoveredJob } from '@/lib/jobs/discovery';

interface ScoutConfig {
  userId: string;
  targetRoles: string[];
  targetLocations: string[];
  preferRemote: boolean;
  minMatchScore: number;
  excludeCompanies: string[];
  excludeKeywords: string[];
  limit?: number;
}

interface ScoutResult {
  jobs: DiscoveredJob[];
  totalFound: number;
  totalFiltered: number;
  sources: string[];
}

export async function runScout(config: ScoutConfig): Promise<ScoutResult> {
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

  // Discover jobs
  const allJobs = await discoverJobs({
    roles: targetRoles,
    locations: targetLocations,
    preferRemote,
    limit,
    excludeCompanies,
    excludeKeywords,
    userProfile,
  });

  // Filter by minimum match score
  const qualifiedJobs = allJobs.filter(j => (j.matchScore || 0) >= minMatchScore);

  // Collect unique sources
  const sources = [...new Set(allJobs.map(j => j.source))];

  // Log agent activity
  await prisma.agentActivity.create({
    data: {
      userId,
      agent: 'scout',
      action: 'discovered_jobs',
      summary: `Found ${allJobs.length} jobs, ${qualifiedJobs.length} above ${minMatchScore}% match threshold`,
      details: {
        totalFound: allJobs.length,
        qualified: qualifiedJobs.length,
        sources,
        topMatch: qualifiedJobs[0] ? { title: qualifiedJobs[0].title, company: qualifiedJobs[0].company, score: qualifiedJobs[0].matchScore } : null,
      },
    },
  });

  return {
    jobs: qualifiedJobs,
    totalFound: allJobs.length,
    totalFiltered: qualifiedJobs.length,
    sources,
  };
}
