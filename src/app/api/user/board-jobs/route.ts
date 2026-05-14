import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { computeDedupeKey } from '@/lib/agents/scout';
import { isPlaceholderCompany, shouldShowJob } from '@/lib/jobs/filters';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const period = url.searchParams.get('period'); // day, week, month, all
  // ?archived=true → return ONLY archived rows (Archive tab).
  // Default → only LIVE rows (archivedAt is null).
  const archived = url.searchParams.get('archived') === 'true';

  // Build date filter
  let dateFilter: Date | undefined;
  if (period === 'day') {
    dateFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
  } else if (period === 'week') {
    dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'month') {
    dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  const jobs = await prisma.scoutJob.findMany({
    where: {
      userId: session.user.id,
      ...(dateFilter ? { discoveredAt: { gte: dateFilter } } : {}),
      // Live board hides archived rows; archive tab shows only those.
      archivedAt: archived ? { not: null } : null,
    },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      description: true,
      source: true,
      matchScore: true,
      jobUrl: true,
      postedAt: true,
      discoveredAt: true,
      appliedAt: true,
      archivedAt: true,
      status: true,
    },
    orderBy: archived
      ? { archivedAt: 'desc' }
      : { discoveredAt: 'desc' },
    take: 500,
  });

  // Deduplicate using the SAME key Scout writes with — previously this
  // route used an ad-hoc inline key, which let near-duplicate rows
  // slip through when Scout had merged them and this route had not.
  const jobMap = new Map<string, typeof jobs[0]>();
  const statusPriority: Record<string, number> = {
    'WITHDRAWN': 0, 'NEW': 1, 'SCORED': 2, 'SAVED': 3, 'READY': 4,
    'FORGE_PENDING': 5, 'FORGE_READY': 6, 'QUEUED': 7, 'APPLYING': 8,
    'APPLIED': 9, 'EMAILED': 10, 'SCREENED': 11, 'INTERVIEW': 12, 'OFFER': 13,
    'SKIPPED': 1, 'EXPIRED': 0,
  };
  for (const job of jobs) {
    const key = computeDedupeKey(job.company, job.title, job.jobUrl, job.description || '');
    const existing = jobMap.get(key);
    if (!existing || (statusPriority[job.status] || 0) > (statusPriority[existing.status] || 0)) {
      jobMap.set(key, job);
    }
  }
  const dedupedJobs = Array.from(jobMap.values());

  // Single canonical filter — same rules across every consumer. Hides:
  //   - Placeholder / portal-name companies (Unknown, Indeed, etc.)
  //   - Non-job URLs (review pages, /jobs/view/ alert subscribes, etc.)
  //   - Non-job description signals ("Get notified about new ..." pages)
  //   - Stale postings beyond the freshness cutoff (skipped for Archive)
  const cleanedJobs = dedupedJobs.filter((job) =>
    shouldShowJob(
      {
        title: job.title,
        company: job.company,
        description: job.description,
        url: job.jobUrl,
        postedAt: job.postedAt,
      },
      { allowStale: archived },
    ),
  );

  // Compute status summary for the graph
  const statusCounts: Record<string, number> = {};
  for (const job of cleanedJobs) {
    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
  }

  return NextResponse.json({ jobs: cleanedJobs, statusCounts, total: cleanedJobs.length });
}

/* POST /api/user/board-jobs — Save a job to the board from search results */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, company, jobUrl, location, source, matchScore, description, status, postedAt } = body;

    if (!title || !company || !jobUrl) {
      return NextResponse.json({ error: 'title, company, and jobUrl are required' }, { status: 400 });
    }

    // Refuse to persist placeholder-company saves. The user's UI never
    // shows them anyway (the GET filter hides them); allowing inserts
    // just accumulates garbage rows that have to be hidden later.
    if (isPlaceholderCompany(company)) {
      return NextResponse.json({ error: 'Cannot save a job with no employer name' }, { status: 400 });
    }

    // Build dedupeKey via the centralized helper so board-jobs entries
    // collide with Scout-discovered + quick-apply records for the same job.
    const dedupeKey = computeDedupeKey(company, title, jobUrl, description || '');

    // Preserve the original posting date when supplied. Empty / undefined
    // becomes null so the freshness filter treats it as unknown rather
    // than as "right now". NEVER fabricate a date here.
    const postedAtClean = typeof postedAt === 'string' && postedAt.trim() ? postedAt.trim() : null;

    // Upsert — if already exists, just update status (and backfill
    // postedAt if we now know it but didn't before).
    const job = await prisma.scoutJob.upsert({
      where: {
        userId_dedupeKey: {
          userId: session.user.id,
          dedupeKey,
        },
      },
      create: {
        userId: session.user.id,
        title,
        company,
        jobUrl,
        dedupeKey,
        location: location || '',
        description: description || '',
        source: source || 'Manual',
        matchScore: matchScore || null,
        status: status || 'SAVED',
        postedAt: postedAtClean,
      },
      update: {
        status: status || 'SAVED',
        // Backfill only — never overwrite a known date with null.
        ...(postedAtClean ? { postedAt: postedAtClean } : {}),
      },
    });

    return NextResponse.json({ job });
  } catch (err) {
    console.error('[board-jobs/POST]', err);
    return NextResponse.json({ error: 'Failed to save job' }, { status: 500 });
  }
}

/* PUT /api/user/board-jobs — Bulk save jobs from live search results */
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { jobs } = body as { jobs: Array<{ title: string; company: string; url: string; location?: string; source?: string; matchScore?: number; description?: string; postedAt?: string }> };

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'jobs array is required' }, { status: 400 });
    }

    // Skip placeholder-company rows at INSERT time so the DB doesn't keep
    // accumulating "Unknown Company" garbage. Uses the same shared
    // helper as the GET filter — they can't drift apart anymore.

    let saved = 0;
    // Process in parallel batches of 5 to avoid overwhelming the DB
    for (let i = 0; i < jobs.length; i += 5) {
      const batch = jobs.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(async (job) => {
          if (!job.title || !job.company || !job.url) return null;
          if (isPlaceholderCompany(job.company)) return null;

          const dedupeKey = computeDedupeKey(job.company, job.title, job.url, job.description || '');
          const postedAtClean = typeof job.postedAt === 'string' && job.postedAt.trim() ? job.postedAt.trim() : null;

          return prisma.scoutJob.upsert({
            where: {
              userId_dedupeKey: {
                userId: session.user.id,
                dedupeKey,
              },
            },
            create: {
              userId: session.user.id,
              title: job.title,
              company: job.company,
              jobUrl: job.url,
              dedupeKey,
              location: job.location || '',
              description: job.description || '',
              source: job.source || 'Live Search',
              matchScore: job.matchScore || null,
              status: 'NEW',
              postedAt: postedAtClean,
            },
            // Don't overwrite status if job already exists (user may have changed it).
            // Backfill postedAt only when we now know it; never clobber a known date.
            update: postedAtClean ? { postedAt: postedAtClean } : {},
          });
        }),
      );
      saved += results.filter((r) => r.status === 'fulfilled' && r.value).length;
    }

    return NextResponse.json({ saved, total: jobs.length });
  } catch (err) {
    console.error('[board-jobs/PUT bulk]', err);
    return NextResponse.json({ error: 'Failed to bulk save' }, { status: 500 });
  }
}

/* PATCH /api/user/board-jobs — Update board job status (e.g. Withdraw) */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const existing = await prisma.scoutJob.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    await prisma.scoutJob.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[board-jobs/PATCH]', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

/**
 * DELETE /api/user/board-jobs — Clear the Application Pipeline.
 *
 * Stamps `archivedAt` on every non-archived ScoutJob for this user.
 * Rows are NEVER deleted — they stay queryable via the Archive tab
 * (?archived=true). Application history, applied dates, statuses are
 * all preserved. Future Scout runs still dedupe by the same key, so
 * a re-discovered job won't reappear on the live board if it's
 * already archived (and that's fine — user explicitly cleared it).
 *
 * Optional ?id=<scoutJobId> archives a single row instead of all.
 */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const idParam = url.searchParams.get('id');

    if (idParam) {
      // Single-row archive
      const existing = await prisma.scoutJob.findFirst({
        where: { id: idParam, userId: session.user.id },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      await prisma.scoutJob.update({
        where: { id: idParam },
        data: { archivedAt: new Date() },
      });
      return NextResponse.json({ success: true, archived: 1 });
    }

    // Bulk archive: every still-live row for this user
    const result = await prisma.scoutJob.updateMany({
      where: { userId: session.user.id, archivedAt: null },
      data: { archivedAt: new Date() },
    });
    return NextResponse.json({ success: true, archived: result.count });
  } catch (err) {
    console.error('[board-jobs/DELETE]', err);
    return NextResponse.json({ error: 'Failed to clear board' }, { status: 500 });
  }
}
