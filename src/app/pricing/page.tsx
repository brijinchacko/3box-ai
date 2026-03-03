import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { PAGE_SEO, SCHEMA_ORG } from '@/lib/seo/keywords';
import PricingPageClient from './PricingPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.pricing);

const pricingFaqs = [
  { question: 'Can I switch AI career plans anytime?', answer: 'Yes, you can upgrade or downgrade your NXTED AI plan at any time. Changes take effect immediately and billing is prorated.' },
  { question: 'Is there a student discount for AI career tools?', answer: 'Yes! Students get 30% off Pro and Ultra AI career plans with a valid .edu email address.' },
  { question: 'What payment methods does NXTED AI accept?', answer: 'We accept all major credit cards, PayPal, and wire transfer for enterprise AI career platform plans.' },
  { question: 'Is the AI resume builder really free?', answer: 'Yes! Our Basic plan includes a free AI resume builder, 2 skill assessments, 50 AI credits per month, and a personalized career plan at zero cost.' },
];

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(SCHEMA_ORG.faqPage(pricingFaqs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(SCHEMA_ORG.breadcrumb([
            { name: 'Home', url: 'https://nxted.ai' },
            { name: 'Pricing', url: 'https://nxted.ai/pricing' },
          ])),
        }}
      />
      <PricingPageClient />
    </>
  );
}
