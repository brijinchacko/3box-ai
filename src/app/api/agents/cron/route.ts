import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { runAgentPipeline } from '@/lib/agents/orchestrator';
import { runIndependentScout } from '@/lib/agents/scout';
import { runIndependentForge } from '@/lib/agents/forge';
import { runIndependentArcher } from '@/lib/agents/archer';
import { checkApplicationCap } from '@/lib/tokens/dailyCap';
import { normalizePlan } from '@/lib/tokens/pricing';
import { sendAgentRunSummaryEmail } from '@/lib/email';

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

    // ── TTL Cleanup: expire old ScoutJobs (14 days) ──
    try {
      await prisma.scoutJob.updateMany({
        where: {
          status: { in: ['NEW', 'READY', 'FORGE_READY'] },
          discoveredAt: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
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
        user: { select: { id: true, email: true, name: true, plan: true } },
      },
    });

    const results: DispatchResult[] = [];

    // Limit configs to prevent cron from running too long
    const maxConfigs = 50;
    const limitedConfigs = configs.slice(0, maxConfigs);
    if (configs.length > maxConfigs) {
      console.warn(`[Cron] Processing ${maxConfigs} of ${configs.length} configs to prevent timeout`);
    }

    for (const config of limitedConfigs) {
      // Skip FREE plan users from cron automation
      if (normalizePlan(config.user.plan) === 'FREE') continue;

      // Check application cap (only applications are limited, AI operations are unlimited)
      const appCap = await checkApplicationCap(config.userId);
      if (!appCap.allowed) {
        console.log(`[Cron] Agents paused for user ${config.userId}: application cap reached (${appCap.used}/${appCap.limit})`);
        continue;
      }

      // Check for any running job for this user (prevent concurrent runs)
      const activeRun = await prisma.autoApplyRun.findFirst({
        where: { userId: config.userId, status: 'running' },
      });
      if (activeRun) continue;

      const plan = normalizePlan(config.user.plan);
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

      // Scout — all agents unlocked for all plans
      if (config.scoutEnabled && shouldRunAgent(config.scoutLastRunAt, config.scoutInterval, now)) {
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

      // Forge (skip on_demand mode — only runs when manually triggered)
      if (config.forgeEnabled && config.forgeMode !== 'on_demand' && shouldRunAgent(config.forgeLastRunAt, config.forgeInterval, now)) {
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

      // Archer — check application cap before dispatching
      if (config.archerEnabled && shouldRunAgent(config.archerLastRunAt, config.archerInterval, now)) {
        const appCapCheck = await checkApplicationCap(config.userId);
        if (!appCapCheck.allowed) {
          console.log(`[Cron] Archer app cap for ${config.userId}: ${appCapCheck.used}/${appCapCheck.limit}`);
          results.push({ userId: config.userId, agent: 'archer', status: 'daily_cap_reached' });
        } else {
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

      // ── Send Email Notification ──
      // Only send if agents ran AND actually found/applied something useful
      const userResults = results.filter(r => r.userId === config.userId && r.status === 'completed');
      if (userResults.length > 0 && config.user.email) {
        try {
          const jobsFound = userResults.reduce((sum, r) => sum + (r.jobsNew || 0), 0);
          const jobsApplied = userResults.reduce((sum, r) => sum + (r.jobsApplied || 0), 0);
          const agentsUsed = userResults.map(r => r.agent.charAt(0).toUpperCase() + r.agent.slice(1));

          // Skip sending email if nothing meaningful happened (0 jobs, 0 applications)
          if (jobsFound === 0 && jobsApplied === 0) {
            console.log(`[Cron] Skipping email for ${config.user.email} — no jobs found or applied`);
            continue;
          }

          // Fetch top recent matches for the email
          const topMatches = await prisma.scoutJob.findMany({
            where: { userId: config.userId, status: { in: ['NEW', 'READY', 'FORGE_READY'] } },
            orderBy: { matchScore: 'desc' },
            take: 5,
            select: { title: true, company: true, matchScore: true },
          });

          await sendAgentRunSummaryEmail(
            config.user.email,
            config.user.name || 'there',
            {
              jobsFound,
              jobsApplied,
              topMatches: topMatches.map(j => ({
                title: j.title,
                company: j.company,
                matchScore: j.matchScore || 0,
              })),
              agentsUsed,
              creditsUsed: 0, // Credits tracked separately per agent
            }
          );
          console.log(`[Cron] Email sent to ${config.user.email} — ${agentsUsed.join(', ')} completed`);
        } catch (emailErr) {
          console.error(`[Cron] Failed to send email to ${config.user.email}:`, emailErr);
        }
      }
    }

    return NextResponse.json({ triggered: results.length, results });
  } catch (err) {
    console.error('[Agents Cron] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
