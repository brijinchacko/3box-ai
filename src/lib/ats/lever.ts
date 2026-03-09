/**
 * Lever Postings API Client
 * Submits applications directly via the Lever Postings API.
 *
 * API Docs: https://hire.lever.co/developer/posting-api
 * Endpoint: POST https://api.lever.co/v0/postings/{site}/{posting_id}?key={api_key}
 *
 * Rate Limit: 2 requests/second
 * Note: Some companies require an API key, others allow public submissions.
 */

export interface LeverApplicationData {
  site: string;        // Company's Lever site slug
  postingId: string;   // Lever posting ID
  name: string;        // Full name
  email: string;
  phone?: string;
  org?: string;        // Current company/organization
  urls?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    other?: string;
  };
  comments?: string;   // Cover letter or additional notes
  resumeBuffer?: Uint8Array;
  resumeFilename?: string;
  consent?: Record<string, boolean>; // GDPR consent fields
}

export interface LeverSubmitResult {
  success: boolean;
  status: number;
  message: string;
  applicationId?: string;
}

/**
 * Extract Lever site slug and posting ID from a job URL.
 * Patterns:
 *  - https://jobs.lever.co/{site}/{posting_id}
 *  - https://jobs.lever.co/{site}/{posting_id}/apply
 */
export function parseLeverUrl(url: string): { site: string; postingId: string } | null {
  const match = url.match(/jobs\.lever\.co\/([^/]+)\/([a-f0-9-]+)/);
  if (match) return { site: match[1], postingId: match[2] };
  return null;
}

/**
 * Check if a URL is a Lever job posting.
 */
export function isLeverUrl(url: string): boolean {
  return /jobs\.lever\.co\/[^/]+\/[a-f0-9-]+/.test(url);
}

/**
 * Submit an application via the Lever Postings API.
 * Uses multipart/form-data for resume upload.
 */
export async function submitLeverApplication(
  data: LeverApplicationData,
): Promise<LeverSubmitResult> {
  // Lever API key is optional for public postings
  const apiKey = process.env.LEVER_API_KEY;
  const baseUrl = `https://api.lever.co/v0/postings/${data.site}/${data.postingId}`;
  const apiUrl = apiKey ? `${baseUrl}?key=${apiKey}` : baseUrl;

  try {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);

    if (data.phone) formData.append('phone', data.phone);
    if (data.org) formData.append('org', data.org);
    if (data.comments) formData.append('comments', data.comments);

    // URLs
    if (data.urls?.linkedin) formData.append('urls[LinkedIn]', data.urls.linkedin);
    if (data.urls?.github) formData.append('urls[GitHub]', data.urls.github);
    if (data.urls?.portfolio) formData.append('urls[Portfolio]', data.urls.portfolio);
    if (data.urls?.other) formData.append('urls[Other]', data.urls.other);

    // GDPR consent
    if (data.consent) {
      for (const [key, value] of Object.entries(data.consent)) {
        formData.append(`consent[${key}]`, String(value));
      }
    }

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
      let applicationId: string | undefined;
      try {
        const responseData = await response.json();
        applicationId = responseData?.applicationId || responseData?.id;
      } catch { /* Response might not be JSON */ }

      return {
        success: true,
        status,
        message: `Application submitted to ${data.site} via Lever`,
        applicationId,
      };
    }

    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage = errorData?.message || errorData?.error || `HTTP ${status}`;
    } catch {
      errorMessage = `HTTP ${status}`;
    }

    if (status === 422) {
      return { success: false, status, message: `Validation error: ${errorMessage}` };
    }

    if (status === 404) {
      return { success: false, status, message: `Lever posting not found or closed` };
    }

    if (status === 429) {
      return { success: false, status, message: `Lever rate limit hit (2 req/sec) — retry later` };
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
