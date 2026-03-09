/**
 * Human-Like Application Behavior Layer
 * Adds realistic timing, variation, and rate limiting to prevent
 * bot detection and improve application effectiveness.
 */

// ─── Timing ────────────────────────────────────────────────────────

/**
 * Calculate human-like delay between applications.
 * Mode 'normal': 10-30s base with occasional pauses (for high-throughput 100/day).
 * Mode 'stealth': 30-180s base with longer breaks (legacy conservative mode).
 */
export function getApplicationDelay(mode: 'normal' | 'stealth' = 'normal'): number {
  if (mode === 'stealth') {
    const baseDelay = 30_000 + Math.random() * 150_000; // 30-180s
    if (Math.random() < 0.15) {
      return baseDelay + 180_000 + Math.random() * 300_000; // +3-8 min
    }
    return Math.round(baseDelay);
  }

  // Normal mode: 10-30s base delay between apps
  const baseDelay = 10_000 + Math.random() * 20_000; // 10-30s

  // 10% chance of a short "break" — 60-120s pause
  if (Math.random() < 0.10) {
    return baseDelay + 60_000 + Math.random() * 60_000;
  }

  return Math.round(baseDelay);
}

/**
 * Check if now is an optimal time to send applications.
 * Best: Tuesday-Thursday, 9-11 AM in target timezone.
 * Good: Monday-Friday, 8 AM - 12 PM.
 * Acceptable: Monday-Friday, any business hours.
 * Bad: Weekends, late nights.
 */
export function getOptimalTimeWindow(targetTimezoneOffset = 5.5): {
  isOptimal: boolean;
  isAcceptable: boolean;
  nextOptimalHour: number;
  waitMs: number;
} {
  const now = new Date();
  // Adjust to target timezone (default IST = UTC+5:30)
  const utcHour = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const targetHour = (utcHour + Math.floor(targetTimezoneOffset)) % 24;
  const targetMinute = (utcMinutes + (targetTimezoneOffset % 1) * 60) % 60;
  const targetDay = now.getUTCDay(); // 0=Sun, 1=Mon...6=Sat

  const isWeekday = targetDay >= 1 && targetDay <= 5;
  const isMidWeek = targetDay >= 2 && targetDay <= 4; // Tue-Thu
  const isBusinessHours = targetHour >= 8 && targetHour <= 18;
  const isPeakHours = targetHour >= 9 && targetHour <= 11;

  const isOptimal = isMidWeek && isPeakHours;
  const isAcceptable = isWeekday && isBusinessHours;

  // Calculate wait time to next optimal window (Tue 9AM)
  let waitMs = 0;
  if (!isAcceptable) {
    // Find next Tuesday-Thursday 9 AM
    let daysToWait = 0;
    let nextDay = targetDay;
    while (true) {
      nextDay = (nextDay + 1) % 7;
      daysToWait++;
      if (nextDay >= 2 && nextDay <= 4) break;
      if (daysToWait > 7) break;
    }
    waitMs = daysToWait * 86400000 - (targetHour - 9) * 3600000 - targetMinute * 60000;
    if (waitMs < 0) waitMs = 0;
  }

  return {
    isOptimal,
    isAcceptable,
    nextOptimalHour: 9,
    waitMs,
  };
}

// ─── Rate Limiting ─────────────────────────────────────────────────

const RATE_LIMITS = {
  perHour: 15,
  perDay: 30,       // Matches DB-backed daily cap (DAILY_APP_LIMIT)
  perCompanyDomain: 5,
};

interface RateLimitState {
  hourlyCount: number;
  dailyCount: number;
  companyDomainCounts: Map<string, number>;
  lastHourReset: number;
  lastDayReset: number;
}

let rateLimitState: RateLimitState = {
  hourlyCount: 0,
  dailyCount: 0,
  companyDomainCounts: new Map(),
  lastHourReset: Date.now(),
  lastDayReset: Date.now(),
};

/**
 * Check if we can send another application
 */
export function canSendApplication(companyDomain?: string): {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
} {
  const now = Date.now();

  // Reset hourly counter
  if (now - rateLimitState.lastHourReset > 3600000) {
    rateLimitState.hourlyCount = 0;
    rateLimitState.lastHourReset = now;
  }

  // Reset daily counter
  if (now - rateLimitState.lastDayReset > 86400000) {
    rateLimitState.dailyCount = 0;
    rateLimitState.companyDomainCounts = new Map();
    rateLimitState.lastDayReset = now;
  }

  // Check hourly limit
  if (rateLimitState.hourlyCount >= RATE_LIMITS.perHour) {
    const retryAfter = 3600000 - (now - rateLimitState.lastHourReset);
    return { allowed: false, reason: `Hourly limit reached (${RATE_LIMITS.perHour}/hr)`, retryAfterMs: retryAfter };
  }

  // Check daily limit
  if (rateLimitState.dailyCount >= RATE_LIMITS.perDay) {
    const retryAfter = 86400000 - (now - rateLimitState.lastDayReset);
    return { allowed: false, reason: `Daily limit reached (${RATE_LIMITS.perDay}/day)`, retryAfterMs: retryAfter };
  }

  // Check per-company limit
  if (companyDomain) {
    const domain = normalizeCompanyDomain(companyDomain);
    const count = rateLimitState.companyDomainCounts.get(domain) || 0;
    if (count >= RATE_LIMITS.perCompanyDomain) {
      return { allowed: false, reason: `Too many applications to ${domain} (max ${RATE_LIMITS.perCompanyDomain}/day)` };
    }
  }

  return { allowed: true };
}

/**
 * Record that an application was sent
 */
export function recordApplicationSent(companyDomain?: string): void {
  rateLimitState.hourlyCount++;
  rateLimitState.dailyCount++;

  if (companyDomain) {
    const domain = normalizeCompanyDomain(companyDomain);
    const current = rateLimitState.companyDomainCounts.get(domain) || 0;
    rateLimitState.companyDomainCounts.set(domain, current + 1);
  }
}

/**
 * Reset rate limit state (useful for testing or new day)
 */
export function resetRateLimits(): void {
  rateLimitState = {
    hourlyCount: 0,
    dailyCount: 0,
    companyDomainCounts: new Map(),
    lastHourReset: Date.now(),
    lastDayReset: Date.now(),
  };
}

// ─── Cover Letter Variation ────────────────────────────────────────

/**
 * Add subtle, unique variation to a cover letter to avoid template detection.
 * Does NOT change the meaning — just varies sentence structure and phrasing.
 */
export function uniquifyCoverLetter(letter: string, jobId: string): string {
  // Use jobId as a deterministic seed for consistent variation per job
  const seed = hashCode(jobId);

  // Variation pool — each entry replaces the other
  const variations: [string, string][] = [
    ['I am excited to', 'I am eager to'],
    ['I am confident', 'I am convinced'],
    ['I believe', 'I am certain'],
    ['I would welcome', 'I look forward to'],
    ['Thank you for', 'I appreciate your'],
    ['strong interest', 'keen interest'],
    ['make a meaningful contribution', 'add real value'],
    ['equipped me with', 'given me'],
    ['excel in this role', 'thrive in this position'],
    ['align with', 'complement'],
    ['I am writing to', 'I wanted to reach out to'],
    ['bring my expertise', 'contribute my skills'],
  ];

  let result = letter;
  const variationSubset = variations.filter((_, i) => (seed + i) % 3 === 0); // Use ~1/3 of variations

  for (const [from, to] of variationSubset) {
    if (result.toLowerCase().includes(from.toLowerCase())) {
      result = result.replace(new RegExp(escapeRegex(from), 'i'), to);
    }
  }

  return result;
}

// ─── Helpers ───────────────────────────────────────────────────────

function normalizeCompanyDomain(company: string): string {
  return company
    .toLowerCase()
    .replace(/\s*(pvt|private|ltd|limited|inc|corp|corporation|llc|technologies|tech|solutions|services|group|india)\s*/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
