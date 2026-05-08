import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/agents/scout/jobs
 * Query the persistent ScoutJob table.
 *
 * Query params:
 *   status  — filter by ScoutJobStatus (optional)
 *   limit   — max results (default 50, max 100)
 *   offset  — pagination offset (default 0)
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

    const where: any = { userId: session.user.id };
    if (status) {
      where.status = status;
    }

    const [jobs, total, statusCounts] = await Promise.all([
      prisma.scoutJob.findMany({
        where,
        orderBy: [{ matchScore: 'desc' }, { discoveredAt: 'desc' }],
        take: limit,
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
          discoveredAt: true,
          appliedAt: true,
          resumeVariantId: true,
          description: true,
        },
      }),
      prisma.scoutJob.count({ where }),
      prisma.scoutJob.groupBy({
        by: ['status'],
        where: { userId: session.user.id },
        _count: true,
      }),
    ]);

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
