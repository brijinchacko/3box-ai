import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { runAgentPipeline } from '@/lib/agents/orchestrator';
import { runIndependentScout } from '@/lib/agents/scout';
import { runIndependentForge } from '@/lib/agents/forge';
import { runIndependentArcher } from '@/lib/agents/archer';
import { isAgentAvailable, type PlanTier } from '@/lib/agents/permissions';

/**
 * Cron endpoint — called hourly by external cron job
 *
 * Dispatches agents independently based on per-agent interval configuration.
 * Falls back to the legacy pipeline path for users with only the old config.
 *
 * Protected by CRON_SECRET bearer token.
 */

interface DispatchResult {
  userId: string;
  agent: string;
  status: string;
  error?: string;
  [key: string]: any;
}

/**
 * Check if enough time has elapsed since the last run for the given interval.
 */
function shouldRunAgent(
  lastRunAt: Date | null,
  intervalHours: number,
  now: Date,
): boolean {
  if (!lastRunAt) return true; // Never run before — trigger immediately
  const elapsedMs = now.getTime() - lastRunAt.getTime();
  const intervalMs = intervalHours * 60 * 60 * 1000;
  return elapsedMs >= intervalMs;
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // ── TTL Cleanup: expire old ScoutJobs (30 days) ──
    try {
      await prisma.scoutJob.updateMany({
        where: {
          status: { in: ['NEW', 'READY', 'FORGE_READY'] },
          discoveredAt: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
        data: { status: 'EXPIRED' },
      });
    } catch (err) {
      console.error('[Cron] ScoutJob TTL cleanup failed:', err);
    }

    // ── Fetch all configs with any agent enabled ──
    const configs = await prisma.autoApplyConfig.findMany({
      where: {
        OR: [
          { scoutEnabled: true },
          { forgeEnabled: true },
          { archerEnabled: true },
          { enabled: true }, // Legacy: full pipeline users
        ],
      },
      include: {
        user: { select: { id: true, plan: true, aiCreditsUsed: true, aiCreditsLimit: true } },
      },
    });

    const results: DispatchResult[] = [];

    for (const config of configs) {
      // Skip BASIC plan users
      if (config.user.plan === 'BASIC') continue;

      // Skip if no credits remaining
      if (config.user.aiCreditsLimit >= 0 && config.user.aiCreditsUsed >= config.user.aiCreditsLimit) continue;

      // Check for any running job for this user (prevent concurrent runs)
      const activeRun = await prisma.autoApplyRun.findFirst({
        where: { userId: config.userId, status: 'running' },
      });
      if (activeRun) continue;

      const plan = config.user.plan as PlanTier;
      const hasPerAgentConfig = config.scoutEnabled || config.forgeEnabled || config.archerEnabled;

      // ── Legacy path: old-style scheduleTime pipeline ──
      if (config.enabled && !hasPerAgentConfig) {
        // Get current hour in IST (UTC+5:30)
        const istHour = (now.getUTCHours() + 5) % 24;
        const istMinute = now.getUTCMinutes() + 30;
        const adjustedHour = istMinute >= 60 ? (istHour + 1) % 24 : istHour;
        const currentTime = `${String(adjustedHour).padStart(2, '0')}:00`;

        if (config.scheduleTime === currentTime) {
          // Check if already ran today
          if (config.lastRunAt) {
            const lastRun = new Date(config.lastRunAt);
            if (lastRun.toDateString() === now.toDateString()) continue;
          }

          try {
            const automationMode = (config as any).automationMode || 'autopilot';
            const result = await runAgentPipeline({
              userId: config.userId,
              plan,
              automationMode: automationMode as any,
            });
            results.push({ userId: config.userId, agent: 'pipeline', status: result.status, jobsApplied: result.jobsApplied });
          } catch (err: any) {
            results.push({ userId: config.userId, agent: 'pipeline', status: 'failed', error: err.message });
          }
        }
        continue;
      }

      // ── Per-Agent Independent Dispatch ──

      // Scout
      if (config.scoutEnabled && shouldRunAgent(config.scoutLastRunAt, config.scoutInterval, now)) {
        if (isAgentAvailable('scout', plan)) {
          try {
            const result = await runIndependentScout(config.userId, {
              targetRoles: (config.targetRoles as string[]) || [],
              targetLocations: (config.targetLocations as string[]) || [],
              preferRemote: config.preferRemote,
              minMatchScore: config.minMatchScore,
              excludeCompanies: (config.excludeCompanies as string[]) || [],
              excludeKeywords: (config.excludeKeywords as string[]) || [],
            });
            results.push({ userId: config.userId, agent: 'scout', status: 'completed', jobsNew: result.jobsNew });
          } catch (err: any) {
            results.push({ userId: config.userId, agent: 'scout', status: 'failed', error: err.message });
          }
        }
      }

      // Forge (skip on_demand mode — only runs when manually triggered)
      if (config.forgeEnabled && config.forgeMode !== 'on_demand' && shouldRunAgent(config.forgeLastRunAt, config.forgeInterval, now)) {
        if (isAgentAvailable('forge', plan)) {
          try {
            const result = await runIndependentForge(config.userId, {
              forgeMode: config.forgeMode as any,
              resumeId: config.resumeId || undefined,
            });
            results.push({ userId: config.userId, agent: 'forge', status: 'completed', jobsProcessed: result.jobsProcessed });
          } catch (err: any) {
            results.push({ userId: config.userId, agent: 'forge', status: 'failed', error: err.message });
          }
        }
      }

      // Archer
      if (config.archerEnabled && shouldRunAgent(config.archerLastRunAt, config.archerInterval, now)) {
        if (isAgentAvailable('archer', plan)) {
          try {
            const result = await runIndependentArcher(config.userId, {
              maxPerRun: config.archerMaxPerRun,
              resumeId: config.resumeId || undefined,
              forgeEnabled: config.forgeEnabled,
              forgeMode: config.forgeMode,
            });
            results.push({ userId: config.userId, agent: 'archer', status: 'completed', jobsApplied: result.jobsApplied });
          } catch (err: any) {
            results.push({ userId: config.userId, agent: 'archer', status: 'failed', error: err.message });
          }
        }
      }
    }

    return NextResponse.json({ triggered: results.length, results });
  } catch (err) {
    console.error('[Agents Cron] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
