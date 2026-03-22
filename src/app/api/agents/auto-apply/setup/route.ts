import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { normalizePlan } from '@/lib/tokens/pricing';

/**
 * GET /api/agents/auto-apply/setup
 * Returns the current auto-apply configuration for the authenticated user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await prisma.autoApplyConfig.findUnique({
      where: { userId: session.user.id },
      select: {
        autoApplyEnabled: true,
        autoApplyMinScore: true,
        excludedCompanies: true,
        allowColdEmail: true,
        maxDailyPreference: true,
        schedulePreset: true,
        notifyOnApply: true,
        notifyDigestTime: true,
      },
    });

    if (!config) {
      return NextResponse.json({
        autoApplyEnabled: false,
        autoApplyMinScore: 80,
        excludedCompanies: [],
        allowColdEmail: true,
        maxDailyPreference: 20,
        schedulePreset: 'balanced',
        notifyOnApply: true,
        notifyDigestTime: '09:00',
      });
    }

    return NextResponse.json(config);
  } catch (err) {
    console.error('[Auto-Apply Setup GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Map schedule presets to archer interval hours */
const PRESET_INTERVALS: Record<string, number> = {
  aggressive: 6,
  balanced: 12,
  relaxed: 24,
};

/**
 * POST /api/agents/auto-apply/setup
 * Saves auto-apply configuration. Requires PRO or MAX plan.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check plan — only PRO/MAX can use auto-apply
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const plan = normalizePlan(user.plan);
    if (plan === 'FREE') {
      return NextResponse.json(
        { error: 'Auto-apply requires a PRO or MAX plan. Please upgrade to continue.' },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate input
    const autoApplyMinScore = Math.min(100, Math.max(0, Number(body.autoApplyMinScore) || 80));
    const maxDailyPreference = Math.min(100, Math.max(1, Number(body.maxDailyPreference) || 20));
    const schedulePreset = ['aggressive', 'balanced', 'relaxed'].includes(body.schedulePreset)
      ? body.schedulePreset
      : 'balanced';
    const notifyDigestTime = typeof body.notifyDigestTime === 'string' && /^\d{2}:\d{2}$/.test(body.notifyDigestTime)
      ? body.notifyDigestTime
      : '09:00';

    const excludedCompanies = Array.isArray(body.excludedCompanies)
      ? body.excludedCompanies.filter((c: unknown) => typeof c === 'string' && c.trim().length > 0).map((c: string) => c.trim())
      : [];

    const allowColdEmail = typeof body.allowColdEmail === 'boolean' ? body.allowColdEmail : true;
    const notifyOnApply = typeof body.notifyOnApply === 'boolean' ? body.notifyOnApply : true;

    // Map schedule preset to archer interval
    const archerInterval = PRESET_INTERVALS[schedulePreset] || 12;

    const config = await prisma.autoApplyConfig.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        autoApplyEnabled: true,
        autoApplyMinScore,
        excludedCompanies,
        allowColdEmail,
        maxDailyPreference,
        schedulePreset,
        notifyOnApply,
        notifyDigestTime,
        archerInterval,
        // Also enable the per-agent pipeline for smart-auto
        scoutEnabled: true,
        forgeEnabled: true,
        archerEnabled: true,
      },
      update: {
        autoApplyEnabled: true,
        autoApplyMinScore,
        excludedCompanies,
        allowColdEmail,
        maxDailyPreference,
        schedulePreset,
        notifyOnApply,
        notifyDigestTime,
        archerInterval,
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        autoApplyEnabled: config.autoApplyEnabled,
        autoApplyMinScore: config.autoApplyMinScore,
        excludedCompanies: config.excludedCompanies,
        allowColdEmail: config.allowColdEmail,
        maxDailyPreference: config.maxDailyPreference,
        schedulePreset: config.schedulePreset,
        notifyOnApply: config.notifyOnApply,
        notifyDigestTime: config.notifyDigestTime,
      },
    });
  } catch (err) {
    console.error('[Auto-Apply Setup POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
