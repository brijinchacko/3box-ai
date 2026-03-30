/**
 * Arbeitnow Job Board API — 100% Free, No API Key Required
 *
 * Public API: https://www.arbeitnow.com/api/job-board-api
 * Returns jobs from companies across the world.
 * Supports pagination and search.
 */

export interface ArbeitnowJob {
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

// ── In-memory cache (15 min TTL, keyed by search) ──
const cache = new Map<string, { data: ArbeitnowJob[]; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000;

/**
 * Search Arbeitnow for jobs matching keywords and location
 */
export async function searchArbeitnow(
  keywords: string,
  location: string = '',
): Promise<ArbeitnowJob[]> {
  const cacheKey = `${keywords}:${location}`.toLowerCase();

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = new URL('https://www.arbeitnow.com/api/job-board-api');
    url.searchParams.set('page', '1');
    // Note: Arbeitnow returns all jobs paginated; we filter client-side by keywords

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; 3BoxAI/1.0; job-search)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`[Arbeitnow] API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const rawJobs = data?.data || [];

    // Filter and rank by keyword relevance
    const searchLower = keywords.toLowerCase();
    const searchTerms = searchLower.split(/\s+/).filter(Boolean);
    const locationTerms = location.toLowerCase().split(/[\s,]+/).filter(Boolean);

    const scored = rawJobs
      .filter((j: any) => j.title && j.company_name)
      .map((j: any) => {
        const titleLower = (j.title || '').toLowerCase();
        // Exact phrase match in title = highest priority
        if (titleLower.includes(searchLower)) return { j, score: 100 };
        // All keywords in title
        const allInTitle = searchTerms.every((term) => titleLower.includes(term));
        if (allInTitle) return { j, score: 80 };
        // Most keywords in title (at least 60%)
        const titleMatches = searchTerms.filter((term) => titleLower.includes(term)).length;
        const titleRatio = titleMatches / searchTerms.length;
        if (titleRatio >= 0.6) return { j, score: 50 + titleRatio * 20 };
        return { j, score: 0 };
      })
      .filter((item) => {
        if (item.score === 0) return false;
        // If location specified, filter by it
        if (locationTerms.length > 0) {
          const jobLocation = `${item.j.location || ''} ${item.j.remote ? 'remote' : ''}`.toLowerCase();
          return locationTerms.some((term) => jobLocation.includes(term)) || item.j.remote;
        }
        return true;
      })
      .sort((a, b) => b.score - a.score);

    const jobs: ArbeitnowJob[] = scored
      .slice(0, 20)
      .map(({ j }) => j)
      .map((j: any) => ({
        id: `arbeitnow_${j.slug || j.id || Math.random().toString(36).slice(2)}`,
        title: j.title || '',
        company: j.company_name || '',
        location: j.location || (j.remote ? 'Remote' : 'Unknown'),
        description: stripHtml(j.description || '').slice(0, 500),
        salary: j.salary || null,
        url: j.url || `https://www.arbeitnow.com/view/${j.slug}`,
        source: 'Arbeitnow',
        postedAt: j.created_at
          ? new Date(j.created_at * 1000).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        remote: !!j.remote,
      }));

    // Update cache
    cache.set(cacheKey, { data: jobs, timestamp: Date.now() });
    console.log(`[Arbeitnow] Found ${jobs.length} jobs for "${keywords}" (cached for 15 min)`);
    return jobs;
  } catch (err) {
    console.warn('[Arbeitnow] Search failed:', (err as Error).message);
    return [];
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
