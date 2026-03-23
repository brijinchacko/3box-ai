/**
 * Adzuna Job Search API Integration
 * Docs: https://developer.adzuna.com/docs/search
 */

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string; area: string[] };
  description: string;
  salary_min?: number;
  salary_max?: number;
  redirect_url: string;
  created: string;
  contract_type?: string;
  contract_time?: string;
  category?: { label: string; tag: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

export interface TransformedJob {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  description: string;
  salary: string | null;
  url: string;
  postedAt: string;
  type: string;
  remote: boolean;
  source: string;
}

function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  if (min && max) return `${fmt(min)} - ${fmt(max)}/year`;
  if (min) return `From ${fmt(min)}/year`;
  if (max) return `Up to ${fmt(max)}/year`;
  return null;
}

function transformAdzunaJob(job: AdzunaJob): TransformedJob {
  const isRemote = job.title.toLowerCase().includes('remote') ||
    job.location?.display_name?.toLowerCase().includes('remote') ||
    job.description?.toLowerCase().includes('fully remote');

  return {
    id: `adzuna-${job.id}`,
    title: job.title,
    company: job.company?.display_name || 'Unknown Company',
    companyLogo: null,
    location: job.location?.display_name || 'Not specified',
    description: job.description?.slice(0, 300) + (job.description?.length > 300 ? '...' : ''),
    salary: formatSalary(job.salary_min, job.salary_max),
    url: job.redirect_url,
    postedAt: job.created,
    type: job.contract_time === 'full_time' ? 'Full-time' : job.contract_time === 'part_time' ? 'Part-time' : 'Full-time',
    remote: isRemote,
    source: 'Adzuna',
  };
}

/**
 * Search Adzuna for jobs
 * @param query Job title or keywords
 * @param location Location string
 * @param page Page number (1-indexed)
 * @param country Country code (us, gb, ca, au, in, etc.)
 */
export async function searchAdzuna(
  query: string,
  location: string = '',
  page: number = 1,
  country: string = 'us'
): Promise<{ jobs: TransformedJob[]; total: number }> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error('Adzuna API credentials not configured');
  }

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('results_per_page', '10');
  url.searchParams.set('what', query);
  if (location) {
    url.searchParams.set('where', location);
  }
  url.searchParams.set('sort_by', 'relevance');
  url.searchParams.set('content-type', 'application/json');

  const response = await fetch(url.toString(), {
    next: { revalidate: 300 }, // Cache 5 min
  });

  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const data: AdzunaResponse = await response.json();

  return {
    jobs: (data.results || []).map(transformAdzunaJob),
    total: data.count || 0,
  };
}
