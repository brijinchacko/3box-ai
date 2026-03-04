'use client';

import { useEffect, type ReactNode } from 'react';

interface AnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Client-side analytics provider.
 *
 * If `NEXT_PUBLIC_POSTHOG_KEY` is set the component will dynamically load the
 * PostHog snippet on mount. When the env var is absent the component simply
 * renders its children without injecting any scripts.
 */
export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    // Avoid double-initialisation if PostHog is already on the page.
    if (typeof window !== 'undefined' && (window as any).posthog) return;

    // PostHog bootstrap snippet (lightweight async loader).
    // See: https://posthog.com/docs/libraries/js#install
    (function () {
      const ph: any = ((window as any).posthog =
        (window as any).posthog || []);

      // Stub queue methods so calls made before the script loads are buffered.
      if (!ph.__loaded) {
        ph.push = function (...args: any[]) {
          ph.push.apply(ph, args);
        } as any;
        ph.__loaded = true;

        const methods = [
          'capture',
          'identify',
          'alias',
          'people.set',
          'people.set_once',
          'people.unset',
          'people.increment',
          'people.append',
          'people.union',
          'people.track_charge',
          'people.clear_charges',
          'people.delete_user',
          'register',
          'register_once',
          'unregister',
          'opt_out_capturing',
          'opt_in_capturing',
          'has_opted_out_capturing',
          'has_opted_in_capturing',
          'clear_opt_in_out_capturing',
          'reset',
          'get_distinct_id',
          'getFeatureFlag',
          'reloadFeatureFlags',
          'isFeatureEnabled',
          'group',
          'get_property',
        ];

        for (const method of methods) {
          // eslint-disable-next-line @typescript-eslint/no-loop-func
          (ph as any)[method] = function (...args: any[]) {
            const call = [method, ...args];
            ph.push(call);
          };
        }

        // Load the remote script.
        const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = `${host}/static/array.js`;

        script.onload = () => {
          (window as any).posthog.init(key, {
            api_host: host,
            capture_pageview: true,
            capture_pageleave: true,
          });
        };

        const first = document.getElementsByTagName('script')[0];
        first?.parentNode?.insertBefore(script, first);
      }
    })();
  }, []);

  return <>{children}</>;
}
