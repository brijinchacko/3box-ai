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
  BASIC:   { aiCredits: 10,  assessments: 1,  resumes: 1, exports: 0,  price: 0,  priceYearly: 0 },
  STARTER: { aiCredits: 100, assessments: 5,  resumes: 3, exports: 5,  price: 12, priceYearly: 10 },
  PRO:     { aiCredits: 500, assessments: -1, resumes: -1, exports: -1, price: 29, priceYearly: 24 },
  ULTRA:   { aiCredits: -1,  assessments: -1, resumes: -1, exports: -1, price: 59, priceYearly: 49 },
} as const;

export type PlanTierKey = keyof typeof PLAN_LIMITS;

export const PLAN_FEATURES = {
  BASIC: {
    name: 'Basic',
    description: 'Get started with AI career tools',
    badge: 'Free Forever',
    features: [
      { label: '1 skill assessment', included: true },
      { label: '10 AI credits / month', included: true },
      { label: '1 resume (watermarked)', included: true },
      { label: 'Basic career plan', included: true },
      { label: 'AI coach (limited)', included: true },
      { label: 'PDF resume export', included: false },
      { label: 'Full assessment suite', included: false },
      { label: 'Job matching', included: false },
      { label: 'Automation agent', included: false },
    ],
  },
  STARTER: {
    name: 'Starter',
    description: 'For students and casual job seekers',
    badge: 'Best for Students',
    features: [
      { label: '5 skill assessments / month', included: true },
      { label: '100 AI credits / month', included: true },
      { label: '3 resume templates', included: true },
      { label: '5 PDF exports / month', included: true },
      { label: 'Full career plan', included: true },
      { label: 'AI coach (full access)', included: true },
      { label: 'Learning path', included: true },
      { label: 'Portfolio builder', included: false },
      { label: 'Job matching', included: false },
      { label: 'Automation agent', included: false },
    ],
  },
  PRO: {
    name: 'Pro',
    description: 'Full career toolkit for serious job seekers',
    badge: 'Most Popular',
    features: [
      { label: 'Unlimited assessments', included: true },
      { label: '500 AI credits / month', included: true },
      { label: 'All resume templates', included: true },
      { label: 'Unlimited PDF exports', included: true },
      { label: 'Full career plan + timeline', included: true },
      { label: 'AI coach (full access)', included: true },
      { label: 'Adaptive learning path', included: true },
      { label: 'Portfolio builder', included: true },
      { label: 'Job matching + fit reports', included: true },
      { label: 'Interview prep + mock interviews', included: true },
      { label: 'Automation agent', included: false },
    ],
  },
  ULTRA: {
    name: 'Ultra',
    description: 'Maximum automation and intelligence',
    badge: 'Maximum Power',
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'Unlimited AI credits', included: true },
      { label: 'Automation agent', included: true },
      { label: 'Auto-apply to jobs', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Priority AI processing', included: true },
      { label: 'LinkedIn optimizer', included: true },
      { label: 'Cover letter generator', included: true },
      { label: 'Role simulator', included: true },
      { label: 'Market readiness forecasting', included: true },
      { label: 'Verified credentials', included: true },
      { label: 'Premium support', included: true },
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
  const tierOrder: PlanTierKey[] = ['BASIC', 'STARTER', 'PRO', 'ULTRA'];
  const featureMinPlan: Record<string, PlanTierKey> = {
    assessment: 'BASIC',
    career_plan: 'BASIC',
    ai_coach: 'BASIC',
    resume_builder: 'BASIC',
    pdf_export: 'STARTER',
    learning_path: 'STARTER',
    portfolio: 'PRO',
    job_matching: 'PRO',
    interview_prep: 'PRO',
    auto_apply: 'ULTRA',
    role_simulator: 'ULTRA',
    priority_ai: 'ULTRA',
  };

  const minPlan = featureMinPlan[feature] || 'BASIC';
  return tierOrder.indexOf(plan) >= tierOrder.indexOf(minPlan);
}

export function getCreditsRemaining(used: number, limit: number): number {
  if (limit === -1) return Infinity;
  return Math.max(0, limit - used);
}

export function getCreditUsagePercent(used: number, limit: number): number {
  if (limit === -1) return 0;
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}
