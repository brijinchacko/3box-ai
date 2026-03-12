/**
 * Agent Config Utilities — Shared constants and helpers for per-agent scheduling UI.
 * Used by AgentConfigPanel, agents/page.tsx, and onboarding wizard.
 */
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

// ─── Schedule Presets (for onboarding) ─────────────────────
export const SCHEDULE_PRESETS = {
  aggressive: {
    label: 'Aggressive',
    desc: 'Search every 2h, apply fast',
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
    desc: 'Daily search, minimal activity',
    scoutInterval: 24,
    forgeInterval: 24,
    archerInterval: 24,
  },
} as const;

export type SchedulePreset = keyof typeof SCHEDULE_PRESETS;
