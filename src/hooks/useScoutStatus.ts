'use client';

import { useState, useEffect, useCallback } from 'react';

interface ScoutStatus {
  status: 'idle' | 'running' | 'completed';
  runId?: string;
  lastRunAt?: string;
}

export function useScoutStatus(enabled = true) {
  const [scoutStatus, setScoutStatus] = useState<ScoutStatus>({ status: 'idle' });
  const [localOverride, setLocalOverride] = useState<'running' | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/scout/status');
      if (res.ok) {
        const data = await res.json();
        setScoutStatus(data);
        // Auto-clear override when server reports non-running
        if (data.status !== 'running') {
          setLocalOverride(null);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!enabled) return;

    poll(); // initial fetch
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [enabled, poll]);

  // Immediately mark Scout as running (called when Deploy is clicked)
  const markRunning = useCallback(() => setLocalOverride('running'), []);
  const clearOverride = useCallback(() => setLocalOverride(null), []);

  const effectiveStatus = localOverride || scoutStatus.status;

  return {
    isRunning: effectiveStatus === 'running',
    status: effectiveStatus,
    runId: scoutStatus.runId,
    lastRunAt: scoutStatus.lastRunAt,
    refresh: poll,
    markRunning,
    clearOverride,
  };
}
