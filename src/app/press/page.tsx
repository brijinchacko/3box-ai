import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { PAGE_SEO, SCHEMA_ORG } from '@/lib/seo/keywords';
import PressPageClient from './PressPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.press);

export default function PressPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(SCHEMA_ORG.breadcrumb([
            { name: 'Home', url: 'https://jobted.ai' },
            { name: 'Press & Media', url: 'https://jobted.ai/press' },
          ])),
        }}
      />
      <PressPageClient />
    </>
  );
}
