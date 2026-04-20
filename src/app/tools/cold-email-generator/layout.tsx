import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { buildToolSchemas, COLD_EMAIL_SCHEMA } from '@/lib/seo/tool-schemas';

export const metadata: Metadata = {
  title: 'Free AI Cold Email Generator — Get Job Referrals | 3BOX AI',
  description: 'Write cold emails to recruiters, hiring managers, and referrers that actually get replies. AI personalizes every email. Free, unlimited.',
  keywords: ['AI cold email generator', 'recruiter email template', 'hiring manager outreach', 'referral email AI', 'job search cold email', 'LinkedIn outreach AI'],
  alternates: { canonical: 'https://3box.ai/tools/cold-email-generator' },
  openGraph: {
    title: 'Free AI Cold Email Generator — Get Job Referrals',
    description: 'Personalized cold emails to recruiters and hiring managers. Free, unlimited.',
    url: 'https://3box.ai/tools/cold-email-generator',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={buildToolSchemas(COLD_EMAIL_SCHEMA)} />
      {children}
    </>
  );
}
