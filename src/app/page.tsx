import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { PAGE_SEO, SCHEMA_ORG } from '@/lib/seo/keywords';
import LandingPageClient from './LandingPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.home);

export default function LandingPage() {
  const faqData = [
    { question: 'What is NXTED AI?', answer: 'NXTED AI is an AI-powered career operating system that takes you from skill assessment to dream job. It includes an AI resume builder, career coach, skill assessment, adaptive learning paths, and AI-powered job matching.' },
    { question: 'Is the AI resume builder free?', answer: 'Yes! Our Basic plan includes a free AI resume builder with ATS optimization, 2 skill assessments, 50 AI credits per month, and a personalized career plan.' },
    { question: 'How does AI job matching work?', answer: 'Our AI analyzes your skills, experience, and career goals to match you with relevant job openings. Each match includes a fit score and explanation of why you are a good fit.' },
    { question: 'Can NXTED AI automate job applications?', answer: 'Yes, our Ultra plan includes an automation agent that can apply to jobs on your behalf with full compliance controls, audit trails, and smart targeting.' },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(SCHEMA_ORG.faqPage(faqData)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(SCHEMA_ORG.breadcrumb([
            { name: 'Home', url: 'https://nxtedai.com' },
          ])),
        }}
      />
      <LandingPageClient />
    </>
  );
}
