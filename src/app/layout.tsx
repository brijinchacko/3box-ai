import type { Metadata, Viewport } from 'next';
import { SCHEMA_ORG } from '@/lib/seo/keywords';
import Providers from '@/components/providers/Providers';
import PageTracker from '@/components/analytics/PageTracker';

import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://3box.ai';

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '3BOX AI — Free AI Resume Builder, Career Coach & Job Matching Platform',
    template: '%s | 3BOX AI',
  },
  description:
    '3BOX AI is the #1 AI career platform. Free AI resume builder, personalized career coaching, skill assessment, adaptive learning paths, and AI-powered job matching. From skill assessment to dream job — powered by AI.',
  keywords: [
    'AI resume builder', 'AI career coach', 'AI job matching', 'free AI career platform',
    'ATS resume builder', 'skill assessment AI', 'career development tool', 'job search automation',
    'AI career copilot', 'personalized career plan', 'AI interview preparation', 'skill gap analysis',
    'AI cover letter generator', 'AI portfolio builder', 'career path recommendation AI',
    'AI resume keyword optimizer', 'adaptive learning path AI', 'AI job search tool 2026',
    'best AI resume builder', 'automated job applications', 'AI career operating system',
    'hire probability AI', 'market readiness score', 'proof of skills AI',
    'AI career transition planner', '3BOX AI', 'OFORO AI',
  ],
  authors: [{ name: 'OFORO AI', url: 'https://oforo.ai' }],
  creator: 'OFORO AI',
  publisher: 'OFORO AI',
  applicationName: '3BOX AI',
  category: 'Career Development',
  referrer: 'strict-origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'en-IN': SITE_URL,
      'en-US': SITE_URL,
      'x-default': SITE_URL,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    title: '3BOX AI — Free AI Resume Builder, Career Coach & Job Matching Platform',
    description: 'The #1 AI career platform. Free AI resume builder, career coaching, skill assessment, and job matching.',
    siteName: '3BOX AI',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: '3BOX AI — AI Career Operating System' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3BOX AI — AI Career Operating System',
    description: 'Free AI resume builder, career coaching, skill assessment & job matching.',
    creator: '@3boxai',
    site: '@3boxai',
    images: [`${SITE_URL}/og-image.png`],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Hreflang alternate links for geo-targeting */}
        <link rel="alternate" hrefLang="en-in" href="https://3box.ai" />
        <link rel="alternate" hrefLang="en-us" href="https://3box.ai" />
        <link rel="alternate" hrefLang="x-default" href="https://3box.ai" />
        {/* Schema.org Organization */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_ORG.organization) }} />
        {/* Schema.org WebSite with SearchAction */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_ORG.website) }} />
        {/* Schema.org SoftwareApplication with pricing + ratings */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_ORG.softwareApplication) }} />
      </head>
      <body className="min-h-screen bg-surface text-white antialiased overflow-x-hidden">
        <Providers>
          <PageTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
