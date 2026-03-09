/**
 * Daily Application Cap — Database-backed per-user daily limit
 *
 * Every user (including ULTRA) can apply to a maximum of 30 jobs per day.
 * The counter resets at midnight (UTC). Users can purchase an "Unlimited Daily"
 * one-time pack to remove the cap permanently.
 */
import { prisma } from '@/lib/db/prisma';

// ─── Constants ────────────────────────────────────────────────
export const DAILY_APP_LIMIT = 30;

// ─── Types ────────────────────────────────────────────────────
export interface DailyCapStatus {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  resetsAt: Date;
}

// ─── Core Functions ───────────────────────────────────────────

/**
 * Get the start of today (midnight UTC).
 */
function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Get the start of tomorrow (midnight UTC) — when the counter resets.
 */
function startOfTomorrowUTC(): Date {
  const today = startOfTodayUTC();
  return new Date(today.getTime() + 86400000);
}

/**
 * Check if the user's daily reset timestamp is before today, meaning
 * the counter should be lazily reset.
 */
function needsReset(resetAt: Date): boolean {
  return resetAt < startOfTodayUTC();
}

/**
 * Check the user's daily application cap.
 * Performs a lazy reset if the counter is stale (from a previous day).
 */
export async function checkDailyCap(userId: string): Promise<DailyCapStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      dailyAppsUsed: true,
      dailyAppsResetAt: true,
      hasUnlimitedDaily: true,
    },
  });

  if (!user) {
    return {
      allowed: false,
      used: 0,
      limit: DAILY_APP_LIMIT,
      remaining: 0,
      isUnlimited: false,
      resetsAt: startOfTomorrowUTC(),
    };
  }

  // Unlimited users always pass
  if (user.hasUnlimitedDaily) {
    return {
      allowed: true,
      used: user.dailyAppsUsed,
      limit: DAILY_APP_LIMIT,
      remaining: Infinity,
      isUnlimited: true,
      resetsAt: startOfTomorrowUTC(),
    };
  }

  // Lazy reset: if resetAt is before today, reset the counter
  let used = user.dailyAppsUsed;
  if (needsReset(user.dailyAppsResetAt)) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyAppsUsed: 0,
        dailyAppsResetAt: new Date(),
      },
    });
    used = 0;
  }

  const remaining = Math.max(0, DAILY_APP_LIMIT - used);

  return {
    allowed: used < DAILY_APP_LIMIT,
    used,
    limit: DAILY_APP_LIMIT,
    remaining,
    isUnlimited: false,
    resetsAt: startOfTomorrowUTC(),
  };
}

/**
 * Consume one daily application slot.
 * Returns success=false if the cap is reached.
 */
export async function consumeDailySlot(userId: string): Promise<{ success: boolean; remaining: number }> {
  const cap = await checkDailyCap(userId);

  if (!cap.allowed) {
    return { success: false, remaining: 0 };
  }

  // Unlimited users — still increment for analytics, but never block
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      dailyAppsUsed: { increment: 1 },
    },
    select: { dailyAppsUsed: true, hasUnlimitedDaily: true },
  });

  const remaining = updated.hasUnlimitedDaily
    ? Infinity
    : Math.max(0, DAILY_APP_LIMIT - updated.dailyAppsUsed);

  return { success: true, remaining };
}

/**
 * Get daily cap status for UI display (read-only, no modifications).
 * Performs lazy reset if needed.
 */
export async function getDailyCapStatus(userId: string): Promise<DailyCapStatus> {
  return checkDailyCap(userId);
}
