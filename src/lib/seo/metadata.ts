import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://3box.ai';
const SITE_NAME = '3BOX AI';

interface PageSEO {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogImage?: string;
  noindex?: boolean;
}

export function generatePageMetadata(page: PageSEO): Metadata {
  const url = `${SITE_URL}${page.canonical}`;
  const ogImage = page.ogImage || `${SITE_URL}/og-image.png`;

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: url,
    },
    robots: page.noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large' as const,
            'max-snippet': -1,
          },
        },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      title: page.title,
      description: page.description,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [ogImage],
      creator: '@3boxai',
      site: '@3boxai',
    },
    other: {
      'application-name': SITE_NAME,
      'apple-mobile-web-app-title': SITE_NAME,
      'msapplication-TileColor': '#0a0a0f',
      'theme-color': '#0a0a0f',
    },
  };
}

// ─── JSON-LD helper for structured data ────────────────
export function jsonLd(data: Record<string, any>): string {
  return JSON.stringify(data);
}
