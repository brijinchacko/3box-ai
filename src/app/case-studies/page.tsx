import type { Metadata } from 'next';
import { generatePageMetadata, jsonLd } from '@/lib/seo/metadata';
import { SCHEMA_ORG } from '@/lib/seo/keywords';
import CaseStudiesClient from './CaseStudiesClient';

export const metadata: Metadata = generatePageMetadata({
  title: 'Case Studies — 3BOX AI | Real Career Transformations with AI',
  description:
    'Discover how 3BOX AI helped job seekers across India land dream jobs, switch careers, and grow their salaries. Real stories from real professionals.',
  keywords:
    'AI career success stories, 3BOX AI case studies, AI resume builder results, career transformation India, job search success, AI job placement stories',
  canonical: '/case-studies',
});

export default function CaseStudiesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            SCHEMA_ORG.breadcrumb([
              { name: 'Home', url: 'https://3box.ai' },
              { name: 'Case Studies', url: 'https://3box.ai/case-studies' },
            ]),
          ),
        }}
      />
      <CaseStudiesClient />
    </>
  );
}
