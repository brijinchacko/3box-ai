import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * Mirrors STALE_JOB_CUTOFF_DAYS in board-jobs/route.ts and
 * MAX_JOB_AGE_DAYS in lib/jobs/discovery.ts. These three knobs must
 * stay aligned — keeping them split (rather than centralized) is a
 * conscious choice so the API and the discovery layer can be tuned
 * independently without one cascading into the other unexpectedly.
 */
const STALE_JOB_CUTOFF_DAYS = 21;

const PLACEHOLDER_COMPANIES = new Set(['unknown', 'unknown company', 'confidential', 'na', 'n/a', '']);

function parsePostedAtServer(postedAt: string | null | undefined): Date | null {
  if (!postedAt) return null;
  const s = String(postedAt).trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  const now = Date.now();
  if (/^today$/.test(lower)) return new Date(now);
  if (/^yesterday$/.test(lower)) return new Date(now - 86_400_000);
  const m = lower.match(/^(\d+)\s*(minute|hour|day|week|month|year)s?\s*ago/);
  if (m) {
    const n = parseInt(m[1], 10);
    const ms: Record<string, number> = {
      minute: 60_000, hour: 3_600_000, day: 86_400_000,
      week: 604_800_000, month: 2_592_000_000, year: 31_536_000_000,
    };
    return new Date(now - n * (ms[m[2]] || 0));
  }
  const ts = Date.parse(s);
  if (!Number.isNaN(ts)) return new Date(ts);
  return null;
}

/**
 * GET /api/agents/scout/jobs
 * Query the persistent ScoutJob table.
 *
 * Query params:
 *   status  — filter by ScoutJobStatus (optional)
 *   limit   — max results (default 50, max 100)
 *   offset  — pagination offset (default 0)
 *
 * Quality guarantees:
 *   - Hides rows whose `company` is a placeholder ("Unknown Company", etc.)
 *   - Hides rows whose `postedAt` is older than STALE_JOB_CUTOFF_DAYS
 *   Both protect against legacy bad data from earlier Scout runs.
 *   `archivedAt` rows are excluded so the Search Results queue only
 *   surfaces live, actionable jobs.
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

    const staleCutoffMs = STALE_JOB_CUTOFF_DAYS * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const jobs = rawJobs.filter((j) => {
      const company = (j.company || '').trim().toLowerCase();
      if (PLACEHOLDER_COMPANIES.has(company)) return false;
      const postedDate = parsePostedAtServer(j.postedAt);
      // Hide only when we're CONFIDENT it's stale (parseable old date).
      // Unknown dates pass through — UI labels them "Recently posted".
      if (postedDate && nowMs - postedDate.getTime() > staleCutoffMs) return false;
      return true;
    }).slice(0, limit);

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
