/**
 * Multi-source Job Discovery Engine v2
 *
 * Sources (priority order):
 * 1. Serper.dev — Google Jobs (structured), LinkedIn, Naukri, Indeed (2,500 free/mo)
 * 2. Jooble — Free aggregator covering 69 countries incl. India
 * 3. Adzuna — Free, good salary data, India support
 * 4. JSearch (RapidAPI) — Fallback only (quota limited)
 *
 * Smart search: limits API calls based on available sources, deduplicates
 * aggressively, and filters for quality before returning results.
 */
import { searchAdzuna } from './adzuna';
import { searchJooble } from './jooble';
import {
  searchGoogleJobs as searchSerperGoogleJobs,
  searchLinkedInJobs as searchSerperLinkedIn,
  searchNaukriJobs as searchSerperNaukri,
  searchIndeedJobs as searchSerperIndeed,
} from './serper';
import {
  searchGoogleJobsFree,
  searchLinkedInFree,
  searchNaukriFree,
  searchIndeedFree,
  type ScrapedJob,
} from './google-scraper';
import { calculateMatchScore } from './matcher';
import {
  isNonJobDescription,
  isNonJobTitle as sharedIsNonJobTitle,
  isNonJobUrl as sharedIsNonJobUrl,
  isStalePosting,
  isValidEmployer,
} from './filters';

export interface DiscoveredJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  url: string;
  source: string;
  postedAt: string;
  remote: boolean;
  matchScore?: number;
  companyEmail?: string | null;
}

export interface DiscoveryParams {
  roles: string[];
  locations: string[];
  preferRemote: boolean;
  limit: number;
  excludeCompanies?: string[];
  excludeKeywords?: string[];
  /** Optional list of platforms to search. When omitted, all available platforms are used. */
  platforms?: string[];
  /**
   * Optional list of board IDs the user selected (e.g. ['linkedin', 'indeed']).
   * When provided, results are filtered to ONLY include jobs whose URL host
   * matches one of these boards. This means a "LinkedIn"-only user will get
   * direct linkedin.com jobs even if those jobs were surfaced by JSearch or
   * Google — and never get aggregator URLs like adzuna.in / jooble.org.
   */
  selectedBoards?: string[];
  userProfile: {
    targetRole: string;
    skills: string[];
    location: string;
  };
}

/**
 * Map of board ID → URL host regex. A job is "from" a board if its URL
 * matches the regex. Used to enforce the user's board selection at the
 * URL level, regardless of which discovery source returned the result.
 */
const BOARD_HOST_PATTERNS: Record<string, RegExp> = {
  linkedin: /\blinkedin\.com\b/i,
  indeed: /\bindeed\.(com|co\.in)\b/i,
  glassdoor: /\bglassdoor\.(com|co\.in)\b/i,
  google: /\b(jobs\.google\.com|google\.com\/search)\b/i,
  dice: /\bdice\.com\b/i,
  naukri: /\bnaukri\.com\b/i,
};

/**
 * Filter jobs by selected boards using URL host matching.
 * Returns the input unchanged when no boards are specified.
 */
function applyBoardHostFilter(
  jobs: DiscoveredJob[],
  boards?: string[],
): { kept: DiscoveredJob[]; rejected: number } {
  if (!boards || boards.length === 0) return { kept: jobs, rejected: 0 };
  const patterns = boards
    .map((b) => BOARD_HOST_PATTERNS[b.toLowerCase().trim()])
    .filter(Boolean);
  if (patterns.length === 0) return { kept: jobs, rejected: 0 };
  const kept: DiscoveredJob[] = [];
  let rejected = 0;
  for (const job of jobs) {
    const url = (job.url || '').trim();
    if (!url) {
      rejected++;
      continue;
    }
    const match = patterns.some((re) => re.test(url));
    if (match) kept.push(job);
    else rejected++;
  }
  return { kept, rejected };
}

// ── Platform Registry ──

type SearchFn = (role: string, location: string) => Promise<DiscoveredJob[]>;

// Wrappers to convert ScrapedJob → DiscoveredJob
function wrapFreeScraperFn(
  fn: (role: string, location: string) => Promise<ScrapedJob[]>,
): SearchFn {
  return async (role: string, location: string): Promise<DiscoveredJob[]> => {
    const results = await fn(role, location);
    return results.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      description: j.description,
      salary: j.salary,
      url: j.url,
      source: j.source,
      postedAt: j.postedAt,
      remote: j.remote,
    }));
  };
}

const PLATFORM_SEARCH_MAP: Record<string, SearchFn> = {
  // Free Google scraping — no API key needed (rate-limited, cached)
  google_free: wrapFreeScraperFn(searchGoogleJobsFree),
  linkedin_free: wrapFreeScraperFn(searchLinkedInFree),
  naukri_free: wrapFreeScraperFn(searchNaukriFree),
  indeed_free: wrapFreeScraperFn(searchIndeedFree),
  // Serper.dev (Google) — paid, structured data (2,500 free/mo)
  google_jobs: searchSerperGoogleJobs,
  linkedin: searchSerperLinkedIn,
  naukri: searchSerperNaukri,
  indeed: searchSerperIndeed,
  // Jooble — free aggregator
  jooble: searchJoobleWrapper,
  // Adzuna — free, good salary data
  adzuna: searchAdzunaIndia,
  // JSearch — fallback (often rate-limited)
  jsearch: searchJSearch,
};

export const ALL_PLATFORMS = Object.keys(PLATFORM_SEARCH_MAP);

// ── Source Wrappers ──

async function searchJoobleWrapper(role: string, location: string): Promise<DiscoveredJob[]> {
  const result = await searchJooble(role, location);
  return result.jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    description: j.description,
    salary: j.salary,
    url: j.url,
    source: j.source,
    postedAt: j.postedAt,
    remote: j.remote,
  }));
}

async function searchAdzunaIndia(role: string, location: string): Promise<DiscoveredJob[]> {
  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) return [];

  try {
    const isIndianLocation =
      /india|bangalore|mumbai|delhi|hyderabad|chennai|pune|kolkata|bengaluru|noida|gurgaon|gurugram/i.test(
        location,
      );
    const country = isIndianLocation || !location ? 'in' : 'us';

    const result = await searchAdzuna(role, location, 1, country);
    return result.jobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      description: j.description,
      salary: j.salary,
      url: j.url,
      source: 'Adzuna',
      postedAt: j.postedAt,
      remote: j.remote,
    }));
  } catch {
    return [];
  }
}

async function searchJSearch(role: string, location: string): Promise<DiscoveredJob[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return [];

  try {
    const searchQuery = `${role}${location ? ` in ${location}` : ' in India'}`;
    const apiUrl = new URL('https://jsearch.p.rapidapi.com/search');
    apiUrl.searchParams.set('query', searchQuery);
    apiUrl.searchParams.set('page', '1');
    apiUrl.searchParams.set('num_pages', '1');
    apiUrl.searchParams.set('date_posted', 'week');

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[JSearch] Rate limited (429) — quota exhausted');
      }
      return [];
    }
    const data = await response.json();

    return (data.data || [])
      .map((job: any): DiscoveredJob | null => {
        const company = (job.employer_name || '').trim();
        if (!isValidEmployer(company)) return null;

        const description = (job.job_description || '').slice(0, 500);
        if (isNonJobDescription(description)) return null;

        return {
          id: job.job_id || `jsearch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: job.job_title || '',
          company,
          location: job.job_is_remote
            ? 'Remote'
            : [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ') ||
              'Not specified',
          description,
          salary:
            job.job_min_salary && job.job_max_salary
              ? `${job.job_min_salary} - ${job.job_max_salary}`
              : null,
          url: job.job_apply_link || '',
          source: 'JSearch',
          // Empty string (not now()) when JSearch doesn't supply a date —
          // freshness filter treats unknown-date jobs conservatively.
          postedAt: (job.job_posted_at_datetime_utc || '').trim(),
          remote: job.job_is_remote || false,
        };
      })
      .filter((j: DiscoveredJob | null): j is DiscoveredJob => j !== null);
  } catch {
    return [];
  }
}

// ── Utility Functions ──

/**
 * Clean location string — strips postcodes, zip codes, PIN codes
 */
function cleanLocationForSearch(location: string): string {
  if (!location) return '';
  const clean = location
    .replace(/,?\s*[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi, '') // UK postcodes
    .replace(/,?\s*\d{5}(-\d{4})?\b/g, '') // US zip codes
    .replace(/,?\s*\d{6}\b/g, '') // Indian PIN codes
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .replace(/,\s*,/g, ',')
    .trim();
  return clean || location;
}

/**
 * Aggressive deduplication — same company + similar title = duplicate.
 * When two sources surface the same posting, keep the one with more
 * data (longer description, salary, real company name).
 */
function deduplicateJobs(jobs: DiscoveredJob[]): DiscoveredJob[] {
  const seen = new Map<string, DiscoveredJob>();
  const seenUrls = new Set<string>();

  for (const job of jobs) {
    const urlKey = (job.url || '').toLowerCase().replace(/[?#].*$/, '').replace(/\/+$/, '');
    if (urlKey && seenUrls.has(urlKey)) continue;

    // Treat all placeholder companies as empty for dedup so genuinely
    // different employers using the same placeholder name aren't keyed
    // identically — but identical postings re-surfaced under "Unknown"
    // still collapse via the title portion.
    const isPlaceholder = !isValidEmployer(job.company);
    const companyKey = isPlaceholder
      ? ''
      : job.company.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    const titleKey = job.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 30);
    const key = `${companyKey}-${titleKey}`;

    if (!seen.has(key)) {
      seen.set(key, job);
      if (urlKey) seenUrls.add(urlKey);
    } else {
      const existing = seen.get(key)!;
      const existingScore =
        (existing.description?.length || 0)
        + (existing.salary ? 50 : 0)
        + (existing.url ? 20 : 0)
        + (isValidEmployer(existing.company) ? 100 : 0);
      const newScore =
        (job.description?.length || 0)
        + (job.salary ? 50 : 0)
        + (job.url ? 20 : 0)
        + (isValidEmployer(job.company) ? 100 : 0);
      if (newScore > existingScore) {
        if (urlKey) seenUrls.add(urlKey);
        seen.set(key, job);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Filter out excluded companies and keywords
 */
function applyExclusions(
  jobs: DiscoveredJob[],
  excludeCompanies: string[],
  excludeKeywords: string[],
): DiscoveredJob[] {
  const lowerCompanies = excludeCompanies.map((c) => c.toLowerCase());
  const lowerKeywords = excludeKeywords.map((k) => k.toLowerCase());

  return jobs.filter((job) => {
    const jobCompanyLower = job.company.toLowerCase();
    if (lowerCompanies.some((c) => jobCompanyLower.includes(c))) return false;

    const jobText = `${job.title} ${job.description}`.toLowerCase();
    if (lowerKeywords.some((k) => jobText.includes(k))) return false;

    // Filter out jobs with no apply URL
    if (!job.url || job.url.length < 10) return false;

    // Filter out obviously bad titles
    const badTitles = ['not found', 'error', 'page not found', 'access denied'];
    if (badTitles.some((t) => job.title.toLowerCase().includes(t))) return false;

    return true;
  });
}

// All quality predicates live in `./filters` — single source of truth
// shared with the route layer. If you're adding a new rule, change
// `./filters.ts`, not this file.

/**
 * Filter low-quality jobs that waste application slots.
 *
 * All predicates delegate to `./filters` so the live discovery path,
 * the persisted-board path, and the cached-India path apply the same
 * rules. If you're adding a new rejection rule, add it there.
 */
function filterLowQuality(jobs: DiscoveredJob[]): DiscoveredJob[] {
  return jobs.filter((job) => {
    // 1. Real employer required. Rejects "Unknown Company", "Confidential",
    //    portal names ("LinkedIn"), and digit-only junk in one check.
    //    Without this, cover letters can't be personalized and match
    //    scoring is meaningless — pure noise.
    if (!isValidEmployer(job.company)) return false;

    // 2. Title must look like a real role. Catches the bad-parse signal
    //    "<X> hiring <Y>" plus the aggregator/listicle/salary-page titles.
    if (sharedIsNonJobTitle(job.title)) return false;

    // 3. Description-based check. Catches LinkedIn expired postings that
    //    serve a "Get notified about new ___ jobs" alert page from the
    //    same /jobs/view/<id> URL. The URL filter can't see this.
    if (isNonJobDescription(job.description)) return false;

    // 4. Description sanity floor.
    if (!job.description || job.description.length < 20) return false;

    // 5. URL points to a real posting (not a /cmp/reviews / /Salaries /
    //    /jobs/view/ alert page / -jobs-in- aggregator landing page).
    if (sharedIsNonJobUrl(job.url)) return false;

    // 6. Freshness: drop postings older than the cutoff. Unknown dates
    //    pass through — the UI shows "Recently posted" honestly.
    if (isStalePosting(job.postedAt)) return false;

    return true;
  });
}

// ── Main Discovery Function ──

/**
 * Discover jobs from all available sources
 *
 * Searches up to 3 roles across all enabled platforms in parallel,
 * deduplicates, filters for quality, scores against user profile,
 * and returns the top matches.
 */
export async function discoverJobs(params: DiscoveryParams): Promise<DiscoveredJob[]> {
  const {
    roles,
    locations,
    preferRemote,
    limit,
    excludeCompanies = [],
    excludeKeywords = [],
    platforms,
    userProfile,
  } = params;

  const allJobs: DiscoveredJob[] = [];
  const searchPromises: Promise<DiscoveredJob[]>[] = [];
  const platformNames: string[] = [];

  // Determine which platforms to use
  const activePlatforms = platforms && platforms.length > 0 ? platforms : ALL_PLATFORMS;

  // Log available sources
  const hasSerper = !!process.env.SERPER_API_KEY;
  const hasJooble = !!process.env.JOOBLE_API_KEY;
  const hasAdzuna = !!process.env.ADZUNA_APP_ID && !!process.env.ADZUNA_APP_KEY;
  const hasJSearch = !!process.env.RAPIDAPI_KEY;
  console.log(
    `[Discovery] Sources: GoogleFree=yes, Serper=${hasSerper}, Jooble=${hasJooble}, Adzuna=${hasAdzuna}, JSearch=${hasJSearch}`,
  );

  // Search each role (max 3 to avoid burning API quota)
  for (const role of roles.slice(0, 3)) {
    const loc = cleanLocationForSearch(locations[0] || '');

    for (const platform of activePlatforms) {
      const searchFn = PLATFORM_SEARCH_MAP[platform];
      if (searchFn) {
        searchPromises.push(searchFn(role, loc));
        platformNames.push(`${platform}:${role}`);
      }
    }
  }

  // Execute all searches in parallel
  const results = await Promise.allSettled(searchPromises);

  let totalFromSource: Record<string, number> = {};
  for (let i = 0; i < results.length; i++) {
    const label = platformNames[i] || 'unknown';
    const platform = label.split(':')[0];
    const result = results[i];

    if (result.status === 'fulfilled') {
      const count = result.value.length;
      totalFromSource[platform] = (totalFromSource[platform] || 0) + count;
      if (count > 0) {
        allJobs.push(...result.value);
      }
    } else {
      console.error(`[Discovery] ${label}: failed —`, result.reason?.message || result.reason);
    }
  }

  // Log summary per source
  for (const [source, count] of Object.entries(totalFromSource)) {
    console.log(`[Discovery] ${source}: ${count} jobs`);
  }
  if (Object.values(totalFromSource).every((c) => c === 0)) {
    console.warn('[Discovery] All sources returned 0 jobs — check API keys and search criteria');
  }

  console.log(`[Discovery] Total raw: ${allJobs.length} jobs`);

  // ── Post-processing pipeline ──

  // 1. Deduplicate
  let processed = deduplicateJobs(allJobs);
  console.log(`[Discovery] After dedup: ${processed.length}`);

  // 1b. Filter by user-selected boards (URL host match).
  // This is the critical guard that ensures e.g. a "LinkedIn-only" user
  // only sees direct linkedin.com URLs — not jobs aggregated by Adzuna,
  // Jooble, etc. that happen to mention LinkedIn.
  const boardFilter = applyBoardHostFilter(processed, params.selectedBoards);
  if (boardFilter.rejected > 0) {
    console.log(`[Discovery] After board filter (${(params.selectedBoards || []).join(',')}): ${boardFilter.kept.length} (rejected ${boardFilter.rejected})`);
  }
  processed = boardFilter.kept;

  // 2. Apply exclusions
  processed = applyExclusions(processed, excludeCompanies, excludeKeywords);

  // 3. Filter low quality
  processed = filterLowQuality(processed);
  console.log(`[Discovery] After quality filter: ${processed.length}`);

  // 4. Filter remote if preferred
  if (preferRemote) {
    const remoteJobs = processed.filter((j) => j.remote);
    if (remoteJobs.length >= 5) processed = remoteJobs;
  }

  // 5. Score and rank against user profile
  const scoredJobs = processed.map((job) => ({
    ...job,
    matchScore: calculateMatchScore(
      {
        title: job.title,
        description: job.description,
        location: job.location,
        salary: job.salary,
        remote: job.remote,
      },
      userProfile,
    ),
  }));

  // 6. Filter out clearly irrelevant results (require ALL role keywords in title, or high score)
  const targetWords = userProfile.targetRole
    .toLowerCase()
    .split(/[\s,&\-/]+/)
    .filter((w) => w.length > 2 && !['the', 'and', 'for', 'with', 'jobs'].includes(w));

  const relevantJobs = scoredJobs.filter((job) => {
    const titleLower = job.title.toLowerCase();
    const matchedCount = targetWords.filter((keyword) => titleLower.includes(keyword)).length;
    const allKeywordsMatch = matchedCount === targetWords.length;
    // Keep if ALL keywords match in title, OR score is above 60
    if (!allKeywordsMatch && (job.matchScore || 0) < 60) {
      return false;
    }
    return true;
  });

  console.log(`[Discovery] After relevance filter: ${relevantJobs.length} (removed ${scoredJobs.length - relevantJobs.length} irrelevant)`);

  // 7. Filter by location if user specified one — keep remote jobs + location matches
  const searchLocation = (params.locations[0] || '').toLowerCase().trim();
  let locationFiltered = relevantJobs;
  if (searchLocation && searchLocation.length > 2) {
    const locParts = searchLocation.split(/[,\s]+/).filter(p => p.length > 2);
    locationFiltered = relevantJobs.filter((job) => {
      if (job.remote) return true; // Always keep remote jobs
      const jobLoc = (job.location || '').toLowerCase();
      if (!jobLoc) return false;
      // Keep if any part of the searched location appears in the job location
      return locParts.some(part => jobLoc.includes(part));
    });
    // Fallback: if too aggressive, keep at least some results
    if (locationFiltered.length < 3 && relevantJobs.length > 0) {
      locationFiltered = relevantJobs;
    }
    console.log(`[Discovery] After location filter (${searchLocation}): ${locationFiltered.length}`);
  }

  // Sort by match score descending
  locationFiltered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  console.log(
    `[Discovery] Returning top ${Math.min(limit, locationFiltered.length)} of ${locationFiltered.length} scored jobs`,
  );

  return locationFiltered.slice(0, limit);
}
