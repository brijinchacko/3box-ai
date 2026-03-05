import type { Metadata } from 'next';
import StructuredData, {
  breadcrumbSchema,
  faqPageSchema,
  comparisonPageSchema,
} from '@/components/seo/StructuredData';
import ComparePageClient, { type ComparisonData } from '../ComparePageClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nxted.ai';

export const metadata: Metadata = {
  title: 'NXTED AI vs Rezi — The Better Rezi Alternative (2026)',
  description:
    'Looking for a Rezi alternative? NXTED AI offers AI career coaching, salary estimator, skills assessment, job matching, and portfolio builder that Rezi lacks. Compare AI resume builders side by side.',
  keywords:
    'Rezi alternative, Rezi vs Kickresume, NXTED AI vs Rezi, Rezi AI resume builder alternative, best AI resume builder 2026, Rezi competitor, Rezi pricing alternative',
  alternates: {
    canonical: `${SITE_URL}/compare/rezi`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/compare/rezi`,
    title: 'NXTED AI vs Rezi — The Better Rezi Alternative',
    description:
      'Career coaching, salary estimator, skills assessment, and job matching that Rezi lacks.',
    siteName: 'NXTED AI',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NXTED AI vs Rezi — The Better Alternative',
    description: 'Full career platform vs resume-only tool.',
    creator: '@nxtedai',
  },
};

const data: ComparisonData = {
  competitorName: 'Rezi',
  competitorSlug: 'rezi',
  heroTitle: 'NXTED AI vs Rezi — The Better Alternative',
  heroSubtitle:
    'Rezi is a focused AI resume builder. NXTED AI takes you beyond the resume with career coaching, salary insights, skills assessment, job matching, and a portfolio builder — the complete career toolkit.',
  verdict: 'NXTED AI is the full career platform that Rezi is not.',
  verdictDetail:
    'Rezi builds strong resumes with its AI writer and ATS optimization. But your career is more than a resume. NXTED AI adds career coaching, salary estimator, skills assessment, portfolio builder, and AI job matching at $12/mo vs Rezi\'s $29/mo.',
  features: [
    { feature: 'AI Resume Builder', nxted: true, competitor: true },
    { feature: 'ATS Resume Checker', nxted: true, competitor: true },
    { feature: 'AI Career Coach', nxted: true, competitor: false },
    { feature: 'Salary Estimator', nxted: true, competitor: false },
    { feature: 'Skills Assessment', nxted: true, competitor: false },
    { feature: 'Portfolio Builder', nxted: true, competitor: false },
    { feature: 'AI Job Matching', nxted: true, competitor: false },
    { feature: 'Interview Prep', nxted: true, competitor: false },
    { feature: 'Cover Letter Builder', nxted: true, competitor: true },
    { feature: 'AI Content Generation', nxted: true, competitor: true },
    { feature: 'Multiple Templates', nxted: true, competitor: true },
    { feature: 'PDF Export', nxted: true, competitor: true },
  ],
  nxtedPrice: '$12/mo',
  competitorPrice: '$29/mo',
  nxtedFreeTier: 'Yes — AI resume builder, 2 assessments, 50 AI credits',
  competitorFreeTier: 'Yes — limited resume builder (1 resume)',
  nxtedRating: '4.8',
  competitorRating: '4.6',
  nxtedReviewCount: '2,847',
  competitorReviewCount: '500+',
  advantages: [
    {
      icon: 'zap',
      title: 'Beyond the Resume',
      description:
        'Rezi stops at the resume. NXTED AI covers your entire career journey — from skill assessment through coaching to job matching and automated applications.',
    },
    {
      icon: 'dollar',
      title: 'Better Value at $12/mo',
      description:
        'NXTED AI Pro costs $12/mo for 8+ career tools. Rezi charges $29/mo for a resume builder and cover letter tool — significantly less value per dollar.',
    },
    {
      icon: 'trophy',
      title: 'Career Coaching & Salary Data',
      description:
        'Get AI-powered career guidance, skill gap analysis, custom learning paths, and regional salary insights. Rezi offers none of these features.',
    },
    {
      icon: 'star',
      title: 'Smart Job Matching',
      description:
        'NXTED AI recommends jobs based on your skills and career goals with fit scores and improvement tips. Rezi has no job discovery or matching capabilities.',
    },
  ],
  faqs: [
    {
      question: 'Is NXTED AI a good Rezi alternative?',
      answer:
        'Yes. NXTED AI matches Rezi on AI resume building and ATS checking, then adds career coaching, salary estimator, skills assessment, portfolio builder, and job matching — all at a lower price.',
    },
    {
      question: 'How does NXTED AI\'s resume builder compare to Rezi?',
      answer:
        'Both offer AI-powered resume writing with ATS optimization and multiple templates. NXTED AI adds job-specific tailoring, keyword optimization against target job descriptions, and context from your skill assessments for more personalized content.',
    },
    {
      question: 'Is NXTED AI cheaper than Rezi?',
      answer:
        'Yes. NXTED AI Pro is $12/mo for all features including career coaching, salary tools, and job matching. Rezi Pro is $29/mo for just resume and cover letter building.',
    },
    {
      question: 'Does NXTED AI have ATS optimization like Rezi?',
      answer:
        'Yes. NXTED AI includes a full ATS resume checker that analyzes keyword match, formatting, and readability — similar to Rezi. Plus, NXTED AI gives you a learning path to fill actual skill gaps, not just keyword gaps.',
    },
    {
      question: 'Can Rezi help with career coaching?',
      answer:
        'No. Rezi is focused on resume building and does not offer career coaching, skills assessment, or career transition planning. NXTED AI provides all of these as part of its AI career coaching feature.',
    },
  ],
};

export default function ReziComparePage() {
  return (
    <>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Compare', url: `${SITE_URL}/compare` },
          { name: 'NXTED AI vs Rezi', url: `${SITE_URL}/compare/rezi` },
        ])}
      />
      <StructuredData data={faqPageSchema(data.faqs)} />
      <StructuredData
        data={comparisonPageSchema({
          title: 'NXTED AI vs Rezi — The Better Rezi Alternative',
          description: metadata.description as string,
          url: `${SITE_URL}/compare/rezi`,
          competitors: ['Rezi'],
        })}
      />
      <ComparePageClient data={data} />
    </>
  );
}
