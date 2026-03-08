import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runs = await prisma.autoApplyRun.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        jobsFound: true,
        summary: true,
        startedAt: true,
        completedAt: true,
      },
    });

    return NextResponse.json({
      runs: runs.map(r => ({
        runId: r.id,
        status: r.status,
        jobsFound: r.jobsFound,
        summary: r.summary,
        startedAt: r.startedAt.toISOString(),
        completedAt: r.completedAt?.toISOString() || null,
      })),
    });
  } catch (err) {
    console.error('[Scout History] Error:', err);
    return NextResponse.json({ runs: [] });
  }
}
