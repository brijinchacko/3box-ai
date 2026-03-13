import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobs = await prisma.scoutJob.findMany({
    where: { userId: session.user.id },
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
    take: 200,
  });

  return NextResponse.json({ jobs });
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
