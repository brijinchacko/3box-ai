'use client';

import { SessionProvider } from 'next-auth/react';
import AnalyticsProvider from './AnalyticsProvider';
import CookieConsent from '@/components/gdpr/CookieConsent';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AnalyticsProvider>
        {children}
        <CookieConsent />
      </AnalyticsProvider>
    </SessionProvider>
  );
}
