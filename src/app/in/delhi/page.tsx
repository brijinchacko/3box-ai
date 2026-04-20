import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import CityPageClient, { type CityData } from '../CityPageClient';

export const metadata: Metadata = {
  title: 'Jobs in Delhi NCR — AI That Applies for You | 3BOX AI',
  description: 'AI finds and applies to jobs in Delhi, Gurgaon, Noida automatically. 31,000+ jobs in consulting, tech, government, startups. Free plan, 5 applications/week.',
  keywords: ['jobs in Delhi', 'Delhi NCR jobs', 'Gurgaon jobs', 'Noida jobs AI', 'consulting jobs Delhi', 'startup jobs Delhi', 'auto apply Delhi', 'AI job search NCR'],
  alternates: { canonical: 'https://3box.ai/in/delhi' },
  openGraph: {
    title: 'AI That Applies to Delhi NCR Jobs for You',
    description: '31K+ jobs in Delhi, Gurgaon, Noida. AI applies automatically.',
    url: 'https://3box.ai/in/delhi',
    type: 'website',
  },
};

const data: CityData = {
  city: 'Delhi NCR',
  cityLower: 'delhi',
  slug: 'delhi',
  alsoKnownAs: 'Gurgaon / Noida / Delhi',
  tagline: 'The National Capital Region has 31,000+ jobs spanning consulting in Gurgaon, tech in Noida, and government/policy in Delhi. Let AI apply across all three cities.',
  heroStats: {
    jobCount: '31,000+',
    companies: 'McKinsey, Deloitte, HCL, Adobe, Paytm',
    avgSalary: '₹10-32 LPA (mid-senior)',
  },
  topCompanies: ['McKinsey & Company', 'Deloitte', 'BCG', 'EY', 'KPMG', 'HCL Technologies', 'Adobe', 'Paytm', 'Snapdeal', 'Nagarro', 'Genpact', 'American Express', 'Flipkart', 'Google Gurgaon', 'Microsoft Noida', 'Oracle'],
  topRoles: [
    { title: 'Management Consultant', salary: '₹15-45 LPA', count: 1700 },
    { title: 'Software Engineer', salary: '₹8-24 LPA', count: 4800 },
    { title: 'Data Scientist', salary: '₹10-30 LPA', count: 2200 },
    { title: 'Digital Marketing Lead', salary: '₹10-28 LPA', count: 1900 },
    { title: 'Financial Consultant / Analyst', salary: '₹10-28 LPA', count: 2100 },
    { title: 'Product Manager', salary: '₹18-45 LPA', count: 1500 },
    { title: 'Policy / Government Relations', salary: '₹8-24 LPA', count: 900 },
    { title: 'Chartered Accountant', salary: '₹8-22 LPA', count: 1800 },
    { title: 'Tech Lead / Engineering Manager', salary: '₹22-55 LPA', count: 1200 },
  ],
  keySectors: ['Management Consulting', 'Information Technology', 'Government & Policy', 'E-commerce', 'Media & Advertising', 'BPO / KPO', 'FinTech', 'Healthcare'],
  faqs: [
    { question: 'Which city has most jobs — Delhi, Gurgaon, or Noida?', answer: 'Gurgaon has the most white-collar jobs (consulting, MNC HQs) — ~45% of NCR jobs. Noida has 30% (IT services, startups). Delhi proper has 25% (government, media, policy). 3BOX AI scans all three.' },
    { question: 'What salaries can I expect in Delhi NCR?', answer: 'Consulting freshers from top firms: ₹15-28 LPA. Mid-level tech: ₹10-25 LPA. Senior management: ₹25-60 LPA. Compensation in NCR is typically 10-15% higher than Bangalore for consulting/finance, similar for tech.' },
    { question: 'Does 3BOX AI work with consulting firms in Gurgaon?', answer: 'Yes. We have integrations with Workday (used by Deloitte, EY, KPMG), McKinsey\'s proprietary system, and direct email apply for BCG and Bain. Forge agent tailors resumes to consulting conventions.' },
    { question: 'What areas in NCR have most tech jobs?', answer: 'Cyber City / Udyog Vihar Gurgaon (Microsoft, Google, Amex), Cyberhub Gurgaon (startups), Sector 62 Noida (HCL, Oracle), Film City Noida (Adobe, Samsung), Connaught Place Delhi (IBM, consulting).' },
    { question: 'Is 3BOX AI good for startup jobs in Delhi?', answer: 'Yes. NCR has a massive startup ecosystem (Paytm, Zomato, Policybazaar, Oyo, Lenskart, Nykaa, etc.). Our Scout scans startup job boards (AngelList India, Cutshort, Instahyre) alongside Naukri/LinkedIn.' },
    { question: 'Is 3BOX AI free for Delhi / NCR job seekers?', answer: 'Yes. Free plan: 5 auto-applications/week, full tools. PRO ₹2,400/mo: 20/day. MAX ₹4,900/mo: 50/day.' },
  ],
};

export default function DelhiCityPage() {
  return (
    <>
      <JsonLd data={[
        { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: data.faqs.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://3box.ai' },
          { '@type': 'ListItem', position: 2, name: 'India', item: 'https://3box.ai/in' },
          { '@type': 'ListItem', position: 3, name: `Jobs in ${data.city}`, item: `https://3box.ai/in/${data.slug}` },
        ] },
      ]} />
      <CityPageClient data={data} />
    </>
  );
}
