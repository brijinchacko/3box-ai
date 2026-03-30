/**
 * Jooble Job Search API Integration
 * Free API — aggregates jobs from LinkedIn, Naukri, Indeed, and 60+ countries
 * Docs: https://jooble.org/api/about
 */

interface JoobleJob {
  title: string;
  location: string;
  snippet: string;
  salary: string;
  source: string;
  type: string;
  link: string;
  company: string;
  updated: string;
  id: number;
}

interface JoobleResponse {
  totalCount: number;
  jobs: JoobleJob[];
}

export interface JoobleResult {
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
 * Search Jooble for jobs
 * @param keywords - Job title or keywords
 * @param location - Location string (city, country)
 * @param page - Page number (1-indexed)
 */
export async function searchJooble(
  keywords: string,
  location: string = '',
  page: number = 1,
): Promise<{ jobs: JoobleResult[]; total: number }> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    console.log('[Jooble] JOOBLE_API_KEY not set — skipping');
    return { jobs: [], total: 0 };
  }

  try {
    const response = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords,
        location: location || 'India',
        page: String(page),
      }),
    });

    if (!response.ok) {
      console.error(`[Jooble] API error: ${response.status}`);
      return { jobs: [], total: 0 };
    }

    const data: JoobleResponse = await response.json();

    const jobs: JoobleResult[] = (data.jobs || []).map((job) => {
      const isRemote = /remote|work from home|wfh|hybrid/i.test(
        `${job.title} ${job.location} ${job.snippet}`,
      );

      return {
        id: `jooble-${job.id || Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: job.title || '',
        company: job.company || 'Unknown Company',
        location: isRemote ? 'Remote' : job.location || 'Not specified',
        description: (job.snippet || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim().slice(0, 500),
        salary: job.salary || null,
        url: job.link || '',
        source: `Jooble (${job.source || 'aggregated'})`,
        postedAt: job.updated || new Date().toISOString(),
        remote: isRemote,
      };
    });

    return { jobs, total: data.totalCount || 0 };
  } catch (err) {
    console.error('[Jooble] Search failed:', (err as Error).message);
    return { jobs: [], total: 0 };
  }
}
