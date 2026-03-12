/**
 * iCIMS Content Script — Fills iCIMS application forms.
 */

import { checkJobWithBackend, syncAppliedJob, type DetectedJob } from './common/job-detector';
import { injectBadge, autoFillForm } from './common/form-filler';

let currentUrl = '';

function extractJobData(): DetectedJob | null {
  const title = document.querySelector('.iCIMS_Header h1, .header-text h1, h1.job-title')?.textContent?.trim() || '';
  const company = document.querySelector('.iCIMS_Header .company-name, .header-text .company')?.textContent?.trim() || '';
  const location = document.querySelector('.iCIMS_Header .location, .header-text .location')?.textContent?.trim() || '';

  if (!title) return null;

  // Extract company from URL
  const urlMatch = window.location.href.match(/https?:\/\/([^.]+)\.icims\.com/);
  const companyFromUrl = urlMatch?.[1] || '';

  return {
    title,
    company: company || companyFromUrl,
    location,
    url: window.location.href,
    source: 'icims',
  };
}

async function handleApply(job: DetectedJob): Promise<void> {
  const filled = await autoFillForm();

  await syncAppliedJob({
    ...job,
    applicationMethod: 'extension_queue',
    atsType: 'icims',
  });
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

console.log('[3BOX AI] iCIMS content script loaded');
