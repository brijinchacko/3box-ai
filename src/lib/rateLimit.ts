/**
 * In-memory IP-based rate limiter for free tool APIs.
 *
 * Two tiers:
 *   - Per-tool:  5 requests per tool per IP per hour
 *   - Global:   20 total tool requests per IP per day
 *
 * Returns { allowed, remaining, resetAt } so callers can surface
 * useful info in 429 responses.
 *
 * Not suitable for multi-instance deployments — use Redis instead.
 */

// ── Types ────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

// ── Config ───────────────────────────────────────────

const PER_TOOL_LIMIT = 5;
const PER_TOOL_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const DAILY_LIMIT = 20;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

// ── Storage ──────────────────────────────────────────

// key: "tool:<toolName>:<ip>" for per-tool limits
// key: "daily:<ip>"           for daily limits
const store = new Map<string, RateLimitEntry>();

// ── Cleanup expired entries every 10 minutes ─────────

if (typeof globalThis !== 'undefined') {
  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  };
  setInterval(cleanup, CLEANUP_INTERVAL_MS);
}

// ── Core check helper ────────────────────────────────

function checkBucket(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // First request or window expired — start fresh
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt: new Date(resetAt) };
  }

  // Within window — check count
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: new Date(entry.resetAt) };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: new Date(entry.resetAt),
  };
}

// ── Public API ───────────────────────────────────────

/**
 * Extract client IP from request headers.
 * Checks x-forwarded-for, x-real-ip, falls back to "unknown".
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Check both per-tool and daily rate limits for an IP.
 *
 * @param ip       - Client IP address
 * @param toolName - Identifier for the tool (e.g. "ats-checker")
 * @returns The most restrictive result (denied if either bucket is full)
 */
export function checkRateLimit(ip: string, toolName: string): RateLimitResult {
  // Check per-tool limit first
  const toolResult = checkBucket(`tool:${toolName}:${ip}`, PER_TOOL_LIMIT, PER_TOOL_WINDOW_MS);
  if (!toolResult.allowed) {
    return toolResult;
  }

  // Check daily global limit
  const dailyResult = checkBucket(`daily:${ip}`, DAILY_LIMIT, DAILY_WINDOW_MS);
  if (!dailyResult.allowed) {
    return dailyResult;
  }

  // Both passed — return the one with fewer remaining
  return toolResult.remaining <= dailyResult.remaining ? toolResult : dailyResult;
}
