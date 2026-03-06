import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { runAgentPipeline } from '@/lib/agents/orchestrator';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check plan allows agents
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, aiCreditsUsed: true, aiCreditsLimit: true },
    });
    if (!user || user.plan === 'BASIC') {
      return NextResponse.json({ error: 'Upgrade your plan to use AI agents' }, { status: 403 });
    }

    // Check not already running
    const activeRun = await prisma.autoApplyRun.findFirst({
      where: { userId: session.user.id, status: 'running' },
    });
    if (activeRun) {
      return NextResponse.json({ error: 'An agent run is already in progress' }, { status: 409 });
    }

    const result = await runAgentPipeline({
      userId: session.user.id,
      plan: user.plan as any,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Agents Run] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to run agents' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(20, parseInt(searchParams.get('limit') || '10', 10));
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const [runs, total] = await Promise.all([
      prisma.autoApplyRun.findMany({
        where: { userId: session.user.id },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.autoApplyRun.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({ runs, total });
  } catch (err) {
    console.error('[Agents Run] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
