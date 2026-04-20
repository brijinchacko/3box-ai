import type { Metadata } from 'next';
import StructuredData, {
  breadcrumbSchema,
  faqPageSchema,
  comparisonPageSchema,
} from '@/components/seo/StructuredData';
import ComparePageClient, { type ComparisonData } from '../ComparePageClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://3box.ai';

export const metadata: Metadata = {
  title: '3BOX AI vs Final Round AI — Better Interview Prep (2026)',
  description:
    'Final Round AI alternative with complete career platform. 3BOX AI offers interview prep plus auto-apply, resume builder, and career coaching — all in one at free tier.',
  keywords:
    'Final Round AI alternative, 3BOX AI vs Final Round AI, Final Round AI review, interview AI alternative, AI interview copilot alternative, cheaper Final Round AI',
  alternates: { canonical: `${SITE_URL}/compare/finalroundai` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/compare/finalroundai`,
    title: '3BOX AI vs Final Round AI — Better Alternative',
    description: 'Full career platform + interview prep. Free plan included.',
    siteName: '3BOX AI',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3BOX AI vs Final Round AI',
    description: 'Full career platform. Free plan included.',
    creator: '@3boxai',
  },
};

const data: ComparisonData = {
  competitorName: 'Final Round AI',
  competitorSlug: 'finalroundai',
  heroTitle: '3BOX AI vs Final Round AI — The Complete Career Platform',
  heroSubtitle:
    "Final Round AI is specialized in real-time interview assistance. 3BOX AI covers interview prep plus the rest of your job search — auto-apply, ATS resume builder, skill analysis, cover letters — in a single platform with a free tier.",
  verdict: '3BOX AI wins on breadth and value; Final Round AI wins on live-interview coaching depth.',
  verdictDetail:
    "Final Round AI's live interview copilot is strong (real-time whispered answers, teleprompter-style). 3BOX AI's Atlas agent handles interview prep (mock questions, practice, feedback) alongside the full job search pipeline. If you need ONLY interview help, Final Round AI is specialized. For the complete career toolkit, 3BOX AI is the better all-rounder.",
  features: [
    { feature: 'AI Interview Question Generation', boxAi: true, competitor: true },
    { feature: 'AI Mock Interview Practice', boxAi: true, competitor: true },
    { feature: 'Answer Feedback', boxAi: true, competitor: true },
    { feature: 'Real-Time Live Interview Copilot', boxAi: 'Coming Soon', competitor: true },
    { feature: 'Auto-Apply to Jobs', boxAi: true, competitor: false },
    { feature: 'AI Resume Builder', boxAi: true, competitor: 'Basic' },
    { feature: 'ATS Resume Checker', boxAi: true, competitor: false },
    { feature: 'AI Cover Letter Generator', boxAi: true, competitor: false },
    { feature: 'Skill Gap Analysis', boxAi: true, competitor: false },
    { feature: 'Portfolio Builder', boxAi: true, competitor: false },
    { feature: 'Career Coaching (Cortex)', boxAi: true, competitor: false },
    { feature: 'Free Plan (Full Features)', boxAi: true, competitor: 'Limited' },
  ],
  boxAiPrice: '$0 (Free)',
  competitorPrice: '$148/mo',
  boxAiEntryPlan: 'Free with interview prep, ATS checker, resume builder. PRO $29/mo adds auto-apply (20/day).',
  competitorEntryPlan: 'Free trial; paid plans $148/mo or $348/3mo',
  boxAiRating: '',
  competitorRating: '4.7',
  boxAiReviewCount: '',
  competitorReviewCount: '10,000+',
  advantages: [
    {
      icon: 'dollar',
      title: '80% Cheaper for the Complete Toolkit',
      description:
        'Final Round AI is $148/mo for interview-only features. 3BOX AI is $29/mo for interview prep PLUS auto-apply, resume builder, ATS checker, cover letters, and career coaching.',
    },
    {
      icon: 'trophy',
      title: 'Full Job Search Pipeline',
      description:
        'Final Round AI helps you ace the interview — but you still need other tools to get there. 3BOX AI handles everything: Scout finds jobs, Archer applies, Atlas preps you, Sentinel reviews quality.',
    },
    {
      icon: 'zap',
      title: 'Free Plan Has Real Value',
      description:
        'Final Round AI\'s free tier is a brief trial. 3BOX AI\'s free plan includes unlimited interview question generation, ATS checks, resume builder, and 5 auto-applications/week.',
    },
    {
      icon: 'shield',
      title: 'Not Just for Interview Day',
      description:
        'Final Round AI is most useful during the live interview. 3BOX AI works for the weeks and months of preparation, applying, and iterating before you even get to an interview.',
    },
  ],
  faqs: [
    {
      question: 'Is 3BOX AI a Final Round AI alternative?',
      answer:
        'For most of what Final Round AI does (interview question prep, mock interviews, answer feedback), yes — 3BOX AI\'s Atlas agent does the same for free. Final Round AI\'s unique feature is the real-time live interview copilot that whispers answers during your video interview — 3BOX AI is developing that feature (Coming Soon).',
    },
    {
      question: 'Which is better for interview prep specifically?',
      answer:
        'Final Round AI is more specialized and has better live-interview assistance. 3BOX AI is better-value if you need interview prep AND the rest of the job search toolkit (applying, resume optimization, etc.) in one plan.',
    },
    {
      question: 'Is there a free alternative to Final Round AI?',
      answer:
        'Yes, 3BOX AI\'s free plan includes unlimited interview question generation, mock interview practice, and AI-powered answer feedback. Final Round AI\'s free tier is a short trial.',
    },
    {
      question: 'Does 3BOX AI have a live interview copilot?',
      answer:
        'Real-time in-interview whispering is our next major feature (Coming Soon). For now, 3BOX AI focuses on deep preparation so you don\'t need a copilot. Atlas agent generates likely questions per company/role and coaches your answers with AI feedback.',
    },
    {
      question: 'Can I use both together?',
      answer:
        'Sure. Use 3BOX AI for finding jobs, applying, and prepping for interviews. Use Final Round AI during the actual live interview if you need real-time coaching. Total cost: $29/mo (3BOX AI PRO) + $148/mo (Final Round AI) vs $148/mo for just Final Round AI alone.',
    },
    {
      question: 'Which is cheaper long-term?',
      answer:
        '3BOX AI is significantly cheaper. Our PRO at $29/mo includes everything Final Round AI\'s interview prep does plus the full career platform. If you only need the live interview copilot, Final Round AI is the only option — but it\'s 5x our price.',
    },
  ],
};

export default function FinalRoundAIComparePage() {
  return (
    <>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Compare', url: `${SITE_URL}/compare` },
          { name: '3BOX AI vs Final Round AI', url: `${SITE_URL}/compare/finalroundai` },
        ])}
      />
      <StructuredData data={faqPageSchema(data.faqs)} />
      <StructuredData
        data={comparisonPageSchema({
          title: '3BOX AI vs Final Round AI — Best Alternative',
          description: metadata.description as string,
          url: `${SITE_URL}/compare/finalroundai`,
          competitors: ['Final Round AI'],
        })}
      />
      <ComparePageClient data={data} />
    </>
  );
}
