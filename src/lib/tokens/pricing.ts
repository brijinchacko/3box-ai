/**
 * Token Pricing — Central source of truth for all token costs and plan allocations.
 * Every agent operation has a defined token cost. Every plan has a finite allowance.
 */
import { type PlanTier } from '@/lib/agents/permissions';

// ─── Plan Token Allocations (monthly) ──────────────────────
export const PLAN_TOKEN_LIMITS: Record<PlanTier, number> = {
  BASIC: 15,       // Demo — 1 Scout run + 1 resume gen
  STARTER: 200,    // ~15 Scout runs or mix of operations
  PRO: 600,        // Heavy usage
  ULTRA: 2000,     // Power users — high but NOT unlimited
};

// ─── Token Costs Per Operation ─────────────────────────────
export const TOKEN_COSTS = {
  // Scout Agent — per-platform cost
  scout_search_per_platform: 2,  // 6 platforms = 12 tokens

  // Forge Agent
  resume_generate: 3,
  resume_enhance: 2,
  resume_analyze: 2,

  // Archer Agent
  cover_letter: 2,
  application_send: 1,

  // Atlas Agent
  interview_prep: 2,
  interview_evaluate: 1,

  // Sage Agent
  skill_gap_analysis: 2,

  // Sentinel Agent
  application_review: 1,

  // Career Plan
  career_plan: 3,

  // Dashboard Insights
  ai_insights: 1,
} as const;

export type TokenOperation = keyof typeof TOKEN_COSTS;

// ─── Token Cost Reference (for UI display) ─────────────────
export const TOKEN_COST_LABELS: { operation: string; cost: string; description: string }[] = [
  { operation: 'Scout Search', cost: '2/platform', description: '6 platforms = 12 tokens' },
  { operation: 'Resume Generation', cost: '3', description: 'AI-powered full resume' },
  { operation: 'Resume Enhancement', cost: '2', description: 'Section optimization' },
  { operation: 'Cover Letter', cost: '2', description: 'Per job application' },
  { operation: 'Interview Prep', cost: '2', description: 'Company-specific questions' },
  { operation: 'Interview Eval', cost: '1', description: 'Answer feedback' },
  { operation: 'Career Plan', cost: '3', description: 'Full roadmap generation' },
  { operation: 'Application Send', cost: '1', description: 'Portal or email' },
  { operation: 'Skill Gap Analysis', cost: '2', description: 'Learning recommendations' },
  { operation: 'Application Review', cost: '1', description: 'Quality check' },
];

// ─── Helpers ───────────────────────────────────────────────

/** Estimate Scout token cost based on selected platform count */
export function estimateScoutCost(platformCount: number): number {
  return platformCount * TOKEN_COSTS.scout_search_per_platform;
}

/** Check if user can afford an operation (handles legacy unlimited -1) */
export function canAfford(used: number, limit: number, cost: number): boolean {
  if (limit < 0) return true; // Legacy unlimited users
  return (used + cost) <= limit;
}

/** Tokens remaining (handles legacy unlimited -1) */
export function tokensRemaining(used: number, limit: number): number {
  if (limit < 0) return Infinity;
  return Math.max(0, limit - used);
}

/** Percentage of tokens used (0-100, handles legacy unlimited) */
export function tokenUsagePercent(used: number, limit: number): number {
  if (limit < 0) return 0; // Unlimited — show as 0% used
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}
