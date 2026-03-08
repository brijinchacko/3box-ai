import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { SCHEMA_ORG } from '@/lib/seo/keywords';
import SoftwareEngineerClient from './SoftwareEngineerClient';

export const metadata: Metadata = generatePageMetadata({
  title: 'AI Resume Builder for Software Engineers | ATS-Optimized Tech Resumes | jobTED AI',
  description:
    'Build an ATS-optimized software engineer resume with AI. Tailored for FAANG, startups, and top tech companies. Highlight your technical skills, projects, and impact metrics. Free to start.',
  keywords:
    'AI resume builder for software engineers, software engineer resume, tech resume builder, ATS resume for developers, FAANG resume builder, developer resume template, software developer resume AI, coding resume optimizer, engineering resume tips, programmer resume builder 2026',
  canonical: '/resume/software-engineer',
});

const faqData = [
  {
    question: 'What should a software engineer resume include?',
    answer:
      'A strong software engineer resume should include a concise professional summary, technical skills section (languages, frameworks, tools, cloud platforms), work experience with quantified impact metrics (e.g., "Reduced API latency by 40%"), notable projects with tech stacks used, education, and relevant certifications like AWS or Google Cloud.',
  },
  {
    question: 'How do I pass ATS as a software engineer?',
    answer:
      'To pass ATS filters, include exact keywords from the job description such as specific programming languages, frameworks, and tools. Use standard section headings like "Work Experience" and "Skills." Avoid graphics, tables, and columns. jobTED AI scans your resume against ATS algorithms and suggests missing keywords automatically.',
  },
  {
    question: 'Should I use AI to write my software engineer resume?',
    answer:
      'Yes, AI resume builders like jobTED AI help you structure your experience effectively, suggest impactful bullet points with quantified metrics, and optimize for ATS compatibility. The AI understands tech industry conventions and can tailor your resume for specific roles like frontend, backend, full-stack, DevOps, or ML engineering.',
  },
  {
    question: 'How do I quantify achievements on a software engineer resume?',
    answer:
      'Use specific numbers and percentages: "Improved page load time by 60%," "Architected microservices handling 10M+ requests/day," "Reduced deployment time from 2 hours to 15 minutes with CI/CD pipeline," or "Led team of 5 engineers to deliver product 2 weeks ahead of schedule." jobTED AI suggests metrics based on your experience.',
  },
  {
    question: 'What are the best resume formats for software engineers in 2026?',
    answer:
      'Reverse-chronological format works best for most software engineers. Use a clean, single-column layout with clear section headers. Include a dedicated "Technical Skills" section near the top. For senior roles, add an "Architecture & System Design" section. For career changers, a combination format highlighting transferable skills works well.',
  },
  {
    question: 'How long should a software engineer resume be?',
    answer:
      'For junior to mid-level engineers (0-7 years), keep it to one page. Senior engineers and architects (8+ years) can use two pages if the content is relevant and impactful. Staff and principal engineers may use two pages to cover leadership, mentorship, and system design contributions. Never exceed two pages.',
  },
];

export default function SoftwareEngineerResumePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'jobTED AI Resume Builder for Software Engineers',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description:
              'AI-powered resume builder specifically designed for software engineers. Optimizes resumes for ATS systems used by FAANG and top tech companies.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description: 'Free AI resume builder with ATS optimization for software engineers',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: '1847',
              bestRating: '5',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(SCHEMA_ORG.faqPage(faqData)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            SCHEMA_ORG.breadcrumb([
              { name: 'Home', url: 'https://jobted.ai' },
              { name: 'Resume Builder', url: 'https://jobted.ai/resume' },
              { name: 'Software Engineer', url: 'https://jobted.ai/resume/software-engineer' },
            ])
          ),
        }}
      />
      <SoftwareEngineerClient />
    </>
  );
}
