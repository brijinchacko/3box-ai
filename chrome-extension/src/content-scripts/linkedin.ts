/**
 * LinkedIn Content Script — Detects job pages and handles Easy Apply.
 *
 * Flow:
 * 1. Detect /jobs/view/{id} pages
 * 2. Extract title, company, location from DOM
 * 3. Show match badge
 * 4. On "Auto Apply" → click Easy Apply → fill modal → submit
 * 5. Sync back to 3BOX dashboard
 */

import { checkJobWithBackend, syncAppliedJob, type DetectedJob } from './common/job-detector';
import { autoFillForm, injectBadge, getResumeFormData, setNativeValue } from './common/form-filler';

let currentJobUrl = '';
let isApplying = false;

// ─── Job Detection ─────────────────────────────

function extractJobData(): DetectedJob | null {
  const url = window.location.href;
  if (!url.includes('/jobs/view/')) return null;

  const title = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24')?.textContent?.trim() || '';
  const company = document.querySelector('.job-details-jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name')?.textContent?.trim() || '';
  const location = document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet')?.textContent?.trim() || '';

  if (!title || !company) return null;

  return {
    title,
    company,
    location,
    url,
    source: 'linkedin',
  };
}

// ─── Easy Apply Flow ───────────────────────────

async function handleEasyApply(job: DetectedJob): Promise<void> {
  if (isApplying) return;
  isApplying = true;

  try {
    // Step 1: Click the Easy Apply button
    const easyApplyBtn = document.querySelector(
      '.jobs-apply-button, button[aria-label*="Easy Apply"], .jobs-s-apply button',
    ) as HTMLButtonElement | null;

    if (!easyApplyBtn) {
      showNotification('Easy Apply button not found on this page.', 'error');
      return;
    }

    easyApplyBtn.click();
    await wait(1500);

    // Step 2: Get resume data
    const resumeData = await getResumeFormData();
    if (!resumeData) {
      showNotification('No resume data found. Please update your resume on 3BOX AI.', 'error');
      return;
    }

    // Step 3: Fill each step of the modal
    let maxSteps = 10;
    let submitted = false;

    while (maxSteps > 0 && !submitted) {
      maxSteps--;

      const modal = document.querySelector('.jobs-easy-apply-modal, .artdeco-modal[role="dialog"]');
      if (!modal) break;

      // Fill the current step
      await fillModalStep(modal, resumeData);
      await wait(800);

      // Check for Submit button
      const submitBtn = modal.querySelector(
        'button[aria-label*="Submit"], button[aria-label*="submit"], button.artdeco-button--primary:last-child',
      ) as HTMLButtonElement | null;

      if (submitBtn && submitBtn.textContent?.toLowerCase().includes('submit')) {
        submitBtn.click();
        submitted = true;
        await wait(2000);
        break;
      }

      // Click Next/Review
      const nextBtn = modal.querySelector(
        'button[aria-label*="Continue"], button[aria-label*="Next"], button[aria-label*="Review"]',
      ) as HTMLButtonElement | null;

      if (nextBtn) {
        nextBtn.click();
        await wait(1200);
      } else {
        break;
      }
    }

    if (submitted) {
      // Sync to 3BOX dashboard
      await syncAppliedJob({
        ...job,
        applicationMethod: 'linkedin_easy_apply',
        atsType: 'linkedin',
      });
      showNotification(`Applied to ${job.title} at ${job.company}!`, 'success');
    } else {
      showNotification('Could not complete application. Please review and submit manually.', 'warning');
    }
  } catch (err) {
    console.error('[3BOX] Easy Apply error:', err);
    showNotification('Auto-apply failed. Please try manually.', 'error');
  } finally {
    isApplying = false;
  }
}

async function fillModalStep(
  modal: Element,
  data: Awaited<ReturnType<typeof getResumeFormData>>,
): Promise<void> {
  if (!data) return;

  // Fill common fields in the modal
  const inputs = Array.from(modal.querySelectorAll('input, textarea, select'));

  for (const input of inputs) {
    const el = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const label = el.getAttribute('aria-label')?.toLowerCase() || '';
    const name = el.getAttribute('name')?.toLowerCase() || '';
    const id = el.getAttribute('id')?.toLowerCase() || '';
    const placeholder = el.getAttribute('placeholder')?.toLowerCase() || '';
    const combined = `${label} ${name} ${id} ${placeholder}`;

    if (el.value && el.value.trim()) continue; // Already filled

    if (combined.includes('first') && combined.includes('name')) {
      setNativeValue(el as any, data.firstName);
    } else if (combined.includes('last') && combined.includes('name')) {
      setNativeValue(el as any, data.lastName);
    } else if (combined.includes('email')) {
      setNativeValue(el as any, data.email);
    } else if (combined.includes('phone') || combined.includes('mobile')) {
      setNativeValue(el as any, data.phone);
    } else if (combined.includes('city') || combined.includes('location')) {
      setNativeValue(el as any, data.location);
    } else if (combined.includes('linkedin')) {
      setNativeValue(el as any, data.linkedin || '');
    } else if (combined.includes('website') || combined.includes('portfolio')) {
      setNativeValue(el as any, data.website || '');
    } else if (combined.includes('summary') || combined.includes('cover')) {
      setNativeValue(el as any, data.summary || data.coverLetter || '');
    }
  }
}

// ─── UI Helpers ────────────────────────────────

function showNotification(message: string, type: 'success' | 'error' | 'warning'): void {
  const colors = {
    success: { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.3)', text: '#34d399' },
    error: { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.3)', text: '#f87171' },
    warning: { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
  };
  const c = colors[type];

  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed;top:20px;right:20px;z-index:999999;
    padding:14px 20px;border-radius:12px;max-width:340px;
    background:${c.bg};border:1px solid ${c.border};color:${c.text};
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    font-size:13px;box-shadow:0 4px 20px rgba(0,0,0,0.3);
    animation:slideIn 0.3s ease;
  `;
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Page Observer ─────────────────────────────

async function onPageChange(): Promise<void> {
  const url = window.location.href;
  if (url === currentJobUrl) return;
  currentJobUrl = url;

  const job = extractJobData();
  if (!job) return;

  try {
    const result = await checkJobWithBackend(job);
    injectBadge({
      matchScore: result.matchScore,
      alreadyApplied: result.alreadyApplied,
      status: result.applicationStatus,
      onApplyClick: () => handleEasyApply(job),
    });
  } catch (err) {
    console.warn('[3BOX] Job detection failed:', err);
  }
}

// Observe URL changes (LinkedIn is SPA)
let observer: MutationObserver | null = null;

function startObserving(): void {
  onPageChange();

  // Watch for SPA navigation
  observer = new MutationObserver(() => {
    if (window.location.href !== currentJobUrl) {
      setTimeout(onPageChange, 500);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Check auth and start
chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
  if (response?.authenticated) {
    startObserving();
  }
});

console.log('[3BOX AI] LinkedIn content script loaded');
