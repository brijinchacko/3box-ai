/**
 * Application Outcome Tracker
 * Records outcomes for each application channel and recalculates
 * success rates for the smart router to learn from.
 */

const { prisma } = require('@/lib/db/prisma');

type Outcome = 'applied' | 'viewed' | 'interview' | 'offer' | 'rejected' | 'no_response';

/**
 * Record the outcome of a job application for a specific channel.
 */
export async function recordOutcome(params: {
  userId: string;
  company: string;
  atsType: string;
  channel: string;
  outcome: Outcome;
  appliedAt: Date;
  outcomeAt?: Date;
}): Promise<void> {
  try {
    const responseTimeMs = params.outcomeAt
      ? params.outcomeAt.getTime() - params.appliedAt.getTime()
      : null;

    await prisma.applicationOutcome.create({
      data: {
        userId: params.userId,
        company: params.company,
        atsType: params.atsType,
        channel: params.channel,
        outcome: params.outcome,
        responseTimeMs,
        appliedAt: params.appliedAt,
        outcomeAt: params.outcomeAt || null,
      },
    });

    // Trigger incremental recalculation for this company + channel
    await recalculateForCompanyChannel(params.company, params.atsType, params.channel);
  } catch (err) {
    console.error('[OutcomeTracker] Error recording outcome:', err);
  }
}

/**
 * Recalculate success rates for a specific company + channel combination.
 */
async function recalculateForCompanyChannel(
  company: string,
  atsType: string,
  channel: string,
): Promise<void> {
  const SUCCESS_OUTCOMES = ['viewed', 'interview', 'offer'];

  // Company-specific stats
  const companyOutcomes = await prisma.applicationOutcome.findMany({
    where: { company, channel },
    select: { outcome: true, responseTimeMs: true },
  });

  if (companyOutcomes.length > 0) {
    const total = companyOutcomes.length;
    const successes = companyOutcomes.filter((o: any) => SUCCESS_OUTCOMES.includes(o.outcome)).length;
    const avgMs = companyOutcomes
      .filter((o: any) => o.responseTimeMs != null)
      .reduce((sum: number, o: any) => sum + o.responseTimeMs, 0) / (total || 1);

    await prisma.channelSuccessRate.upsert({
      where: { company_atsType_channel: { company, atsType, channel } },
      create: {
        company,
        atsType,
        channel,
        totalAttempts: total,
        successCount: successes,
        responseRate: total > 0 ? successes / total : 0,
        avgResponseMs: avgMs || null,
      },
      update: {
        totalAttempts: total,
        successCount: successes,
        responseRate: total > 0 ? successes / total : 0,
        avgResponseMs: avgMs || null,
        lastUpdated: new Date(),
      },
    });
  }

  // Also update global stats for this channel
  await recalculateGlobalChannel(channel);
}

/**
 * Recalculate global success rates for a channel (across all companies).
 */
async function recalculateGlobalChannel(channel: string): Promise<void> {
  const SUCCESS_OUTCOMES = ['viewed', 'interview', 'offer'];

  const allOutcomes = await prisma.applicationOutcome.findMany({
    where: { channel },
    select: { outcome: true, responseTimeMs: true },
  });

  if (allOutcomes.length > 0) {
    const total = allOutcomes.length;
    const successes = allOutcomes.filter((o: any) => SUCCESS_OUTCOMES.includes(o.outcome)).length;
    const withResponse = allOutcomes.filter((o: any) => o.responseTimeMs != null);
    const avgMs = withResponse.length > 0
      ? withResponse.reduce((sum: number, o: any) => sum + o.responseTimeMs, 0) / withResponse.length
      : null;

    await prisma.channelSuccessRate.upsert({
      where: { company_atsType_channel: { company: null, atsType: null, channel } },
      create: {
        company: null,
        atsType: null,
        channel,
        totalAttempts: total,
        successCount: successes,
        responseRate: total > 0 ? successes / total : 0,
        avgResponseMs: avgMs,
      },
      update: {
        totalAttempts: total,
        successCount: successes,
        responseRate: total > 0 ? successes / total : 0,
        avgResponseMs: avgMs,
        lastUpdated: new Date(),
      },
    });
  }
}

/**
 * Full recalculation of all success rates — run nightly via cron.
 */
export async function recalculateAllSuccessRates(): Promise<{ processed: number }> {
  const SUCCESS_OUTCOMES = ['viewed', 'interview', 'offer'];

  // Get all unique company + channel combinations
  const groups = await prisma.applicationOutcome.groupBy({
    by: ['company', 'atsType', 'channel'],
    _count: { id: true },
    _avg: { responseTimeMs: true },
  });

  let processed = 0;

  for (const group of groups) {
    const outcomes = await prisma.applicationOutcome.findMany({
      where: { company: group.company, atsType: group.atsType, channel: group.channel },
      select: { outcome: true },
    });

    const total = outcomes.length;
    const successes = outcomes.filter((o: any) => SUCCESS_OUTCOMES.includes(o.outcome)).length;

    await prisma.channelSuccessRate.upsert({
      where: {
        company_atsType_channel: {
          company: group.company,
          atsType: group.atsType,
          channel: group.channel,
        },
      },
      create: {
        company: group.company,
        atsType: group.atsType,
        channel: group.channel,
        totalAttempts: total,
        successCount: successes,
        responseRate: total > 0 ? successes / total : 0,
        avgResponseMs: group._avg?.responseTimeMs || null,
      },
      update: {
        totalAttempts: total,
        successCount: successes,
        responseRate: total > 0 ? successes / total : 0,
        avgResponseMs: group._avg?.responseTimeMs || null,
        lastUpdated: new Date(),
      },
    });
    processed++;
  }

  // Also recalculate global per-channel
  const globalGroups = await prisma.applicationOutcome.groupBy({
    by: ['channel'],
    _count: { id: true },
    _avg: { responseTimeMs: true },
  });

  for (const g of globalGroups) {
    const outcomes = await prisma.applicationOutcome.findMany({
      where: { channel: g.channel },
      select: { outcome: true },
    });

    const total = outcomes.length;
    const successes = outcomes.filter((o: any) => SUCCESS_OUTCOMES.includes(o.outcome)).length;

    await prisma.channelSuccessRate.upsert({
      where: { company_atsType_channel: { company: null, atsType: null, channel: g.channel } },
      create: {
        company: null,
        atsType: null,
        channel: g.channel,
        totalAttempts: total,
        successCount: successes,
        responseRate: total > 0 ? successes / total : 0,
        avgResponseMs: g._avg?.responseTimeMs || null,
      },
      update: {
        totalAttempts: total,
        successCount: successes,
        responseRate: total > 0 ? successes / total : 0,
        avgResponseMs: g._avg?.responseTimeMs || null,
        lastUpdated: new Date(),
      },
    });
    processed++;
  }

  return { processed };
}

/**
 * Get per-company channel stats for dashboard.
 */
export async function getCompanyChannelStats(company: string) {
  return prisma.channelSuccessRate.findMany({
    where: { company },
    orderBy: { responseRate: 'desc' },
  });
}
