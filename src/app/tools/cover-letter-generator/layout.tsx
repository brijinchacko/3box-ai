import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { buildToolSchemas, COVER_LETTER_SCHEMA } from '@/lib/seo/tool-schemas';

export const metadata: Metadata = {
  title: 'Free AI Cover Letter Generator — Tailored in Seconds | 3BOX AI',
  description: 'Generate personalized cover letters for any job in seconds. AI reads the job description and tailors the letter to you. Free, unlimited, no signup.',
  keywords: ['free AI cover letter generator', 'cover letter AI', 'ChatGPT cover letter alternative', 'personalized cover letter', 'AI cover letter writer', 'job application letter', 'cover letter free'],
  alternates: { canonical: 'https://3box.ai/tools/cover-letter-generator' },
  openGraph: {
    title: 'Free AI Cover Letter Generator — Tailored in Seconds',
    description: 'Paste a job, get a tailored cover letter in seconds. Free, unlimited.',
    url: 'https://3box.ai/tools/cover-letter-generator',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={buildToolSchemas(COVER_LETTER_SCHEMA)} />
      {children}
    </>
  );
}
