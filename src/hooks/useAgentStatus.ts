'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AgentId } from '@/lib/agents/registry';
import { getAgentsWithStatus, type PlanTier } from '@/lib/agents/permissions';
import type { AgentStatus } from '@/components/dashboard/AgentStatusBadge';

export function useAgentStatus(plan: PlanTier): Record<AgentId, AgentStatus> {
  const [statuses, setStatuses] = useState<Record<AgentId, AgentStatus>>(() => {
    // Initial fallback: locked = sleeping, unlocked = idle
    const agents = getAgentsWithStatus(plan);
    const result: Partial<Record<AgentId, AgentStatus>> = {};
    agents.forEach(a => {
      result[a.id as AgentId] = a.locked ? 'sleeping' : 'idle';
    });
    return result as Record<AgentId, AgentStatus>;
  });

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/status');
      if (res.ok) {
        const data = await res.json();
        if (data.statuses && Object.keys(data.statuses).length > 0) {
          setStatuses(data.statuses as Record<AgentId, AgentStatus>);
        }
      }
    } catch {
      // Keep fallback statuses on error
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [fetchStatuses]);

  // Update fallback when plan changes
  useEffect(() => {
    const agents = getAgentsWithStatus(plan);
    setStatuses(prev => {
      const updated = { ...prev };
      agents.forEach(a => {
        const id = a.id as AgentId;
        if (a.locked) {
          updated[id] = 'sleeping';
        } else if (updated[id] === 'sleeping') {
          updated[id] = 'idle'; // Was locked, now unlocked
        }
      });
      return updated;
    });
  }, [plan]);

  return statuses;
}
