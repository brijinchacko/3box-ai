'use client';

import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';

/**
 * Polls for new Scout auto-hunt activities and pushes them into the
 * in-memory notification store. This ensures users see notifications
 * for auto-runs that happened while they were signed out.
 */
export function useScoutAutoNotifications(enabled = true) {
  const lastChecked = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    async function check() {
      try {
        const res = await fetch('/api/agents/scout/history');
        if (!res.ok) return;
        const data = await res.json();
        const runs = data?.runs || [];

        // Filter to auto runs only
        const autoRuns = runs.filter((r: any) => r.summary?.includes('Auto Scout'));
        if (autoRuns.length === 0) return;

        // On first load, set baseline without creating notifications
        if (!lastChecked.current) {
          lastChecked.current = autoRuns[0]?.startedAt || new Date().toISOString();
          return;
        }

        // Find new runs since last check
        const newRuns = autoRuns.filter(
          (r: any) => new Date(r.startedAt) > new Date(lastChecked.current!)
        );

        const store = useNotificationStore.getState();

        for (const run of newRuns) {
          store.addNotification({
            type: run.status === 'completed' ? 'success' : 'error',
            title: 'Scout Auto-Hunt Complete',
            message: run.summary || `Found ${run.jobsFound} jobs`,
            agent: 'scout',
            action: '/dashboard?agent=scout&tab=report',
          });
        }

        if (newRuns.length > 0) {
          lastChecked.current = autoRuns[0].startedAt;
        }
      } catch {}
    }

    // Check immediately, then every 30 seconds
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [enabled]);
}
