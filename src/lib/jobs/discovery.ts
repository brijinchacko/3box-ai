/**
 * Multi-source Job Discovery Engine
 * Aggregates jobs from JSearch, Adzuna, SerpAPI (Naukri, LinkedIn, Indeed, Google Jobs)
 */
import { searchAdzuna } from './adzuna';
import { searchNaukri, searchLinkedInJobs, searchIndeedIndia, searchGoogleJobs } from './serpapi';
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
  /** Optional list of platforms to search. When omitted, all platforms are used. */
  platforms?: string[];
  userProfile: {
    targetRole: string;
    skills: string[];
    location: string;
  };
}

const PLATFORM_SEARCH_MAP: Record<string, (role: string, location: string) => Promise<DiscoveredJob[]>> = {
  jsearch: searchJSearch,
  adzuna: searchAdzunaIndia,
  naukri: searchNaukri,
  linkedin: searchLinkedInJobs,
  indeed: searchIndeedIndia,
  google_jobs: searchGoogleJobs,
};

export const ALL_PLATFORMS = Object.keys(PLATFORM_SEARCH_MAP);

/**
 * Deduplicate jobs by comparing company + title (fuzzy)
 */
function deduplicateJobs(jobs: DiscoveredJob[]): DiscoveredJob[] {
  const seen = new Map<string, DiscoveredJob>();
  
  for (const job of jobs) {
    const key = `${job.company.toLowerCase().replace(/\s+/g, '')}-${job.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30)}`;
    if (!seen.has(key)) {
      seen.set(key, job);
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Filter out excluded companies and keywords
 */
function applyExclusions(jobs: DiscoveredJob[], excludeCompanies: string[], excludeKeywords: string[]): DiscoveredJob[] {
  const lowerCompanies = excludeCompanies.map(c => c.toLowerCase());
  const lowerKeywords = excludeKeywords.map(k => k.toLowerCase());
  
  return jobs.filter(job => {
    const jobCompanyLower = job.company.toLowerCase();
    if (lowerCompanies.some(c => jobCompanyLower.includes(c))) return false;
    
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    if (lowerKeywords.some(k => jobText.includes(k))) return false;
    
    return true;
  });
}

/**
 * Search JSearch API (existing integration)
 */
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
      next: { revalidate: 300 },
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.data || []).map((job: any) => ({
      id: job.job_id || `jsearch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: job.job_title || '',
      company: job.employer_name || 'Unknown',
      location: job.job_is_remote ? 'Remote' : [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ') || 'Not specified',
      description: (job.job_description || '').slice(0, 500),
      salary: job.job_min_salary && job.job_max_salary ? `${job.job_min_salary} - ${job.job_max_salary}` : null,
      url: job.job_apply_link || '',
      source: 'JSearch',
      postedAt: job.job_posted_at_datetime_utc || new Date().toISOString(),
      remote: job.job_is_remote || false,
    }));
  } catch {
    return [];
  }
}

/**
 * Search Adzuna with India support
 */
async function searchAdzunaIndia(role: string, location: string): Promise<DiscoveredJob[]> {
  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) return [];
  
  try {
    const isIndianLocation = /india|bangalore|mumbai|delhi|hyderabad|chennai|pune|kolkata|bengaluru|noida|gurgaon|gurugram/i.test(location);
    const country = isIndianLocation || !location ? 'in' : 'us';
    
    const result = await searchAdzuna(role, location, 1, country);
    return result.jobs.map(j => ({
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

/**
 * Clean location string for API search queries.
 * Strips postcodes, zip codes, extra punctuation that confuse job search APIs.
 */
function cleanLocationForSearch(location: string): string {
  if (!location) return '';
  let clean = location
    // Remove UK postcodes (e.g., "BD7 2AA", "SW1A 1AA")
    .replace(/,?\s*[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi, '')
    // Remove US zip codes (e.g., "90210", "90210-1234")
    .replace(/,?\s*\d{5}(-\d{4})?\b/g, '')
    // Remove Indian PIN codes (e.g., "560001")
    .replace(/,?\s*\d{6}\b/g, '')
    // Clean up trailing/leading commas and whitespace
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .replace(/,\s*,/g, ',')
    .trim();
  return clean || location; // Fall back to original if cleaning removed everything
}

/**
 * Main discovery function — aggregates from all sources
 */
export async function discoverJobs(params: DiscoveryParams): Promise<DiscoveredJob[]> {
  const { roles, locations, preferRemote, limit, excludeCompanies = [], excludeKeywords = [], platforms, userProfile } = params;

  const allJobs: DiscoveredJob[] = [];

  // Search selected (or all) sources in parallel for each role
  const searchPromises: Promise<DiscoveredJob[]>[] = [];
  const activePlatforms = platforms && platforms.length > 0 ? platforms : ALL_PLATFORMS;

  for (const role of roles.slice(0, 3)) { // Max 3 roles to avoid rate limits
    const loc = cleanLocationForSearch(locations[0] || '');

    for (const platform of activePlatforms) {
      const searchFn = PLATFORM_SEARCH_MAP[platform];
      if (searchFn) searchPromises.push(searchFn(role, loc));
    }
  }
  
  const results = await Promise.allSettled(searchPromises);
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allJobs.push(...result.value);
    }
  }
  
  // Deduplicate
  let uniqueJobs = deduplicateJobs(allJobs);
  
  // Apply exclusions
  uniqueJobs = applyExclusions(uniqueJobs, excludeCompanies, excludeKeywords);
  
  // Filter remote if preferred
  if (preferRemote) {
    const remoteJobs = uniqueJobs.filter(j => j.remote);
    if (remoteJobs.length >= 5) uniqueJobs = remoteJobs; // Only filter if enough remote jobs
  }
  
  // Score and rank
  const scoredJobs = uniqueJobs.map(job => ({
    ...job,
    matchScore: calculateMatchScore(
      { title: job.title, description: job.description, location: job.location, salary: job.salary, remote: job.remote },
      userProfile
    ),
  }));
  
  // Sort by score descending
  scoredJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  
  return scoredJobs.slice(0, limit);
}
