import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { PAGE_SEO, SCHEMA_ORG } from '@/lib/seo/keywords';
import LandingPageClient from './LandingPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.home);

export default function LandingPage() {
  const faqData = [
    { question: 'What is 3BOX AI?', answer: 'Your personal AI career team. Six specialized agents handle everything — from finding matching jobs to sending applications and prepping you for interviews. Think of it as a career operating system that works around the clock.' },
    { question: 'Will AI send wrong applications?', answer: 'No. You choose your control level: Copilot mode lets you approve every application. Autopilot auto-applies to high-match jobs. Full Agent mode works hands-free. Sentinel reviews every application for quality before sending.' },
    { question: 'Will companies block me?', answer: 'No. Each application is individually crafted — no mass blasts or spam. Sentinel ensures every submission meets quality standards and relevance thresholds.' },
    { question: 'Is my data safe?', answer: 'All data is encrypted in transit and at rest. We never sell or share your information. You can delete your account and all data anytime. We are GDPR compliant.' },
    { question: 'Is it actually free?', answer: 'Yes! The Basic plan is free forever with limited AI credits. Paid plans unlock unlimited agent work, more job sources, and automation features.' },
    { question: 'Do I need to install anything?', answer: 'No. 3BOX AI is entirely browser-based. Sign up and your agents start working immediately.' },
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
