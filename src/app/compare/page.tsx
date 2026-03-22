import type { Metadata } from 'next';
import StructuredData, {
  breadcrumbSchema,
} from '@/components/seo/StructuredData';
import CompareHubClient from './CompareHubClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://3box.ai';

export const metadata: Metadata = {
  title: '3BOX AI vs Competitors - See How We Compare',
  description:
    'Compare 3BOX AI with Jobscan, Teal, Rezi, Kickresume, Careerflow, and Hiration. See why 3BOX AI is the best all-in-one AI career platform with resume builder, career coaching, and job matching.',
  keywords:
    '3BOX AI alternatives, Jobscan alternative, Teal alternative, Rezi alternative, best AI resume builder comparison, AI career platform comparison 2026',
  alternates: {
    canonical: `${SITE_URL}/compare`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/compare`,
    title: '3BOX AI vs Competitors - See How We Compare',
    description:
      'Compare 3BOX AI with Jobscan, Teal, Rezi, and more. Feature-by-feature breakdowns, pricing, and ratings.',
    siteName: '3BOX AI',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3BOX AI vs Competitors - See How We Compare',
    description:
      'Compare 3BOX AI with Jobscan, Teal, Rezi, and more.',
    creator: '@3boxai',
  },
};

export default function ComparePage() {
  return (
    <>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Compare', url: `${SITE_URL}/compare` },
        ])}
      />
      <CompareHubClient />
    </>
  );
}
