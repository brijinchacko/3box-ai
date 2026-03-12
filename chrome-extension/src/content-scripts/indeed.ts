/**
 * Indeed Content Script — Job detection + auto-fill for Indeed Apply.
 */

import { checkJobWithBackend, syncAppliedJob, type DetectedJob } from './common/job-detector';
import { injectBadge, autoFillForm } from './common/form-filler';

let currentUrl = '';

function extractJobData(): DetectedJob | null {
  const title = document.querySelector('h1.jobsearch-JobInfoHeader-title, .jobTitle, h2[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim() || '';
  const company = document.querySelector('[data-testid="inlineHeader-companyName"] a, .companyName, .jobsearch-InlineCompanyRating-companyHeader a')?.textContent?.trim() || '';
  const location = document.querySelector('[data-testid="job-location"], .companyLocation, .jobsearch-JobInfoHeader-subtitle .companyLocation')?.textContent?.trim() || '';

  if (!title || !company) return null;

  return { title, company, location, url: window.location.href, source: 'indeed' };
}

async function handleApply(job: DetectedJob): Promise<void> {
  // Fill the current page form
  const filled = await autoFillForm();

  if (filled > 0) {
    await syncAppliedJob({
      ...job,
      applicationMethod: 'indeed_apply',
      atsType: 'indeed',
    });
  }
}

async function onPageChange(): Promise<void> {
  const url = window.location.href;
  if (url === currentUrl) return;
  currentUrl = url;

  const job = extractJobData();
  if (!job) return;

  try {
    const result = await checkJobWithBackend(job);
    injectBadge({
      matchScore: result.matchScore,
      alreadyApplied: result.alreadyApplied,
      status: result.applicationStatus,
      onApplyClick: () => handleApply(job),
    });
  } catch {}
}

const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    setTimeout(onPageChange, 500);
  }
});

chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
  if (response?.authenticated) {
    onPageChange();
    observer.observe(document.body, { childList: true, subtree: true });
  }
});

console.log('[3BOX AI] Indeed content script loaded');
