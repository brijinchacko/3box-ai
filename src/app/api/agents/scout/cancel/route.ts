import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runningRun = await prisma.autoApplyRun.findFirst({
      where: { userId: session.user.id, status: 'running' },
    });

    if (!runningRun) {
      return NextResponse.json({ error: 'No running mission' }, { status: 404 });
    }

    await prisma.autoApplyRun.update({
      where: { id: runningRun.id },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
        summary: (runningRun.summary || '') + ' [Cancelled by user]',
      },
    });

    return NextResponse.json({ cancelled: true });
  } catch (err) {
    console.error('[Scout Cancel] Error:', err);
    return NextResponse.json({ error: 'Failed to cancel mission' }, { status: 500 });
  }
}
