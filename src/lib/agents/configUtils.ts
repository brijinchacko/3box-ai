/**
 * Agent Config Utilities — Shared constants and helpers for per-agent scheduling UI.
 * Used by AgentConfigPanel, agents/page.tsx, and onboarding wizard.
 */
import { TOKEN_COSTS, PLAN_TOKEN_LIMITS } from '@/lib/tokens/pricing';
import type { PlanTier } from '@/lib/agents/permissions';

// ─── Interval Options ─────────────────────────────────────
export const INTERVAL_OPTIONS = [
  { value: 1, label: 'Every 1h' },
  { value: 2, label: 'Every 2h' },
  { value: 4, label: 'Every 4h' },
  { value: 6, label: 'Every 6h' },
  { value: 12, label: 'Every 12h' },
  { value: 24, label: 'Every 24h' },
] as const;

// ─── Time Helpers ──────────────────────────────────────────

/** Human-readable time-ago string from an ISO date string */
export function humanizeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Label for when the next scheduled run is expected */
export function nextRunLabel(lastRunAt: string | null, intervalHours: number): string {
  if (!lastRunAt) return 'On next cron';
  const nextRun = new Date(new Date(lastRunAt).getTime() + intervalHours * 3600000);
  if (nextRun.getTime() <= Date.now()) return 'Due now';
  const diff = nextRun.getTime() - Date.now();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `in ${hrs}h`;
}

// ─── Token Estimation ──────────────────────────────────────

/** Estimate monthly token consumption for a single agent based on interval + settings */
export function estimateMonthlyTokens(
  agentId: 'scout' | 'forge' | 'archer',
  intervalHours: number,
  opts?: { archerMaxPerRun?: number; forgeMode?: string }
): number {
  const runsPerMonth = Math.floor(720 / intervalHours); // 720h ≈ 30 days

  const costPerRun: Record<string, number> = {
    scout: 6 * TOKEN_COSTS.scout_search_per_platform, // 6 platforms
    forge: opts?.forgeMode === 'per_job'
      ? 10 * TOKEN_COSTS.per_job_rewrite           // ~10 jobs per run
      : TOKEN_COSTS.forge_auto_generate,             // base resume gen
    archer: (TOKEN_COSTS.cover_letter + TOKEN_COSTS.application_send) * (opts?.archerMaxPerRun || 10),
  };

  return Math.ceil(runsPerMonth * (costPerRun[agentId] || 0));
}

/** Sum estimated monthly tokens for all enabled agents */
export function estimateTotalMonthlyTokens(config: {
  scoutEnabled: boolean;
  scoutInterval: number;
  forgeEnabled: boolean;
  forgeInterval: number;
  forgeMode: string;
  archerEnabled: boolean;
  archerInterval: number;
  archerMaxPerRun: number;
}): number {
  let total = 0;
  if (config.scoutEnabled) total += estimateMonthlyTokens('scout', config.scoutInterval);
  if (config.forgeEnabled) total += estimateMonthlyTokens('forge', config.forgeInterval, { forgeMode: config.forgeMode });
  if (config.archerEnabled) total += estimateMonthlyTokens('archer', config.archerInterval, { archerMaxPerRun: config.archerMaxPerRun });
  return total;
}

/** Get token warning level based on estimated usage vs plan limit */
export function getTokenWarningLevel(
  estimatedMonthly: number,
  plan: PlanTier
): { level: 'none' | 'warning' | 'error'; message: string } {
  const limit = PLAN_TOKEN_LIMITS[plan] || 200;
  const pct = (estimatedMonthly / limit) * 100;

  if (pct > 100) {
    return {
      level: 'error',
      message: `Estimated ~${estimatedMonthly} tokens/month exceeds your ${limit} token limit. Consider a longer interval or upgrading your plan.`,
    };
  }
  if (pct > 80) {
    return {
      level: 'warning',
      message: `Estimated ~${estimatedMonthly} tokens/month (${Math.round(pct)}% of your ${limit} limit). Use tokens wisely.`,
    };
  }
  return { level: 'none', message: '' };
}

// ─── Schedule Presets (for onboarding) ─────────────────────
export const SCHEDULE_PRESETS = {
  aggressive: {
    label: 'Aggressive',
    desc: 'Search every 2h, apply fast — uses more tokens',
    scoutInterval: 2,
    forgeInterval: 4,
    archerInterval: 4,
  },
  balanced: {
    label: 'Balanced',
    desc: 'Search twice daily, steady pace',
    scoutInterval: 12,
    forgeInterval: 12,
    archerInterval: 12,
  },
  relaxed: {
    label: 'Relaxed',
    desc: 'Daily search, minimal token usage',
    scoutInterval: 24,
    forgeInterval: 24,
    archerInterval: 24,
  },
} as const;

export type SchedulePreset = keyof typeof SCHEDULE_PRESETS;
