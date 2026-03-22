/**
 * Application Cap — Database-backed per-user application limits
 *
 * FREE plan: 5 applications per week (resets every Monday at midnight UTC)
 * PRO plan:  20 applications per day (resets at midnight UTC)
 * MAX plan:  50 applications per day (resets at midnight UTC)
 */
import { prisma } from '@/lib/db/prisma';
import {
  type PlanTier,
  APP_LIMITS,
  getApplicationsRemaining,
  normalizePlan,
  getWeekStart,
} from './pricing';

// ─── Types ────────────────────────────────────────────────────
export interface ApplicationCapStatus {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  limitType: 'weekly' | 'daily';
  resetsAt: Date | null;
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

function nextMondayUTC(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + daysUntilMonday);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function needsReset(resetAt: Date): boolean {
  return resetAt < startOfTodayUTC();
}

/**
 * Get the period limit for a plan tier.
 */
export function getPeriodLimit(plan: PlanTier): number {
  const limit = APP_LIMITS[plan];
  return limit.type === 'weekly' ? (limit.perWeek ?? 0) : (limit.perDay ?? 0);
}

/**
 * Count applications for this week (for FREE plan).
 */
async function getWeeklyAppCount(userId: string): Promise<number> {
  const weekStart = getWeekStart();
  const count = await prisma.jobApplication.count({
    where: {
      userId,
      createdAt: { gte: weekStart },
    },
  });
  return count;
}

/**
 * Check if the user can send another application.
 * FREE: counts applications since Monday. PRO/MAX: uses dailyAppsUsed with lazy reset.
 */
export async function checkApplicationCap(userId: string): Promise<ApplicationCapStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      totalAppsUsed: true,
      dailyAppsUsed: true,
      dailyAppsResetAt: true,
      bonusApps: true,
    },
  });

  if (!user) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      remaining: 0,
      limitType: 'weekly',
      resetsAt: null,
    };
  }

  const plan = normalizePlan(user.plan);
  const planLimit = APP_LIMITS[plan];

  // Bonus applications from referrals (added to current period limit)
  const bonus = user.bonusApps ?? 0;

  // FREE plan — weekly limit (count from DB)
  if (planLimit.type === 'weekly') {
    const weeklyUsed = await getWeeklyAppCount(userId);
    const perWeek = (planLimit.perWeek ?? 0) + bonus;
    return {
      allowed: weeklyUsed < perWeek,
      used: weeklyUsed,
      limit: perWeek,
      remaining: Math.max(0, perWeek - weeklyUsed),
      limitType: 'weekly',
      resetsAt: nextMondayUTC(),
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

  const perDay = (planLimit.perDay ?? 0) + bonus;
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
