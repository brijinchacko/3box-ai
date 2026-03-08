import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { PAGE_SEO, SCHEMA_ORG } from '@/lib/seo/keywords';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.contact);

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(SCHEMA_ORG.breadcrumb([
            { name: 'Home', url: 'https://jobted.ai' },
            { name: 'Contact', url: 'https://jobted.ai/contact' },
          ])),
        }}
      />
      <ContactPageClient />
    </>
  );
}
