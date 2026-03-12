/**
 * 3BOX AI API Client for Chrome Extension
 * Handles all HTTP communication with the 3BOX backend.
 */

const API_BASE = 'https://3box.ai';
// Dev mode fallback
const DEV_API_BASE = 'http://localhost:3002';

async function getApiBase(): Promise<string> {
  const { devMode } = await chrome.storage.local.get('devMode');
  return devMode ? DEV_API_BASE : API_BASE;
}

async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get('authToken');
  return (result.authToken as string) || null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const [base, token] = await Promise.all([getApiBase(), getToken()]);

  if (!token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${base}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `API Error: ${res.status}`);
  }

  return res.json();
}

// ─── Auth ──────────────────────────────────────

export async function validateAuth(): Promise<{
  user: { id: string; name: string; email: string; plan: string; image: string | null };
}> {
  return apiRequest('/api/extension/auth', { method: 'POST' });
}

// ─── Resume ────────────────────────────────────

export async function getResumeData(): Promise<{ resume: any }> {
  return apiRequest('/api/extension/resume');
}

// ─── Job Detection ─────────────────────────────

export async function detectJob(data: {
  jobUrl: string;
  jobTitle: string;
  company: string;
}): Promise<{
  alreadyApplied: boolean;
  applicationStatus: string | null;
  applicationId: string | null;
  atsType: string;
  matchScore: number;
}> {
  return apiRequest('/api/extension/jobs/detect', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Sync Application ──────────────────────────

export async function syncApplication(data: {
  jobTitle: string;
  company: string;
  location?: string;
  jobUrl?: string;
  source: string;
  applicationMethod: string;
  atsType: string;
  coverLetter?: string;
}): Promise<{ success: boolean; applicationId: string }> {
  return apiRequest('/api/extension/sync', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Extension Queue ───────────────────────────

export async function getQueuedJobs(): Promise<{
  jobs: any[];
  total: number;
}> {
  return apiRequest('/api/extension/queue');
}

export { getToken, getApiBase };
