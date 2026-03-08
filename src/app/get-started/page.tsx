import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { SCHEMA_ORG } from '@/lib/seo/keywords';
import GetStartedClient from './GetStartedClient';

export const metadata: Metadata = generatePageMetadata({
  title: 'Get Started — 3BOX AI | Build Your Career in 2 Minutes',
  description:
    'Tell us about yourself and let 3BOX AI craft your perfect career path. Quick onboarding — no sign-up required to start.',
  keywords:
    'get started 3BOX AI, AI career onboarding, career assessment, AI resume setup, free career tool',
  canonical: '/get-started',
});

export default function GetStartedPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            SCHEMA_ORG.breadcrumb([
              { name: 'Home', url: 'https://3box.ai' },
              { name: 'Get Started', url: 'https://3box.ai/get-started' },
            ]),
          ),
        }}
      />
      <GetStartedClient />
    </>
  );
}
