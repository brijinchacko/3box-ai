/**
 * RemoteOK Job Search — 100% Free, No API Key Required
 *
 * Public API: https://remoteok.com/api
 * Returns remote jobs from top companies worldwide.
 * Rate limit: Be respectful, cache results.
 */

export interface RemoteOKJob {
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

// ── In-memory cache (15 min TTL) ──
let cache: { data: RemoteOKJob[]; timestamp: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000;

/**
 * Search RemoteOK for remote jobs matching keywords
 */
export async function searchRemoteOK(
  keywords: string,
  _location: string = '',
): Promise<RemoteOKJob[]> {
  try {
    // Fetch all jobs (API returns full list, we filter client-side)
    const jobs = await fetchRemoteOKJobs();
    if (!jobs.length) return [];

    // Filter and rank by keyword relevance
    const searchLower = keywords.toLowerCase();
    const searchTerms = searchLower.split(/\s+/).filter(Boolean);

    const scored = jobs
      .map((job) => {
        const titleLower = job.title.toLowerCase();
        // Exact phrase match in title = highest priority
        if (titleLower.includes(searchLower)) return { job, score: 100 };
        // All keywords present in title
        const allInTitle = searchTerms.every((term) => titleLower.includes(term));
        if (allInTitle) return { job, score: 80 };
        // Most keywords in title (at least 60% of terms)
        const titleMatches = searchTerms.filter((term) => titleLower.includes(term)).length;
        const titleRatio = titleMatches / searchTerms.length;
        if (titleRatio >= 0.6) return { job, score: 50 + titleRatio * 20 };
        // Skip jobs that only match one generic word in title
        return { job, score: 0 };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    // Return top 20 most relevant matches
    return scored.slice(0, 20).map((item) => item.job);
  } catch (err) {
    console.warn('[RemoteOK] Search failed:', (err as Error).message);
    return [];
  }
}

async function fetchRemoteOKJobs(): Promise<RemoteOKJob[]> {
  // Check cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const response = await fetch('https://remoteok.com/api', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; 3BoxAI/1.0; job-search)',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    console.warn(`[RemoteOK] API returned ${response.status}`);
    return cache?.data ?? [];
  }

  const raw = await response.json();

  // First element is a legal notice object, skip it
  const data = Array.isArray(raw) ? raw.slice(1) : [];

  const jobs: RemoteOKJob[] = data
    .filter((j: any) => j.position && j.company)
    .map((j: any) => {
      const salary = buildSalary(j.salary_min, j.salary_max);
      return {
        id: `remoteok_${j.id || j.slug || Math.random().toString(36).slice(2)}`,
        title: j.position || j.title || '',
        company: j.company || '',
        location: j.location || 'Remote',
        description: stripHtml(j.description || j.snippet || '').slice(0, 500),
        salary,
        url: j.url || `https://remoteok.com/l/${j.slug || j.id}`,
        source: 'RemoteOK',
        postedAt: j.date ? new Date(j.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        remote: true,
      };
    });

  // Update cache
  cache = { data: jobs, timestamp: Date.now() };
  console.log(`[RemoteOK] Fetched ${jobs.length} jobs (cached for 15 min)`);
  return jobs;
}

function buildSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  if (min && max) return `$${(min / 1000).toFixed(0)}k – $${(max / 1000).toFixed(0)}k`;
  if (min) return `From $${(min / 1000).toFixed(0)}k`;
  if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
  return null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
