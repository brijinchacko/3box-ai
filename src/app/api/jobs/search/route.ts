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
    } catch (_e) { /* ignore */ }

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

    // Track daily search count per user for source quality tiering
    let dailySearchCount = 0;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dailySearchCount = await prisma.agentActivity.count({
        where: {
          userId: session.user.id,
          agent: 'live_search',
          createdAt: { gte: today },
        },
      });
    } catch (_e) { /* ignore — default to 0 */ }

    // Log this search as an activity
    try {
      await prisma.agentActivity.create({
        data: {
          userId: session.user.id,
          agent: 'live_search',
          action: 'search',
          summary: `Searched for "${query}"${location ? ` in ${location}` : ''}`,
          details: { query, location, searchNumber: dailySearchCount + 1 },
        },
      });
    } catch (_e) { /* ignore */ }

    // First 5 searches use premium sources only; after that include lower-quality sources
    const isPremiumSearch = dailySearchCount < 5;
    let effectivePlatforms = platforms;
    if (!effectivePlatforms && isPremiumSearch) {
      // Premium: exclude adzuna and jsearch for better quality results
      effectivePlatforms = [
        'remoteok', 'arbeitnow',
        'google_free', 'linkedin_free', 'naukri_free', 'indeed_free',
        'google_jobs', 'linkedin', 'naukri', 'indeed',
        'jooble',
      ];
    }
    // After 5th search: all platforms including adzuna & jsearch (effectivePlatforms stays undefined = all)

    // Run discovery engine with all sources — max 20 results per search
    const jobs = await discoverJobs({
      roles: [query],
      locations: location ? [location] : [],
      preferRemote: remoteOnly,
      limit: 20,
      excludeCompanies: [],
      excludeKeywords: excludes,
      platforms: effectivePlatforms,
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
      searchTier: isPremiumSearch ? 'premium' : 'standard',
      searchesUsed: dailySearchCount + 1,
      premiumSearchesLeft: Math.max(0, 5 - (dailySearchCount + 1)),
    });
  } catch (error) {
    console.error('[Jobs Search API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
