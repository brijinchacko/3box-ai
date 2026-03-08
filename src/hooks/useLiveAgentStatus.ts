'use client';

import { useMemo } from 'react';
import type { AgentId } from '@/lib/agents/registry';
import type { AgentStatus } from '@/components/dashboard/AgentStatusBadge';
import { useAgentStatus } from './useAgentStatus';
import { useScoutStatus } from './useScoutStatus';
import type { PlanTier } from '@/lib/agents/permissions';

/**
 * Composes base agent status with live scout polling.
 * When Scout is actively running, overrides its status to 'working'.
 */
export function useLiveAgentStatus(plan: PlanTier): Record<AgentId, AgentStatus> {
  const baseStatus = useAgentStatus(plan);
  const { isRunning: scoutRunning } = useScoutStatus(true);

  return useMemo(() => {
    if (!scoutRunning) return baseStatus;

    return {
      ...baseStatus,
      scout: 'working' as AgentStatus,
    };
  }, [baseStatus, scoutRunning]);
}
