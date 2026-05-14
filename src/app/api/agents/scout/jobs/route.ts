import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { shouldShowJob } from '@/lib/jobs/filters';

/**
 * GET /api/agents/scout/jobs
 * Query the persistent ScoutJob table.
 *
 * Query params:
 *   status  — filter by ScoutJobStatus (optional)
 *   limit   — max results (default 50, max 100)
 *   offset  — pagination offset (default 0)
 *
 * Quality guarantees: everything goes through `shouldShowJob` from
 * `@/lib/jobs/filters`, the single source of truth shared with the
 * board, the live discovery path, and the India cache. Legacy bad
 * rows from earlier Scout runs are hidden uniformly. Archived rows
 * are excluded here — they appear only in the Archive tab.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: any = { userId: session.user.id, archivedAt: null };
    if (status) {
      where.status = status;
    }

    // Over-fetch a bit to compensate for client-side quality filtering,
    // so the user still gets `limit` actionable rows back.
    const fetchTake = Math.min(200, Math.max(limit * 2, limit + 30));

    const [rawJobs, total, statusCounts] = await Promise.all([
      prisma.scoutJob.findMany({
        where,
        orderBy: [{ matchScore: 'desc' }, { discoveredAt: 'desc' }],
        take: fetchTake,
        skip: offset,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          salary: true,
          source: true,
          remote: true,
          matchScore: true,
          atsScore: true,
          qualityScore: true,
          scamScore: true,
          status: true,
          jobUrl: true,
          postedAt: true,
          discoveredAt: true,
          appliedAt: true,
          resumeVariantId: true,
          description: true,
        },
      }),
      prisma.scoutJob.count({ where }),
      prisma.scoutJob.groupBy({
        by: ['status'],
        where: { userId: session.user.id, archivedAt: null },
        _count: true,
      }),
    ]);

    // Single canonical filter — same rules used by /api/jobs/india and
    // /api/user/board-jobs so the user can't see different garbage on
    // different tabs.
    const jobs = rawJobs.filter((j) => shouldShowJob({
      title: j.title,
      company: j.company,
      description: j.description,
      url: j.jobUrl,
      postedAt: j.postedAt,
    })).slice(0, limit);

    // Format status counts as a simple object
    const counts: Record<string, number> = {};
    for (const group of statusCounts) {
      counts[group.status] = group._count;
    }

    return NextResponse.json({ jobs, total, statusCounts: counts });
  } catch (err) {
    console.error('[Scout Jobs] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/agents/scout/jobs — Clear the user's pending Search Results.
 *
 * Marks all NEW / READY / FORGE_READY jobs as SKIPPED. Applied, emailed,
 * queued, and otherwise-acted-on jobs are LEFT ALONE (those are history
 * and the user might still want to track them). The action is scoped to
 * the calling user and never touches other users' data.
 *
 * Optional query: ?status=NEW restricts to a single status.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    // Default: every "pending in the Search Results queue" status.
    const pendingStatuses = ['NEW', 'READY', 'FORGE_READY'] as const;
    const target = statusParam && (pendingStatuses as readonly string[]).includes(statusParam)
      ? [statusParam]
      : (pendingStatuses as readonly string[]);

    const result = await prisma.scoutJob.updateMany({
      where: {
        userId: session.user.id,
        status: { in: target as any },
      },
      data: { status: 'SKIPPED' },
    });

    return NextResponse.json({ success: true, cleared: result.count });
  } catch (err) {
    console.error('[Scout Jobs DELETE] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
