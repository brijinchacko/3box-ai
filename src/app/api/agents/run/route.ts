import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { runAgentPipeline } from '@/lib/agents/orchestrator';
import type { AutomationMode } from '@/lib/agents/registry';

export async function POST(request: NextRequest) {
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

    // Read automationMode: prefer request body, fall back to DB config, then default 'autopilot'
    let automationMode: AutomationMode = 'autopilot';
    try {
      const body = await request.json().catch(() => ({}));
      if (body?.automationMode && ['copilot', 'autopilot', 'full-agent'].includes(body.automationMode)) {
        automationMode = body.automationMode as AutomationMode;
      } else {
        // Read from database config
        const config = await prisma.autoApplyConfig.findUnique({
          where: { userId: session.user.id },
          select: { automationMode: true },
        });
        if (config?.automationMode && ['copilot', 'autopilot', 'full-agent'].includes(config.automationMode)) {
          automationMode = config.automationMode as AutomationMode;
        }
      }
    } catch {
      // Fall through with default 'autopilot'
    }

    const result = await runAgentPipeline({
      userId: session.user.id,
      plan: user.plan as any,
      automationMode,
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
