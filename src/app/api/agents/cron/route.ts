import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { runAgentPipeline } from '@/lib/agents/orchestrator';

/**
 * Cron endpoint — called hourly by external cron job
 * Checks for users with scheduled runs and triggers their pipelines
 * Protected by CRON_SECRET bearer token
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current hour in IST (UTC+5:30)
    const now = new Date();
    const istHour = (now.getUTCHours() + 5) % 24;
    const istMinute = now.getUTCMinutes() + 30;
    const adjustedHour = istMinute >= 60 ? (istHour + 1) % 24 : istHour;
    const currentTime = `${String(adjustedHour).padStart(2, '0')}:00`;

    // Find users with matching schedule time
    const configs = await prisma.autoApplyConfig.findMany({
      where: {
        enabled: true,
        scheduleTime: currentTime,
      },
      include: {
        user: { select: { id: true, plan: true, aiCreditsUsed: true, aiCreditsLimit: true } },
      },
    });

    const results = [];
    for (const config of configs) {
      // Skip BASIC plan users
      if (config.user.plan === 'BASIC') continue;

      // Skip if no credits
      if (config.user.aiCreditsLimit >= 0 && config.user.aiCreditsUsed >= config.user.aiCreditsLimit) continue;

      // Skip if already ran today
      if (config.lastRunAt) {
        const lastRun = new Date(config.lastRunAt);
        const today = new Date();
        if (lastRun.toDateString() === today.toDateString()) continue;
      }

      try {
        const result = await runAgentPipeline({
          userId: config.userId,
          plan: config.user.plan as any,
        });
        results.push({ userId: config.userId, status: result.status, jobsApplied: result.jobsApplied });
      } catch (err: any) {
        results.push({ userId: config.userId, status: 'failed', error: err.message });
      }
    }

    return NextResponse.json({ triggered: results.length, results });
  } catch (err) {
    console.error('[Agents Cron] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
