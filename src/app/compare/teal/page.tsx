import type { Metadata } from 'next';
import StructuredData, {
  breadcrumbSchema,
  faqPageSchema,
  comparisonPageSchema,
} from '@/components/seo/StructuredData';
import ComparePageClient, { type ComparisonData } from '../ComparePageClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://3box.ai';

export const metadata: Metadata = {
  title: '3BOX AI vs Teal - The Better Teal Alternative (2026)',
  description:
    'Looking for a Teal alternative? 3BOX AI offers salary tools, skills assessment, portfolio builder, AI career coaching, and job matching that Teal lacks. Compare features, pricing, and ratings.',
  keywords:
    'Teal alternative, Teal vs Jobscan, 3BOX AI vs Teal, Teal resume builder alternative, Teal HQ competitor, best job tracker alternative, AI career platform vs Teal 2026',
  alternates: {
    canonical: `${SITE_URL}/compare/teal`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/compare/teal`,
    title: '3BOX AI vs Teal - The Better Teal Alternative',
    description:
      'Salary tools, skills assessment, portfolio builder, and AI career coaching that Teal lacks.',
    siteName: '3BOX AI',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3BOX AI vs Teal - The Better Alternative',
    description: 'Skills assessment, salary tools, portfolio builder, and more.',
    creator: '@3boxai',
  },
};

const data: ComparisonData = {
  competitorName: 'Teal',
  competitorSlug: 'teal',
  heroTitle: '3BOX AI vs Teal - The Better Alternative',
  heroSubtitle:
    'Teal offers job tracking and a basic resume builder. 3BOX AI adds salary insights, skills assessment, AI portfolio builder, career coaching, and intelligent job matching, the tools Teal is missing.',
  verdict: '3BOX AI goes deeper where Teal stops.',
  verdictDetail:
    'Teal is great for organizing your job search with its tracker and basic resume tools. But it lacks salary data, skills assessment, career coaching, and a portfolio builder. 3BOX AI fills every gap and offers more at a comparable price.',
  features: [
    { feature: 'AI Resume Builder', boxAi: true, competitor: true },
    { feature: 'ATS Resume Checker', boxAi: true, competitor: 'Basic' },
    { feature: 'AI Career Coach', boxAi: true, competitor: false },
    { feature: 'Salary Estimator', boxAi: true, competitor: false },
    { feature: 'Skills Assessment', boxAi: true, competitor: false },
    { feature: 'Portfolio Builder', boxAi: true, competitor: false },
    { feature: 'AI Job Matching', boxAi: true, competitor: false },
    { feature: 'Interview Prep', boxAi: true, competitor: false },
    { feature: 'Job Tracking', boxAi: true, competitor: true },
    { feature: 'Cover Letter Builder', boxAi: true, competitor: true },
    { feature: 'Chrome Extension', boxAi: 'Coming Soon', competitor: true },
    { feature: 'LinkedIn Integration', boxAi: true, competitor: true },
  ],
  boxAiPrice: '$29/mo',
  competitorPrice: '$29/mo (Pro+)',
  boxAiEntryPlan: 'Pro at $29/mo with all 6 AI agents and unlimited operations',
  competitorEntryPlan: 'Yes, limited resume builder, job tracker',
  boxAiRating: '4.8',
  competitorRating: '4.5',
  boxAiReviewCount: '2,847',
  competitorReviewCount: '900+',
  advantages: [
    {
      icon: 'trophy',
      title: 'Salary Intelligence',
      description:
        '3BOX AI includes a built-in salary estimator with regional data so you can negotiate with confidence. Teal offers no salary tools whatsoever.',
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
      question: 'Is 3BOX AI a good Teal alternative?',
      answer:
        'Yes. 3BOX AI includes everything Teal offers (resume builder, job tracker) plus salary tools, skills assessment, portfolio builder, AI career coaching, and intelligent job matching that Teal does not provide.',
    },
    {
      question: 'Does 3BOX AI have job tracking like Teal?',
      answer:
        'Yes. 3BOX AI includes job tracking and management. But it goes further with AI-powered job matching that recommends roles based on your skills and career goals, plus match scores explaining why each job fits.',
    },
    {
      question: 'How does 3BOX AI compare to Teal on pricing?',
      answer:
        '3BOX AI Pro starts at $29/mo with access to all career tools. Teal Pro+ costs $29/mo and still lacks salary tools, skills assessment, portfolio builder, and career coaching. 3BOX AI offers significantly more value.',
    },
    {
      question: 'Can I import my Teal data to 3BOX AI?',
      answer:
        'You can upload your resume to 3BOX AI and our AI will parse all your experience, skills, and education automatically. 7-day money-back guarantee included.',
    },
    {
      question: 'Is 3BOX AI better for career changers than Teal?',
      answer:
        'Yes. 3BOX AI is particularly strong for career changers because it offers skill gap analysis, adaptive learning paths, career transition planning, and AI coaching, features that Teal does not have.',
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
          { name: '3BOX AI vs Teal', url: `${SITE_URL}/compare/teal` },
        ])}
      />
      <StructuredData data={faqPageSchema(data.faqs)} />
      <StructuredData
        data={comparisonPageSchema({
          title: '3BOX AI vs Teal - The Better Teal Alternative',
          description: metadata.description as string,
          url: `${SITE_URL}/compare/teal`,
          competitors: ['Teal'],
        })}
      />
      <ComparePageClient data={data} />
    </>
  );
}
