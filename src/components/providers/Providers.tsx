'use client';

import { SessionProvider } from 'next-auth/react';
import { RegionProvider } from '@/lib/geo/context';
import AnalyticsProvider from './AnalyticsProvider';
import CookieConsent from '@/components/gdpr/CookieConsent';
import ToastProvider from './ToastProvider';
import ThemeProvider from './ThemeProvider';
import DashboardModeProvider from './DashboardModeProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RegionProvider>
        <ThemeProvider>
          <DashboardModeProvider>
            <AnalyticsProvider>
              {children}
              <ToastProvider />
              <CookieConsent />
            </AnalyticsProvider>
          </DashboardModeProvider>
        </ThemeProvider>
      </RegionProvider>
    </SessionProvider>
  );
}
