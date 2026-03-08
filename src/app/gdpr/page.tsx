import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { PAGE_SEO, SCHEMA_ORG } from '@/lib/seo/keywords';
import GDPRPageClient from './GDPRPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.gdpr);

export default function GDPRPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(SCHEMA_ORG.breadcrumb([
            { name: 'Home', url: 'https://jobted.ai' },
            { name: 'GDPR Compliance', url: 'https://jobted.ai/gdpr' },
          ])),
        }}
      />
      <GDPRPageClient />
    </>
  );
}
