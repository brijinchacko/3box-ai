import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

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

  // Compute status summary for the graph
  const statusCounts: Record<string, number> = {};
  for (const job of jobs) {
    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
  }

  return NextResponse.json({ jobs, statusCounts, total: jobs.length });
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

    // Build dedupeKey: normalized(company)::normalized(title)::urlDomain
    const normalizedCompany = company.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const normalizedTitle = title.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    let urlDomain = '';
    try {
      urlDomain = new URL(jobUrl).hostname.replace('www.', '');
    } catch {
      urlDomain = 'unknown';
    }
    const dedupeKey = `${normalizedCompany}::${normalizedTitle}::${urlDomain}`;

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

          const normalizedCompany = job.company.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          const normalizedTitle = job.title.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          let urlDomain = '';
          try {
            urlDomain = new URL(job.url).hostname.replace('www.', '');
          } catch (_e) {
            urlDomain = 'unknown';
          }
          const dedupeKey = `${normalizedCompany}::${normalizedTitle}::${urlDomain}`;

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
