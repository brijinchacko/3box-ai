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
 * Parse job from Google organic search result (site:linkedin, site:naukri).
 *
 * LinkedIn search result titles follow a standard format:
 *   "<Company> hiring <Role> in <Location> - LinkedIn"
 * The previous parser only stripped the trailing "- LinkedIn" and shoved
 * the entire "Company hiring Role in Location" string into the job title,
 * leaving company unparsed (defaulted to "Unknown Company"). This helper
 * detects and extracts the three fields.
 */
function parseLinkedInTitle(rawTitle: string): { company: string; role: string; location: string } | null {
  // Strip trailing "- LinkedIn" / "| LinkedIn" / "… - linkedin.com" first.
  const stripped = rawTitle
    .replace(/\s*[-–|]\s*linkedin(\.com)?\s*$/i, '')
    .replace(/\s*[-–|]\s*$/, '')
    .trim();

  // Pattern: "<Company> hiring <Role> in <Location>"
  // Use .+? (non-greedy) and require " in " before the last segment so the
  // role can contain hyphens and the location can contain commas.
  const m = stripped.match(/^(.+?)\s+hiring\s+(.+?)\s+in\s+(.+)$/i);
  if (!m) return null;

  const company = m[1].trim();
  const role = m[2].trim();
  // Strip dangling ellipsis / trailing punctuation.
  const location = m[3].replace(/[…\.]{2,}\s*$/, '').replace(/[,\s]+$/, '').trim();

  if (!company || !role || role.length < 3) return null;
  return { company, role, location };
}

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
  let location = 'India';

  // ── LinkedIn-specific extraction ──
  // Try the structured "Company hiring Role in Location" pattern first.
  // When it matches we get clean fields without "Unknown Company" leakage.
  if (source === 'LinkedIn') {
    const parsed = parseLinkedInTitle(result.title);
    if (parsed) {
      title = parsed.role;
      company = parsed.company;
      if (parsed.location) location = parsed.location;
    }
  }

  // ── Generic snippet-based extraction (fallback) ──
  if (company === 'Unknown Company') {
    const companyMatch = result.snippet.match(
      /(?:at|@|by)\s+([A-Z][A-Za-z\s&.]+?)(?:\s*[-–,.|]|\s+in\s)/,
    );
    if (companyMatch) company = companyMatch[1].trim();
  }
  if (location === 'India') {
    const locationMatch = result.snippet.match(
      /(?:in|at|location[:\s])\s*([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)?)/,
    );
    if (locationMatch) location = locationMatch[1].trim();
  }

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

  const query = `"${role}" jobs${location ? ` in ${location}` : ' in India'}`;
  const data = await serperSearch(query, 'search', 10);

  if (!data.organic) return [];

  return data.organic
    .map((r) => parseJobFromOrganic(r, 'Google'))
    .filter((j): j is DiscoveredJob => j !== null);
}

/**
 * Search LinkedIn jobs via Google site: search.
 * Restricts to /jobs/view/ URLs — actual job postings, not search pages.
 */
export async function searchLinkedInJobs(
  role: string,
  location: string = '',
): Promise<DiscoveredJob[]> {
  if (!process.env.SERPER_API_KEY) return [];

  // inurl:/jobs/view/ → only LinkedIn job-posting URLs (excludes the
  // /jobs/search and /company/ pages that just list other people's jobs).
  const query = `site:linkedin.com inurl:/jobs/view/ "${role}"${location ? ` ${location}` : ' India'}`;
  const data = await serperSearch(query, 'search', 10);

  if (!data.organic) return [];

  return data.organic
    // Final URL guard — even if Google returns a non-job URL, drop it.
    .filter((r) => /linkedin\.com\/jobs\/view\//i.test(r.link))
    .map((r) => parseJobFromOrganic(r, 'LinkedIn'))
    .filter((j): j is DiscoveredJob => j !== null);
}

/**
 * Search Naukri jobs via Google site: search.
 * Restricts to /job-listings-/ URLs — Naukri's job-posting URL format.
 */
export async function searchNaukriJobs(
  role: string,
  location: string = '',
): Promise<DiscoveredJob[]> {
  if (!process.env.SERPER_API_KEY) return [];

  // inurl:job-listings → only Naukri posting pages (excludes /jobs-in-x
  // listicle pages and category landing pages).
  const query = `site:naukri.com inurl:job-listings "${role}"${location ? ` ${location}` : ''}`;
  const data = await serperSearch(query, 'search', 10);

  if (!data.organic) return [];

  return data.organic
    .filter((r) => /naukri\.com\/job-listings/i.test(r.link))
    .map((r) => parseJobFromOrganic(r, 'Naukri'))
    .filter((j): j is DiscoveredJob => j !== null);
}

/**
 * Search Indeed India jobs via Google site: search.
 * Restricts to viewjob URLs — actual job postings, not /cmp/ reviews,
 * /career/ salary pages, or /q-...-jobs.html search-result listings.
 */
export async function searchIndeedJobs(
  role: string,
  location: string = '',
): Promise<DiscoveredJob[]> {
  if (!process.env.SERPER_API_KEY) return [];

  // inurl:viewjob → only Indeed job-posting URLs. This is the single
  // most important fix for the "Indeed jobs are all expired/junk" bug:
  // previously we'd index /cmp/<company>/reviews and salary pages.
  const query = `site:indeed.co.in inurl:viewjob "${role}"${location ? ` ${location}` : ''}`;
  const data = await serperSearch(query, 'search', 10);

  if (!data.organic) return [];

  return data.organic
    .filter((r) => /indeed\.(co\.in|com)\/(viewjob|rc\/clk)/i.test(r.link))
    .map((r) => parseJobFromOrganic(r, 'Indeed India'))
    .filter((j): j is DiscoveredJob => j !== null);
}
