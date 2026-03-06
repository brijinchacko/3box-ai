/**
 * Server-side cookie-based usage checking utility.
 * Provides functions to verify free usage limits and build usage cookies.
 */

/**
 * Check whether a free usage attempt is allowed.
 * Compares cookie-stored count against the client-reported count,
 * takes the higher value as the real count (prevents tampering),
 * and allows usage only if realCount < 1.
 *
 * @param cookieValue - The raw cookie value string (may be undefined if no cookie set)
 * @param clientCount - The count reported by the client (from localStorage)
 * @returns Object with `allowed` boolean and the `realCount`
 */
export function checkFreeUsage(
  cookieValue: string | undefined,
  clientCount: number
): { allowed: boolean; realCount: number } {
  let cookieCount = 0;

  if (cookieValue) {
    const parsed = parseInt(cookieValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      cookieCount = parsed;
    }
  }

  // Use the higher of cookie vs client count to prevent tampering
  const safeClientCount = Math.max(0, Math.floor(clientCount) || 0);
  const realCount = Math.max(cookieCount, safeClientCount);

  return {
    allowed: realCount < 1,
    realCount,
  };
}

/**
 * Build a Set-Cookie header string for tracking usage.
 *
 * @param cookieName - The name of the cookie (e.g., "nxted-free-ats")
 * @param newCount - The updated usage count to store
 * @param maxAgeDays - How many days the cookie should persist (default: 30)
 * @returns A fully formatted cookie string ready for Set-Cookie header
 */
export function buildUsageCookie(
  cookieName: string,
  newCount: number,
  maxAgeDays: number = 30
): string {
  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60;
  return `${cookieName}=${newCount}; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax; Path=/`;
}
