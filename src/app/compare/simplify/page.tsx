import type { Metadata } from 'next';
import StructuredData, {
  breadcrumbSchema,
  faqPageSchema,
  comparisonPageSchema,
} from '@/components/seo/StructuredData';
import ComparePageClient, { type ComparisonData } from '../ComparePageClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://3box.ai';

export const metadata: Metadata = {
  title: '3BOX AI vs Simplify — Best Simplify.jobs Alternative (2026)',
  description:
    'Looking for a Simplify.jobs alternative? 3BOX AI auto-applies to jobs with AI agents, builds ATS resumes, and runs interview prep. Free plan includes 5 applications/week. Compare side by side.',
  keywords:
    'Simplify.jobs alternative, 3BOX AI vs Simplify, Simplify alternative, better than Simplify jobs, Simplify competitor, auto apply tool comparison, Chrome extension job apply alternative',
  alternates: { canonical: `${SITE_URL}/compare/simplify` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/compare/simplify`,
    title: '3BOX AI vs Simplify — The Better Simplify.jobs Alternative',
    description: 'AI agents that actually apply for you, not just autofill. Free plan with 5 applications/week.',
    siteName: '3BOX AI',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3BOX AI vs Simplify — Better Auto-Apply Alternative',
    description: 'AI agents that apply automatically. Free plan, 5 apps/week.',
    creator: '@3boxai',
  },
};

const data: ComparisonData = {
  competitorName: 'Simplify',
  competitorSlug: 'simplify',
  heroTitle: '3BOX AI vs Simplify.jobs — The Better Alternative',
  heroSubtitle:
    "Simplify's Chrome extension autofills forms — you still click apply on every job. 3BOX AI runs 6 specialized agents that discover, tailor, apply, and follow up automatically. Free plan includes 5 fully-automated applications every week.",
  verdict: '3BOX AI wins on true automation, breadth, and free-tier value.',
  verdictDetail:
    "Simplify is a form autofill tool — you still have to find, open, and click submit on every job. 3BOX AI's Scout agent finds jobs, Forge tailors your resume per role, Archer sends applications through ATS APIs or email, and Sentinel reviews quality before anything goes out. Full automation from discovery to follow-up.",
  features: [
    { feature: 'AI Job Discovery (11+ sources)', boxAi: true, competitor: false },
    { feature: 'Automated Apply (no click needed)', boxAi: true, competitor: false },
    { feature: 'Chrome Extension Autofill', boxAi: true, competitor: true },
    { feature: 'AI Resume Tailoring per Job', boxAi: true, competitor: false },
    { feature: 'AI Cover Letter per Job', boxAi: true, competitor: 'Basic' },
    { feature: 'Quality Review Before Sending', boxAi: true, competitor: false },
    { feature: 'Gmail/Outlook Integration', boxAi: true, competitor: false },
    { feature: 'Interview Prep', boxAi: true, competitor: false },
    { feature: 'ATS Resume Checker', boxAi: true, competitor: false },
    { feature: 'Skill Gap Analysis', boxAi: true, competitor: false },
    { feature: 'Application Tracking', boxAi: true, competitor: true },
    { feature: 'India Market Support (Naukri, etc.)', boxAi: true, competitor: false },
  ],
  boxAiPrice: '$0 (Free)',
  competitorPrice: '$10/mo',
  boxAiEntryPlan: 'Free plan with 5 auto-applications/week. PRO at $29/mo unlocks 20/day.',
  competitorEntryPlan: 'Free plan with basic autofill; Pro $10/mo',
  boxAiRating: '',
  competitorRating: '4.5',
  boxAiReviewCount: '',
  competitorReviewCount: '8,000+',
  advantages: [
    {
      icon: 'zap',
      title: 'True End-to-End Automation',
      description:
        'Simplify autofills forms on job sites — you still click apply. 3BOX AI finds matching jobs, writes tailored resumes, and submits applications automatically through ATS APIs or email.',
    },
    {
      icon: 'trophy',
      title: 'Free Plan Auto-Applies 5 Jobs/Week',
      description:
        'Simplify\'s free tier is limited to autofill. 3BOX AI free plan actually applies to 5 jobs per week for you — no credit card needed.',
    },
    {
      icon: 'shield',
      title: 'Quality Gate by Sentinel Agent',
      description:
        'Every application is reviewed by our Sentinel agent before it\'s sent. No generic "Dear hiring manager" slop — each application is tailored and quality-checked.',
    },
    {
      icon: 'dollar',
      title: 'All-in-One vs Autofill-Only',
      description:
        'Replace Simplify + Jobscan + Teal + interview prep tools + resume builder with one platform. $29/mo instead of $60+/mo stacked.',
    },
  ],
  faqs: [
    {
      question: 'Is 3BOX AI a good alternative to Simplify.jobs?',
      answer:
        'Yes, and for a different use case. Simplify is a Chrome extension that autofills application forms — you still have to click apply on every job. 3BOX AI is a fully automated career platform: AI finds matching jobs, writes tailored resumes and cover letters, and submits applications for you through APIs or email. Free plan gives you 5 auto-applied jobs per week.',
    },
    {
      question: 'Does 3BOX AI replace Simplify\'s Chrome extension?',
      answer:
        'Yes. 3BOX AI has a Chrome extension (pending Chrome Web Store verification) plus server-side automation. You can autofill like Simplify AND set up fully-automated job applications that run while you sleep.',
    },
    {
      question: 'Is 3BOX AI really free?',
      answer:
        'Yes. Free plan includes AI resume builder, ATS checker, cover letter generator, interview prep, skill gap analysis, and 5 automated job applications per week. No credit card, no trial expiry.',
    },
    {
      question: 'Which is better for tech jobs (FAANG, startups)?',
      answer:
        '3BOX AI — because it integrates with Greenhouse, Lever, Workday, and most ATS systems used by tech companies. Simplify only autofills visible form fields. 3BOX AI submits directly to company APIs and sends personalized cold emails when no API is available.',
    },
    {
      question: 'Does it work in India?',
      answer:
        'Yes. 3BOX AI supports Naukri, TimesJobs, Shine, Foundit, LinkedIn India, and Indian company ATS portals. Simplify has limited Indian job board support.',
    },
    {
      question: 'Can I use both together?',
      answer:
        'You can, but most users replace Simplify once they see 3BOX AI automate the full pipeline. Simplify has good autofill; 3BOX AI has autofill + discovery + tailoring + sending + follow-up.',
    },
  ],
};

export default function SimplifyComparePage() {
  return (
    <>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Compare', url: `${SITE_URL}/compare` },
          { name: '3BOX AI vs Simplify', url: `${SITE_URL}/compare/simplify` },
        ])}
      />
      <StructuredData data={faqPageSchema(data.faqs)} />
      <StructuredData
        data={comparisonPageSchema({
          title: '3BOX AI vs Simplify — Best Alternative',
          description: metadata.description as string,
          url: `${SITE_URL}/compare/simplify`,
          competitors: ['Simplify', 'Simplify.jobs'],
        })}
      />
      <ComparePageClient data={data} />
    </>
  );
}
