/**
 * 3BOX AI Extension — Auth Bridge
 * Runs on 3box.ai to pick up the auth token from the web app
 * and send it to the extension's background service worker.
 */

function checkForToken(): void {
  const token = localStorage.getItem('3box_extension_token');
  if (!token) return;

  // Remove immediately to prevent re-use
  localStorage.removeItem('3box_extension_token');

  // Send to background worker
  chrome.runtime.sendMessage({ type: 'SET_TOKEN', token }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[3BOX Extension] Message failed:', chrome.runtime.lastError.message);
      return;
    }
    if (response && !response.error) {
      console.log('[3BOX Extension] Successfully connected!');
      // Update the page to show success
      const statusEl = document.querySelector('[data-extension-status]');
      if (statusEl) {
        statusEl.textContent = 'Extension connected!';
      }
    } else if (response?.error) {
      console.error('[3BOX Extension] Auth failed:', response.error);
    }
  });
}

// Check immediately
checkForToken();

// Also poll briefly in case the token arrives after page load
let attempts = 0;
const interval = setInterval(() => {
  checkForToken();
  attempts++;
  if (attempts >= 20) {
    clearInterval(interval);
  }
}, 500);

// Listen for custom event from the auth page (backup method)
window.addEventListener('3box-token-ready', () => {
  checkForToken();
});
