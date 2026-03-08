import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

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

    return NextResponse.json({
      runId: run.id,
      jobs: details.jobs || [],
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
