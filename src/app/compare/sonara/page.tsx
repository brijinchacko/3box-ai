import type { Metadata } from 'next';
import StructuredData, {
  breadcrumbSchema,
  faqPageSchema,
  comparisonPageSchema,
} from '@/components/seo/StructuredData';
import ComparePageClient, { type ComparisonData } from '../ComparePageClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://3box.ai';

export const metadata: Metadata = {
  title: '3BOX AI vs Sonara — Better AI Auto-Apply Alternative (2026)',
  description:
    'Sonara alternative with real free plan and full career toolkit. 3BOX AI uses 6 AI agents for discovery, tailoring, applying, and interview prep. Compare features and pricing.',
  keywords:
    'Sonara alternative, 3BOX AI vs Sonara, Sonara AI competitor, better than Sonara, AI auto apply Sonara replacement',
  alternates: { canonical: `${SITE_URL}/compare/sonara` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/compare/sonara`,
    title: '3BOX AI vs Sonara — The Better Alternative',
    description: 'Full AI career platform with free plan. Better than Sonara.',
    siteName: '3BOX AI',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3BOX AI vs Sonara — Better Alternative',
    description: 'Full career platform, free plan included.',
    creator: '@3boxai',
  },
};

const data: ComparisonData = {
  competitorName: 'Sonara',
  competitorSlug: 'sonara',
  heroTitle: '3BOX AI vs Sonara — The Better Auto-Apply Alternative',
  heroSubtitle:
    "Sonara applies to jobs for you, but charges $49/mo for a limited tool. 3BOX AI does the same plus ATS checker, interview prep, resume builder, and skill analysis — starting at free.",
  verdict: '3BOX AI wins on breadth, price, and free-tier access.',
  verdictDetail:
    "Sonara is focused purely on auto-apply automation — no resume builder, no interview prep, no skill analysis. 3BOX AI is a complete career platform with 6 specialized AI agents covering every phase of the job search, all with a generous free tier.",
  features: [
    { feature: 'Automated Job Applications', boxAi: true, competitor: true },
    { feature: 'AI Resume Tailoring per Job', boxAi: true, competitor: 'Basic' },
    { feature: 'AI Cover Letter per Job', boxAi: true, competitor: true },
    { feature: 'AI Resume Builder', boxAi: true, competitor: false },
    { feature: 'ATS Resume Checker', boxAi: true, competitor: false },
    { feature: 'Interview Prep', boxAi: true, competitor: false },
    { feature: 'Skill Gap Analysis', boxAi: true, competitor: false },
    { feature: 'LinkedIn Optimization', boxAi: true, competitor: false },
    { feature: 'Portfolio Builder', boxAi: true, competitor: false },
    { feature: 'Chrome Extension', boxAi: true, competitor: false },
    { feature: 'Gmail/Outlook Integration', boxAi: true, competitor: false },
    { feature: 'Free Plan (Real Apps)', boxAi: true, competitor: false },
  ],
  boxAiPrice: '$0 (Free)',
  competitorPrice: '$49/mo',
  boxAiEntryPlan: 'Free with 5 apps/week; PRO $29/mo = 20/day; MAX $59/mo = 50/day',
  competitorEntryPlan: 'No free plan. Pro starts at $49/mo.',
  boxAiRating: '',
  competitorRating: '4.2',
  boxAiReviewCount: '',
  competitorReviewCount: '600+',
  advantages: [
    {
      icon: 'dollar',
      title: '40% Cheaper, 10x More Features',
      description:
        '3BOX AI PRO is $29/mo and includes resume builder, ATS checker, interview prep, skill analysis. Sonara is $49/mo for auto-apply only.',
    },
    {
      icon: 'trophy',
      title: 'True Free Plan',
      description:
        'Sonara has no free plan. 3BOX AI gives you 5 auto-applications/week free — no credit card, no trial expiry.',
    },
    {
      icon: 'zap',
      title: '6 AI Agents vs 1 Tool',
      description:
        'Sonara is a single automation tool. 3BOX AI has Scout (find), Forge (tailor), Archer (apply), Atlas (interview), Sage (learn), Sentinel (quality).',
    },
    {
      icon: 'shield',
      title: 'Quality Review Before Sending',
      description:
        'Our Sentinel agent checks every application for quality, relevance, and tone. Sonara applications go out unchecked.',
    },
  ],
  faqs: [
    {
      question: 'Is 3BOX AI a better Sonara alternative?',
      answer:
        'Yes, for most users. Sonara is $49/mo for just auto-apply. 3BOX AI is $29/mo for auto-apply PLUS resume builder, ATS checker, interview prep, skill analysis, cover letters, and career coaching. Plus a free plan with 5 apps/week.',
    },
    {
      question: 'Does 3BOX AI auto-apply like Sonara?',
      answer:
        'Yes. 3BOX AI\'s Archer agent applies to matching jobs through ATS APIs (Greenhouse, Lever), emails, or Chrome extension form-fills — similar end result to Sonara but with better resume tailoring per job.',
    },
    {
      question: 'Why switch from Sonara to 3BOX AI?',
      answer:
        '(1) Save $20/mo on the equivalent plan. (2) Get resume builder, ATS checker, interview prep bundled in. (3) Try on a free plan before committing. (4) Better India market support.',
    },
    {
      question: 'Can I migrate my Sonara data?',
      answer:
        'Yes. Upload your resume and target roles to 3BOX AI and it auto-creates your search profile. No manual migration needed.',
    },
    {
      question: 'Does 3BOX AI guarantee interview calls like Sonara claims?',
      answer:
        'We don\'t make interview guarantees — no auto-apply tool can. But our quality-first approach (80%+ match threshold, tailored resumes, quality review) delivers measurably higher response rates than mass-apply tools.',
    },
  ],
};

export default function SonaraComparePage() {
  return (
    <>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Compare', url: `${SITE_URL}/compare` },
          { name: '3BOX AI vs Sonara', url: `${SITE_URL}/compare/sonara` },
        ])}
      />
      <StructuredData data={faqPageSchema(data.faqs)} />
      <StructuredData
        data={comparisonPageSchema({
          title: '3BOX AI vs Sonara — Best Alternative',
          description: metadata.description as string,
          url: `${SITE_URL}/compare/sonara`,
          competitors: ['Sonara'],
        })}
      />
      <ComparePageClient data={data} />
    </>
  );
}
