'use client';

import { SessionProvider } from 'next-auth/react';
import { RegionProvider } from '@/lib/geo/context';
import AnalyticsProvider from './AnalyticsProvider';
import CookieConsent from '@/components/gdpr/CookieConsent';
import ToastProvider from './ToastProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RegionProvider>
        <AnalyticsProvider>
          {children}
          <ToastProvider />
          <CookieConsent />
        </AnalyticsProvider>
      </RegionProvider>
    </SessionProvider>
  );
}
