import { AgentId, AGENTS, AGENT_LIST, AgentDefinition } from './registry';

export type PlanTier = 'BASIC' | 'STARTER' | 'PRO' | 'ULTRA';

const PLAN_HIERARCHY: Record<PlanTier, number> = {
  BASIC: 0,
  STARTER: 1,
  PRO: 2,
  ULTRA: 3,
};

const MIN_PLAN_LEVEL: Record<string, number> = {
  STARTER: 1,
  PRO: 2,
  ULTRA: 3,
};

/**
 * Check if a specific agent is available on the given plan
 */
export function isAgentAvailable(agentId: AgentId, plan: PlanTier): boolean {
  const agent = AGENTS[agentId];
  if (!agent) return false;
  const userLevel = PLAN_HIERARCHY[plan] ?? 0;
  const requiredLevel = PLAN_HIERARCHY[agent.minPlan as PlanTier] ?? 3;
  return userLevel >= requiredLevel;
}

/**
 * Get all agents available on the given plan
 */
export function getActiveAgents(plan: PlanTier): AgentDefinition[] {
  return AGENT_LIST.filter(agent => isAgentAvailable(agent.id, plan));
}

/**
 * Get all agents with their locked/unlocked status for the given plan
 */
export function getAgentsWithStatus(plan: PlanTier): (AgentDefinition & { locked: boolean })[] {
  return AGENT_LIST.map(agent => ({
    ...agent,
    locked: !isAgentAvailable(agent.id, plan),
  }));
}

/**
 * Get the number of active agents for a plan
 */
export function getAgentCount(plan: PlanTier): number {
  return getActiveAgents(plan).length;
}

/**
 * Get the plan needed to unlock a specific agent
 */
export function getPlanForAgent(agentId: AgentId): string {
  const agent = AGENTS[agentId];
  return agent?.minPlan || 'ULTRA';
}

/**
 * Agent counts per plan:
 * BASIC: 0, STARTER: 2 (Scout+Forge), PRO: 4 (+Archer+Atlas), ULTRA: 6 (all)
 */
export const PLAN_AGENT_COUNTS: Record<PlanTier, number> = {
  BASIC: 0,
  STARTER: 2,
  PRO: 4,
  ULTRA: 6,
};
