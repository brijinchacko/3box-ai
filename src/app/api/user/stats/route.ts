import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/user/stats — Dashboard overview statistics.
 *
 * Returns:
 *   jobsFound    — Total ScoutJobs discovered for this user
 *   appsSent     — Total JobApplications created
 *   interviews   — Applications in interview/offer stage
 *   responseRate — % of sent applications that received any response
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const [jobsFound, appsSent, interviews, respondedCount] = await Promise.all([
      // Jobs discovered by Scout
      prisma.scoutJob.count({ where: { userId } }),

      // Total applications sent
      prisma.jobApplication.count({ where: { userId } }),

      // Applications in interview/offer stage
      prisma.jobApplication.count({
        where: { userId, status: { in: ['INTERVIEW', 'OFFER'] } },
      }),

      // Any application that got a response (not just sitting in QUEUED/APPLIED)
      prisma.jobApplication.count({
        where: {
          userId,
          status: { in: ['VIEWED', 'INTERVIEW', 'OFFER', 'REJECTED'] },
        },
      }),
    ]);

    const responseRate = appsSent > 0
      ? Math.round((respondedCount / appsSent) * 100)
      : 0;

    return NextResponse.json({
      jobsFound,
      appsSent,
      interviews,
      responseRate,
    });
  } catch (err) {
    console.error('[user/stats/GET]', err);
    return NextResponse.json(
      { jobsFound: 0, appsSent: 0, interviews: 0, responseRate: 0 },
    );
  }
}
