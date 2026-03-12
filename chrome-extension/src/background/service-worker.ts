/**
 * 3BOX AI Extension — Background Service Worker
 *
 * Handles:
 * - Message routing between popup/content scripts and API
 * - Auth token management
 * - Periodic queue polling
 * - Badge updates
 */

import { setAuthToken, isAuthenticated, refreshAuth, logout, getUserInfo } from './auth';
import { detectJob, syncApplication, getQueuedJobs, getResumeData } from './api-client';

// ─── Message Handler ───────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch((err) => {
    sendResponse({ error: err.message });
  });
  return true; // Keep message channel open for async response
});

async function handleMessage(message: any, sender: chrome.runtime.MessageSender): Promise<any> {
  switch (message.type) {
    // ── Auth ──
    case 'SET_TOKEN':
      return setAuthToken(message.token);

    case 'CHECK_AUTH':
      return { authenticated: await isAuthenticated(), user: await getUserInfo() };

    case 'REFRESH_AUTH':
      return refreshAuth();

    case 'LOGOUT':
      await logout();
      updateBadge('');
      return { success: true };

    // ── Job Detection ──
    case 'DETECT_JOB':
      return detectJob(message.data);

    // ── Apply & Sync ──
    case 'SYNC_APPLICATION':
      return syncApplication(message.data);

    // ── Resume Data ──
    case 'GET_RESUME':
      const cached = await chrome.storage.local.get(['resumeData', 'resumeCachedAt']);
      if (cached.resumeData && cached.resumeCachedAt) {
        const age = Date.now() - Number(cached.resumeCachedAt);
        if (age < 3600000) return cached.resumeData; // Cache for 1 hour
      }
      const fresh = await getResumeData();
      await chrome.storage.local.set({ resumeData: fresh, resumeCachedAt: Date.now() });
      return fresh;

    // ── Queue ──
    case 'GET_QUEUE':
      return getQueuedJobs();

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

// ─── Badge Management ──────────────────────────

function updateBadge(text: string, color: string = '#00d4ff') {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

// ─── Periodic Queue Check ──────────────────────

chrome.alarms.create('check-queue', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'check-queue') return;

  const authed = await isAuthenticated();
  if (!authed) return;

  try {
    const { total } = await getQueuedJobs();
    updateBadge(total > 0 ? String(total) : '');
  } catch {
    // Silent fail
  }
});

// ─── External Message Handler (from 3box.ai web app) ──

chrome.runtime.onMessageExternal?.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_TOKEN' && message.token) {
    setAuthToken(message.token)
      .then((user) => sendResponse({ success: true, user }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

// ─── Install/Update Handler ────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open the 3BOX extension auth page on first install
    chrome.tabs.create({ url: 'https://3box.ai/extension-auth' });
  }
});

console.log('[3BOX AI] Extension service worker loaded');
