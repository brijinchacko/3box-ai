/**
 * Workday ATS Parser & Extension Data Preparer
 *
 * Workday does NOT have a public apply API. Jobs are hosted on
 * myworkdayjobs.com (wd1-wd5 instances) and require multi-step
 * form submission with CSRF tokens + session cookies.
 *
 * Strategy: parse URL → extract metadata → prepare structured
 * form data for the Chrome extension to auto-fill.
 */

export interface WorkdayJobMetadata {
  company: string;      // e.g., "amazon"
  instance: string;     // e.g., "wd5"
  site: string;         // e.g., "en-US/Amazon"
  jobSlug: string;      // e.g., "Software-Dev-Engineer"
  jobId: string;        // e.g., "R12345" or numeric ID
  fullUrl: string;
}

export interface WorkdayFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  coverLetter?: string;
  resumeFileName?: string;
}

/**
 * Check if a URL is a Workday job posting.
 */
export function isWorkdayUrl(url: string): boolean {
  return /myworkdayjobs\.com/i.test(url) || /wd\d+\.myworkdayjobs/i.test(url) || /workday\.com\/.*\/job/i.test(url);
}

/**
 * Parse a Workday job URL to extract metadata.
 *
 * URL patterns:
 * - https://{company}.wd5.myworkdayjobs.com/en-US/{site}/job/{slug}/{id}
 * - https://www.myworkdayjobs.com/{company}/{slug}/{id}
 * - https://{company}.wd1.myworkdayjobs.com/{locale}/{site}/details/{id}
 */
export function parseWorkdayUrl(url: string): WorkdayJobMetadata | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const pathname = parsed.pathname;

    // Pattern 1: {company}.wd{N}.myworkdayjobs.com/...
    let match = hostname.match(/^([^.]+)\.(wd\d+)\.myworkdayjobs\.com$/i);
    if (match) {
      const company = match[1];
      const instance = match[2];

      // Extract job ID from path — usually the last segment
      const segments = pathname.split('/').filter(Boolean);
      const jobId = segments[segments.length - 1] || '';
      const jobSlug = segments.length > 2 ? segments[segments.length - 2] : '';
      const site = segments.slice(0, -2).join('/');

      return { company, instance, site, jobSlug, jobId, fullUrl: url };
    }

    // Pattern 2: myworkdayjobs.com/{company}/...
    match = hostname.match(/myworkdayjobs\.com$/i);
    if (match) {
      const segments = pathname.split('/').filter(Boolean);
      const company = segments[0] || 'unknown';
      const jobId = segments[segments.length - 1] || '';
      const jobSlug = segments.length > 2 ? segments[segments.length - 2] : '';

      return {
        company,
        instance: 'unknown',
        site: segments.slice(1, -2).join('/'),
        jobSlug,
        jobId,
        fullUrl: url,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Prepare structured form data for the Chrome extension to auto-fill
 * Workday's multi-step application form.
 */
export function prepareWorkdayApplicationData(
  resume: { contact: { name?: string; email?: string; phone?: string; location?: string; linkedin?: string; portfolio?: string } },
  coverLetter?: string,
): WorkdayFormData {
  const nameParts = (resume.contact.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    firstName,
    lastName,
    email: resume.contact.email || '',
    phone: resume.contact.phone,
    address: resume.contact.location,
    linkedinUrl: resume.contact.linkedin,
    portfolioUrl: resume.contact.portfolio,
    coverLetter,
    resumeFileName: `${firstName}_${lastName}_Resume.pdf`.replace(/\s+/g, '_'),
  };
}
