/**
 * StructuredData — Reusable JSON-LD structured data component for SEO.
 *
 * Provides helper factories for common schema types:
 * - Organization
 * - SoftwareApplication
 * - FAQPage
 * - BreadcrumbList
 * - ComparisonPage (custom WebPage with review)
 */

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://3box.ai';

// ─── Generic renderer ──────────────────────────────────
interface StructuredDataProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── Organization Schema ────────────────────────────────
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '3BOX AI',
    alternateName: '3BOX AI by OFORO AI',
    url: SITE_URL,
    logo: `${SITE_URL}/assets/brand/logo.svg`,
    description:
      'AI-powered career operating system — resume builder, career coaching, skill assessment, and job matching.',
    parentOrganization: {
      '@type': 'Organization',
      name: 'OFORO AI',
      url: 'https://oforo.ai',
    },
    sameAs: [
      'https://www.linkedin.com/company/3box-ai/',
      'https://youtube.com/channel/UCt1LnfzqtMRcfSPwAV3J1ZQ/',
      'https://www.facebook.com/61586302726912',
      'https://www.instagram.com/3box.ai',
    ],
  };
}

// ─── SoftwareApplication Schema ─────────────────────────
export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '3BOX AI',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    offers: [
      {
        '@type': 'Offer',
        name: 'Basic',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free AI resume builder with limited assessments and AI credits',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '12',
        priceCurrency: 'USD',
        description:
          'Full AI career toolkit with unlimited resumes, job matching, and interview prep',
      },
      {
        '@type': 'Offer',
        name: 'Ultra',
        price: '49',
        priceCurrency: 'USD',
        description:
          'Maximum automation with auto-apply, advanced analytics, and priority AI',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '2847',
      bestRating: '5',
    },
  };
}

// ─── FAQPage Schema Helper ──────────────────────────────
export function faqPageSchema(
  faqs: { question: string; answer: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// ─── BreadcrumbList Schema Helper ───────────────────────
export function breadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ─── Comparison / Review Page Schema ────────────────────
export function comparisonPageSchema({
  title,
  description,
  url,
  competitors,
}: {
  title: string;
  description: string;
  url: string;
  competitors: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    about: {
      '@type': 'SoftwareApplication',
      name: '3BOX AI',
      applicationCategory: 'BusinessApplication',
    },
    mentions: competitors.map((name) => ({
      '@type': 'SoftwareApplication',
      name,
      applicationCategory: 'BusinessApplication',
    })),
  };
}
