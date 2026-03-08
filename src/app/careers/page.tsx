import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { PAGE_SEO, SCHEMA_ORG } from '@/lib/seo/keywords';
import CareersPageClient from './CareersPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.careers);

export default function CareersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(SCHEMA_ORG.breadcrumb([
            { name: 'Home', url: 'https://jobted.ai' },
            { name: 'Careers', url: 'https://jobted.ai/careers' },
          ])),
        }}
      />
      <CareersPageClient />
    </>
  );
}
