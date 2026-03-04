import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

// ── Types ──────────────────────────────────────────────
interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  job_city: string;
  job_state: string;
  job_country: string;
  job_description: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
  job_apply_link: string;
  job_posted_at_datetime_utc: string;
  job_employment_type: string;
  job_is_remote: boolean;
}

interface TransformedJob {
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
}

// ── Demo Data (used when RAPIDAPI_KEY is not set) ──────
const DEMO_JOBS: TransformedJob[] = [
  {
    id: 'demo-1',
    title: 'Senior Software Engineer',
    company: 'TechCorp Inc.',
    companyLogo: null,
    location: 'San Francisco, CA',
    description:
      'We are looking for a Senior Software Engineer to join our platform team. You will design and build scalable microservices, mentor junior engineers, and drive technical decisions across the organization.',
    salary: '$150,000 - $200,000/year',
    url: 'https://example.com/jobs/1',
    postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    type: 'FULLTIME',
    remote: false,
  },
  {
    id: 'demo-2',
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    companyLogo: null,
    location: 'Remote',
    description:
      'Join our fast-growing startup as a Full Stack Developer. Work with React, Node.js, and PostgreSQL to build features used by millions. Fully remote with flexible hours.',
    salary: '$120,000 - $160,000/year',
    url: 'https://example.com/jobs/2',
    postedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    type: 'FULLTIME',
    remote: true,
  },
  {
    id: 'demo-3',
    title: 'Machine Learning Engineer',
    company: 'AI Solutions Ltd.',
    companyLogo: null,
    location: 'New York, NY',
    description:
      'Build and deploy production ML models for our recommendation engine. Strong Python, PyTorch, and MLOps experience required. Competitive compensation and equity.',
    salary: '$170,000 - $230,000/year',
    url: 'https://example.com/jobs/3',
    postedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    type: 'FULLTIME',
    remote: false,
  },
  {
    id: 'demo-4',
    title: 'DevOps Engineer',
    company: 'CloudScale',
    companyLogo: null,
    location: 'Austin, TX',
    description:
      'Manage and improve our cloud infrastructure on AWS. Experience with Kubernetes, Terraform, and CI/CD pipelines is essential. On-call rotation required.',
    salary: '$130,000 - $175,000/year',
    url: 'https://example.com/jobs/4',
    postedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    type: 'FULLTIME',
    remote: false,
  },
  {
    id: 'demo-5',
    title: 'Frontend Engineer (React)',
    company: 'DesignHub',
    companyLogo: null,
    location: 'Remote',
    description:
      'Create beautiful, performant user interfaces with React and TypeScript. Collaborate closely with our design team to build the next generation of creative tools.',
    salary: '$110,000 - $150,000/year',
    url: 'https://example.com/jobs/5',
    postedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    type: 'FULLTIME',
    remote: true,
  },
];

// ── Helpers ────────────────────────────────────────────
function formatEmploymentType(type: string): string {
  const map: Record<string, string> = {
    FULLTIME: 'Full-time',
    PARTTIME: 'Part-time',
    CONTRACTOR: 'Contract',
    INTERN: 'Internship',
  };
  return map[type] || type;
}

function formatSalary(job: JSearchJob): string | null {
  if (!job.job_min_salary && !job.job_max_salary) return null;
  const currency = job.job_salary_currency || 'USD';
  const period = job.job_salary_period || 'YEAR';
  const periodLabel = period === 'YEAR' ? '/year' : period === 'MONTH' ? '/month' : period === 'HOUR' ? '/hour' : '';
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

  if (job.job_min_salary && job.job_max_salary) {
    return `${fmt(job.job_min_salary)} - ${fmt(job.job_max_salary)}${periodLabel}`;
  }
  if (job.job_min_salary) return `From ${fmt(job.job_min_salary)}${periodLabel}`;
  if (job.job_max_salary) return `Up to ${fmt(job.job_max_salary)}${periodLabel}`;
  return null;
}

function formatLocation(job: JSearchJob): string {
  if (job.job_is_remote) return 'Remote';
  const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
  return parts.join(', ') || 'Not specified';
}

function transformJob(job: JSearchJob): TransformedJob {
  return {
    id: job.job_id,
    title: job.job_title,
    company: job.employer_name,
    companyLogo: job.employer_logo,
    location: formatLocation(job),
    description: job.job_description?.slice(0, 300) + (job.job_description?.length > 300 ? '...' : ''),
    salary: formatSalary(job),
    url: job.job_apply_link,
    postedAt: job.job_posted_at_datetime_utc,
    type: formatEmploymentType(job.job_employment_type),
    remote: job.job_is_remote,
  };
}

// ── Route Handler ──────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'software engineer';
    const location = searchParams.get('location') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const remoteOnly = searchParams.get('remote_only') === 'true';

    const apiKey = process.env.RAPIDAPI_KEY;

    // ── Fallback to demo data when no API key ──
    if (!apiKey) {
      console.log('[Jobs API] No RAPIDAPI_KEY set, returning demo data');

      let filtered = [...DEMO_JOBS];

      // Basic filtering on demo data
      if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
          (j) =>
            j.title.toLowerCase().includes(q) ||
            j.company.toLowerCase().includes(q) ||
            j.description.toLowerCase().includes(q)
        );
      }
      if (location) {
        const loc = location.toLowerCase();
        filtered = filtered.filter((j) => j.location.toLowerCase().includes(loc));
      }
      if (remoteOnly) {
        filtered = filtered.filter((j) => j.remote);
      }

      return NextResponse.json({
        jobs: filtered,
        total: filtered.length,
        page: 1,
        isDemo: true,
      });
    }

    // ── Call JSearch API ──
    const searchQuery = remoteOnly
      ? `${query} remote${location ? ` in ${location}` : ''}`
      : `${query}${location ? ` in ${location}` : ''}`;

    const apiUrl = new URL('https://jsearch.p.rapidapi.com/search');
    apiUrl.searchParams.set('query', searchQuery);
    apiUrl.searchParams.set('page', String(page));
    apiUrl.searchParams.set('num_pages', '1');
    apiUrl.searchParams.set('date_posted', 'month');

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error('[Jobs API] JSearch responded with status:', response.status);

      // If the API fails, fall back to demo data
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'API rate limit reached. Please try again later.', jobs: DEMO_JOBS, total: DEMO_JOBS.length, page: 1, isDemo: true },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch jobs from external API' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const jobs: TransformedJob[] = (data.data || []).map((job: JSearchJob) => transformJob(job));
    const total = data.total || jobs.length;

    return NextResponse.json({
      jobs,
      total,
      page,
      isDemo: false,
    });
  } catch (error) {
    console.error('[Jobs API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
