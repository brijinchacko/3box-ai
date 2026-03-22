import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'NX';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ─── Plan Configuration ─────────────────────────

export const PLAN_LIMITS = {
  FREE: { applicationsPerDay: 0, applicationsLifetime: 10, price: 0,  priceYearly: 0 },
  PRO:  { applicationsPerDay: 20, applicationsLifetime: -1, price: 29, priceYearly: 24 },
  MAX:  { applicationsPerDay: 50, applicationsLifetime: -1, price: 59, priceYearly: 49 },
} as const;

export type PlanTierKey = keyof typeof PLAN_LIMITS;

export const PLAN_FEATURES = {
  FREE: {
    name: 'Free',
    description: 'Get started with AI career tools',
    badge: 'Free Forever',
    features: [
      { label: 'All AI agents unlocked', included: true },
      { label: 'Unlimited AI operations', included: true },
      { label: 'All resume templates', included: true },
      { label: 'Unlimited PDF exports', included: true },
      { label: 'Full career plan', included: true },
      { label: 'AI coach (full access)', included: true },
      { label: '5 job applications per week', included: true },
      { label: 'Daily application limit', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  PRO: {
    name: 'Pro',
    description: 'For active job seekers',
    badge: 'Most Popular',
    features: [
      { label: 'All AI agents unlocked', included: true },
      { label: 'Unlimited AI operations', included: true },
      { label: 'All resume templates', included: true },
      { label: 'Unlimited PDF exports', included: true },
      { label: 'Full career plan + timeline', included: true },
      { label: 'AI coach (full access)', included: true },
      { label: '20 job applications / day', included: true },
      { label: 'Job matching + fit reports', included: true },
      { label: 'Interview prep + mock interviews', included: true },
      { label: 'Priority support', included: false },
    ],
  },
  MAX: {
    name: 'Max',
    description: 'Maximum power for serious job seekers',
    badge: 'Maximum Power',
    features: [
      { label: 'Everything in Pro', included: true },
      { label: '50 job applications / day', included: true },
      { label: 'Auto-apply to jobs', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Priority AI processing', included: true },
      { label: 'LinkedIn optimizer', included: true },
      { label: 'Market readiness forecasting', included: true },
      { label: 'Priority support', included: true },
    ],
  },
} as const;

export const OFORO_DOMAINS = ['oforo.ai', 'oforoai.com'];

export function isOforoDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return OFORO_DOMAINS.includes(domain || '');
}

export function isStudentEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  return domain.endsWith('.edu') || domain.endsWith('.ac.uk') || domain.endsWith('.edu.au');
}

export function canAccessFeature(plan: PlanTierKey, feature: string): boolean {
  const tierOrder: PlanTierKey[] = ['FREE', 'PRO', 'MAX'];
  const featureMinPlan: Record<string, PlanTierKey> = {
    assessment: 'FREE',
    career_plan: 'FREE',
    ai_coach: 'FREE',
    resume_builder: 'FREE',
    pdf_export: 'FREE',
    learning_path: 'FREE',
    portfolio: 'FREE',
    job_matching: 'PRO',
    interview_prep: 'PRO',
    auto_apply: 'MAX',
    priority_ai: 'MAX',
  };

  const minPlan = featureMinPlan[feature] || 'FREE';
  return tierOrder.indexOf(plan) >= tierOrder.indexOf(minPlan);
}

export function getApplicationsRemaining(used: number, plan: PlanTierKey): number {
  const limits = PLAN_LIMITS[plan];
  const daily = limits.applicationsPerDay as number;
  const lifetime = limits.applicationsLifetime as number;
  if (daily === -1 || daily > 0) {
    // Paid plans: daily limit (used = today's count)
    if (daily === -1) return Infinity;
    return Math.max(0, daily - used);
  }
  // FREE plan: lifetime limit
  if (lifetime === -1) return Infinity;
  return Math.max(0, lifetime - used);
}

export function getApplicationUsagePercent(used: number, plan: PlanTierKey): number {
  const limits = PLAN_LIMITS[plan];
  const daily = limits.applicationsPerDay as number;
  const lifetime = limits.applicationsLifetime as number;
  const limit = daily > 0 ? daily : lifetime;
  if (limit === -1) return 0;
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}
