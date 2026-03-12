/**
 * iCIMS ATS Parser & Extension Data Preparer
 *
 * iCIMS uses iframe-based apply forms with no public submission API.
 * Strategy: detect URL → parse job ID → prepare form data for
 * Chrome extension auto-fill.
 */

export interface IcimsJobMetadata {
  company: string;
  jobId: string;
  portalUrl: string;
  fullUrl: string;
}

export interface IcimsFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  linkedinUrl?: string;
  coverLetter?: string;
  resumeFileName?: string;
}

/**
 * Check if a URL is an iCIMS job posting.
 */
export function isIcimsUrl(url: string): boolean {
  return /icims\.com/i.test(url) || /\.icims\./i.test(url);
}

/**
 * Parse an iCIMS job URL to extract metadata.
 *
 * URL patterns:
 * - https://{company}.icims.com/jobs/{id}/job
 * - https://careers-{company}.icims.com/jobs/{id}/...
 * - https://{company}.icims.com/jobs/{id}/login
 * - https://jobs-{company}.icims.com/jobs/{id}
 */
export function parseIcimsUrl(url: string): IcimsJobMetadata | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const pathname = parsed.pathname;

    // Extract company from hostname
    let company = 'unknown';
    const hostMatch = hostname.match(/^(?:careers-|jobs-)?([^.]+)\.icims\.com$/i);
    if (hostMatch) {
      company = hostMatch[1];
    }

    // Extract job ID from path
    const jobMatch = pathname.match(/\/jobs\/(\d+)/);
    if (!jobMatch) return null;

    const jobId = jobMatch[1];

    return {
      company,
      jobId,
      portalUrl: `${parsed.origin}/jobs/${jobId}/job`,
      fullUrl: url,
    };
  } catch {
    return null;
  }
}

/**
 * Prepare structured form data for Chrome extension auto-fill.
 */
export function prepareIcimsApplicationData(
  resume: { contact: { name?: string; email?: string; phone?: string; location?: string; linkedin?: string } },
  coverLetter?: string,
): IcimsFormData {
  const nameParts = (resume.contact.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Parse location into components
  const locationParts = (resume.contact.location || '').split(',').map(s => s.trim());

  return {
    firstName,
    lastName,
    email: resume.contact.email || '',
    phone: resume.contact.phone,
    city: locationParts[0],
    state: locationParts[1],
    linkedinUrl: resume.contact.linkedin,
    coverLetter,
    resumeFileName: `${firstName}_${lastName}_Resume.pdf`.replace(/\s+/g, '_'),
  };
}
