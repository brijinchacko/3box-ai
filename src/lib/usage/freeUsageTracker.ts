/**
 * Client-side free usage tracking utility.
 * Tracks how many times a user has used each free service via localStorage.
 * Wrapped in try/catch for SSR safety (no window/localStorage on server).
 */

export type FreeService = 'ats_checker' | 'resume_builder' | 'salary_estimator';

const STORAGE_KEY_PREFIX = 'nxted-free-use-';

/**
 * Get the current usage count for a free service.
 * Returns 0 if not yet used or if localStorage is unavailable.
 */
export function getFreeUseCount(service: FreeService): number {
  try {
    if (typeof window === 'undefined') return 0;
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${service}`);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

/**
 * Increment the usage count for a free service.
 * Returns the new count after incrementing.
 */
export function incrementFreeUse(service: FreeService): number {
  try {
    if (typeof window === 'undefined') return 0;
    const current = getFreeUseCount(service);
    const newCount = current + 1;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${service}`, String(newCount));
    return newCount;
  } catch {
    return 0;
  }
}

/**
 * Check if the user still has a free trial available for the given service.
 * Returns true if the usage count is less than 1 (i.e., never used).
 */
export function hasFreeTrial(service: FreeService): boolean {
  return getFreeUseCount(service) < 1;
}
