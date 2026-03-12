/**
 * Smart Application Router — Data-driven routing that learns
 * which channels work best for each company and ATS type.
 *
 * Falls back to static defaults when no outcome data exists.
 */

import { routeApplication, detectATSType, type ApplicationChannel, type ATSType, type RouteDecision } from './router';

const { prisma } = require('@/lib/db/prisma');

// Default channel ranking when no data exists
const DEFAULT_RANKING: ApplicationChannel[] = [
  'ats_api',
  'extension_queue',
  'user_email',
  'cold_email',
  'portal_queue',
];

interface ChannelStats {
  channel: ApplicationChannel;
  totalAttempts: number;
  successCount: number;
  responseRate: number;
  avgResponseMs: number | null;
}

/**
 * Get channel ranking for a company + ATS type based on historical success rates.
 * Falls back to: company-level → ATS-level → global → static defaults.
 */
export async function getChannelRanking(
  company?: string,
  atsType?: string,
): Promise<ApplicationChannel[]> {
  try {
    // Try company-specific stats first
    if (company) {
      const companyStats = await prisma.channelSuccessRate.findMany({
        where: { company, totalAttempts: { gte: 3 } },
        orderBy: { responseRate: 'desc' },
        select: { channel: true, responseRate: true, totalAttempts: true },
      });

      if (companyStats.length >= 2) {
        const ranked = companyStats.map((s: any) => s.channel as ApplicationChannel);
        // Add any missing channels at the end
        for (const ch of DEFAULT_RANKING) {
          if (!ranked.includes(ch)) ranked.push(ch);
        }
        return ranked;
      }
    }

    // Try ATS-type-level stats
    if (atsType) {
      const atsStats = await prisma.channelSuccessRate.findMany({
        where: { atsType, company: null, totalAttempts: { gte: 5 } },
        orderBy: { responseRate: 'desc' },
        select: { channel: true },
      });

      if (atsStats.length >= 2) {
        const ranked = atsStats.map((s: any) => s.channel as ApplicationChannel);
        for (const ch of DEFAULT_RANKING) {
          if (!ranked.includes(ch)) ranked.push(ch);
        }
        return ranked;
      }
    }

    // Try global stats
    const globalStats = await prisma.channelSuccessRate.findMany({
      where: { company: null, atsType: null, totalAttempts: { gte: 10 } },
      orderBy: { responseRate: 'desc' },
      select: { channel: true },
    });

    if (globalStats.length >= 2) {
      const ranked = globalStats.map((s: any) => s.channel as ApplicationChannel);
      for (const ch of DEFAULT_RANKING) {
        if (!ranked.includes(ch)) ranked.push(ch);
      }
      return ranked;
    }
  } catch (err) {
    console.error('[SmartRouter] Error fetching stats:', err);
  }

  return DEFAULT_RANKING;
}

/**
 * Smart route a job application using historical success data.
 * Returns the same RouteDecision as the static router, but may
 * override the channel if data suggests a better option.
 */
export async function smartRouteApplication(
  jobUrl: string,
  hasVerifiedEmail: boolean = false,
  emailConfidence: number = 0,
  hasConnectedEmail: boolean = false,
  hasExtension: boolean = false,
  company?: string,
): Promise<RouteDecision> {
  // Start with the static router's decision
  const staticDecision = routeApplication(jobUrl, hasVerifiedEmail, emailConfidence, hasConnectedEmail, hasExtension);

  // If the static router chose ATS API (Greenhouse/Lever), always use it — it's the best
  if (staticDecision.channel === 'ats_api') {
    return staticDecision;
  }

  // Get smart ranking for this company/ATS
  const ranking = await getChannelRanking(company, staticDecision.atsType);

  // Find the best available channel from the ranking
  for (const channel of ranking) {
    // Check if the channel is available for this context
    if (channel === 'ats_api' && !staticDecision.supportsDirectApi) continue;
    if (channel === 'extension_queue' && !hasExtension) continue;
    if (channel === 'user_email' && !hasConnectedEmail) continue;
    if (channel === 'cold_email' && (!hasVerifiedEmail || emailConfidence < 50)) continue;

    // This channel is available — use it
    if (channel !== staticDecision.channel) {
      return {
        ...staticDecision,
        channel,
        priority: DEFAULT_RANKING.indexOf(channel) + 1,
        reason: `Smart routing: ${channel} has higher success rate for ${company || staticDecision.atsType}`,
      };
    }
    break;
  }

  return staticDecision;
}

/**
 * Get channel effectiveness stats for dashboard display.
 */
export async function getChannelEffectiveness(): Promise<ChannelStats[]> {
  try {
    const stats = await prisma.channelSuccessRate.findMany({
      where: { company: null, atsType: null },
      orderBy: { responseRate: 'desc' },
    });

    return stats.map((s: any) => ({
      channel: s.channel as ApplicationChannel,
      totalAttempts: s.totalAttempts,
      successCount: s.successCount,
      responseRate: s.responseRate,
      avgResponseMs: s.avgResponseMs,
    }));
  } catch {
    return [];
  }
}
