import type { Metadata } from 'next';
import StructuredData, {
  breadcrumbSchema,
  faqPageSchema,
  comparisonPageSchema,
} from '@/components/seo/StructuredData';
import CompareAllClient from './CompareAllClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jobted.ai';

export const metadata: Metadata = {
  title:
    'Best AI Resume Builder 2026 — jobTED AI vs Jobscan vs Teal vs Rezi vs Kickresume',
  description:
    'Comprehensive comparison of the best AI resume builders in 2026. jobTED AI vs Jobscan vs Teal vs Rezi vs Kickresume vs Careerflow vs Hiration — features, pricing, and ratings compared side by side.',
  keywords:
    'best AI resume builder 2026, AI resume builder comparison, Jobscan vs Teal vs Rezi, AI career platform comparison, best ATS resume builder, Kickresume alternative, Careerflow alternative, Hiration alternative, jobTED AI review',
  alternates: {
    canonical: `${SITE_URL}/compare/all`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/compare/all`,
    title:
      'Best AI Resume Builder 2026 — Full Comparison of 7 Platforms',
    description:
      'jobTED AI vs Jobscan vs Teal vs Rezi vs Kickresume vs Careerflow vs Hiration. 8 features, pricing, and ratings compared.',
    siteName: 'jobTED AI',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best AI Resume Builder 2026 — Full Comparison',
    description:
      '7 platforms, 8 features. See which AI career tool wins.',
    creator: '@jobtedai',
  },
};

const faqs = [
  {
    question: 'What is the best AI resume builder in 2026?',
    answer:
      'jobTED AI is widely considered the best AI resume builder in 2026 because it combines an AI resume writer with ATS optimization, career coaching, salary insights, skills assessment, portfolio building, and job matching — all in one platform starting at $12/mo.',
  },
  {
    question: 'How does jobTED AI compare to Jobscan, Teal, and Rezi?',
    answer:
      'jobTED AI offers the widest feature set of any AI career platform. While Jobscan focuses on ATS scanning ($49.95/mo), Teal on job tracking ($29/mo), and Rezi on resume building ($29/mo), jobTED AI combines all these capabilities plus career coaching, salary estimator, skills assessment, and portfolio builder for just $12/mo.',
  },
  {
    question: 'Which AI career platform has the most features?',
    answer:
      'jobTED AI is the only platform that includes all 8 core career features: AI resume builder, ATS checker, career coaching, salary estimator, skills assessment, portfolio builder, job matching, and interview prep.',
  },
  {
    question: 'Is there a free AI resume builder that includes career coaching?',
    answer:
      'Yes. jobTED AI offers a free plan that includes an AI resume builder, 2 skill assessments, and 50 AI credits per month. The Pro plan at $12/mo unlocks unlimited access to all features including AI career coaching.',
  },
  {
    question: 'What makes jobTED AI different from other AI resume builders?',
    answer:
      'jobTED AI is not just a resume builder — it is a complete AI career operating system. It takes you from skill assessment through personalized learning, resume building, career coaching, salary negotiation, portfolio creation, to job matching and automated applications.',
  },
];

export default function CompareAllPage() {
  return (
    <>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Compare', url: `${SITE_URL}/compare` },
          { name: 'All Competitors', url: `${SITE_URL}/compare/all` },
        ])}
      />
      <StructuredData data={faqPageSchema(faqs)} />
      <StructuredData
        data={comparisonPageSchema({
          title:
            'Best AI Resume Builder 2026 — Full Comparison',
          description: metadata.description as string,
          url: `${SITE_URL}/compare/all`,
          competitors: [
            'Jobscan',
            'Teal',
            'Rezi',
            'Kickresume',
            'Careerflow',
            'Hiration',
          ],
        })}
      />
      <CompareAllClient />
    </>
  );
}
