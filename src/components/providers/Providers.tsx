'use client';

import { SessionProvider } from 'next-auth/react';
import { RegionProvider } from '@/lib/geo/context';
import AnalyticsProvider from './AnalyticsProvider';
import CookieConsent from '@/components/gdpr/CookieConsent';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RegionProvider>
        <AnalyticsProvider>
          {children}
          <CookieConsent />
        </AnalyticsProvider>
      </RegionProvider>
    </SessionProvider>
  );
}
