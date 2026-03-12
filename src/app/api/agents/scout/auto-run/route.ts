import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { runScout, persistScoutJobs } from '@/lib/agents/scout';
import { checkApplicationCap } from '@/lib/tokens/dailyCap';
import { normalizePlan } from '@/lib/tokens/pricing';

/**
 * Scout Auto-Run — called by a cron/scheduler to execute Scout for all users
 * with scoutAutoMode enabled and whose interval has elapsed.
 *
 * POST /api/agents/scout/auto-run
 * Body: { secret: string } — must match CRON_SECRET env var
 *
 * This also supports individual user auto-runs from the client:
 * POST /api/agents/scout/auto-run
 * Body: { userId: string } — authenticated via session in that case
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { secret, userId: singleUserId } = body;

    // Auth: either CRON_SECRET or we find all eligible users
    if (!secret && !singleUserId) {
      return NextResponse.json({ error: 'Missing secret or userId' }, { status: 401 });
    }

    if (secret && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
    }

    const now = new Date();

    // Reset daily counts if a new day has started
    await prisma.autoApplyConfig.updateMany({
      where: {
        scoutAutoMode: true,
        scoutDailyResetAt: { lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      },
      data: {
        scoutDailyCount: 0,
        scoutDailyResetAt: now,
      },
    });

    // Find users eligible for auto-run
    const configs = await prisma.autoApplyConfig.findMany({
      where: {
        scoutAutoMode: true,
        ...(singleUserId ? { userId: singleUserId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            plan: true,
          },
        },
      },
    });

    const results: { userId: string; status: string; jobsFound?: number }[] = [];

    for (const config of configs) {
      const user = config.user;

      // Check if interval has elapsed
      if (config.scoutLastRunAt) {
        const hoursSinceLastRun = (now.getTime() - new Date(config.scoutLastRunAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRun < config.scoutInterval) {
          results.push({ userId: user.id, status: 'skipped_interval' });
          continue;
        }
      }

      // Check daily cap
      if (config.scoutDailyCount >= config.scoutDailyCap) {
        results.push({ userId: user.id, status: 'daily_cap_reached' });
        continue;
      }

      // Skip FREE plan users from auto-run
      const plan = normalizePlan(user.plan || 'FREE');
      if (plan === 'FREE') {
        results.push({ userId: user.id, status: 'plan_ineligible' });
        continue;
      }

      // Check application cap
      const appCap = await checkApplicationCap(user.id);
      if (!appCap.allowed) {
        results.push({ userId: user.id, status: 'application_cap_reached' });
        continue;
      }

      // Get target roles — prefer AutoApplyConfig (synced from search profiles), fallback to careerTwin
      const configRoles = Array.isArray(config.targetRoles) ? config.targetRoles as string[] : [];
      const configLocations = Array.isArray(config.targetLocations) ? config.targetLocations as string[] : [];
      let targetRoles = configRoles.filter(Boolean);
      let targetLocations = configLocations.filter(Boolean);

      if (targetRoles.length === 0) {
        // Fallback: get from careerTwin
        const twin = await prisma.careerTwin.findUnique({ where: { userId: user.id } });
        const roles = twin?.targetRoles as any;
        const targetRole = Array.isArray(roles) && roles.length > 0
          ? (typeof roles[0] === 'string' ? roles[0] : roles[0]?.title || '')
          : '';
        if (targetRole) targetRoles = [targetRole];
        const snap = twin?.skillSnapshot as any;
        const userLocation = snap?._profile?.location || '';
        if (userLocation && targetLocations.length === 0) targetLocations = [userLocation];
      }

      if (targetRoles.length === 0) {
        results.push({ userId: user.id, status: 'no_target_role' });
        continue;
      }

      try {
        // Create run record
        const run = await prisma.autoApplyRun.create({
          data: {
            userId: user.id,
            status: 'running',
            agentType: 'scout',
            jobsFound: 0,
            jobsApplied: 0,
            jobsSkipped: 0,
            creditsUsed: 0,
            summary: `Auto Scout: ${targetRoles.join(', ')} (${config.scoutJobsPerSearch} jobs)`,
          },
        });

        // Run Scout
        const result = await runScout({
          userId: user.id,
          targetRoles,
          targetLocations,
          preferRemote: config.preferRemote ?? false,
          minMatchScore: config.minMatchScore ?? 20,
          excludeCompanies: (config.excludeCompanies as string[]) || [],
          excludeKeywords: (config.excludeKeywords as string[]) || [],
          limit: config.scoutJobsPerSearch || 10,
        });

        // Persist jobs
        const { newCount, dupCount } = await persistScoutJobs(user.id, result.jobs, run.id);

        // Update run, config, and log activity
        await Promise.all([
          prisma.autoApplyRun.update({
            where: { id: run.id },
            data: {
              status: 'completed',
              completedAt: new Date(),
              jobsFound: result.totalFound,
              jobsSkipped: result.scamJobsFiltered,
              creditsUsed: 0,
              summary: `Auto Scout found ${result.totalFound} jobs, ${newCount} new, ${dupCount} duplicates`,
              details: JSON.parse(JSON.stringify({
                autoMode: true,
                jobs: result.jobs,
                totalFound: result.totalFound,
                totalFiltered: result.totalFiltered,
                scamJobsFiltered: result.scamJobsFiltered,
                newJobs: newCount,
                duplicates: dupCount,
                sources: result.sources,
              })),
            },
          }),
          prisma.autoApplyConfig.update({
            where: { userId: user.id },
            data: {
              scoutLastRunAt: new Date(),
              scoutDailyCount: { increment: result.totalFound },
            },
          }),
          // Log activity for notification polling
          prisma.agentActivity.create({
            data: {
              userId: user.id,
              agent: 'scout',
              action: 'auto_hunt_complete',
              summary: `Auto Scout found ${result.totalFound} jobs (${newCount} new). ${result.scamJobsFiltered} spam filtered.`,
              creditsUsed: 0,
              runId: run.id,
              details: JSON.parse(JSON.stringify({
                autoMode: true,
                totalFound: result.totalFound,
                newJobs: newCount,
                duplicates: dupCount,
                scamFiltered: result.scamJobsFiltered,
              })),
            },
          }).catch(() => {}),
        ]);

        results.push({ userId: user.id, status: 'completed', jobsFound: result.totalFound });
      } catch (err: any) {
        console.error(`[Scout Auto-Run] Error for user ${user.id}:`, err);
        results.push({ userId: user.id, status: 'error' });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
      timestamp: now.toISOString(),
    });
  } catch (err: any) {
    console.error('[Scout Auto-Run] Error:', err);
    return NextResponse.json({ error: err.message || 'Auto-run failed' }, { status: 500 });
  }
}
