import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { PAGE_SEO, SCHEMA_ORG } from '@/lib/seo/keywords';
import SecurityPageClient from './SecurityPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.security);

export default function SecurityPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(SCHEMA_ORG.breadcrumb([
            { name: 'Home', url: 'https://nxted.ai' },
            { name: 'Security & Privacy', url: 'https://nxted.ai/security' },
          ])),
        }}
      />
      <SecurityPageClient />
    </>
  );
}
