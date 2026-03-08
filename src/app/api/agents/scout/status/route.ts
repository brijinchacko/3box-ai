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

    const latestRun = await prisma.autoApplyRun.findFirst({
      where: { userId: session.user.id },
      orderBy: { startedAt: 'desc' },
      select: { id: true, status: true, startedAt: true, completedAt: true },
    });

    if (!latestRun) {
      return NextResponse.json({ status: 'idle' });
    }

    return NextResponse.json({
      status: latestRun.status === 'running' ? 'running' : latestRun.status,
      runId: latestRun.id,
      lastRunAt: latestRun.completedAt?.toISOString() || latestRun.startedAt.toISOString(),
    });
  } catch (err) {
    console.error('[Scout Status] Error:', err);
    return NextResponse.json({ status: 'idle' });
  }
}
