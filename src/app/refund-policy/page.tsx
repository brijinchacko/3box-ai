import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { PAGE_SEO, SCHEMA_ORG } from '@/lib/seo/keywords';
import RefundPolicyClient from './RefundPolicyClient';

export const metadata: Metadata = generatePageMetadata(PAGE_SEO.refundPolicy);

export default function RefundPolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(SCHEMA_ORG.breadcrumb([
            { name: 'Home', url: 'https://3box.ai' },
            { name: 'Refund Policy', url: 'https://3box.ai/refund-policy' },
          ])),
        }}
      />
      <RefundPolicyClient />
    </>
  );
}
