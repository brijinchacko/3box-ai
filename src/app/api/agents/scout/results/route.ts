import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { shouldShowJob, type JobLike } from '@/lib/jobs/filters';

/**
 * GET /api/agents/scout/results — Latest Scout run snapshot.
 *
 * Returns jobs from the `details.jobs` JSON blob persisted on
 * AutoApplyRun. Critically these are SNAPSHOTS taken at the time the
 * run completed, so they freeze whatever the discovery pipeline
 * surfaced back then — including any "Unknown Company" or non-job-URL
 * rows that earlier (pre-filter) discovery let through.
 *
 * We apply `shouldShowJob` on the way out so legacy snapshots show the
 * same clean view as a fresh discovery would. The stored blob itself
 * is left intact (cheap to keep, lets the run-history page render an
 * honest archival count if we ever surface it).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');

    const run = runId
      ? await prisma.autoApplyRun.findFirst({
          where: { id: runId, userId: session.user.id },
          select: { id: true, status: true, details: true, summary: true, startedAt: true, completedAt: true },
        })
      : await prisma.autoApplyRun.findFirst({
          where: { userId: session.user.id, status: 'completed' },
          orderBy: { completedAt: 'desc' },
          select: { id: true, status: true, details: true, summary: true, startedAt: true, completedAt: true },
        });

    if (!run || !run.details) {
      return NextResponse.json({ jobs: [], summary: null, runId: null });
    }

    const details = run.details as any;
    const rawJobs: any[] = Array.isArray(details.jobs) ? details.jobs : [];

    // Apply the same quality filter every other job-surfacing route
    // uses. Legacy runs predating the filter overhaul stored "Unknown
    // Company" + non-job-URL rows; hiding them on read keeps the UI
    // consistent without a destructive DB migration.
    const jobs = rawJobs.filter((j): j is any =>
      shouldShowJob({
        title: j?.title,
        company: j?.company,
        description: j?.description,
        url: j?.url || j?.jobUrl,
        postedAt: j?.postedAt,
      } as JobLike),
    );

    return NextResponse.json({
      runId: run.id,
      jobs,
      summary: {
        totalFound: details.totalFound || 0,
        totalFiltered: details.totalFiltered || 0,
        scamJobsFiltered: details.scamJobsFiltered || 0,
        sources: details.sources || [],
        missionParams: details.missionParams || null,
      },
      completedAt: run.completedAt?.toISOString(),
    });
  } catch (err) {
    console.error('[Scout Results] Error:', err);
    return NextResponse.json({ jobs: [], summary: null, runId: null });
  }
}
