/**
 * Naukri Content Script — Job detection + auto-fill for Naukri Apply.
 */

import { checkJobWithBackend, syncAppliedJob, type DetectedJob } from './common/job-detector';
import { injectBadge, autoFillForm } from './common/form-filler';

let currentUrl = '';

function extractJobData(): DetectedJob | null {
  const title = document.querySelector('.jd-header-title, h1.styles_jd-header-title__rZwM1, .job-title')?.textContent?.trim() || '';
  const company = document.querySelector('.jd-header-comp-name a, .styles_jd-header-comp-name__MvqAI a, .company-name')?.textContent?.trim() || '';
  const location = document.querySelector('.ni-job-tuple-icon-srp-location, .location .ni-job-tuple-icon, .loc')?.textContent?.trim() || '';

  if (!title || !company) return null;

  return { title, company, location, url: window.location.href, source: 'naukri' };
}

async function handleApply(job: DetectedJob): Promise<void> {
  // Click Naukri's apply button
  const applyBtn = document.querySelector('#apply-button, .apply-button-container button, button.apply-btn') as HTMLButtonElement | null;
  if (applyBtn) {
    applyBtn.click();
    await new Promise((r) => setTimeout(r, 1500));
  }

  const filled = await autoFillForm();

  if (filled > 0) {
    await syncAppliedJob({
      ...job,
      applicationMethod: 'naukri_apply',
      atsType: 'naukri',
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

console.log('[3BOX AI] Naukri content script loaded');
