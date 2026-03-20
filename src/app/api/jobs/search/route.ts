import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { discoverJobs, type DiscoveredJob } from '@/lib/jobs/discovery';

/**
 * GET /api/jobs/search — Live job search across all sources
 *
 * Searches Google (free scraper), Serper, Jooble, Adzuna, and JSearch
 * in parallel and returns scored, deduplicated results.
 *
 * Query params:
 *   q         — Job title or keywords (required)
 *   location  — Location filter
 *   remote    — "true" to prefer remote jobs
 *   page      — Page number (for future pagination)
 *   sources   — Comma-separated platform filter (e.g. "linkedin_free,naukri_free,adzuna")
 *   exclude   — Comma-separated keywords to exclude
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'software engineer';
    const location = searchParams.get('location') || '';
    const remoteOnly =
      searchParams.get('remote_only') === 'true' || searchParams.get('remote') === 'true';
    const excludeKeywords = searchParams.get('exclude') || '';
    const sourcesParam = searchParams.get('sources') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);

    // Get user profile for match scoring
    let userProfile = { targetRole: query, skills: [] as string[], location };
    try {
      const careerTwin = await prisma.careerTwin.findUnique({
        where: { userId: session.user.id },
        select: { targetRoles: true, skillSnapshot: true },
      });
      if (careerTwin) {
        const targets = careerTwin.targetRoles as any;
        const targetRole =
          Array.isArray(targets) && targets.length > 0
            ? typeof targets[0] === 'string'
              ? targets[0]
              : targets[0]?.title || query
            : typeof targets === 'string'
              ? targets
              : query;
        const skills = careerTwin.skillSnapshot as any;
        const skillList = Array.isArray(skills)
          ? skills.map((s: any) => (typeof s === 'string' ? s : s.skill || s.name || ''))
          : typeof skills === 'object' && skills !== null
            ? Object.keys(skills)
            : [];
        userProfile = { targetRole: targetRole || query, skills: skillList, location };
      }
    } catch {}

    // Parse platforms filter
    const platforms = sourcesParam
      ? sourcesParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined; // undefined = use all platforms

    // Parse exclude keywords
    const excludes = excludeKeywords
      ? excludeKeywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean)
      : [];

    // Run discovery engine with all sources
    const jobs = await discoverJobs({
      roles: [query],
      locations: location ? [location] : [],
      preferRemote: remoteOnly,
      limit: 50,
      excludeCompanies: [],
      excludeKeywords: excludes,
      platforms,
      userProfile,
    });

    // Transform for frontend compatibility
    const transformedJobs = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      companyLogo: null,
      location: job.location,
      description: job.description,
      salary: job.salary,
      url: job.url,
      postedAt: job.postedAt,
      type: 'Full-time',
      remote: job.remote,
      source: job.source,
      matchScore: job.matchScore || 0,
    }));

    // Collect source breakdown
    const sourceBreakdown: Record<string, number> = {};
    for (const job of transformedJobs) {
      const src = job.source?.split(' ')[0] || 'Unknown';
      sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
    }

    return NextResponse.json({
      jobs: transformedJobs,
      total: transformedJobs.length,
      page,
      isDemo: false,
      sources: sourceBreakdown,
    });
  } catch (error) {
    console.error('[Jobs Search API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
