import type { Metadata } from 'next';
import StructuredData, {
  breadcrumbSchema,
  faqPageSchema,
  comparisonPageSchema,
} from '@/components/seo/StructuredData';
import ComparePageClient, { type ComparisonData } from '../ComparePageClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://3box.ai';

export const metadata: Metadata = {
  title: '3BOX AI vs Jobscan — The Better Jobscan Alternative (2026)',
  description:
    'Looking for a Jobscan alternative? 3BOX AI offers AI resume builder, ATS checker, career coaching, salary estimator, and job matching — all-in-one at $12/mo vs Jobscan $49.95/mo. Compare features side by side.',
  keywords:
    'Jobscan alternative, 3BOX AI vs Jobscan, Jobscan competitor, best ATS resume checker, AI resume builder vs Jobscan, Jobscan pricing alternative, cheaper Jobscan alternative 2026',
  alternates: {
    canonical: `${SITE_URL}/compare/jobscan`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/compare/jobscan`,
    title: '3BOX AI vs Jobscan — The Better Jobscan Alternative',
    description:
      'All-in-one AI career platform at $12/mo vs Jobscan $49.95/mo. Resume builder, ATS checker, career coaching, and more.',
    siteName: '3BOX AI',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3BOX AI vs Jobscan — The Better Alternative',
    description: 'All-in-one AI career platform at $12/mo vs Jobscan $49.95/mo.',
    creator: '@3boxai',
  },
};

const data: ComparisonData = {
  competitorName: 'Jobscan',
  competitorSlug: 'jobscan',
  heroTitle: '3BOX AI vs Jobscan — The Better Alternative',
  heroSubtitle:
    'Jobscan focuses narrowly on ATS keyword matching. 3BOX AI gives you the complete career toolkit — resume building, career coaching, skills assessment, salary insights, and job matching — at a fraction of the price.',
  verdict: '3BOX AI wins on value, features, and price.',
  verdictDetail:
    'While Jobscan is a solid ATS keyword scanner, it only covers one part of the job search. 3BOX AI provides 8+ career tools in a single platform at $12/mo compared to Jobscan\'s $49.95/mo for just resume scanning and LinkedIn optimization.',
  features: [
    { feature: 'AI Resume Builder', boxAi: true, competitor: false },
    { feature: 'ATS Resume Checker', boxAi: true, competitor: true },
    { feature: 'AI Career Coach', boxAi: true, competitor: false },
    { feature: 'Salary Estimator', boxAi: true, competitor: false },
    { feature: 'Skills Assessment', boxAi: true, competitor: false },
    { feature: 'Portfolio Builder', boxAi: true, competitor: false },
    { feature: 'AI Job Matching', boxAi: true, competitor: false },
    { feature: 'Interview Prep', boxAi: true, competitor: false },
    { feature: 'LinkedIn Optimization', boxAi: true, competitor: true },
    { feature: 'Cover Letter Builder', boxAi: true, competitor: 'Basic' },
    { feature: 'Job Tracking', boxAi: true, competitor: true },
    { feature: 'Keyword Optimization', boxAi: true, competitor: true },
  ],
  boxAiPrice: '$12/mo',
  competitorPrice: '$49.95/mo',
  boxAiEntryPlan: 'Starter Duo — $12/mo with 100 AI credits, 7-day money-back guarantee',
  competitorEntryPlan: 'Limited — 5 scans/mo',
  boxAiRating: '4.8',
  competitorRating: '4.4',
  boxAiReviewCount: '2,847',
  competitorReviewCount: '1,200+',
  advantages: [
    {
      icon: 'dollar',
      title: '76% Lower Cost',
      description:
        'Get 8+ career tools at $12/mo. Jobscan charges $49.95/mo for just ATS scanning and keyword optimization — a single tool.',
    },
    {
      icon: 'zap',
      title: 'All-in-One Platform',
      description:
        '3BOX AI replaces Jobscan, a separate resume builder, career coach, salary tool, and more. One login, one subscription, complete coverage.',
    },
    {
      icon: 'trophy',
      title: 'AI Career Coaching',
      description:
        'Get personalized career advice, skill gap analysis, and a custom career roadmap. Jobscan only tells you if your resume matches a job posting.',
    },
    {
      icon: 'shield',
      title: 'Skills-First Approach',
      description:
        '3BOX AI assesses your actual skills, builds a learning path, and connects you to matching jobs. Jobscan focuses only on resume keywords.',
    },
  ],
  faqs: [
    {
      question: 'Is 3BOX AI a good Jobscan alternative?',
      answer:
        'Yes. 3BOX AI offers everything Jobscan does (ATS checking, keyword optimization) plus a full AI resume builder, career coaching, salary estimator, skills assessment, portfolio builder, and job matching — all at $12/mo vs Jobscan\'s $49.95/mo.',
    },
    {
      question: 'Does 3BOX AI have ATS scanning like Jobscan?',
      answer:
        'Yes. 3BOX AI includes a built-in ATS resume checker that analyzes your resume against job descriptions for keyword match, formatting compatibility, and ATS readiness score — similar to Jobscan\'s core feature.',
    },
    {
      question: 'Why is 3BOX AI cheaper than Jobscan?',
      answer:
        '3BOX AI is built as an integrated AI-native platform from the ground up, which allows us to offer more features at a lower cost. Jobscan was built as a standalone ATS checker and charges premium pricing for that single capability.',
    },
    {
      question: 'Can I switch from Jobscan to 3BOX AI easily?',
      answer:
        'Yes. Sign up for 3BOX AI, upload your existing resume, and you\'ll immediately have access to ATS checking plus all the additional career tools. 7-day money-back guarantee included.',
    },
    {
      question: 'Does 3BOX AI work for all industries?',
      answer:
        'Yes. 3BOX AI supports all industries and roles — from tech and finance to healthcare and education. Our AI adapts to your specific career field for tailored resume optimization and career guidance.',
    },
  ],
};

export default function JobscanComparePage() {
  return (
    <>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Compare', url: `${SITE_URL}/compare` },
          { name: '3BOX AI vs Jobscan', url: `${SITE_URL}/compare/jobscan` },
        ])}
      />
      <StructuredData data={faqPageSchema(data.faqs)} />
      <StructuredData
        data={comparisonPageSchema({
          title: '3BOX AI vs Jobscan — The Better Jobscan Alternative',
          description: metadata.description as string,
          url: `${SITE_URL}/compare/jobscan`,
          competitors: ['Jobscan'],
        })}
      />
      <ComparePageClient data={data} />
    </>
  );
}
