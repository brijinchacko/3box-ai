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
import { searchRemoteOK } from './remoteok';
import { searchArbeitnow } from './arbeitnow';
import { calculateMatchScore } from './matcher';

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
  userProfile: {
    targetRole: string;
    skills: string[];
    location: string;
  };
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
  // ── Free, no API key needed ──────────────────────
  remoteok: searchRemoteOKWrapper,
  arbeitnow: searchArbeitnowWrapper,
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

async function searchRemoteOKWrapper(role: string, location: string): Promise<DiscoveredJob[]> {
  try {
    const results = await searchRemoteOK(role, location);
    console.log(`[RemoteOK] Found ${results.length} jobs for "${role}"`);
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
  } catch {
    return [];
  }
}

async function searchArbeitnowWrapper(role: string, location: string): Promise<DiscoveredJob[]> {
  try {
    const results = await searchArbeitnow(role, location);
    console.log(`[Arbeitnow] Found ${results.length} jobs for "${role}"`);
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
  } catch {
    return [];
  }
}

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

    return (data.data || []).map((job: any) => ({
      id: job.job_id || `jsearch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: job.job_title || '',
      company: job.employer_name || 'Unknown',
      location: job.job_is_remote
        ? 'Remote'
        : [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ') ||
          'Not specified',
      description: (job.job_description || '').slice(0, 500),
      salary:
        job.job_min_salary && job.job_max_salary
          ? `${job.job_min_salary} - ${job.job_max_salary}`
          : null,
      url: job.job_apply_link || '',
      source: 'JSearch',
      postedAt: job.job_posted_at_datetime_utc || new Date().toISOString(),
      remote: job.job_is_remote || false,
    }));
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
 * Aggressive deduplication — same company + similar title = duplicate
 */
function deduplicateJobs(jobs: DiscoveredJob[]): DiscoveredJob[] {
  const seen = new Map<string, DiscoveredJob>();

  for (const job of jobs) {
    // Normalize: strip spaces, lowercase, first 30 chars of title
    const companyKey = job.company
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
    const titleKey = job.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 30);
    const key = `${companyKey}-${titleKey}`;

    if (!seen.has(key)) {
      seen.set(key, job);
    } else {
      // Keep the one with more data (longer description, has salary, etc.)
      const existing = seen.get(key)!;
      const existingScore =
        (existing.description?.length || 0) + (existing.salary ? 50 : 0) + (existing.url ? 20 : 0);
      const newScore =
        (job.description?.length || 0) + (job.salary ? 50 : 0) + (job.url ? 20 : 0);
      if (newScore > existingScore) {
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

/**
 * Filter low-quality jobs that waste application slots
 */
function filterLowQuality(jobs: DiscoveredJob[]): DiscoveredJob[] {
  return jobs.filter((job) => {
    // Must have a real title (not just "Job" or single word)
    if (!job.title || job.title.trim().split(/\s+/).length < 2) return false;

    // Must have a real company name
    if (!job.company || job.company === 'Unknown' || job.company === 'Unknown Company') {
      // Allow if it has a good URL and description
      if (!job.description || job.description.length < 50) return false;
    }

    // Must have some description
    if (!job.description || job.description.length < 20) return false;

    // Filter out search/listing pages that slipped through (not actual job postings)
    const titleLower = job.title.toLowerCase();
    if (/^\d+\s+.*job\s*(vacancies|openings|listings|results)/i.test(titleLower)) return false;
    if (/^\d+\+?\s+.*jobs?\s+(in|near|for)/i.test(titleLower)) return false;
    if (/job\s*vacancies\s*in\s/i.test(titleLower)) return false;

    // Filter Naukri listing page URLs
    const urlLower = (job.url || '').toLowerCase();
    if (urlLower.includes('naukri.com') && /-jobs-in-|-jobs$/.test(urlLower)) return false;

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

  // 6. Filter and rank by title relevance — prioritize exact role matches
  const roleLower = userProfile.targetRole.toLowerCase();
  const targetWords = roleLower
    .split(/[\s,&\-/]+/)
    .filter((w) => w.length > 1 && !['the', 'and', 'for', 'with', 'jobs', 'in', 'of', 'at', 'to', 'a'].includes(w));

  const relevantJobs = scoredJobs
    .map((job) => {
      const titleLower = job.title.toLowerCase();
      // Exact role phrase in title = best match, big score boost
      if (titleLower.includes(roleLower)) {
        return { ...job, matchScore: Math.min(100, (job.matchScore || 0) + 30) };
      }
      // All keywords present in title = strong match
      const allInTitle = targetWords.every((w) => titleLower.includes(w));
      if (allInTitle) {
        return { ...job, matchScore: Math.min(100, (job.matchScore || 0) + 20) };
      }
      // Count how many keywords match in title
      const titleMatchCount = targetWords.filter((w) => titleLower.includes(w)).length;
      const titleMatchRatio = targetWords.length > 0 ? titleMatchCount / targetWords.length : 0;
      // Keep if at least 50% of keywords in title, OR score is above 40
      if (titleMatchRatio >= 0.5) {
        return { ...job, matchScore: Math.min(100, (job.matchScore || 0) + Math.round(titleMatchRatio * 15)) };
      }
      if ((job.matchScore || 0) >= 40) {
        return job;
      }
      // Not relevant enough — filter out
      return null;
    })
    .filter((job): job is DiscoveredJob => job !== null);

  console.log(`[Discovery] After relevance filter: ${relevantJobs.length} (removed ${scoredJobs.length - relevantJobs.length} irrelevant)`);

  // Sort by match score descending
  relevantJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  console.log(
    `[Discovery] Returning top ${Math.min(limit, relevantJobs.length)} of ${relevantJobs.length} scored jobs`,
  );

  return relevantJobs.slice(0, limit);
}
