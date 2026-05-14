/**
 * Serper.dev Google Search Integration
 * 2,500 free searches/month — replaces SerpAPI
 * Used to search LinkedIn Jobs and Naukri directly via Google
 * Docs: https://serper.dev/
 */
import { isValidEmployer, isNonJobDescription, isNonJobTitle } from './filters';

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
  // Strip trailing "- LinkedIn" / "| LinkedIn" / "… - linkedin.com" /
  // ellipsis / trailing punctuation. Also strips trailing region tags
  // like "- LinkedIn India" and country names that LinkedIn appends.
  const stripped = rawTitle
    .replace(/\s*[-–|]\s*linkedin(\.com)?(\s+[A-Z][a-z]+)?\s*$/i, '')
    .replace(/\s*[-–|]\s*$/, '')
    .replace(/[…]+\s*$/, '')
    .replace(/\.{2,}\s*$/, '')
    .trim();

  // Pattern 1: "<Company> hiring <Role> in <Location>" — most common
  // search-result title format. Non-greedy + required " in " keeps the
  // role/location boundary correct.
  const m1 = stripped.match(/^(.+?)\s+hiring\s+(.+?)\s+in\s+(.+)$/i);
  if (m1) {
    const company = m1[1].trim();
    const role = m1[2].trim();
    const location = m1[3].replace(/[,\s]+$/, '').trim();
    if (company && role && role.length >= 3) {
      return { company, role, location };
    }
  }

  // Pattern 2: truncated "<Company> hiring <Role>" — Google cut off
  // the location with "...". Still useful: company + role beats
  // dropping the row entirely.
  const m2 = stripped.match(/^(.+?)\s+hiring\s+(.+)$/i);
  if (m2) {
    const company = m2[1].trim();
    const role = m2[2].trim();
    if (company && role && role.length >= 3) {
      return { company, role, location: '' };
    }
  }

  // Pattern 3: "<Role> at <Company> in <Location>" — alternate LinkedIn
  // SEO format ("Senior Engineer at Acme Corp in Bangalore"). Order
  // matters: this comes after the "hiring" patterns so we don't
  // misparse "Acme hiring Senior Engineer at remote" by mistake.
  const m3 = stripped.match(/^(.+?)\s+at\s+([A-Z][^,]+?)(?:\s+in\s+(.+))?$/);
  if (m3) {
    const role = m3[1].trim();
    const company = m3[2].trim();
    const location = (m3[3] || '').replace(/[,\s]+$/, '').trim();
    // Guard against false positives where "<Role>" is actually the
    // company ("Senior Engineer at Acme" is fine; "Acme Inc at Branch"
    // is not). Heuristic: role should contain a known role keyword
    // OR be 2+ words long.
    if (
      role && company && role.length >= 3 && company.length >= 2
      && (/(engineer|developer|manager|analyst|designer|consultant|specialist|lead|director|officer|associate|coordinator|architect|executive|assistant|representative|writer|editor)/i.test(role)
        || role.split(/\s+/).length >= 2)
    ) {
      return { company, role, location };
    }
  }

  // Pattern 4: "<Company> - <Role>" — Naukri-on-LinkedIn cross-post
  // pattern where employer brand is leading. Conservative: only when
  // the right side looks like a role.
  const m4 = stripped.match(/^([A-Z][^-–|]+?)\s+[-–]\s+(.+)$/);
  if (m4) {
    const company = m4[1].trim();
    const role = m4[2].trim();
    if (
      company.length >= 2 && role.length >= 3
      && /(engineer|developer|manager|analyst|designer|consultant|specialist|lead|director|officer|associate|coordinator|architect|executive|assistant|representative)/i.test(role)
    ) {
      return { company, role, location: '' };
    }
  }

  return null;
}

/**
 * Best-effort posted-date extraction from a Serper organic-result
 * snippet. Common phrases: "5 days ago", "2 months ago", "yesterday".
 * Returns ISO string when found, '' otherwise. Empty string deliberately
 * — never lie with new Date() because the freshness filter relies on
 * this value to catch stale postings.
 */
function extractDateFromSnippet(snippet: string): string {
  if (!snippet) return '';
  const lower = snippet.toLowerCase();
  if (/\byesterday\b/.test(lower)) {
    return new Date(Date.now() - 86_400_000).toISOString();
  }
  const m = lower.match(/(\d+)\s*(minute|hour|day|week|month|year)s?\s+ago/);
  if (m) {
    const n = parseInt(m[1], 10);
    const unit = m[2];
    const ms: Record<string, number> = {
      minute: 60_000, hour: 3_600_000, day: 86_400_000,
      week: 604_800_000, month: 2_592_000_000, year: 31_536_000_000,
    };
    return new Date(Date.now() - n * (ms[unit] || 0)).toISOString();
  }
  return '';
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

  // Reject search-results / aggregator landing titles up front. Indeed
  // /viewjob URLs sometimes serve pages whose <title> is
  // "executive assistant,ea jobs in chennai, tamil nadu" — Indeed's
  // SEO format for landing pages. Those slip past the URL whitelist
  // (URL is /viewjob) but are not real postings. Defense in depth —
  // even when a downstream filter catches this, rejecting at parse
  // time keeps the bad row out of every consumer's pipeline.
  if (isNonJobTitle(title)) return null;

  // Reject obvious LinkedIn alert / expired-job pages BEFORE we even
  // try to extract fields. Their snippets reliably contain "Get
  // notified about new <role> jobs in <location>" — the URL might be
  // /jobs/view/<id> (passes the URL whitelist) but the page no longer
  // serves a real posting. This is the single biggest source of the
  // "Unknown Company · India — Posted today" complaint.
  if (isNonJobDescription(result.snippet)) return null;

  let company = '';
  let location = 'India';

  // ── LinkedIn-specific extraction ──
  if (source === 'LinkedIn') {
    const parsed = parseLinkedInTitle(result.title);
    if (parsed) {
      title = parsed.role;
      company = parsed.company;
      if (parsed.location) location = parsed.location;
    }
  }

  // ── Generic snippet-based fallback when title parser didn't give us a
  // company. Tighter than before: leading-cap-words only, max 5 words.
  if (!company) {
    const companyMatch = result.snippet.match(
      /(?:at|@|by)\s+([A-Z][A-Za-z0-9&.\-' ]{1,60}?)(?:\s*[-–,.|]|\s+in\s)/,
    );
    if (companyMatch) company = companyMatch[1].trim();
  }

  // ── Hard-fail when we still don't have a real employer name. We used
  // to ship "Unknown Company" through and rely on a downstream filter
  // to drop it; in practice that filter doesn't run on every consumer
  // (legacy DB rows, /api/jobs/india, etc.) so junk leaks to the UI.
  // Reject at the source so it never enters the pipeline.
  if (!isValidEmployer(company)) return null;

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

  // postedAt: ONLY trust a "Posted X ago" phrase extracted from the
  // snippet text. Do NOT use Google's `result.date` field.
  //
  // Reason: for LinkedIn / Naukri / Indeed `/jobs/view/<id>` URLs,
  // `result.date` is the page's RE-CRAWL date (when Google last
  // re-indexed it), not the date the job was originally posted. The
  // same listing gets re-indexed periodically as long as the URL stays
  // alive, so a 4-month-old job that Google revisited 4 days ago shows
  // `result.date = "4 days ago"` and we'd render "Posted 4d ago" on a
  // stale listing. That's exactly the bug the screenshot in the issue
  // is showing.
  //
  // Snippet-extracted dates are LinkedIn's / Naukri's / Indeed's own
  // "Posted X months ago" text that those sites render on the page and
  // Google indexes verbatim. That phrase reflects the real posting
  // date. When the snippet doesn't include it, we leave postedAt empty
  // — the UI honestly renders "Recently posted" rather than
  // fabricating a freshness signal from re-crawl noise.
  const postedAt = extractDateFromSnippet(result.snippet) || '';

  return {
    id: `serper-${Buffer.from(result.link).toString('base64').slice(0, 20)}`,
    title,
    company,
    location: isRemote ? 'Remote' : location,
    description: result.snippet.slice(0, 300),
    salary,
    url: result.link,
    source,
    postedAt,
    remote: isRemote,
  };
}

/**
 * Parse job from Google Jobs results (structured data)
 */
function parseGoogleJob(job: SerperJobResult): DiscoveredJob | null {
  if (!job.title) return null;

  const company = (job.company_name || '').trim();
  if (!isValidEmployer(company)) return null;

  if (isNonJobDescription(job.description)) return null;

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
    company,
    location: isRemote ? 'Remote' : job.location || 'India',
    description: (job.description || '').slice(0, 500),
    salary: job.detected_extensions?.salary || null,
    url: applyUrl,
    source: `Google Jobs (${job.via || 'aggregated'})`,
    // Same rule as parseJobFromOrganic — '' when unknown, never now().
    postedAt: (job.detected_extensions?.posted_at || '').trim(),
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
    // Final URL guard — must be /jobs/view/<digits>. Real LinkedIn
    // postings have a numeric job ID; subscribe/alert pages don't.
    .filter((r) => /linkedin\.com\/jobs\/view\/\d+/i.test(r.link))
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
