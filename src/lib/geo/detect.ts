// =============================================================================
// jobTED AI — Server-Side Geo Detection
// =============================================================================
// Detects the visitor's country using IP geolocation (ip-api.com free tier)
// with in-memory caching. Falls back to timezone-based detection on the client.
// =============================================================================

// ---------------------------------------------------------------------------
// In-Memory Cache (IP -> CountryCode)
// ---------------------------------------------------------------------------

interface CacheEntry {
  countryCode: string;
  expiresAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const geoCache = new Map<string, CacheEntry>();

// Prune stale entries periodically to avoid unbounded memory growth
const MAX_CACHE_SIZE = 10_000;

function pruneCache(): void {
  if (geoCache.size <= MAX_CACHE_SIZE) return;

  const now = Date.now();
  for (const [key, entry] of geoCache) {
    if (entry.expiresAt < now) {
      geoCache.delete(key);
    }
  }

  // If still too large after pruning expired, evict oldest entries
  if (geoCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(geoCache.entries());
    const toRemove = entries
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt)
      .slice(0, geoCache.size - MAX_CACHE_SIZE + 1000);
    for (const [key] of toRemove) {
      geoCache.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// IP Extraction
// ---------------------------------------------------------------------------

/**
 * Extract the client IP from request headers.
 * Supports Cloudflare, Vercel, AWS ALB, and standard proxies.
 */
export function extractClientIP(request: Request): string | null {
  const headers = request.headers;

  // Cloudflare
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) return cfIP.trim();

  // Vercel
  const vercelIP = headers.get('x-vercel-forwarded-for');
  if (vercelIP) return vercelIP.split(',')[0].trim();

  // Standard proxy header
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();

  // Nginx
  const xRealIP = headers.get('x-real-ip');
  if (xRealIP) return xRealIP.trim();

  return null;
}

// ---------------------------------------------------------------------------
// IP Geolocation via ip-api.com
// ---------------------------------------------------------------------------

interface IpApiResponse {
  status: string;
  countryCode?: string;
  country?: string;
}

/**
 * Query ip-api.com for the country code of a given IP.
 * Free tier: 45 requests/minute, no API key needed.
 * Returns null on failure so callers can fall back gracefully.
 */
async function lookupIP(ip: string): Promise<string | null> {
  // Don't look up private / loopback addresses
  if (isPrivateIP(ip)) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode,country`,
      { signal: controller.signal, cache: 'no-store' }
    );

    clearTimeout(timeout);

    if (!res.ok) return null;

    const data: IpApiResponse = await res.json();

    if (data.status === 'success' && data.countryCode) {
      return data.countryCode;
    }

    return null;
  } catch {
    // Network error, timeout, or aborted — fail silently
    return null;
  }
}

/**
 * Check if an IP address is private/loopback.
 */
function isPrivateIP(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('fc') ||
    ip.startsWith('fd') ||
    ip.startsWith('fe80')
  );
}

// ---------------------------------------------------------------------------
// Primary Detection — Server Side
// ---------------------------------------------------------------------------

/**
 * Detect the visitor's country from a Next.js Request object.
 *
 * Resolution order:
 *  1. Cloudflare header `cf-ipcountry` (instant, no external call)
 *  2. Vercel header `x-vercel-ip-country`
 *  3. In-memory cache by IP
 *  4. ip-api.com lookup (cached for 1 hour)
 *  5. Falls back to 'US' if all else fails
 */
export async function detectCountry(request: Request): Promise<string> {
  // 1. Cloudflare provides country code directly
  const cfCountry = request.headers.get('cf-ipcountry');
  if (cfCountry && cfCountry !== 'XX' && cfCountry !== 'T1') {
    return cfCountry.toUpperCase();
  }

  // 2. Vercel provides country code directly
  const vercelCountry = request.headers.get('x-vercel-ip-country');
  if (vercelCountry) {
    return vercelCountry.toUpperCase();
  }

  // 3. Extract IP and check cache
  const ip = extractClientIP(request);
  if (!ip) {
    return 'US'; // No IP available, default to US
  }

  const cached = geoCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.countryCode;
  }

  // 4. External lookup
  const countryCode = await lookupIP(ip);

  if (countryCode) {
    geoCache.set(ip, {
      countryCode,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    pruneCache();
    return countryCode;
  }

  // 5. Fallback
  return 'US';
}

// ---------------------------------------------------------------------------
// Client-Side Fallback — Timezone-Based Detection
// ---------------------------------------------------------------------------

/**
 * Map an IANA timezone string to a country code.
 * This is a best-effort heuristic for client-side fallback when the
 * server-side IP detection is unavailable.
 */
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  // India
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',

  // United States
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Detroit': 'US',
  'America/Indiana/Indianapolis': 'US',
  'America/Boise': 'US',

  // United Kingdom
  'Europe/London': 'GB',

  // Canada
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/St_Johns': 'CA',
  'America/Regina': 'CA',

  // UAE & Gulf
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Qatar': 'QA',
  'Asia/Bahrain': 'BH',
  'Asia/Muscat': 'OM',
  'Asia/Kuwait': 'KW',

  // Singapore
  'Asia/Singapore': 'SG',

  // Australia
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU',
  'Australia/Hobart': 'AU',
  'Australia/Darwin': 'AU',

  // New Zealand
  'Pacific/Auckland': 'NZ',

  // Europe
  'Europe/Amsterdam': 'NL',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Lisbon': 'PT',
  'Europe/Brussels': 'BE',
  'Europe/Vienna': 'AT',
  'Europe/Zurich': 'CH',
  'Europe/Dublin': 'IE',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Warsaw': 'PL',
  'Europe/Prague': 'CZ',
  'Europe/Budapest': 'HU',
  'Europe/Bucharest': 'RO',
  'Europe/Athens': 'GR',

  // Southeast Asia
  'Asia/Manila': 'PH',
  'Asia/Jakarta': 'ID',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Dhaka': 'BD',
  'Asia/Colombo': 'LK',
  'Asia/Kathmandu': 'NP',
  'Asia/Karachi': 'PK',
  'Asia/Yangon': 'MM',
  'Asia/Phnom_Penh': 'KH',

  // Africa
  'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE',
  'Africa/Johannesburg': 'ZA',
  'Africa/Accra': 'GH',
  'Africa/Cairo': 'EG',
  'Africa/Dar_es_Salaam': 'TZ',
  'Africa/Kampala': 'UG',
  'Africa/Addis_Ababa': 'ET',
  'Africa/Kigali': 'RW',
  'Africa/Casablanca': 'MA',
  'Africa/Tunis': 'TN',
};

/**
 * Detect country code from an IANA timezone string.
 * Intended as a client-side fallback when server-side IP detection fails.
 *
 * @param timezone - e.g. "Asia/Kolkata", "America/New_York"
 * @returns ISO 3166-1 alpha-2 country code, defaults to 'US'
 */
export function detectCountryFromTimezone(timezone: string): string {
  if (!timezone) return 'US';

  // Direct lookup
  const direct = TIMEZONE_TO_COUNTRY[timezone];
  if (direct) return direct;

  // Heuristic: try matching by region prefix
  const lower = timezone.toLowerCase();

  if (lower.startsWith('asia/kolkata') || lower.startsWith('asia/calcutta')) return 'IN';
  if (lower.startsWith('america/') && !lower.includes('toronto') && !lower.includes('vancouver')) return 'US';
  if (lower.startsWith('europe/london')) return 'GB';
  if (lower.startsWith('australia/')) return 'AU';
  if (lower.startsWith('africa/')) return 'NG'; // Default African country for the region
  if (lower.startsWith('pacific/auckland')) return 'NZ';

  return 'US';
}
