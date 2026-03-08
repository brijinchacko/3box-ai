import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { SCHEMA_ORG } from '@/lib/seo/keywords';
import CareerChangerClient from './CareerChangerClient';

export const metadata: Metadata = generatePageMetadata({
  title: 'Resume Builder for Career Changers | Transition Your Career with AI | 3BOX AI',
  description:
    'Build an ATS-optimized resume for your career change. AI identifies your transferable skills, reframes your experience for a new industry, and helps you tell a compelling career pivot story. Free to start.',
  keywords:
    'resume builder for career changers, career change resume, career transition resume builder, transferable skills resume, career pivot resume template, career switch resume AI, mid-career change resume, new career resume builder, industry change resume tips, career transition resume 2026',
  canonical: '/resume/career-changer',
});

const faqData = [
  {
    question: 'How do I write a resume for a career change?',
    answer:
      'Focus on transferable skills rather than job titles. Lead with a strong professional summary explaining your transition. Use a combination resume format that highlights relevant skills and achievements before work history. Reframe past experience using language from your target industry. 3BOX AI automatically identifies transferable skills and suggests how to position them.',
  },
  {
    question: 'What resume format is best for career changers?',
    answer:
      'A combination (functional + chronological) format works best for career changers. Start with a compelling summary, follow with a "Relevant Skills & Achievements" section organized by skill category, then include work history. This format lets you lead with transferable strengths while still providing the chronological detail that ATS systems and recruiters expect.',
  },
  {
    question: 'How do I explain a career change on my resume?',
    answer:
      'Use your professional summary to briefly address the transition and connect the dots. For example: "Operations manager transitioning to data analytics, bringing 8 years of experience optimizing business processes through data-driven decision making." Then let your bullet points demonstrate relevant skills. Avoid apologizing for the switch or over-explaining.',
  },
  {
    question: 'Should I include all my past experience on a career change resume?',
    answer:
      'Only include experience that supports your new direction. Trim irrelevant roles or summarize them briefly. Expand on positions where you used transferable skills. If you were a teacher transitioning to corporate training, emphasize curriculum design, presentation skills, and learner outcomes rather than classroom management details.',
  },
  {
    question: 'How do I pass ATS when changing careers?',
    answer:
      'Mirror the job description language exactly. Even if you have the skill under a different name, use the target industry terminology. Include both your current industry keywords and target industry keywords in your skills section. 3BOX AI cross-references your experience with target job requirements and suggests keyword bridges.',
  },
  {
    question: 'Can AI help with a career change resume?',
    answer:
      'Absolutely. AI resume builders like 3BOX AI are especially powerful for career changers. The AI identifies transferable skills you might overlook, suggests how to reframe your experience for a new industry, generates industry-appropriate bullet points, and optimizes for ATS keywords in your target field. It bridges the gap between what you have done and what you want to do.',
  },
];

export default function CareerChangerResumePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: '3BOX AI Resume Builder for Career Changers',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description:
              'AI-powered resume builder designed for career changers and professionals transitioning to new industries. Identifies transferable skills, reframes experience, and optimizes for target industry ATS systems.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description: 'Free AI resume builder with ATS optimization for career changers',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: '1156',
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
              { name: 'Home', url: 'https://3box.ai' },
              { name: 'Resume Builder', url: 'https://3box.ai/resume' },
              { name: 'Career Changer', url: 'https://3box.ai/resume/career-changer' },
            ])
          ),
        }}
      />
      <CareerChangerClient />
    </>
  );
}
