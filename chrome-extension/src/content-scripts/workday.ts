/**
 * Workday Content Script — Fills Workday application forms
 * using pre-filled data from the extension queue.
 */

import { checkJobWithBackend, syncAppliedJob, type DetectedJob } from './common/job-detector';
import { injectBadge, autoFillForm, getResumeFormData, setNativeValue } from './common/form-filler';

let currentUrl = '';

function extractJobData(): DetectedJob | null {
  // Workday job page selectors
  const title = document.querySelector('[data-automation-id="jobPostingHeader"] h2, .css-1q2dra3, h2[data-automation-id="jobTitle"]')?.textContent?.trim() || '';
  const company = document.querySelector('[data-automation-id="company"], .css-1h469mi')?.textContent?.trim() || '';
  const location = document.querySelector('[data-automation-id="locations"] dd, .css-cygeeu')?.textContent?.trim() || '';

  if (!title) return null;

  // Extract company from URL if not found in DOM
  const urlMatch = window.location.href.match(/https?:\/\/([^.]+)\.myworkdayjobs\.com/);
  const companyFromUrl = urlMatch?.[1] || '';

  return {
    title,
    company: company || companyFromUrl,
    location,
    url: window.location.href,
    source: 'workday',
  };
}

async function handleApply(job: DetectedJob): Promise<void> {
  // First try the standard auto-fill
  const filled = await autoFillForm();

  // Get resume data for Workday-specific fields
  const data = await getResumeFormData();
  if (!data) return;

  // Workday-specific field selectors
  const workdayFields: { selector: string; value: string }[] = [
    { selector: 'input[data-automation-id="legalNameSection_firstName"]', value: data.firstName },
    { selector: 'input[data-automation-id="legalNameSection_lastName"]', value: data.lastName },
    { selector: 'input[data-automation-id="email"]', value: data.email },
    { selector: 'input[data-automation-id="phone-number"]', value: data.phone },
    { selector: 'input[data-automation-id="addressSection_city"]', value: data.location },
  ];

  for (const { selector, value } of workdayFields) {
    const el = document.querySelector(selector) as HTMLInputElement | null;
    if (el && !el.value?.trim()) {
      setNativeValue(el, value);
    }
  }

  await syncAppliedJob({
    ...job,
    applicationMethod: 'extension_queue',
    atsType: 'workday',
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

console.log('[3BOX AI] Workday content script loaded');
