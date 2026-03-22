import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { runAgentPipeline } from '@/lib/agents/orchestrator';
import { checkApplicationCap } from '@/lib/tokens/dailyCap';
import type { AutomationMode } from '@/lib/agents/registry';
import { normalizePlan } from '@/lib/tokens/pricing';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // All agents are available on all plans — no plan gate needed
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check application cap (only applications are limited, AI operations are unlimited)
    const appCap = await checkApplicationCap(session.user.id);
    if (!appCap.allowed) {
      return NextResponse.json({
        error: `Application cap reached (${appCap.used}/${appCap.limit}). ${appCap.resetsAt ? 'Resets at ' + appCap.resetsAt.toISOString() : 'Lifetime limit reached.'}`,
      }, { status: 429 });
    }

    // Check not already running
    const activeRun = await prisma.autoApplyRun.findFirst({
      where: { userId: session.user.id, status: 'running' },
    });
    if (activeRun) {
      return NextResponse.json({ error: 'An agent run is already in progress' }, { status: 409 });
    }

    // Ensure auto-apply config exists and is enabled — auto-create if missing
    let autoConfig = await prisma.autoApplyConfig.findUnique({
      where: { userId: session.user.id },
    });
    if (!autoConfig) {
      // Auto-create config with sensible defaults so first run works
      autoConfig = await prisma.autoApplyConfig.create({
        data: {
          userId: session.user.id,
          enabled: true,
          automationMode: 'autopilot',
          targetRoles: [],
          targetLocations: [],
          excludeCompanies: [],
          excludeKeywords: [],
          minMatchScore: 60,
          maxAppliesPerRun: 100,
          preferRemote: false,
        },
      });
    } else if (!autoConfig.enabled) {
      // Auto-enable for manual "Run Now" button clicks
      await prisma.autoApplyConfig.update({
        where: { userId: session.user.id },
        data: { enabled: true },
      });
    }

    // Read automationMode: prefer request body, fall back to DB config, then default 'autopilot'
    let automationMode: AutomationMode = 'autopilot';
    try {
      const body = await request.json().catch(() => ({}));
      if (body?.automationMode && ['copilot', 'autopilot', 'full-agent', 'smart-auto'].includes(body.automationMode)) {
        automationMode = body.automationMode as AutomationMode;
      } else if (autoConfig.automationMode && ['copilot', 'autopilot', 'full-agent', 'smart-auto'].includes(autoConfig.automationMode)) {
        automationMode = autoConfig.automationMode as AutomationMode;
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
