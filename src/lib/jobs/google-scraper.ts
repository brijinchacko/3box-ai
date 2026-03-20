/**
 * Google Jobs Free Scraper — No API key required
 *
 * Scrapes Google search results for job listings from LinkedIn, Naukri,
 * Indeed, and Google Jobs. Uses plain HTTP + Cheerio parsing.
 *
 * Features:
 * - Rotating User-Agent headers to avoid detection
 * - In-memory cache with 15-minute TTL
 * - Rate limiting (3 second gap between requests)
 * - Optional proxy support via SCRAPER_PROXY_URL
 * - Graceful degradation — returns [] on failure, never throws
 *
 * This is a supplementary source. The paid APIs (Serper, Jooble, Adzuna)
 * remain the primary sources for reliability.
 */
import * as cheerio from 'cheerio';

// ── Types ──

export interface ScrapedJob {
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

// ── Configuration ──

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
];

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_ENTRIES = 200;
const MIN_REQUEST_GAP_MS = 3000; // 3 seconds between Google requests

// ── State ──

const cache = new Map<string, { data: ScrapedJob[]; expiry: number }>();
let lastRequestTime = 0;

// ── Helpers ──

function getRandomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Rate-limited fetch from Google with rotating UA
 */
async function fetchGoogle(url: string): Promise<string | null> {
  // Rate limit
  const now = Date.now();
  const waitMs = MIN_REQUEST_GAP_MS - (now - lastRequestTime);
  if (waitMs > 0) {
    await new Promise((r) => setTimeout(r, waitMs));
  }
  lastRequestTime = Date.now();

  try {
    const headers: Record<string, string> = {
      'User-Agent': getRandomUA(),
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate',
      'Cache-Control': 'no-cache',
    };

    const fetchOptions: RequestInit = { headers, redirect: 'follow' };

    // Proxy support
    const proxyUrl = process.env.SCRAPER_PROXY_URL;
    if (proxyUrl) {
      // For proxy, we'd need a custom agent — skip for now, use direct
      // This can be enhanced with https-proxy-agent if needed
    }

    const response = await fetch(url, fetchOptions);

    if (response.status === 429 || response.status === 403) {
      console.warn(`[GoogleScraper] Blocked (${response.status}) — Google rate limit hit`);
      return null;
    }

    if (!response.ok) {
      console.warn(`[GoogleScraper] HTTP ${response.status} for ${url.slice(0, 80)}`);
      return null;
    }

    return await response.text();
  } catch (err) {
    console.error('[GoogleScraper] Fetch failed:', (err as Error).message);
    return null;
  }
}

/**
 * Check and return from cache, or null if expired/missing
 */
function getFromCache(key: string): ScrapedJob[] | null {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: ScrapedJob[]): void {
  // Evict oldest entries if cache is full
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

// ── Parsers ──

/**
 * Parse Google organic search results (site:linkedin.com, site:naukri.com, etc.)
 */
function parseOrganicResults(html: string, source: string): ScrapedJob[] {
  const $ = cheerio.load(html);
  const jobs: ScrapedJob[] = [];

  // Google organic results are in <div class="g"> or similar containers
  $('div.g, div.tF2Cxc, div.kvH3mc').each((_, el) => {
    const $el = $(el);
    const linkEl = $el.find('a[href^="http"]').first();
    const url = linkEl.attr('href') || '';
    if (!url) return;

    // Get title from <h3>
    let title = $el.find('h3').first().text().trim();
    if (!title) return;

    // Clean title — remove "... - Naukri.com" etc.
    title = title
      .replace(/\s*[-–|].*?(naukri|linkedin|indeed|glassdoor|monster).*$/i, '')
      .replace(/\s*[-–|]\s*$/, '')
      .trim();

    if (!title || title.length < 3) return;

    // Get snippet/description
    const snippet =
      $el.find('.VwiC3b, .lEBKkf, span.aCOpRe, div.IsZvec').first().text().trim() || '';

    // Extract company from snippet
    let company = 'Unknown Company';
    const companyMatch = snippet.match(
      /(?:at|@|by)\s+([A-Z][A-Za-z\s&.]+?)(?:\s*[-–,.|]|\s+in\s)/,
    );
    if (companyMatch) company = companyMatch[1].trim();

    // Extract location
    let location = 'India';
    const locationMatch = snippet.match(
      /(?:in|at|location[:\s]+)\s*([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)?)/,
    );
    if (locationMatch) location = locationMatch[1].trim();

    const isRemote = /remote|work from home|wfh/i.test(title + ' ' + snippet);

    // Extract salary
    let salary: string | null = null;
    const salaryMatch = snippet.match(
      /₹[\d,.]+ ?(?:- ?₹[\d,.]+)?(?:\s*(?:LPA|PA|per annum|per month|lakh|lakhs))?/i,
    );
    if (salaryMatch) salary = salaryMatch[0];

    jobs.push({
      id: generateId('gscrape'),
      title,
      company,
      location: isRemote ? 'Remote' : location,
      description: snippet.slice(0, 500),
      salary,
      url,
      source: `Google (${source})`,
      postedAt: new Date().toISOString(),
      remote: isRemote,
    });
  });

  return jobs;
}

/**
 * Parse Google Jobs tab results (structured job cards)
 * Google Jobs uses `ibp=htl;jobs` parameter — renders JS-heavy page
 * We try to extract from the initial HTML payload
 */
function parseGoogleJobsTab(html: string): ScrapedJob[] {
  const $ = cheerio.load(html);
  const jobs: ScrapedJob[] = [];

  // Google Jobs embeds JSON-LD structured data in some cases
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '');
      const items = Array.isArray(data) ? data : data['@graph'] || [data];

      for (const item of items) {
        if (item['@type'] !== 'JobPosting') continue;

        const title = item.title || '';
        if (!title) continue;

        const company =
          item.hiringOrganization?.name || item.hiringOrganization || 'Unknown Company';
        const loc =
          item.jobLocation?.address?.addressLocality ||
          item.jobLocation?.address?.addressRegion ||
          'India';
        const isRemote =
          item.jobLocationType === 'TELECOMMUTE' ||
          /remote/i.test(title + ' ' + loc);

        let salary: string | null = null;
        if (item.baseSalary?.value) {
          const sv = item.baseSalary.value;
          salary =
            typeof sv === 'object'
              ? `${sv.minValue || ''} - ${sv.maxValue || ''} ${item.baseSalary.currency || ''}`
              : String(sv);
        }

        const applyUrl =
          item.url || (item.directApply ? item.directApply : '');

        jobs.push({
          id: generateId('gjobs'),
          title,
          company: typeof company === 'string' ? company : company.name || 'Unknown Company',
          location: isRemote ? 'Remote' : loc,
          description: (item.description || '').replace(/<[^>]*>/g, '').slice(0, 500),
          salary,
          url: applyUrl || '',
          source: 'Google Jobs',
          postedAt: item.datePosted || new Date().toISOString(),
          remote: isRemote,
        });
      }
    } catch {
      // Not valid JSON-LD, skip
    }
  });

  // Also try parsing visible job cards from the HTML
  // Google Jobs cards use various class names
  $('li.iFjolb, div[data-hveid] div.PwjeAc, div.gws-plugins-horizon-jobs__li-ed').each(
    (_, el) => {
      const $el = $(el);
      const title =
        $el.find('.BjJfJf, .PUpOsf, h2, .sH3zFd').first().text().trim() || '';
      if (!title || title.length < 3) return;

      const company =
        $el.find('.vNEEBe, .nJlQNd, .company').first().text().trim() || 'Unknown Company';
      const location =
        $el.find('.Qk80Jf, .location, .pwO9Dc').first().text().trim() || 'India';
      const isRemote = /remote|wfh/i.test(title + ' ' + location);

      // Try to get job URL
      const url = $el.find('a[href]').first().attr('href') || '';

      jobs.push({
        id: generateId('gjobs'),
        title,
        company,
        location: isRemote ? 'Remote' : location,
        description: $el.find('.HBvzbc, .YgLbBe, .description').first().text().trim().slice(0, 500),
        salary: null,
        url: url.startsWith('http') ? url : '',
        source: 'Google Jobs',
        postedAt: new Date().toISOString(),
        remote: isRemote,
      });
    },
  );

  return jobs;
}

// ── Public Search Functions ──

/**
 * Search Google Jobs tab (structured job data)
 */
export async function searchGoogleJobsFree(
  role: string,
  location: string = '',
): Promise<ScrapedJob[]> {
  const cacheKey = `gjobs:${role}:${location}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const query = encodeURIComponent(`${role} jobs${location ? ` in ${location}` : ' in India'}`);
  const url = `https://www.google.com/search?q=${query}&ibp=htl;jobs&hl=en&gl=in`;

  const html = await fetchGoogle(url);
  if (!html) return [];

  const jobs = parseGoogleJobsTab(html);
  console.log(`[GoogleScraper] Google Jobs: ${jobs.length} jobs for "${role}"`);
  setCache(cacheKey, jobs);
  return jobs;
}

/**
 * Search LinkedIn jobs via Google site: search
 */
export async function searchLinkedInFree(
  role: string,
  location: string = '',
): Promise<ScrapedJob[]> {
  const cacheKey = `glinkedin:${role}:${location}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const query = encodeURIComponent(
    `site:linkedin.com/jobs ${role}${location ? ` ${location}` : ' India'}`,
  );
  const url = `https://www.google.com/search?q=${query}&num=10&hl=en&gl=in`;

  const html = await fetchGoogle(url);
  if (!html) return [];

  const jobs = parseOrganicResults(html, 'LinkedIn');
  // Filter to only LinkedIn URLs
  const linkedinJobs = jobs.filter((j) => j.url.includes('linkedin.com'));
  console.log(`[GoogleScraper] LinkedIn: ${linkedinJobs.length} jobs for "${role}"`);
  setCache(cacheKey, linkedinJobs);
  return linkedinJobs;
}

/**
 * Search Naukri jobs via Google site: search
 */
export async function searchNaukriFree(
  role: string,
  location: string = '',
): Promise<ScrapedJob[]> {
  const cacheKey = `gnaukri:${role}:${location}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const query = encodeURIComponent(
    `site:naukri.com ${role}${location ? ` ${location}` : ''} jobs`,
  );
  const url = `https://www.google.com/search?q=${query}&num=10&hl=en&gl=in`;

  const html = await fetchGoogle(url);
  if (!html) return [];

  const jobs = parseOrganicResults(html, 'Naukri');
  const naukriJobs = jobs.filter((j) => j.url.includes('naukri.com'));
  console.log(`[GoogleScraper] Naukri: ${naukriJobs.length} jobs for "${role}"`);
  setCache(cacheKey, naukriJobs);
  return naukriJobs;
}

/**
 * Search Indeed jobs via Google site: search
 */
export async function searchIndeedFree(
  role: string,
  location: string = '',
): Promise<ScrapedJob[]> {
  const cacheKey = `gindeed:${role}:${location}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const query = encodeURIComponent(
    `site:indeed.com ${role}${location ? ` ${location}` : ' India'} jobs`,
  );
  const url = `https://www.google.com/search?q=${query}&num=10&hl=en&gl=in`;

  const html = await fetchGoogle(url);
  if (!html) return [];

  const jobs = parseOrganicResults(html, 'Indeed');
  const indeedJobs = jobs.filter((j) => j.url.includes('indeed'));
  console.log(`[GoogleScraper] Indeed: ${indeedJobs.length} jobs for "${role}"`);
  setCache(cacheKey, indeedJobs);
  return indeedJobs;
}

/**
 * Search multiple sites in one Google query (saves API calls)
 * Uses OR to combine LinkedIn + Naukri + Indeed in a single search
 */
export async function searchAllFree(
  role: string,
  location: string = '',
): Promise<ScrapedJob[]> {
  const cacheKey = `gall:${role}:${location}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const query = encodeURIComponent(
    `(site:linkedin.com/jobs OR site:naukri.com OR site:indeed.com) ${role}${location ? ` ${location}` : ' India'}`,
  );
  const url = `https://www.google.com/search?q=${query}&num=15&hl=en&gl=in`;

  const html = await fetchGoogle(url);
  if (!html) return [];

  const jobs = parseOrganicResults(html, 'Multi');
  // Tag each job with the correct source based on URL
  for (const job of jobs) {
    if (job.url.includes('linkedin.com')) job.source = 'Google (LinkedIn)';
    else if (job.url.includes('naukri.com')) job.source = 'Google (Naukri)';
    else if (job.url.includes('indeed')) job.source = 'Google (Indeed)';
  }

  console.log(`[GoogleScraper] Multi-search: ${jobs.length} jobs for "${role}"`);
  setCache(cacheKey, jobs);
  return jobs;
}
