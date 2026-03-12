/**
 * Glassdoor Content Script — Job detection + match badge.
 */

import { checkJobWithBackend, syncAppliedJob, type DetectedJob } from './common/job-detector';
import { injectBadge, autoFillForm } from './common/form-filler';

let currentUrl = '';

function extractJobData(): DetectedJob | null {
  const title = document.querySelector('[data-test="job-title"], .css-1vg6q84, h2.jobTitle')?.textContent?.trim() || '';
  const company = document.querySelector('[data-test="employerName"], .css-87uc0g, .e1tk4kwz1')?.textContent?.trim() || '';
  const location = document.querySelector('[data-test="location"], .css-56kyx5')?.textContent?.trim() || '';

  if (!title || !company) return null;

  return { title, company, location, url: window.location.href, source: 'glassdoor' };
}

async function handleApply(job: DetectedJob): Promise<void> {
  const filled = await autoFillForm();
  if (filled > 0) {
    await syncAppliedJob({
      ...job,
      applicationMethod: 'glassdoor_apply',
      atsType: 'generic',
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

console.log('[3BOX AI] Glassdoor content script loaded');
