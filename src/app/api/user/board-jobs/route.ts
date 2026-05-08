import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { computeDedupeKey } from '@/lib/agents/scout';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const period = url.searchParams.get('period'); // day, week, month, all

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
    },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      source: true,
      matchScore: true,
      jobUrl: true,
      discoveredAt: true,
      appliedAt: true,
      status: true,
    },
    orderBy: { discoveredAt: 'desc' },
    take: 500,
  });

  // Deduplicate: keep the most advanced status for each company+title combo
  const jobMap = new Map<string, typeof jobs[0]>();
  const statusPriority: Record<string, number> = {
    'WITHDRAWN': 0, 'NEW': 1, 'SCORED': 2, 'SAVED': 3, 'READY': 4,
    'FORGE_PENDING': 5, 'FORGE_READY': 6, 'QUEUED': 7, 'APPLYING': 8,
    'APPLIED': 9, 'EMAILED': 10, 'SCREENED': 11, 'INTERVIEW': 12, 'OFFER': 13,
    'SKIPPED': 1, 'EXPIRED': 0,
  };
  for (const job of jobs) {
    const key = `${job.company.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}-${job.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30)}`;
    const existing = jobMap.get(key);
    if (!existing || (statusPriority[job.status] || 0) > (statusPriority[existing.status] || 0)) {
      jobMap.set(key, job);
    }
  }
  const dedupedJobs = Array.from(jobMap.values());

  // Filter out job portal names showing as companies
  const portalNames = ['shine.com', 'whatjobs', 'whatjobs direct', 'jooble', 'indeed', 'linkedin', 'naukri', 'glassdoor', 'remoteok', 'adzuna', 'dice', 'monster'];
  const cleanedJobs = dedupedJobs.filter(job => {
    const companyLower = job.company.toLowerCase();
    return !portalNames.some(p => companyLower === p || companyLower === `${p}.com`);
  });

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
    const { title, company, jobUrl, location, source, matchScore, description, status } = body;

    if (!title || !company || !jobUrl) {
      return NextResponse.json({ error: 'title, company, and jobUrl are required' }, { status: 400 });
    }

    // Build dedupeKey via the centralized helper so board-jobs entries
    // collide with Scout-discovered + quick-apply records for the same job.
    const dedupeKey = computeDedupeKey(company, title, jobUrl, description || '');

    // Upsert — if already exists, just update status
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
      },
      update: {
        status: status || 'SAVED',
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
    const { jobs } = body as { jobs: Array<{ title: string; company: string; url: string; location?: string; source?: string; matchScore?: number; description?: string }> };

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'jobs array is required' }, { status: 400 });
    }

    let saved = 0;
    // Process in parallel batches of 5 to avoid overwhelming the DB
    for (let i = 0; i < jobs.length; i += 5) {
      const batch = jobs.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(async (job) => {
          if (!job.title || !job.company || !job.url) return null;

          const dedupeKey = computeDedupeKey(job.company, job.title, job.url, job.description || '');

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
            },
            // Don't overwrite status if job already exists (user may have changed it)
            update: {},
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
