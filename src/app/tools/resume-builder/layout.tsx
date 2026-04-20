import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { buildToolSchemas, RESUME_BUILDER_SCHEMA } from '@/lib/seo/tool-schemas';

export const metadata: Metadata = {
  title: 'Free AI Resume Builder — ATS-Optimized in Minutes | 3BOX AI',
  description: 'Build an ATS-friendly resume with AI in minutes. Free templates, live ATS score, instant PDF export. Works with LinkedIn, Naukri, Indeed. No signup required.',
  keywords: ['free AI resume builder', 'AI resume builder', 'ATS resume builder', 'resume maker AI', 'professional resume', 'resume templates', 'free resume PDF export', 'AI resume builder India', 'resume builder no signup'],
  alternates: { canonical: 'https://3box.ai/tools/resume-builder' },
  openGraph: {
    title: 'Free AI Resume Builder — ATS-Optimized in Minutes',
    description: 'Create a professional ATS-optimized resume with AI. Free templates, live ATS score, instant PDF.',
    url: 'https://3box.ai/tools/resume-builder',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={buildToolSchemas(RESUME_BUILDER_SCHEMA)} />
      {children}
    </>
  );
}
