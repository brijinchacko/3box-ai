/**
 * Greenhouse Job Board API Client
 * Submits applications directly via the public Greenhouse Job Board API.
 *
 * API Docs: https://developers.greenhouse.io/job-board.html
 * Endpoint: POST https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs/{job_id}
 *
 * Note: This uses the PUBLIC job board API — no API key needed.
 * Applications are submitted as multipart/form-data.
 */

export interface GreenhouseApplicationData {
  boardToken: string;  // Company's Greenhouse board token
  jobId: string;       // Greenhouse job ID
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  coverLetter?: string;
  resumeBuffer?: Uint8Array;   // PDF buffer
  resumeFilename?: string; // e.g. "John_Doe_Resume.pdf"
}

export interface GreenhouseSubmitResult {
  success: boolean;
  status: number;
  message: string;
  candidateId?: string;
}

/**
 * Extract Greenhouse board token and job ID from a job URL.
 * Patterns:
 *  - https://boards.greenhouse.io/{board_token}/jobs/{job_id}
 *  - https://job-boards.greenhouse.io/ts/{board_token}/jobs/{job_id}
 *  - https://{company}.greenhouse.io/jobs/{job_id}
 */
export function parseGreenhouseUrl(url: string): { boardToken: string; jobId: string } | null {
  // Pattern 1: boards.greenhouse.io/{token}/jobs/{id}
  let match = url.match(/boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/);
  if (match) return { boardToken: match[1], jobId: match[2] };

  // Pattern 2: job-boards.greenhouse.io/ts/{token}/jobs/{id}
  match = url.match(/job-boards\.greenhouse\.io\/ts\/([^/]+)\/jobs\/(\d+)/);
  if (match) return { boardToken: match[1], jobId: match[2] };

  // Pattern 3: {company}.greenhouse.io/jobs/{id}  (board token = subdomain)
  match = url.match(/([^/.]+)\.greenhouse\.io\/jobs\/(\d+)/);
  if (match && match[1] !== 'boards' && match[1] !== 'job-boards') {
    return { boardToken: match[1], jobId: match[2] };
  }

  return null;
}

/**
 * Check if a URL is a Greenhouse job posting.
 */
export function isGreenhouseUrl(url: string): boolean {
  return /greenhouse\.io\/(.*\/)?jobs\/\d+/.test(url);
}

/**
 * Submit an application via the Greenhouse Job Board API.
 * Uses multipart/form-data for resume upload support.
 */
export async function submitGreenhouseApplication(
  data: GreenhouseApplicationData,
): Promise<GreenhouseSubmitResult> {
  const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${data.boardToken}/jobs/${data.jobId}`;

  try {
    const formData = new FormData();
    formData.append('first_name', data.firstName);
    formData.append('last_name', data.lastName);
    formData.append('email', data.email);

    if (data.phone) formData.append('phone', data.phone);
    if (data.location) formData.append('location', data.location);
    if (data.linkedinUrl) formData.append('urls[LinkedIn]', data.linkedinUrl);
    if (data.websiteUrl) formData.append('urls[Portfolio]', data.websiteUrl);
    if (data.coverLetter) formData.append('cover_letter', data.coverLetter);

    // Attach resume as PDF if provided
    if (data.resumeBuffer && data.resumeFilename) {
      const blob = new Blob([data.resumeBuffer as BlobPart], { type: 'application/pdf' });
      formData.append('resume', blob, data.resumeFilename);
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    const status = response.status;

    if (status === 200 || status === 201) {
      let candidateId: string | undefined;
      try {
        const responseData = await response.json();
        candidateId = responseData?.id?.toString();
      } catch { /* Response might not be JSON */ }

      return {
        success: true,
        status,
        message: `Application submitted successfully to ${data.boardToken}`,
        candidateId,
      };
    }

    // Handle common error codes
    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage = errorData?.message || errorData?.error || `HTTP ${status}`;
    } catch {
      errorMessage = `HTTP ${status}`;
    }

    if (status === 422) {
      return { success: false, status, message: `Validation error: ${errorMessage} (may already be applied)` };
    }

    if (status === 404) {
      return { success: false, status, message: `Job posting not found or expired` };
    }

    if (status === 429) {
      return { success: false, status, message: `Rate limited by Greenhouse — retry later` };
    }

    return { success: false, status, message: errorMessage };
  } catch (err) {
    return {
      success: false,
      status: 0,
      message: `Network error: ${(err as Error).message}`,
    };
  }
}
