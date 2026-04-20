import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { buildToolSchemas, SKILLS_GAP_SCHEMA } from '@/lib/seo/tool-schemas';

export const metadata: Metadata = {
  title: 'Free Skills Gap Finder — AI Career Plan | 3BOX AI',
  description: 'Discover which skills you need for your target role. AI compares your resume against real job postings and builds a personalized learning plan. Free.',
  keywords: ['skills gap analysis', 'AI career plan', 'skill gap finder', 'career roadmap AI', 'skills for target role', 'learning path AI', 'career development'],
  alternates: { canonical: 'https://3box.ai/tools/skills-gap-finder' },
  openGraph: {
    title: 'Free Skills Gap Finder — AI Career Plan',
    description: 'AI finds the skills you need for your target role. Free career plan.',
    url: 'https://3box.ai/tools/skills-gap-finder',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={buildToolSchemas(SKILLS_GAP_SCHEMA)} />
      {children}
    </>
  );
}
