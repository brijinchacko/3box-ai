import { AgentId, AGENTS, AGENT_LIST, AgentDefinition } from './registry';

export type PlanTier = 'FREE' | 'PRO' | 'MAX';

// Legacy plan mapping for backward compatibility
export const LEGACY_PLAN_MAP: Record<string, PlanTier> = {
  BASIC: 'FREE',
  STARTER: 'PRO',
  PRO: 'PRO',
  ULTRA: 'MAX',
  FREE: 'FREE',
  MAX: 'MAX',
};

/**
 * All agents are available on all plans.
 * The only limit is job applications (FREE=10 lifetime, PRO=20/day, MAX=50/day).
 */
export function isAgentAvailable(_agentId: AgentId, _plan: PlanTier): boolean {
  return true;
}

/**
 * Get all agents — all are available on every plan.
 */
export function getActiveAgents(_plan: PlanTier): AgentDefinition[] {
  return AGENT_LIST;
}

/**
 * Get all agents with their locked/unlocked status — none are locked.
 */
export function getAgentsWithStatus(_plan: PlanTier): (AgentDefinition & { locked: boolean })[] {
  return AGENT_LIST.map(agent => ({
    ...agent,
    locked: false,
  }));
}

/**
 * Get the number of active agents for a plan — always all agents.
 */
export function getAgentCount(_plan: PlanTier): number {
  return AGENT_LIST.length;
}

/**
 * Get the plan needed to unlock a specific agent — always FREE (all unlocked).
 */
export function getPlanForAgent(_agentId: AgentId): string {
  return 'FREE';
}

/**
 * Agent counts per plan — all plans get all 6 agents.
 */
export const PLAN_AGENT_COUNTS: Record<PlanTier, number> = {
  FREE: 6,
  PRO: 6,
  MAX: 6,
};

/**
 * Check if an agent is allowed to run in burst mode (free auto-apply).
 */
export function isBurstModeAllowed(agentId: AgentId): boolean {
  return ['scout', 'archer'].includes(agentId);
}
