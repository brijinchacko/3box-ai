import type { Metadata } from 'next';
import StructuredData, {
  breadcrumbSchema,
  faqPageSchema,
  comparisonPageSchema,
} from '@/components/seo/StructuredData';
import ComparePageClient, { type ComparisonData } from '../ComparePageClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://3box.ai';

export const metadata: Metadata = {
  title: '3BOX AI vs LazyApply — Better AI Auto-Apply (2026)',
  description:
    'LazyApply alternative that actually tailors applications. 3BOX AI uses 6 AI agents to find jobs, customize resumes per role, and submit with quality review. Free plan included.',
  keywords:
    'LazyApply alternative, 3BOX AI vs LazyApply, better than LazyApply, LinkedIn auto apply alternative, Indeed auto apply alternative, AI job application tool',
  alternates: { canonical: `${SITE_URL}/compare/lazyapply` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/compare/lazyapply`,
    title: '3BOX AI vs LazyApply — The Better Alternative',
    description: 'Smarter auto-apply with tailored resumes. Free plan, 5 apps/week.',
    siteName: '3BOX AI',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3BOX AI vs LazyApply — Better Auto-Apply',
    description: 'Tailored applications, quality review, free plan.',
    creator: '@3boxai',
  },
};

const data: ComparisonData = {
  competitorName: 'LazyApply',
  competitorSlug: 'lazyapply',
  heroTitle: '3BOX AI vs LazyApply — The Better Auto-Apply Alternative',
  heroSubtitle:
    "LazyApply fills LinkedIn and Indeed \"Easy Apply\" forms with a single click. 3BOX AI goes further — discovering jobs across 11+ sources, tailoring resume and cover letter per role, and submitting through ATS APIs or email.",
  verdict: '3BOX AI wins on application quality, job source coverage, and free-tier value.',
  verdictDetail:
    "LazyApply solves one problem: clicking Easy Apply buttons faster. 3BOX AI solves the entire pipeline: finding the right jobs, writing tailored applications, submitting them, and following up. LazyApply's one-click resume is the same for every job — 3BOX AI customizes yours per role for 5-10x better response rates.",
  features: [
    { feature: 'AI Job Discovery (11+ sources)', boxAi: true, competitor: 'LinkedIn/Indeed only' },
    { feature: 'Auto-Apply to Jobs', boxAi: true, competitor: true },
    { feature: 'AI Resume Tailoring per Job', boxAi: true, competitor: false },
    { feature: 'AI Cover Letter per Job', boxAi: true, competitor: false },
    { feature: 'Match Score Threshold', boxAi: true, competitor: false },
    { feature: 'Quality Review (Sentinel)', boxAi: true, competitor: false },
    { feature: 'Chrome Extension', boxAi: true, competitor: true },
    { feature: 'Gmail/Outlook Integration', boxAi: true, competitor: false },
    { feature: 'ATS Checker', boxAi: true, competitor: false },
    { feature: 'Interview Prep', boxAi: true, competitor: false },
    { feature: 'Skill Gap Analysis', boxAi: true, competitor: false },
    { feature: 'India Market (Naukri, Foundit)', boxAi: true, competitor: false },
  ],
  boxAiPrice: '$0 (Free)',
  competitorPrice: '$99 one-time',
  boxAiEntryPlan: 'Free plan with 5 auto-applications/week. PRO $29/mo unlocks 20/day.',
  competitorEntryPlan: '$99 one-time for unlimited applications on LinkedIn/Indeed',
  boxAiRating: '',
  competitorRating: '3.9',
  boxAiReviewCount: '',
  competitorReviewCount: '500+',
  advantages: [
    {
      icon: 'zap',
      title: 'Tailored, Not Blast',
      description:
        'LazyApply submits the same resume everywhere. 3BOX AI\'s Forge agent rewrites your resume per job, pulling keywords from the job description for higher match rates.',
    },
    {
      icon: 'trophy',
      title: 'Beyond LinkedIn & Indeed',
      description:
        'LazyApply only works on LinkedIn and Indeed Easy Apply. 3BOX AI covers 11+ sources including Naukri, Foundit, Workday, Greenhouse, Lever, and company ATS portals.',
    },
    {
      icon: 'shield',
      title: 'No Spam Detection Risk',
      description:
        'LazyApply\'s mass-apply approach has gotten users flagged or restricted on LinkedIn. 3BOX AI uses human-like delays (15/hour cap) and personalization to stay under detection thresholds.',
    },
    {
      icon: 'dollar',
      title: 'Real Free Plan',
      description:
        'LazyApply\'s $99 is one-time but you\'re locked to LinkedIn/Indeed only. 3BOX AI\'s free plan applies to 5 real jobs/week across all sources.',
    },
  ],
  faqs: [
    {
      question: 'Is 3BOX AI a good LazyApply alternative?',
      answer:
        'Yes, and a more complete one. LazyApply automates LinkedIn/Indeed Easy Apply clicks. 3BOX AI automates the entire job search: finds matching jobs across 11+ sources, tailors resumes per role, writes cover letters, and applies through ATS APIs or email. Free plan gives you 5 auto-apply actions per week.',
    },
    {
      question: 'Does 3BOX AI tailor the resume per job like LazyApply doesn\'t?',
      answer:
        'Yes. Our Forge agent rewrites your resume for every application — pulling keywords from the job description, reordering skills, and matching tone. LazyApply submits the same resume to every job.',
    },
    {
      question: 'Will 3BOX AI get my LinkedIn account banned like LazyApply risks?',
      answer:
        'Unlikely. 3BOX AI enforces human-like limits (15 applications/hour max, random delays, 5/company/day cap). LazyApply\'s unlimited mass-apply has led to LinkedIn restrictions for some users.',
    },
    {
      question: 'Which is cheaper?',
      answer:
        '3BOX AI free plan applies to 5 jobs/week at no cost — LazyApply requires $99 upfront. For higher volume, 3BOX AI PRO is $29/mo with 20 apps/day across all sources (vs LazyApply\'s LinkedIn/Indeed only).',
    },
    {
      question: 'Does 3BOX AI work for Indian job market?',
      answer:
        'Yes. 3BOX AI integrates with Naukri, TimesJobs, Foundit, Shine, and LinkedIn India. LazyApply has limited Indian board support.',
    },
  ],
};

export default function LazyApplyComparePage() {
  return (
    <>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Compare', url: `${SITE_URL}/compare` },
          { name: '3BOX AI vs LazyApply', url: `${SITE_URL}/compare/lazyapply` },
        ])}
      />
      <StructuredData data={faqPageSchema(data.faqs)} />
      <StructuredData
        data={comparisonPageSchema({
          title: '3BOX AI vs LazyApply — Best Alternative',
          description: metadata.description as string,
          url: `${SITE_URL}/compare/lazyapply`,
          competitors: ['LazyApply'],
        })}
      />
      <ComparePageClient data={data} />
    </>
  );
}
