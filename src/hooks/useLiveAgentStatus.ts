'use client';

import { useMemo } from 'react';
import type { AgentId } from '@/lib/agents/registry';
import type { AgentStatus } from '@/components/dashboard/AgentStatusBadge';
import { useAgentStatus } from './useAgentStatus';
import { useScoutStatus } from './useScoutStatus';
import { useForgeStatus } from './useForgeStatus';
import type { PlanTier } from '@/lib/agents/permissions';

/**
 * Composes base agent status with live scout polling and forge working state.
 * When Scout is actively running, overrides its status to 'working'.
 * When Forge is generating a resume, overrides its status to 'working'.
 */
export function useLiveAgentStatus(plan: PlanTier): Record<AgentId, AgentStatus> {
  const baseStatus = useAgentStatus(plan);
  const { isRunning: scoutRunning } = useScoutStatus(true);
  const { isWorking: forgeWorking } = useForgeStatus();

  return useMemo(() => {
    if (!scoutRunning && !forgeWorking) return baseStatus;

    const result = { ...baseStatus };
    if (scoutRunning) result.scout = 'working' as AgentStatus;
    if (forgeWorking) result.forge = 'working' as AgentStatus;
    return result;
  }, [baseStatus, scoutRunning, forgeWorking]);
}
