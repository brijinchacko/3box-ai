/**
 * Application Limits — Central source of truth for plan-based application caps.
 *
 * The token/credit system is replaced by simple application limits:
 * - FREE: 10 total lifetime applications (all agents unlocked)
 * - PRO:  20 applications per day (resets at midnight UTC)
 * - MAX:  50 applications per day (resets at midnight UTC)
 *
 * All AI operations (resume gen, cover letters, interview prep, etc.) are UNLIMITED.
 */

// ─── Plan Types ──────────────────────────────────────────────
export type PlanTier = 'FREE' | 'PRO' | 'MAX';

// ─── Legacy mapping (for migration period) ───────────────────
export const LEGACY_PLAN_MAP: Record<string, PlanTier> = {
  BASIC: 'FREE',
  STARTER: 'PRO',
  PRO: 'PRO',
  ULTRA: 'MAX',
  FREE: 'FREE',
  MAX: 'MAX',
};

/** Normalize any plan tier (including legacy) to the new 3-tier system */
export function normalizePlan(plan: string): PlanTier {
  return LEGACY_PLAN_MAP[plan] ?? 'FREE';
}

// ─── Application Limits ─────────────────────────────────────
export type LimitType = 'lifetime' | 'daily';

export interface PlanLimit {
  type: LimitType;
  total?: number;   // For lifetime limits (FREE plan)
  perDay?: number;  // For daily limits (PRO/MAX plans)
}

export const APP_LIMITS: Record<PlanTier, PlanLimit> = {
  FREE: { type: 'lifetime', total: 10 },
  PRO:  { type: 'daily', perDay: 20 },
  MAX:  { type: 'daily', perDay: 50 },
};

// ─── Core Functions ─────────────────────────────────────────

/**
 * Check if the user can send another application.
 *
 * @param plan - User's current plan (FREE, PRO, MAX)
 * @param totalAppsUsed - Lifetime total applications (for FREE plan)
 * @param dailyAppsUsed - Applications sent today (for PRO/MAX plans)
 */
export function canApply(
  plan: PlanTier,
  totalAppsUsed: number,
  dailyAppsUsed: number
): boolean {
  const limit = APP_LIMITS[plan];

  if (limit.type === 'lifetime') {
    return totalAppsUsed < (limit.total ?? 0);
  }

  // Daily limit (PRO/MAX)
  return dailyAppsUsed < (limit.perDay ?? 0);
}

/**
 * Get the number of applications remaining for the user.
 */
export function getApplicationsRemaining(
  plan: PlanTier,
  totalAppsUsed: number,
  dailyAppsUsed: number
): number {
  const limit = APP_LIMITS[plan];

  if (limit.type === 'lifetime') {
    return Math.max(0, (limit.total ?? 0) - totalAppsUsed);
  }

  return Math.max(0, (limit.perDay ?? 0) - dailyAppsUsed);
}

/**
 * Get usage percentage (0–100) for progress bars.
 */
export function getUsagePercent(
  plan: PlanTier,
  totalAppsUsed: number,
  dailyAppsUsed: number
): number {
  const limit = APP_LIMITS[plan];

  if (limit.type === 'lifetime') {
    const cap = limit.total ?? 1;
    return Math.min(100, Math.round((totalAppsUsed / cap) * 100));
  }

  const cap = limit.perDay ?? 1;
  return Math.min(100, Math.round((dailyAppsUsed / cap) * 100));
}

/**
 * Get the total limit value for a plan (for UI display).
 */
export function getPlanLimit(plan: PlanTier): number {
  const limit = APP_LIMITS[plan];
  return limit.type === 'lifetime' ? (limit.total ?? 0) : (limit.perDay ?? 0);
}

/**
 * Get a human-readable description of the plan's application limit.
 */
export function getPlanLimitLabel(plan: PlanTier): string {
  const limit = APP_LIMITS[plan];

  if (limit.type === 'lifetime') {
    return `${limit.total} applications total`;
  }

  return `${limit.perDay} applications per day`;
}

// ─── Plan Pricing (for UI display) ──────────────────────────
export const PLAN_PRICING: Record<PlanTier, { monthly: number; yearly: number; name: string }> = {
  FREE: { monthly: 0, yearly: 0, name: 'Free' },
  PRO:  { monthly: 29, yearly: 290, name: 'Pro' },
  MAX:  { monthly: 59, yearly: 590, name: 'Max' },
};
