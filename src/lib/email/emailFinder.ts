/**
 * Email Finder — Multi-strategy email discovery for job applications.
 *
 * Strategy priority:
 * 1. Hunter.io Email Finder API (verified emails by person + domain)
 * 2. Hunter.io Domain Search (find any email at the company)
 * 3. Common pattern guessing with domain verification
 *
 * Hunter.io Free: 25 searches/month
 * Hunter.io Starter ($49/mo): 500 searches/month
 */

// ─── Types ──────────────────────────────────────────

export interface EmailFinderResult {
  email: string;
  confidence: number;  // 0-100
  source: 'hunter_finder' | 'hunter_domain' | 'pattern_guess' | 'provided';
  verified: boolean;
  firstName?: string;
  lastName?: string;
}

interface HunterEmailFinderResponse {
  data: {
    first_name: string;
    last_name: string;
    email: string;
    score: number;
    domain: string;
    position: string;
    company: string;
    sources: { domain: string; uri: string }[];
    verification: { date: string; status: string };
  };
  meta: { params: Record<string, string> };
}

interface HunterDomainSearchResponse {
  data: {
    domain: string;
    disposable: boolean;
    webmail: boolean;
    pattern: string;
    organization: string;
    emails: {
      value: string;
      type: string;
      confidence: number;
      first_name: string;
      last_name: string;
      position: string;
      department: string;
    }[];
  };
  meta: { results: number; limit: number; offset: number };
}

// ─── In-memory cache (avoid duplicate API calls) ────

const emailCache = new Map<string, { result: EmailFinderResult | null; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCached(key: string): EmailFinderResult | null | undefined {
  const entry = emailCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    emailCache.delete(key);
    return undefined;
  }
  return entry.result;
}

function setCache(key: string, result: EmailFinderResult | null): void {
  // Limit cache size
  if (emailCache.size > 5000) {
    const oldest = emailCache.keys().next().value;
    if (oldest) emailCache.delete(oldest);
  }
  emailCache.set(key, { result, timestamp: Date.now() });
}

// ─── Hunter.io API ──────────────────────────────────

const HUNTER_API_KEY = () => process.env.HUNTER_API_KEY || '';
const HUNTER_BASE_URL = 'https://api.hunter.io/v2';

/**
 * Find a specific person's email at a company using Hunter.io Email Finder.
 * Best for cold outreach — finds verified individual emails.
 */
async function hunterEmailFinder(
  domain: string,
  firstName?: string,
  lastName?: string,
): Promise<EmailFinderResult | null> {
  const apiKey = HUNTER_API_KEY();
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({ domain, api_key: apiKey });
    if (firstName) params.set('first_name', firstName);
    if (lastName) params.set('last_name', lastName);

    const response = await fetch(`${HUNTER_BASE_URL}/email-finder?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data: HunterEmailFinderResponse = await response.json();
    if (!data?.data?.email) return null;

    return {
      email: data.data.email,
      confidence: data.data.score || 50,
      source: 'hunter_finder',
      verified: data.data.verification?.status === 'valid',
      firstName: data.data.first_name,
      lastName: data.data.last_name,
    };
  } catch (err) {
    console.error('[EmailFinder] Hunter finder error:', (err as Error).message);
    return null;
  }
}

/**
 * Search for any email at a company domain using Hunter.io Domain Search.
 * Finds HR/recruiting contacts when we don't know specific names.
 */
async function hunterDomainSearch(domain: string): Promise<EmailFinderResult | null> {
  const apiKey = HUNTER_API_KEY();
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      domain,
      api_key: apiKey,
      limit: '5',
      department: 'human_resources',
    });

    const response = await fetch(`${HUNTER_BASE_URL}/domain-search?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data: HunterDomainSearchResponse = await response.json();
    if (!data?.data?.emails?.length) return null;

    // Prioritize: HR department > highest confidence > any email
    const hrEmails = data.data.emails.filter(
      (e) => e.department === 'human_resources' || /hr|recruit|talent|people/i.test(e.position),
    );
    const best = hrEmails[0] || data.data.emails.sort((a, b) => b.confidence - a.confidence)[0];

    if (!best) return null;

    return {
      email: best.value,
      confidence: best.confidence,
      source: 'hunter_domain',
      verified: best.confidence >= 80,
      firstName: best.first_name,
      lastName: best.last_name,
    };
  } catch (err) {
    console.error('[EmailFinder] Hunter domain search error:', (err as Error).message);
    return null;
  }
}

// ─── Pattern Guessing ───────────────────────────────

/**
 * Common email patterns for company domains.
 * Ordered by most common first.
 */
const EMAIL_PATTERNS = [
  'hr@{domain}',
  'careers@{domain}',
  'jobs@{domain}',
  'recruiting@{domain}',
  'talent@{domain}',
  'hiring@{domain}',
  'recruitment@{domain}',
  'people@{domain}',
];

/**
 * Guess HR email from company name using common patterns.
 * Low confidence — used as last resort.
 */
function guessCompanyEmail(company: string): EmailFinderResult | null {
  const domain = inferDomain(company);
  if (!domain) return null;

  // Use the most common pattern: hr@domain.com
  const email = EMAIL_PATTERNS[0].replace('{domain}', domain);

  return {
    email,
    confidence: 25, // Low confidence — it's a guess
    source: 'pattern_guess',
    verified: false,
  };
}

/**
 * Infer a company's domain from its name.
 * Strips common suffixes and normalizes.
 */
export function inferDomain(company: string): string | null {
  const cleaned = company
    .toLowerCase()
    .replace(/\s*(pvt|private|ltd|limited|inc|incorporated|corp|corporation|llc|llp|technologies|tech|solutions|services|group|india|global|labs|studio|studios|consulting|consultancy|software)\s*/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '');

  if (!cleaned || cleaned.length < 2) return null;

  return `${cleaned}.com`;
}

// ─── Main Email Finder ──────────────────────────────

/**
 * Find the best email to reach a company's HR/recruiting team.
 * Tries multiple strategies in order of reliability.
 *
 * @param company - Company name (e.g., "Google", "TCS Pvt Ltd")
 * @param domain - Optional known domain (e.g., "google.com")
 * @param hiringManagerName - Optional name for targeted lookup
 */
export async function findCompanyEmail(
  company: string,
  domain?: string,
  hiringManagerName?: string,
): Promise<EmailFinderResult | null> {
  const resolvedDomain = domain || inferDomain(company);
  if (!resolvedDomain) return null;

  // Check cache
  const cacheKey = `${resolvedDomain}:${hiringManagerName || 'hr'}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  // Strategy 1: Hunter.io Email Finder (if we have a name)
  if (hiringManagerName) {
    const parts = hiringManagerName.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || undefined;
    const result = await hunterEmailFinder(resolvedDomain, firstName, lastName);
    if (result && result.confidence >= 50) {
      setCache(cacheKey, result);
      return result;
    }
  }

  // Strategy 2: Hunter.io Domain Search (find HR contacts)
  const domainResult = await hunterDomainSearch(resolvedDomain);
  if (domainResult && domainResult.confidence >= 40) {
    setCache(cacheKey, domainResult);
    return domainResult;
  }

  // Strategy 3: Pattern guessing (last resort)
  const guessResult = guessCompanyEmail(company);
  setCache(cacheKey, guessResult);
  return guessResult;
}

/**
 * Batch find emails for multiple companies.
 * Processes in parallel with concurrency limit to respect API rate limits.
 */
export async function findEmailsBatch(
  companies: { name: string; domain?: string }[],
  concurrency = 3,
): Promise<Map<string, EmailFinderResult | null>> {
  const results = new Map<string, EmailFinderResult | null>();

  for (let i = 0; i < companies.length; i += concurrency) {
    const batch = companies.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((c) => findCompanyEmail(c.name, c.domain)),
    );

    for (let j = 0; j < batch.length; j++) {
      const result = batchResults[j];
      results.set(
        batch[j].name,
        result.status === 'fulfilled' ? result.value : null,
      );
    }

    // Small delay between batches to respect Hunter.io rate limits
    if (i + concurrency < companies.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return results;
}

/**
 * Get remaining Hunter.io API credits.
 */
export async function getHunterCredits(): Promise<{ available: number; used: number } | null> {
  const apiKey = HUNTER_API_KEY();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${HUNTER_BASE_URL}/account?api_key=${apiKey}`);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      available: data?.data?.requests?.searches?.available ?? 0,
      used: data?.data?.requests?.searches?.used ?? 0,
    };
  } catch {
    return null;
  }
}
