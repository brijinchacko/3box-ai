import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { PAGE_SEO, SCHEMA_ORG } from '@/lib/seo/keywords';
import TermsPageClient from './TermsPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.terms);

export default function TermsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(SCHEMA_ORG.breadcrumb([
            { name: 'Home', url: 'https://jobted.ai' },
            { name: 'Terms of Service', url: 'https://jobted.ai/terms' },
          ])),
        }}
      />
      <TermsPageClient />
    </>
  );
}
