import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const run = await prisma.autoApplyRun.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });

    // Get applications from this run
    const applications = await prisma.jobApplication.findMany({
      where: { autoApplyRunId: run.id },
      orderBy: { createdAt: 'desc' },
    });

    // Get agent activities for this run
    const activities = await prisma.agentActivity.findMany({
      where: { runId: run.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ run, applications, activities });
  } catch (err) {
    console.error('[Agents Run Detail] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
