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
    const { enabled, automationMode, resumeId, targetRoles, targetLocations, minMatchScore, maxAppliesPerRun, excludeCompanies, excludeKeywords, scheduleTime, preferRemote } = body;

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
