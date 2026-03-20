/**
 * Serper.dev Google Search Integration
 * 2,500 free searches/month — replaces SerpAPI
 * Used to search LinkedIn Jobs and Naukri directly via Google
 * Docs: https://serper.dev/
 */

interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  position?: number;
}

interface SerperJobResult {
  title: string;
  company_name?: string;
  location?: string;
  via?: string;
  description?: string;
  extensions?: string[];
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
    salary?: string;
  };
  job_id?: string;
  link?: string;
  apply_options?: Array<{ link: string; title: string }>;
}

interface SerperResponse {
  organic?: SerperOrganicResult[];
  jobs?: SerperJobResult[];
  searchParameters?: { q: string };
}

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
}

/**
 * Core Serper.dev search function
 */
async function serperSearch(
  query: string,
  type: 'search' | 'job' = 'search',
  num: number = 10,
): Promise<SerperResponse> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return {};

  try {
    const endpoint =
      type === 'job'
        ? 'https://google.serper.dev/job'
        : 'https://google.serper.dev/search';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        gl: 'in', // India
        num,
      }),
    });

    if (!response.ok) {
      console.error(`[Serper] API error: ${response.status}`);
      return {};
    }

    return await response.json();
  } catch (err) {
    console.error('[Serper] Search failed:', (err as Error).message);
    return {};
  }
}

/**
 * Parse job from Google organic search result (site:linkedin, site:naukri)
 */
function parseJobFromOrganic(
  result: SerperOrganicResult,
  source: string,
): DiscoveredJob | null {
  let title = result.title
    .replace(/\s*[-–|].*?(naukri|linkedin|indeed|glassdoor).*$/i, '')
    .replace(/\s*[-–|]\s*$/, '')
    .trim();

  if (!title || title.length < 3) return null;

  let company = 'Unknown Company';
  const companyMatch = result.snippet.match(
    /(?:at|@|by)\s+([A-Z][A-Za-z\s&.]+?)(?:\s*[-–,.|]|\s+in\s)/,
  );
  if (companyMatch) company = companyMatch[1].trim();

  let location = 'India';
  const locationMatch = result.snippet.match(
    /(?:in|at|location[:\s])\s*([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)?)/,
  );
  if (locationMatch) location = locationMatch[1].trim();

  const isRemote = /remote|work from home|wfh/i.test(
    result.title + ' ' + result.snippet,
  );

  let salary: string | null = null;
  const salaryMatch = result.snippet.match(
    /₹[\d,.]+ ?(?:- ?₹[\d,.]+)?(?:\s*(?:LPA|PA|per annum|per month|lakh|lakhs))?/i,
  );
  if (salaryMatch) salary = salaryMatch[0];

  return {
    id: `serper-${Buffer.from(result.link).toString('base64').slice(0, 20)}`,
    title,
    company,
    location: isRemote ? 'Remote' : location,
    description: result.snippet.slice(0, 300),
    salary,
    url: result.link,
    source,
    postedAt: result.date || new Date().toISOString(),
    remote: isRemote,
  };
}

/**
 * Parse job from Google Jobs results (structured data)
 */
function parseGoogleJob(job: SerperJobResult): DiscoveredJob | null {
  if (!job.title) return null;

  const isRemote = /remote|work from home|wfh/i.test(
    `${job.title} ${job.location || ''} ${(job.extensions || []).join(' ')}`,
  );

  const applyUrl =
    job.link ||
    (job.apply_options && job.apply_options.length > 0
      ? job.apply_options[0].link
      : '');

  if (!applyUrl) return null;

  return {
    id: `serper-job-${job.job_id || Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: job.title,
    company: job.company_name || 'Unknown Company',
    location: isRemote ? 'Remote' : job.location || 'India',
    description: (job.description || '').slice(0, 500),
    salary: job.detected_extensions?.salary || null,
    url: applyUrl,
    source: `Google Jobs (${job.via || 'aggregated'})`,
    postedAt: job.detected_extensions?.posted_at || new Date().toISOString(),
    remote: isRemote,
  };
}

// ── Public Search Functions ──

/**
 * Search Google Jobs via Serper (structured job data)
 * This is the highest quality source — returns structured fields
 */
export async function searchGoogleJobs(
  role: string,
  location: string = '',
): Promise<DiscoveredJob[]> {
  if (!process.env.SERPER_API_KEY) return [];

  const query = `${role}${location ? ` in ${location}` : ' in India'}`;
  const data = await serperSearch(query, 'job', 10);

  if (!data.jobs) return [];

  return data.jobs
    .map(parseGoogleJob)
    .filter((j): j is DiscoveredJob => j !== null);
}

/**
 * Search LinkedIn jobs via Google site: search
 */
export async function searchLinkedInJobs(
  role: string,
  location: string = '',
): Promise<DiscoveredJob[]> {
  if (!process.env.SERPER_API_KEY) return [];

  const query = `site:linkedin.com/jobs ${role}${location ? ` ${location}` : ' India'}`;
  const data = await serperSearch(query, 'search', 10);

  if (!data.organic) return [];

  return data.organic
    .map((r) => parseJobFromOrganic(r, 'LinkedIn'))
    .filter((j): j is DiscoveredJob => j !== null);
}

/**
 * Search Naukri jobs via Google site: search
 */
export async function searchNaukriJobs(
  role: string,
  location: string = '',
): Promise<DiscoveredJob[]> {
  if (!process.env.SERPER_API_KEY) return [];

  const query = `site:naukri.com ${role}${location ? ` ${location}` : ''} jobs`;
  const data = await serperSearch(query, 'search', 10);

  if (!data.organic) return [];

  return data.organic
    .map((r) => parseJobFromOrganic(r, 'Naukri'))
    .filter((j): j is DiscoveredJob => j !== null);
}

/**
 * Search Indeed India jobs via Google site: search
 */
export async function searchIndeedJobs(
  role: string,
  location: string = '',
): Promise<DiscoveredJob[]> {
  if (!process.env.SERPER_API_KEY) return [];

  const query = `site:indeed.co.in ${role}${location ? ` ${location}` : ''}`;
  const data = await serperSearch(query, 'search', 10);

  if (!data.organic) return [];

  return data.organic
    .map((r) => parseJobFromOrganic(r, 'Indeed India'))
    .filter((j): j is DiscoveredJob => j !== null);
}
