/**
 * Feature Gate — server-side check for whether a FREE user
 * has exhausted their lifetime application limit and should
 * be blocked from ALL features (not just applications).
 *
 * PRO/MAX users are never feature-locked.
 */
import { prisma } from '@/lib/db/prisma';
import { normalizePlan, APP_LIMITS } from './pricing';

export interface FeatureGateResult {
  locked: boolean;
  reason?: string;
}

/**
 * Check if the user's features should be locked.
 * Returns { locked: true } only for FREE users who've hit their limit.
 */
export async function checkFeatureGate(userId: string): Promise<FeatureGateResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, totalAppsUsed: true },
  });

  if (!user) return { locked: true, reason: 'User not found' };

  const plan = normalizePlan(user.plan);

  // PRO and MAX users are never feature-locked
  if (plan !== 'FREE') return { locked: false };

  const limit = APP_LIMITS.FREE;
  const total = limit.type === 'lifetime' ? (limit.total ?? 10) : 10;

  if (user.totalAppsUsed >= total) {
    return {
      locked: true,
      reason: `Free plan limit reached (${user.totalAppsUsed}/${total} applications used). Upgrade to Pro to continue.`,
    };
  }

  return { locked: false };
}
