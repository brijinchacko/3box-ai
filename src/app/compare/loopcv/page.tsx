import type { Metadata } from 'next';
import StructuredData, {
  breadcrumbSchema,
  faqPageSchema,
  comparisonPageSchema,
} from '@/components/seo/StructuredData';
import ComparePageClient, { type ComparisonData } from '../ComparePageClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://3box.ai';

export const metadata: Metadata = {
  title: '3BOX AI vs LoopCV — The Better Auto-Apply Alternative (2026)',
  description:
    'Need a LoopCV alternative? 3BOX AI applies to jobs with 6 specialized AI agents — better targeting, quality review, and a free plan. Compare features, pricing, and automation quality.',
  keywords:
    'LoopCV alternative, 3BOX AI vs LoopCV, LoopCV competitor, better auto apply tool, LoopCV review alternative, job application automation compared',
  alternates: { canonical: `${SITE_URL}/compare/loopcv` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/compare/loopcv`,
    title: '3BOX AI vs LoopCV — The Better Auto-Apply Alternative',
    description: 'Smarter auto-apply with 6 AI agents. Free plan included.',
    siteName: '3BOX AI',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3BOX AI vs LoopCV — Better Auto-Apply',
    description: '6 AI agents, quality review, free plan.',
    creator: '@3boxai',
  },
};

const data: ComparisonData = {
  competitorName: 'LoopCV',
  competitorSlug: 'loopcv',
  heroTitle: '3BOX AI vs LoopCV — The Better Auto-Apply Alternative',
  heroSubtitle:
    "LoopCV blasts your resume to 1000s of jobs with minimal customization. 3BOX AI targets the jobs you'll actually get — tailoring resume and cover letter per application, with a quality review before anything is sent.",
  verdict: '3BOX AI wins on application quality, targeting, and free-tier value.',
  verdictDetail:
    "LoopCV's strength is volume — it can send hundreds of applications per week. But HR data shows low-personalization mass applications have response rates under 2%. 3BOX AI sends fewer applications but with matching scores 80%+, tailored resumes, and personalized cover letters — leading to 5-10x higher reply rates.",
  features: [
    { feature: 'AI Job Discovery (11+ sources)', boxAi: true, competitor: true },
    { feature: 'Auto-Apply to Jobs', boxAi: true, competitor: true },
    { feature: 'AI Resume Tailoring per Job', boxAi: true, competitor: 'Basic' },
    { feature: 'AI Cover Letter per Job', boxAi: true, competitor: 'Template' },
    { feature: 'Match Score Threshold', boxAi: true, competitor: false },
    { feature: 'Quality Review (Sentinel Agent)', boxAi: true, competitor: false },
    { feature: 'Chrome Extension', boxAi: true, competitor: true },
    { feature: 'Gmail/Outlook Integration', boxAi: true, competitor: 'Paid only' },
    { feature: 'Interview Prep', boxAi: true, competitor: false },
    { feature: 'Skill Gap Analysis', boxAi: true, competitor: false },
    { feature: 'Free Plan with Real Applications', boxAi: true, competitor: false },
    { feature: 'India Market (Naukri)', boxAi: true, competitor: 'Limited' },
  ],
  boxAiPrice: '$0 (Free)',
  competitorPrice: '$29+/mo',
  boxAiEntryPlan: 'Free plan with 5 auto-applications/week. PRO $29/mo unlocks 20/day.',
  competitorEntryPlan: 'Free tier limited; paid plans start $29-$99/mo',
  boxAiRating: '',
  competitorRating: '4.1',
  boxAiReviewCount: '',
  competitorReviewCount: '2,500+',
  advantages: [
    {
      icon: 'trophy',
      title: 'Quality Over Quantity',
      description:
        '3BOX AI filters jobs by match score (default 80%+) and tailors every application. LoopCV\'s mass-apply approach has response rates under 2%.',
    },
    {
      icon: 'shield',
      title: 'Sentinel Reviews Every Application',
      description:
        'Our Sentinel agent checks resume quality, cover letter relevance, and company fit before anything is sent. LoopCV has no quality gate.',
    },
    {
      icon: 'zap',
      title: 'True Free Plan',
      description:
        'LoopCV\'s free tier is basically a demo. 3BOX AI\'s free plan applies to 5 real jobs per week, no credit card required.',
    },
    {
      icon: 'dollar',
      title: 'All-in-One Career Platform',
      description:
        'LoopCV does one thing — mass apply. 3BOX AI includes ATS checker, interview prep, skill analysis, career coaching, and LinkedIn optimization in the same plan.',
    },
  ],
  faqs: [
    {
      question: 'Is 3BOX AI better than LoopCV for auto-apply?',
      answer:
        'It depends on your strategy. LoopCV is volume-first (100-1000 applications/week with minimal tailoring). 3BOX AI is quality-first — we apply to fewer jobs per week but each with a tailored resume, custom cover letter, and 80%+ match score. Data shows quality-first approaches get 5-10x higher reply rates.',
    },
    {
      question: 'Does 3BOX AI have a Chrome extension like LoopCV?',
      answer:
        'Yes. The 3BOX AI Chrome extension auto-fills forms on LinkedIn, Indeed, Naukri, Workday, and more. Plus server-side automation for API-based ATS like Greenhouse and Lever.',
    },
    {
      question: 'Can I import my LoopCV setup into 3BOX AI?',
      answer:
        'Yes. Upload your existing resume and target roles — 3BOX AI will auto-create a search profile and start applying. No manual migration needed.',
    },
    {
      question: 'What\'s the difference in pricing?',
      answer:
        '3BOX AI has a real free plan (5 apps/week) and PRO at $29/mo (20 apps/day, ~600/month). LoopCV\'s paid plans start at $29/mo but many users pay $59-99/mo for full features. 3BOX AI includes resume builder, interview prep, and ATS checker in all plans.',
    },
    {
      question: 'Which has better job coverage?',
      answer:
        'Both cover major boards. 3BOX AI adds stronger Indian market support (Naukri, TimesJobs, Foundit) and direct ATS API integration (Greenhouse, Lever, Workday) for higher application success rates.',
    },
  ],
};

export default function LoopCVComparePage() {
  return (
    <>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Compare', url: `${SITE_URL}/compare` },
          { name: '3BOX AI vs LoopCV', url: `${SITE_URL}/compare/loopcv` },
        ])}
      />
      <StructuredData data={faqPageSchema(data.faqs)} />
      <StructuredData
        data={comparisonPageSchema({
          title: '3BOX AI vs LoopCV — Best Alternative',
          description: metadata.description as string,
          url: `${SITE_URL}/compare/loopcv`,
          competitors: ['LoopCV'],
        })}
      />
      <ComparePageClient data={data} />
    </>
  );
}
