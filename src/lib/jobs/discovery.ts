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

interface DiscoveryParams {
  roles: string[];
  locations: string[];
  preferRemote: boolean;
  limit: number;
  excludeCompanies?: string[];
  excludeKeywords?: string[];
  userProfile: {
    targetRole: string;
    skills: string[];
    location: string;
  };
}

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
 * Main discovery function — aggregates from all sources
 */
export async function discoverJobs(params: DiscoveryParams): Promise<DiscoveredJob[]> {
  const { roles, locations, preferRemote, limit, excludeCompanies = [], excludeKeywords = [], userProfile } = params;
  
  const allJobs: DiscoveredJob[] = [];
  
  // Search all sources in parallel for each role
  const searchPromises: Promise<DiscoveredJob[]>[] = [];
  
  for (const role of roles.slice(0, 3)) { // Max 3 roles to avoid rate limits
    const loc = locations[0] || '';
    
    searchPromises.push(searchJSearch(role, loc));
    searchPromises.push(searchAdzunaIndia(role, loc));
    searchPromises.push(searchNaukri(role, loc));
    searchPromises.push(searchLinkedInJobs(role, loc));
    searchPromises.push(searchIndeedIndia(role, loc));
    searchPromises.push(searchGoogleJobs(role, loc));
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
