import type { Metadata } from 'next';
import StructuredData, {
  breadcrumbSchema,
  faqPageSchema,
  comparisonPageSchema,
} from '@/components/seo/StructuredData';
import ComparePageClient, { type ComparisonData } from '../ComparePageClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jobted.ai';

export const metadata: Metadata = {
  title: 'jobTED AI vs Teal — The Better Teal Alternative (2026)',
  description:
    'Looking for a Teal alternative? jobTED AI offers salary tools, skills assessment, portfolio builder, AI career coaching, and job matching that Teal lacks. Compare features, pricing, and ratings.',
  keywords:
    'Teal alternative, Teal vs Jobscan, jobTED AI vs Teal, Teal resume builder alternative, Teal HQ competitor, best job tracker alternative, AI career platform vs Teal 2026',
  alternates: {
    canonical: `${SITE_URL}/compare/teal`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/compare/teal`,
    title: 'jobTED AI vs Teal — The Better Teal Alternative',
    description:
      'Salary tools, skills assessment, portfolio builder, and AI career coaching that Teal lacks.',
    siteName: 'jobTED AI',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'jobTED AI vs Teal — The Better Alternative',
    description: 'Skills assessment, salary tools, portfolio builder, and more.',
    creator: '@jobtedai',
  },
};

const data: ComparisonData = {
  competitorName: 'Teal',
  competitorSlug: 'teal',
  heroTitle: 'jobTED AI vs Teal — The Better Alternative',
  heroSubtitle:
    'Teal offers job tracking and a basic resume builder. jobTED AI adds salary insights, skills assessment, AI portfolio builder, career coaching, and intelligent job matching — the tools Teal is missing.',
  verdict: 'jobTED AI goes deeper where Teal stops.',
  verdictDetail:
    'Teal is great for organizing your job search with its tracker and basic resume tools. But it lacks salary data, skills assessment, career coaching, and a portfolio builder. jobTED AI fills every gap and offers more at a comparable price.',
  features: [
    { feature: 'AI Resume Builder', jobted: true, competitor: true },
    { feature: 'ATS Resume Checker', jobted: true, competitor: 'Basic' },
    { feature: 'AI Career Coach', jobted: true, competitor: false },
    { feature: 'Salary Estimator', jobted: true, competitor: false },
    { feature: 'Skills Assessment', jobted: true, competitor: false },
    { feature: 'Portfolio Builder', jobted: true, competitor: false },
    { feature: 'AI Job Matching', jobted: true, competitor: false },
    { feature: 'Interview Prep', jobted: true, competitor: false },
    { feature: 'Job Tracking', jobted: true, competitor: true },
    { feature: 'Cover Letter Builder', jobted: true, competitor: true },
    { feature: 'Chrome Extension', jobted: 'Coming Soon', competitor: true },
    { feature: 'LinkedIn Integration', jobted: true, competitor: true },
  ],
  jobtedPrice: '$12/mo',
  competitorPrice: '$29/mo (Pro+)',
  jobtedFreeTier: 'Yes — AI resume builder, 2 assessments, 50 AI credits',
  competitorFreeTier: 'Yes — limited resume builder, job tracker',
  jobtedRating: '4.8',
  competitorRating: '4.5',
  jobtedReviewCount: '2,847',
  competitorReviewCount: '900+',
  advantages: [
    {
      icon: 'trophy',
      title: 'Salary Intelligence',
      description:
        'jobTED AI includes a built-in salary estimator with regional data so you can negotiate with confidence. Teal offers no salary tools whatsoever.',
    },
    {
      icon: 'zap',
      title: 'Skills Assessment & Learning',
      description:
        'Take AI-powered skill assessments, identify gaps, and follow adaptive learning paths. Teal has no skills evaluation or learning features.',
    },
    {
      icon: 'star',
      title: 'AI Portfolio Builder',
      description:
        'Create a shareable portfolio with AI-verified projects and skill badges. Teal focuses only on resumes and job tracking with no portfolio support.',
    },
    {
      icon: 'shield',
      title: 'AI Career Coaching',
      description:
        'Get personalized career guidance, transition planning, and a custom career roadmap. Teal provides no coaching or mentorship features.',
    },
  ],
  faqs: [
    {
      question: 'Is jobTED AI a good Teal alternative?',
      answer:
        'Yes. jobTED AI includes everything Teal offers (resume builder, job tracker) plus salary tools, skills assessment, portfolio builder, AI career coaching, and intelligent job matching that Teal does not provide.',
    },
    {
      question: 'Does jobTED AI have job tracking like Teal?',
      answer:
        'Yes. jobTED AI includes job tracking and management. But it goes further with AI-powered job matching that recommends roles based on your skills and career goals, plus match scores explaining why each job fits.',
    },
    {
      question: 'How does jobTED AI compare to Teal on pricing?',
      answer:
        'jobTED AI Pro starts at $12/mo with access to all career tools. Teal Pro+ costs $29/mo and still lacks salary tools, skills assessment, portfolio builder, and career coaching. jobTED AI offers significantly more value.',
    },
    {
      question: 'Can I import my Teal data to jobTED AI?',
      answer:
        'You can upload your resume to jobTED AI and our AI will parse all your experience, skills, and education automatically. Sign up free to get started.',
    },
    {
      question: 'Is jobTED AI better for career changers than Teal?',
      answer:
        'Yes. jobTED AI is particularly strong for career changers because it offers skill gap analysis, adaptive learning paths, career transition planning, and AI coaching — features that Teal does not have.',
    },
  ],
};

export default function TealComparePage() {
  return (
    <>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Compare', url: `${SITE_URL}/compare` },
          { name: 'jobTED AI vs Teal', url: `${SITE_URL}/compare/teal` },
        ])}
      />
      <StructuredData data={faqPageSchema(data.faqs)} />
      <StructuredData
        data={comparisonPageSchema({
          title: 'jobTED AI vs Teal — The Better Teal Alternative',
          description: metadata.description as string,
          url: `${SITE_URL}/compare/teal`,
          competitors: ['Teal'],
        })}
      />
      <ComparePageClient data={data} />
    </>
  );
}
