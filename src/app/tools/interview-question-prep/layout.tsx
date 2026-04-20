import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { buildToolSchemas, INTERVIEW_PREP_SCHEMA } from '@/lib/seo/tool-schemas';

export const metadata: Metadata = {
  title: 'Free AI Interview Question Generator — Any Role | 3BOX AI',
  description: 'Generate likely interview questions for any role. AI predicts behavioral, technical, and situational questions. Practice with AI feedback. Free, unlimited.',
  keywords: ['free AI interview prep', 'AI interview questions', 'interview question generator', 'mock interview AI', 'behavioral interview prep', 'technical interview prep', 'interview practice free'],
  alternates: { canonical: 'https://3box.ai/tools/interview-question-prep' },
  openGraph: {
    title: 'Free AI Interview Question Generator — Any Role',
    description: 'Predict likely interview questions and practice with AI feedback. Free for any role.',
    url: 'https://3box.ai/tools/interview-question-prep',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={buildToolSchemas(INTERVIEW_PREP_SCHEMA)} />
      {children}
    </>
  );
}
