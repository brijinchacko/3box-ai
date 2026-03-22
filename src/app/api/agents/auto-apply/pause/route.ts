import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/agents/auto-apply/pause
 * Emergency pause — immediately disables auto-apply for the authenticated user.
 * Sets autoApplyEnabled to false so no further cron dispatches occur.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await prisma.autoApplyConfig.findUnique({
      where: { userId: session.user.id },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'No auto-apply configuration found' },
        { status: 404 },
      );
    }

    if (!config.autoApplyEnabled) {
      return NextResponse.json({
        success: true,
        message: 'Auto-apply is already paused',
        autoApplyEnabled: false,
      });
    }

    await prisma.autoApplyConfig.update({
      where: { userId: session.user.id },
      data: { autoApplyEnabled: false },
    });

    // Also cancel any currently running auto-apply runs
    await prisma.autoApplyRun.updateMany({
      where: { userId: session.user.id, status: 'running' },
      data: { status: 'failed', completedAt: new Date(), summary: 'Emergency pause activated by user' },
    });

    return NextResponse.json({
      success: true,
      message: 'Auto-apply has been paused immediately',
      autoApplyEnabled: false,
    });
  } catch (err) {
    console.error('[Auto-Apply Pause] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
