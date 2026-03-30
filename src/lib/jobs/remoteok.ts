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

    // Filter by keywords
    const searchTerms = keywords.toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = jobs.filter((job) => {
      const searchText = `${job.title} ${job.company} ${job.description}`.toLowerCase();
      return searchTerms.some((term) => searchText.includes(term));
    });

    // Return top 20 matches
    return filtered.slice(0, 20);
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
