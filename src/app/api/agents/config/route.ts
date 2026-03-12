import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const config = await prisma.autoApplyConfig.findUnique({ where: { userId: session.user.id } });
    
    if (!config) {
      return NextResponse.json({
        enabled: false,
        automationMode: 'autopilot',
        resumeId: null,
        targetRoles: [],
        targetLocations: [],
        minMatchScore: 60,
        maxAppliesPerRun: 5,
        excludeCompanies: [],
        excludeKeywords: [],
        scheduleTime: null,
        preferRemote: false,
        lastRunAt: null,
        // Per-agent scheduling defaults
        scoutEnabled: false,
        scoutInterval: 24,
        scoutJobsPerSearch: 10,
        scoutDailyCap: 50,
        scoutDailyCount: 0,
        scoutDailyResetAt: null,
        scoutAutoMode: false,
        scoutLastRunAt: null,
        forgeEnabled: false,
        forgeInterval: 24,
        forgeLastRunAt: null,
        forgeMode: 'on_demand',
        archerEnabled: false,
        archerInterval: 24,
        archerLastRunAt: null,
        archerMaxPerRun: 10,
      });
    }

    return NextResponse.json({
      ...config,
      targetRoles: config.targetRoles || [],
      targetLocations: config.targetLocations || [],
      excludeCompanies: config.excludeCompanies || [],
      excludeKeywords: config.excludeKeywords || [],
    });
  } catch (err) {
    console.error('[Agents Config] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      enabled, automationMode, resumeId, targetRoles, targetLocations,
      minMatchScore, maxAppliesPerRun, excludeCompanies, excludeKeywords,
      scheduleTime, preferRemote,
      // Per-agent scheduling fields
      scoutEnabled, scoutInterval, scoutJobsPerSearch, scoutDailyCap, scoutAutoMode,
      forgeEnabled, forgeInterval, forgeMode,
      archerEnabled, archerInterval, archerMaxPerRun,
    } = body;

    // If enabling, check for finalized resume
    if (enabled) {
      const hasResume = await prisma.resume.findFirst({
        where: { userId: session.user.id, isFinalized: true },
      });
      if (!hasResume && !resumeId) {
        return NextResponse.json({ error: 'Please finalize a resume before enabling agents' }, { status: 400 });
      }
    }

    const data: any = {};
    if (typeof enabled === 'boolean') data.enabled = enabled;
    if (typeof automationMode === 'string' && ['copilot', 'autopilot', 'full-agent'].includes(automationMode)) {
      data.automationMode = automationMode;
    }
    if (resumeId !== undefined) data.resumeId = resumeId;
    if (Array.isArray(targetRoles)) data.targetRoles = targetRoles;
    if (Array.isArray(targetLocations)) data.targetLocations = targetLocations;
    if (typeof minMatchScore === 'number') data.minMatchScore = Math.min(90, Math.max(40, minMatchScore));
    if (typeof maxAppliesPerRun === 'number') data.maxAppliesPerRun = Math.min(20, Math.max(1, maxAppliesPerRun));
    if (Array.isArray(excludeCompanies)) data.excludeCompanies = excludeCompanies;
    if (Array.isArray(excludeKeywords)) data.excludeKeywords = excludeKeywords;
    if (scheduleTime !== undefined) data.scheduleTime = scheduleTime;
    if (typeof preferRemote === 'boolean') data.preferRemote = preferRemote;

    // ── Per-Agent Scheduling Fields ──
    const VALID_INTERVALS = [1, 2, 4, 6, 12, 24];

    if (typeof scoutEnabled === 'boolean') data.scoutEnabled = scoutEnabled;
    if (typeof scoutInterval === 'number' && VALID_INTERVALS.includes(scoutInterval)) data.scoutInterval = scoutInterval;
    if (typeof scoutJobsPerSearch === 'number') data.scoutJobsPerSearch = Math.min(50, Math.max(5, scoutJobsPerSearch));
    if (typeof scoutDailyCap === 'number') data.scoutDailyCap = Math.min(100, Math.max(5, scoutDailyCap));
    if (typeof scoutAutoMode === 'boolean') data.scoutAutoMode = scoutAutoMode;

    if (typeof forgeEnabled === 'boolean') data.forgeEnabled = forgeEnabled;
    if (typeof forgeInterval === 'number' && VALID_INTERVALS.includes(forgeInterval)) data.forgeInterval = forgeInterval;
    if (typeof forgeMode === 'string' && ['on_demand', 'per_job', 'base_only'].includes(forgeMode)) data.forgeMode = forgeMode;

    if (typeof archerEnabled === 'boolean') data.archerEnabled = archerEnabled;
    if (typeof archerInterval === 'number' && VALID_INTERVALS.includes(archerInterval)) data.archerInterval = archerInterval;
    if (typeof archerMaxPerRun === 'number') data.archerMaxPerRun = Math.min(100, Math.max(1, archerMaxPerRun));

    const config = await prisma.autoApplyConfig.upsert({
      where: { userId: session.user.id },
      update: data,
      create: { userId: session.user.id, ...data },
    });

    return NextResponse.json(config);
  } catch (err) {
    console.error('[Agents Config] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
