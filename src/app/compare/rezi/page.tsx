import type { Metadata } from 'next';
import StructuredData, {
  breadcrumbSchema,
  faqPageSchema,
  comparisonPageSchema,
} from '@/components/seo/StructuredData';
import ComparePageClient, { type ComparisonData } from '../ComparePageClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://3box.ai';

export const metadata: Metadata = {
  title: '3BOX AI vs Rezi - The Better Rezi Alternative (2026)',
  description:
    'Looking for a Rezi alternative? 3BOX AI offers AI career coaching, salary estimator, skills assessment, job matching, and portfolio builder that Rezi lacks. Compare AI resume builders side by side.',
  keywords:
    'Rezi alternative, Rezi vs Kickresume, 3BOX AI vs Rezi, Rezi AI resume builder alternative, best AI resume builder 2026, Rezi competitor, Rezi pricing alternative',
  alternates: {
    canonical: `${SITE_URL}/compare/rezi`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/compare/rezi`,
    title: '3BOX AI vs Rezi - The Better Rezi Alternative',
    description:
      'Career coaching, salary estimator, skills assessment, and job matching that Rezi lacks.',
    siteName: '3BOX AI',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3BOX AI vs Rezi - The Better Alternative',
    description: 'Full career platform vs resume-only tool.',
    creator: '@3boxai',
  },
};

const data: ComparisonData = {
  competitorName: 'Rezi',
  competitorSlug: 'rezi',
  heroTitle: '3BOX AI vs Rezi - The Better Alternative',
  heroSubtitle:
    'Rezi is a focused AI resume builder. 3BOX AI takes you beyond the resume with career coaching, salary insights, skills assessment, job matching, and a portfolio builder, the complete career toolkit.',
  verdict: '3BOX AI is the full career platform that Rezi is not.',
  verdictDetail:
    'Rezi builds strong resumes with its AI writer and ATS optimization. But your career is more than a resume. 3BOX AI adds career coaching, salary estimator, skills assessment, portfolio builder, and AI job matching at $29/mo vs Rezi\'s $29/mo.',
  features: [
    { feature: 'AI Resume Builder', boxAi: true, competitor: true },
    { feature: 'ATS Resume Checker', boxAi: true, competitor: true },
    { feature: 'AI Career Coach', boxAi: true, competitor: false },
    { feature: 'Salary Estimator', boxAi: true, competitor: false },
    { feature: 'Skills Assessment', boxAi: true, competitor: false },
    { feature: 'Portfolio Builder', boxAi: true, competitor: false },
    { feature: 'AI Job Matching', boxAi: true, competitor: false },
    { feature: 'Interview Prep', boxAi: true, competitor: false },
    { feature: 'Cover Letter Builder', boxAi: true, competitor: true },
    { feature: 'AI Content Generation', boxAi: true, competitor: true },
    { feature: 'Multiple Templates', boxAi: true, competitor: true },
    { feature: 'PDF Export', boxAi: true, competitor: true },
  ],
  boxAiPrice: '$29/mo',
  competitorPrice: '$29/mo',
  boxAiEntryPlan: 'Pro at $29/mo with all 6 AI agents and unlimited operations',
  competitorEntryPlan: 'Yes, limited resume builder (1 resume)',
  boxAiRating: '4.8',
  competitorRating: '4.6',
  boxAiReviewCount: '2,847',
  competitorReviewCount: '500+',
  advantages: [
    {
      icon: 'zap',
      title: 'Beyond the Resume',
      description:
        'Rezi stops at the resume. 3BOX AI covers your entire career journey, from skill assessment through coaching to job matching and automated applications.',
    },
    {
      icon: 'dollar',
      title: 'Better Value at $29/mo',
      description:
        '3BOX AI Pro costs $29/mo for 8+ career tools. Rezi charges $29/mo for a resume builder and cover letter tool, significantly less value per dollar.',
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
        '3BOX AI recommends jobs based on your skills and career goals with fit scores and improvement tips. Rezi has no job discovery or matching capabilities.',
    },
  ],
  faqs: [
    {
      question: 'Is 3BOX AI a good Rezi alternative?',
      answer:
        'Yes. 3BOX AI matches Rezi on AI resume building and ATS checking, then adds career coaching, salary estimator, skills assessment, portfolio builder, and job matching, all at a lower price.',
    },
    {
      question: 'How does 3BOX AI\'s resume builder compare to Rezi?',
      answer:
        'Both offer AI-powered resume writing with ATS optimization and multiple templates. 3BOX AI adds job-specific tailoring, keyword optimization against target job descriptions, and context from your skill assessments for more personalized content.',
    },
    {
      question: 'Is 3BOX AI cheaper than Rezi?',
      answer:
        'Yes. 3BOX AI Pro is $29/mo for all features including career coaching, salary tools, and job matching. Rezi Pro is $29/mo for just resume and cover letter building.',
    },
    {
      question: 'Does 3BOX AI have ATS optimization like Rezi?',
      answer:
        'Yes. 3BOX AI includes a full ATS resume checker that analyzes keyword match, formatting, and readability, similar to Rezi. Plus, 3BOX AI gives you a learning path to fill actual skill gaps, not just keyword gaps.',
    },
    {
      question: 'Can Rezi help with career coaching?',
      answer:
        'No. Rezi is focused on resume building and does not offer career coaching, skills assessment, or career transition planning. 3BOX AI provides all of these as part of its AI career coaching feature.',
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
          { name: '3BOX AI vs Rezi', url: `${SITE_URL}/compare/rezi` },
        ])}
      />
      <StructuredData data={faqPageSchema(data.faqs)} />
      <StructuredData
        data={comparisonPageSchema({
          title: '3BOX AI vs Rezi - The Better Rezi Alternative',
          description: metadata.description as string,
          url: `${SITE_URL}/compare/rezi`,
          competitors: ['Rezi'],
        })}
      />
      <ComparePageClient data={data} />
    </>
  );
}
