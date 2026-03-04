'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('nxted_sid');
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('nxted_sid', sid);
  }
  return sid;
}

export default function PageTracker() {
  const pathname = usePathname();
  const startTime = useRef<number>(Date.now());
  const lastPath = useRef<string>('');

  useEffect(() => {
    // Send duration for previous page
    if (lastPath.current && lastPath.current !== pathname) {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      if (duration > 0 && duration < 3600) {
        navigator.sendBeacon(
          '/api/analytics/track',
          JSON.stringify({
            path: lastPath.current,
            referrer: document.referrer || null,
            sessionId: getSessionId(),
            duration,
          })
        );
      }
    }

    // Track new page view
    startTime.current = Date.now();
    lastPath.current = pathname;

    const trackView = async () => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer || null,
            sessionId: getSessionId(),
          }),
        });
      } catch {
        // fail silently
      }
    };

    // Small delay to avoid tracking quick bounces
    const timer = setTimeout(trackView, 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Track duration on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (lastPath.current) {
        const duration = Math.round((Date.now() - startTime.current) / 1000);
        if (duration > 0 && duration < 3600) {
          navigator.sendBeacon(
            '/api/analytics/track',
            JSON.stringify({
              path: lastPath.current,
              sessionId: getSessionId(),
              duration,
            })
          );
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return null;
}
