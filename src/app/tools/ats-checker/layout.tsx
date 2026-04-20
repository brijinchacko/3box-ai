import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { buildToolSchemas, ATS_CHECKER_SCHEMA } from '@/lib/seo/tool-schemas';

export const metadata: Metadata = {
  title: 'Free ATS Resume Checker — Score & Fix Your Resume | 3BOX AI',
  description: 'Scan your resume against ATS in 30 seconds. Get a score, keyword analysis, and actionable fixes. Free, no signup. Works with LinkedIn, Naukri, Indeed, Workday.',
  keywords: ['ATS checker', 'ATS resume checker', 'free ATS score', 'resume ATS compatibility', 'applicant tracking system', 'ATS-friendly resume', 'resume scanner', 'beat ATS', 'resume parser test'],
  alternates: { canonical: 'https://3box.ai/tools/ats-checker' },
  openGraph: {
    title: 'Free ATS Resume Checker — Score & Fix Your Resume',
    description: 'Scan your resume against ATS in 30 seconds. Free, no signup.',
    url: 'https://3box.ai/tools/ats-checker',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={buildToolSchemas(ATS_CHECKER_SCHEMA)} />
      {children}
    </>
  );
}
