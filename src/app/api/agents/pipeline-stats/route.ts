import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/agents/pipeline-stats
 * Returns quality metrics for the dashboard:
 * - Weekly applications sent
 * - Scam jobs blocked
 * - Average quality score
 * - Interview callbacks
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [weeklyApps, scamActivities, allRuns, interviewApps] = await Promise.all([
      // Weekly applications sent
      prisma.jobApplication.count({
        where: {
          userId,
          createdAt: { gte: oneWeekAgo },
          status: { not: 'QUEUED' },
        },
      }),

      // Scam jobs blocked (from agent activity)
      prisma.agentActivity.count({
        where: {
          userId,
          agent: { in: ['sentinel', 'scout'] },
          action: { in: ['blocked_scam', 'filtered_scam'] },
          createdAt: { gte: oneWeekAgo },
        },
      }),

      // Avg quality from recent runs
      prisma.autoApplyRun.findMany({
        where: { userId, completedAt: { gte: oneWeekAgo } },
        select: { details: true },
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),

      // Interview callbacks
      prisma.jobApplication.count({
        where: {
          userId,
          status: { in: ['INTERVIEW', 'OFFER'] },
        },
      }),
    ]);

    // Extract average quality from run details
    let avgQuality = 0;
    let qualityCount = 0;
    for (const run of allRuns) {
      const details = run.details as any;
      if (details?.pipelineContext?.qualityScores) {
        const scores = details.pipelineContext.qualityScores;
        if (typeof scores === 'number' && scores > 0) {
          qualityCount++;
        }
      }
    }
    // Fallback to a calculated metric from match scores
    if (qualityCount === 0) {
      const recentApps = await prisma.jobApplication.findMany({
        where: { userId, createdAt: { gte: oneWeekAgo } },
        select: { matchScore: true },
        take: 50,
      });
      const scores = recentApps.filter(a => a.matchScore != null).map(a => a.matchScore!);
      avgQuality = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
    }

    return NextResponse.json({
      weeklyApps,
      scamBlocked: scamActivities,
      avgQuality,
      interviewCallbacks: interviewApps,
    });
  } catch (err) {
    console.error('[Pipeline Stats]', err);
    return NextResponse.json({
      weeklyApps: 0,
      scamBlocked: 0,
      avgQuality: 0,
      interviewCallbacks: 0,
    });
  }
}
