/**
 * Application Limits — Central source of truth for plan-based application caps.
 *
 * - FREE: 5 applications per week (resets every Monday at midnight UTC)
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
export type LimitType = 'weekly' | 'daily';

export interface PlanLimit {
  type: LimitType;
  perWeek?: number;  // For weekly limits (FREE plan)
  perDay?: number;   // For daily limits (PRO/MAX plans)
}

export const APP_LIMITS: Record<PlanTier, PlanLimit> = {
  FREE: { type: 'weekly', perWeek: 5 },
  PRO:  { type: 'daily', perDay: 20 },
  MAX:  { type: 'daily', perDay: 50 },
};

// ─── Core Functions ─────────────────────────────────────────

/**
 * Check if the user can send another application.
 *
 * @param plan - User's current plan (FREE, PRO, MAX)
 * @param periodAppsUsed - Applications in the current period (this week for FREE, today for PRO/MAX)
 */
export function canApply(
  plan: PlanTier,
  _totalAppsUsed: number,
  periodAppsUsed: number
): boolean {
  const limit = APP_LIMITS[plan];

  if (limit.type === 'weekly') {
    return periodAppsUsed < (limit.perWeek ?? 0);
  }

  // Daily limit (PRO/MAX)
  return periodAppsUsed < (limit.perDay ?? 0);
}

/**
 * Get the number of applications remaining for the user.
 */
export function getApplicationsRemaining(
  plan: PlanTier,
  _totalAppsUsed: number,
  periodAppsUsed: number
): number {
  const limit = APP_LIMITS[plan];

  if (limit.type === 'weekly') {
    return Math.max(0, (limit.perWeek ?? 0) - periodAppsUsed);
  }

  return Math.max(0, (limit.perDay ?? 0) - periodAppsUsed);
}

/**
 * Get usage percentage (0–100) for progress bars.
 */
export function getUsagePercent(
  plan: PlanTier,
  _totalAppsUsed: number,
  periodAppsUsed: number
): number {
  const limit = APP_LIMITS[plan];

  if (limit.type === 'weekly') {
    const cap = limit.perWeek ?? 1;
    return Math.min(100, Math.round((periodAppsUsed / cap) * 100));
  }

  const cap = limit.perDay ?? 1;
  return Math.min(100, Math.round((periodAppsUsed / cap) * 100));
}

/**
 * Get the total limit value for a plan (for UI display).
 */
export function getPlanLimit(plan: PlanTier): number {
  const limit = APP_LIMITS[plan];
  return limit.type === 'weekly' ? (limit.perWeek ?? 0) : (limit.perDay ?? 0);
}

/**
 * Get a human-readable description of the plan's application limit.
 */
export function getPlanLimitLabel(plan: PlanTier): string {
  const limit = APP_LIMITS[plan];

  if (limit.type === 'weekly') {
    return `${limit.perWeek} applications per week`;
  }

  return `${limit.perDay} applications per day`;
}

/**
 * Get the start of the current week (Monday at 00:00 UTC).
 */
export function getWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? 6 : day - 1; // Days since Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get reset label for UI.
 */
export function getResetLabel(plan: PlanTier): string {
  if (plan === 'FREE') return 'Resets every Monday';
  return 'Resets at midnight';
}

// ─── Plan Pricing (for UI display) ──────────────────────────
export const PLAN_PRICING: Record<PlanTier, { monthly: number; yearly: number; name: string }> = {
  FREE: { monthly: 0, yearly: 0, name: 'Free' },
  PRO:  { monthly: 29, yearly: 290, name: 'Pro' },
  MAX:  { monthly: 59, yearly: 590, name: 'Max' },
};
