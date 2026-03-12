/**
 * 3BOX AI Extension Popup
 * Shows auth status, queued jobs, and quick actions.
 */

const $ = (id: string) => document.getElementById(id);

// ─── State Management ──────────────────────────

function showState(state: 'loading' | 'auth' | 'dashboard'): void {
  $('loading')?.classList.toggle('hidden', state !== 'loading');
  $('auth')?.classList.toggle('hidden', state !== 'auth');
  $('dashboard')?.classList.toggle('hidden', state !== 'dashboard');
}

// ─── Init ──────────────────────────────────────

async function init(): Promise<void> {
  showState('loading');

  chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, async (response) => {
    if (response?.authenticated && response?.user) {
      showDashboard(response.user);
    } else {
      showState('auth');
    }
  });
}

// ─── Dashboard ─────────────────────────────────

function showDashboard(user: { name: string; plan: string }): void {
  showState('dashboard');

  const nameEl = $('user-name');
  const planEl = $('user-plan');
  if (nameEl) nameEl.textContent = user.name || 'User';
  if (planEl) planEl.textContent = `${user.plan || 'FREE'} Plan`;

  // Load queue
  loadQueue();
}

async function loadQueue(): Promise<void> {
  chrome.runtime.sendMessage({ type: 'GET_QUEUE' }, (response) => {
    const countEl = $('queue-count');
    const listEl = $('queue-list');
    if (!listEl) return;

    if (response?.error || !response?.jobs) {
      if (countEl) countEl.textContent = '0';
      listEl.innerHTML = '<div class="empty-state">No queued jobs</div>';
      return;
    }

    const jobs = response.jobs;
    if (countEl) countEl.textContent = String(jobs.length);

    if (jobs.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No queued jobs</div>';
      return;
    }

    listEl.innerHTML = jobs
      .slice(0, 5)
      .map(
        (job: any) => `
      <div class="queue-item" data-url="${job.jobUrl || '#'}">
        <div class="queue-item-title">${escapeHtml(job.jobTitle)}</div>
        <div class="queue-item-company">${escapeHtml(job.company)} ${job.atsType ? `· ${job.atsType}` : ''}</div>
      </div>
    `,
      )
      .join('');

    // Click to open job page
    listEl.querySelectorAll('.queue-item').forEach((item) => {
      item.addEventListener('click', () => {
        const url = (item as HTMLElement).dataset.url;
        if (url && url !== '#') {
          chrome.tabs.create({ url });
        }
      });
    });
  });
}

// ─── Event Listeners ───────────────────────────

$('sign-in-btn')?.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://3box.ai/extension-auth' });
  window.close();
});

$('logout-btn')?.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'LOGOUT' }, () => {
    showState('auth');
  });
});

// ─── Helpers ───────────────────────────────────

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Start ─────────────────────────────────────

init();
