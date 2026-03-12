/**
 * Application Cap — Database-backed per-user application limits
 *
 * FREE plan: 10 total lifetime applications (never resets)
 * PRO plan:  20 applications per day (resets at midnight UTC)
 * MAX plan:  50 applications per day (resets at midnight UTC)
 */
import { prisma } from '@/lib/db/prisma';
import {
  type PlanTier,
  APP_LIMITS,
  canApply,
  getApplicationsRemaining,
  normalizePlan,
} from './pricing';

// ─── Types ────────────────────────────────────────────────────
export interface ApplicationCapStatus {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  limitType: 'lifetime' | 'daily';
  resetsAt: Date | null; // null for lifetime (FREE) plan
}

// ─── Core Functions ───────────────────────────────────────────

function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function startOfTomorrowUTC(): Date {
  const today = startOfTodayUTC();
  return new Date(today.getTime() + 86400000);
}

function needsReset(resetAt: Date): boolean {
  return resetAt < startOfTodayUTC();
}

/**
 * Get the daily limit for a plan tier.
 * FREE plan uses lifetime limit (checked separately), returns 0 here.
 */
export function getDailyLimit(plan: PlanTier): number {
  const limit = APP_LIMITS[plan];
  return limit.type === 'daily' ? (limit.perDay ?? 0) : 0;
}

/**
 * Get the lifetime limit for a plan tier.
 * Only applies to FREE plan.
 */
export function getLifetimeLimit(plan: PlanTier): number {
  const limit = APP_LIMITS[plan];
  return limit.type === 'lifetime' ? (limit.total ?? 0) : 0;
}

/**
 * Check if the user can send another application.
 * Performs a lazy reset of the daily counter if it's stale.
 */
export async function checkApplicationCap(userId: string): Promise<ApplicationCapStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      totalAppsUsed: true,
      dailyAppsUsed: true,
      dailyAppsResetAt: true,
    },
  });

  if (!user) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      remaining: 0,
      limitType: 'lifetime',
      resetsAt: null,
    };
  }

  const plan = normalizePlan(user.plan);
  const planLimit = APP_LIMITS[plan];

  // FREE plan — lifetime limit
  if (planLimit.type === 'lifetime') {
    const total = planLimit.total ?? 0;
    const used = user.totalAppsUsed;
    return {
      allowed: used < total,
      used,
      limit: total,
      remaining: Math.max(0, total - used),
      limitType: 'lifetime',
      resetsAt: null,
    };
  }

  // PRO/MAX — daily limit with lazy reset
  let dailyUsed = user.dailyAppsUsed;
  if (needsReset(user.dailyAppsResetAt)) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyAppsUsed: 0,
        dailyAppsResetAt: new Date(),
      },
    });
    dailyUsed = 0;
  }

  const perDay = planLimit.perDay ?? 0;
  const remaining = Math.max(0, perDay - dailyUsed);

  return {
    allowed: dailyUsed < perDay,
    used: dailyUsed,
    limit: perDay,
    remaining,
    limitType: 'daily',
    resetsAt: startOfTomorrowUTC(),
  };
}

/**
 * Consume one application slot.
 * Returns success=false if the cap is reached.
 */
export async function consumeApplicationSlot(
  userId: string
): Promise<{ success: boolean; remaining: number }> {
  const cap = await checkApplicationCap(userId);

  if (!cap.allowed) {
    return { success: false, remaining: 0 };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  const plan = normalizePlan(user?.plan ?? 'FREE');

  // Always increment totalAppsUsed for analytics
  // For daily-limited plans, also increment dailyAppsUsed
  const updateData: Record<string, unknown> = {
    totalAppsUsed: { increment: 1 },
  };

  if (APP_LIMITS[plan].type === 'daily') {
    updateData.dailyAppsUsed = { increment: 1 };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      totalAppsUsed: true,
      dailyAppsUsed: true,
      plan: true,
    },
  });

  const updatedPlan = normalizePlan(updated.plan);
  const remaining = getApplicationsRemaining(
    updatedPlan,
    updated.totalAppsUsed,
    updated.dailyAppsUsed
  );

  return { success: true, remaining };
}

/**
 * Get application cap status for UI display (read-only).
 */
export async function getApplicationCapStatus(userId: string): Promise<ApplicationCapStatus> {
  return checkApplicationCap(userId);
}

// ─── Legacy exports (backward compatibility) ─
export const checkDailyCap = checkApplicationCap;
export const consumeDailySlot = consumeApplicationSlot;
export const getDailyCapStatus = getApplicationCapStatus;
export type DailyCapStatus = ApplicationCapStatus;
