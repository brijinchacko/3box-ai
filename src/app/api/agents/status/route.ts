import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { getAgentsWithStatus, type PlanTier } from '@/lib/agents/permissions';
import type { AgentId } from '@/lib/agents/registry';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    const plan = (user?.plan || 'BASIC') as PlanTier;
    const agents = getAgentsWithStatus(plan);

    // Check for any running AutoApplyRun (Scout missions)
    const runningRun = await prisma.autoApplyRun.findFirst({
      where: { userId: session.user.id, status: 'running' },
      select: { id: true },
    });

    // Check recent AgentActivity (within last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentActivities = await prisma.agentActivity.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: tenMinutesAgo },
      },
      select: { agent: true },
      distinct: ['agent'],
    });
    const recentAgentSet = new Set(recentActivities.map(a => a.agent));

    const statuses: Partial<Record<AgentId, 'working' | 'idle' | 'sleeping'>> = {};

    agents.forEach(a => {
      const id = a.id as AgentId;
      if (a.locked) {
        statuses[id] = 'sleeping';
      } else if (id === 'scout' && runningRun) {
        statuses[id] = 'working';
      } else if (recentAgentSet.has(id)) {
        statuses[id] = 'idle'; // recently active
      } else {
        statuses[id] = 'idle';
      }
    });

    return NextResponse.json({ statuses });
  } catch (err) {
    console.error('[Agent Status] Error:', err);
    return NextResponse.json({ statuses: {} });
  }
}
