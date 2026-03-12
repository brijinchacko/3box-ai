import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { PAGE_SEO, SCHEMA_ORG } from '@/lib/seo/keywords';
import LandingPageClient from './LandingPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.home);

export default function LandingPage() {
  const faqData = [
    { question: 'Is there a money-back guarantee?', answer: 'Yes. All paid plans include a 7-day money-back guarantee. If you\'re not satisfied, request a full refund within 7 days of purchase, subject to our usage conditions.' },
    { question: 'Will AI send wrong or spammy applications?', answer: 'No. Each application is individually crafted by Agent Forge with a unique cover letter, tailored resume, and quality-checked by Sentinel before sending.' },
    { question: 'How does the AI actually apply?', answer: 'Archer generates a unique cover letter for each job, then submits through job portals directly or sends a professional cold email to company HR. Every application is tracked in your dashboard.' },
    { question: 'Is my data safe?', answer: 'All data is encrypted in transit and at rest. We never sell or share your information. You can delete your account and all data anytime. GDPR compliant.' },
    { question: 'Do I need to install anything?', answer: 'No. 3BOX AI is entirely browser-based. Sign up and your agents start working immediately.' },
    { question: 'What happens after the free 20 applications?', answer: 'You can track all your applications and responses for free. To get unlimited auto-applications every night, plans start at affordable prices.' },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(SCHEMA_ORG.faqPage(faqData)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(SCHEMA_ORG.breadcrumb([
            { name: 'Home', url: 'https://3box.ai' },
          ])),
        }}
      />
      <LandingPageClient />
    </>
  );
}
