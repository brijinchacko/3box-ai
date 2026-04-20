import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import CityPageClient, { type CityData } from '../CityPageClient';

export const metadata: Metadata = {
  title: 'Jobs in Mumbai — AI That Applies for You | 3BOX AI',
  description: 'AI finds and applies to jobs in Mumbai automatically. 28,000+ jobs in finance, media, tech, BFSI. Free plan, 5 applications/week. Works with Naukri, LinkedIn India.',
  keywords: ['jobs in Mumbai', 'Mumbai jobs AI', 'BFSI jobs Mumbai', 'Bombay jobs', 'finance jobs Mumbai', 'media jobs Mumbai', 'auto apply Mumbai', 'AI job search Mumbai'],
  alternates: { canonical: 'https://3box.ai/in/mumbai' },
  openGraph: {
    title: 'AI That Applies to Mumbai Jobs for You',
    description: '28K+ jobs in Mumbai finance, media, tech. AI applies automatically.',
    url: 'https://3box.ai/in/mumbai',
    type: 'website',
  },
};

const data: CityData = {
  city: 'Mumbai',
  cityLower: 'mumbai',
  slug: 'mumbai',
  alsoKnownAs: 'Bombay',
  tagline: 'Financial capital with 28,000+ jobs across banking, media, startups, and tech. From Nariman Point to BKC to Powai — let AI handle applications.',
  heroStats: {
    jobCount: '28,000+',
    companies: 'Reliance, TCS, HDFC, Goldman Sachs, JP Morgan',
    avgSalary: '₹10-32 LPA (mid-senior)',
  },
  topCompanies: ['Reliance Industries', 'TCS', 'Infosys', 'HDFC Bank', 'ICICI Bank', 'Kotak Mahindra', 'Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'Axis Bank', 'Nomura', 'Zee Media', 'Star India', 'Dream11', 'Meesho', 'Paytm'],
  topRoles: [
    { title: 'Investment Banking Analyst', salary: '₹12-35 LPA', count: 1800 },
    { title: 'Software Engineer', salary: '₹7-22 LPA', count: 4200 },
    { title: 'Data Analyst / Scientist', salary: '₹8-25 LPA', count: 2400 },
    { title: 'Financial Analyst', salary: '₹8-22 LPA', count: 1900 },
    { title: 'Product Manager', salary: '₹18-45 LPA', count: 1200 },
    { title: 'Risk Analyst', salary: '₹10-28 LPA', count: 1300 },
    { title: 'Digital Marketing Manager', salary: '₹8-24 LPA', count: 1600 },
    { title: 'Media / Content Roles', salary: '₹6-22 LPA', count: 1700 },
    { title: 'Chartered Accountant', salary: '₹8-25 LPA', count: 1400 },
  ],
  keySectors: ['Banking & Financial Services (BFSI)', 'Media & Entertainment', 'Information Technology', 'E-commerce', 'Pharmaceuticals', 'Stock Market', 'Real Estate', 'FinTech'],
  faqs: [
    { question: 'What are the top job sectors in Mumbai?', answer: 'Finance (BFSI) dominates with 35% of white-collar jobs — banking, investment firms, insurance, mutual funds. Media & entertainment (Bollywood, Zee, Star), IT services (TCS, Infosys), e-commerce, and startups follow.' },
    { question: 'Where are the best job hubs in Mumbai?', answer: 'BKC (Bandra Kurla Complex) — finance/banks; Nariman Point — traditional CBD and investment banking; Powai — tech + startups (Hiranandani Gardens has TCS, Accenture); Andheri East — IT parks; Lower Parel — media and new tech.' },
    { question: 'Can 3BOX AI find BFSI / banking jobs in Mumbai?', answer: 'Yes. Our Scout agent pulls from Naukri Banking, LinkedIn finance, and direct ATS integrations with HDFC, ICICI, Goldman Sachs Mumbai, JP Morgan, and Morgan Stanley. Archer submits through their official application systems.' },
    { question: 'Is salary in Mumbai higher than Bangalore?', answer: 'Yes for finance roles (15-25% higher than Bangalore). For pure tech roles, salaries are similar. Mumbai\'s cost of living is significantly higher, so real disposable income may be lower than Bangalore / Hyderabad.' },
    { question: 'Does 3BOX AI help with investment banking applications?', answer: 'Yes — for IB analyst and associate roles at Goldman, JP Morgan, Morgan Stanley Mumbai, our Forge agent optimizes resumes for finance conventions (deal experience sections, quantified impact, CA/MBA credentials) and Archer applies through their custom portals.' },
    { question: 'Is this free for Mumbai job seekers?', answer: 'Yes. Free plan includes 5 applications/week, full tools. PRO at ₹2,400/mo adds 20 apps/day.' },
  ],
};

export default function MumbaiCityPage() {
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
