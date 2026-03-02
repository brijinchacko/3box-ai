import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { PAGE_SEO, SCHEMA_ORG } from '@/lib/seo/keywords';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.about);

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(SCHEMA_ORG.breadcrumb([
            { name: 'Home', url: 'https://nxtedai.com' },
            { name: 'About', url: 'https://nxtedai.com/about' },
          ])),
        }}
      />
      <AboutPageClient />
    </>
  );
}
