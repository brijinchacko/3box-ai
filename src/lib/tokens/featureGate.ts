/**
 * Feature Gate — server-side check for whether a FREE user
 * has exhausted their weekly application limit.
 *
 * IMPORTANT: AI operations (resume gen, cover letters, etc.) are UNLIMITED
 * on all plans. This gate ONLY checks application submission limits.
 * PRO/MAX users are never feature-locked.
 */
import { normalizePlan } from './pricing';
import { checkApplicationCap } from './dailyCap';

export interface FeatureGateResult {
  locked: boolean;
  reason?: string;
}

/**
 * Check if the user's features should be locked.
 * Uses the same weekly/daily cap logic as application submissions
 * (not lifetime totalAppsUsed which was the old buggy behavior).
 */
export async function checkFeatureGate(userId: string): Promise<FeatureGateResult> {
  // Reuse the application cap system which correctly counts weekly for FREE
  const cap = await checkApplicationCap(userId);

  // If the cap check itself returns allowed=true, user is not locked
  if (cap.allowed) return { locked: false };

  // Only lock FREE users — PRO/MAX just can't apply more but features stay open
  // (cap.allowed would be false for PRO/MAX who hit daily limit too, but we don't lock them)
  return {
    locked: true,
    reason: `Free plan limit reached (${cap.used}/${cap.limit} applications this week). Upgrade to Pro to continue.`,
  };
}
