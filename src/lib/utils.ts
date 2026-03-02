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

export const PLAN_LIMITS = {
  BASIC: { aiCredits: 50, assessments: 2, resumes: 1, exports: 3 },
  PRO:   { aiCredits: 500, assessments: -1, resumes: -1, exports: -1 },
  ULTRA: { aiCredits: -1, assessments: -1, resumes: -1, exports: -1 },
} as const;

export const OFORO_DOMAINS = ['oforo.ai', 'oforoai.com'];

export function isOforoDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return OFORO_DOMAINS.includes(domain || '');
}
