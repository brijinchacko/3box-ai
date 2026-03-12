/**
 * Generic Form Auto-Filler
 * Fills common form fields using resume data from 3BOX.
 */

export interface ResumeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  city?: string;
  state?: string;
  country?: string;
  linkedin?: string;
  website?: string;
  summary?: string;
  coverLetter?: string;
  currentTitle?: string;
  currentCompany?: string;
  skills?: string[];
}

/**
 * Get resume data from background worker.
 */
export async function getResumeFormData(): Promise<ResumeFormData | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_RESUME' }, (response) => {
      if (chrome.runtime.lastError || !response?.resume) {
        resolve(null);
        return;
      }

      const r = response.resume;
      const nameParts = (r.contact?.name || '').split(' ');

      resolve({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: r.contact?.email || '',
        phone: r.contact?.phone || '',
        location: r.contact?.location || '',
        linkedin: r.contact?.linkedin || '',
        website: r.contact?.website || '',
        summary: r.summary || '',
        currentTitle: r.experience?.[0]?.title || '',
        currentCompany: r.experience?.[0]?.company || '',
        skills: r.skills || [],
      });
    });
  });
}

/**
 * Try to fill an input field by various selectors.
 */
export function fillInput(
  selectors: string[],
  value: string,
  container: Element = document.body,
): boolean {
  for (const selector of selectors) {
    const el = container.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null;
    if (el && !el.disabled && !el.readOnly) {
      setNativeValue(el, value);
      return true;
    }
  }
  return false;
}

/**
 * Set value on an input/textarea using native input events
 * so React/Angular/Vue pick up the change.
 */
export function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    'value',
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(el, value);
  } else {
    el.value = value;
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
}

/**
 * Fill common form fields automatically using resume data.
 * Returns the number of fields filled.
 */
export async function autoFillForm(container: Element = document.body): Promise<number> {
  const data = await getResumeFormData();
  if (!data) return 0;

  let filled = 0;

  // First name
  if (fillInput(
    ['input[name*="first" i]', 'input[id*="first" i]', 'input[placeholder*="first" i]', 'input[autocomplete="given-name"]'],
    data.firstName, container,
  )) filled++;

  // Last name
  if (fillInput(
    ['input[name*="last" i]', 'input[id*="last" i]', 'input[placeholder*="last" i]', 'input[autocomplete="family-name"]'],
    data.lastName, container,
  )) filled++;

  // Full name
  if (filled === 0 && fillInput(
    ['input[name*="name" i]:not([name*="last"]):not([name*="first"])', 'input[autocomplete="name"]'],
    `${data.firstName} ${data.lastName}`, container,
  )) filled++;

  // Email
  if (fillInput(
    ['input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]', 'input[autocomplete="email"]'],
    data.email, container,
  )) filled++;

  // Phone
  if (fillInput(
    ['input[type="tel"]', 'input[name*="phone" i]', 'input[id*="phone" i]', 'input[autocomplete="tel"]'],
    data.phone, container,
  )) filled++;

  // Location/City
  if (fillInput(
    ['input[name*="city" i]', 'input[name*="location" i]', 'input[id*="city" i]', 'input[id*="location" i]'],
    data.location, container,
  )) filled++;

  // LinkedIn
  if (data.linkedin && fillInput(
    ['input[name*="linkedin" i]', 'input[id*="linkedin" i]', 'input[placeholder*="linkedin" i]'],
    data.linkedin, container,
  )) filled++;

  // Website/Portfolio
  if (data.website && fillInput(
    ['input[name*="website" i]', 'input[name*="portfolio" i]', 'input[id*="website" i]'],
    data.website, container,
  )) filled++;

  // Cover letter
  if (data.coverLetter && fillInput(
    ['textarea[name*="cover" i]', 'textarea[id*="cover" i]', 'textarea[name*="message" i]'],
    data.coverLetter, container,
  )) filled++;

  return filled;
}

/**
 * Create and inject a floating 3BOX badge on the page.
 */
export function injectBadge(params: {
  matchScore: number;
  alreadyApplied: boolean;
  status?: string | null;
  onApplyClick?: () => void;
}): HTMLElement {
  // Remove existing badge
  document.getElementById('threebox-badge')?.remove();

  const badge = document.createElement('div');
  badge.id = 'threebox-badge';
  badge.innerHTML = `
    <div style="
      position: fixed; bottom: 20px; right: 20px; z-index: 999999;
      background: linear-gradient(135deg, #0a0a1a, #1a1a2e);
      border: 1px solid rgba(0,212,255,0.3);
      border-radius: 16px; padding: 16px; width: 260px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #fff;
    ">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <div style="width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#00d4ff,#a855f7);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;">3B</div>
        <span style="font-weight:600;font-size:13px;">3BOX AI</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:12px;color:rgba(255,255,255,0.5);">Match Score</span>
        <span style="font-size:14px;font-weight:700;color:${params.matchScore >= 70 ? '#34d399' : params.matchScore >= 40 ? '#fbbf24' : '#f87171'};">
          ${params.matchScore}%
        </span>
      </div>
      ${params.alreadyApplied
        ? `<div style="padding:8px 12px;border-radius:8px;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.2);text-align:center;font-size:12px;color:#34d399;">
            Already applied ${params.status ? `(${params.status})` : ''}
          </div>`
        : `<button id="threebox-apply-btn" style="
            width:100%;padding:10px;border:none;border-radius:10px;
            background:linear-gradient(135deg,#00d4ff,#a855f7);
            color:#fff;font-weight:600;font-size:13px;cursor:pointer;
            transition:opacity 0.2s;
          ">
            Auto Apply with 3BOX
          </button>`
      }
      <button id="threebox-close-btn" style="
        position:absolute;top:8px;right:8px;background:none;border:none;
        color:rgba(255,255,255,0.3);cursor:pointer;font-size:16px;padding:4px;
      ">&times;</button>
    </div>
  `;

  document.body.appendChild(badge);

  // Event listeners
  const closeBtn = badge.querySelector('#threebox-close-btn');
  closeBtn?.addEventListener('click', () => badge.remove());

  if (!params.alreadyApplied && params.onApplyClick) {
    const applyBtn = badge.querySelector('#threebox-apply-btn');
    applyBtn?.addEventListener('click', () => params.onApplyClick!());
  }

  return badge;
}
