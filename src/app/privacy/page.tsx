import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { PAGE_SEO, SCHEMA_ORG } from '@/lib/seo/keywords';
import PrivacyPageClient from './PrivacyPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.privacy);

export default function PrivacyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(SCHEMA_ORG.breadcrumb([
            { name: 'Home', url: 'https://jobted.ai' },
            { name: 'Privacy Policy', url: 'https://jobted.ai/privacy' },
          ])),
        }}
      />
      <PrivacyPageClient />
    </>
  );
}
