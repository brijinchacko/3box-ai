import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import CityPageClient, { type CityData } from '../CityPageClient';

export const metadata: Metadata = {
  title: 'Jobs in Hyderabad — AI That Applies for You | 3BOX AI',
  description: 'AI finds and applies to jobs in Hyderabad automatically. 22,000+ jobs at Microsoft, Amazon, Apple, Google, Deloitte. Free plan, 5 applications/week.',
  keywords: ['jobs in Hyderabad', 'Hyderabad jobs AI', 'auto apply jobs Hyderabad', 'Cyberabad jobs', 'Hitech City jobs', 'Gachibowli jobs', 'AI job search Hyderabad', 'pharma jobs Hyderabad'],
  alternates: { canonical: 'https://3box.ai/in/hyderabad' },
  openGraph: {
    title: 'AI That Applies to Hyderabad Jobs for You',
    description: '22K+ jobs in Hyderabad / Cyberabad. AI applies automatically.',
    url: 'https://3box.ai/in/hyderabad',
    type: 'website',
  },
};

const data: CityData = {
  city: 'Hyderabad',
  cityLower: 'hyderabad',
  slug: 'hyderabad',
  alsoKnownAs: 'Cyberabad',
  tagline: 'Home to HITEC City and Gachibowli — 22,000+ jobs spanning IT, pharma, and biotech. Let AI apply across Microsoft, Apple, Google, Amazon, and Indian majors.',
  heroStats: {
    jobCount: '22,000+',
    companies: 'Microsoft, Amazon, Apple, Google, Deloitte',
    avgSalary: '₹10-30 LPA (tech, mid-senior)',
  },
  topCompanies: ['Microsoft', 'Apple', 'Amazon', 'Google', 'Facebook/Meta', 'Deloitte', 'Accenture', 'Infosys', 'TCS', 'Wipro', 'Cognizant', 'HCL', 'Genpact', 'Dr. Reddy\'s', 'Bharat Biotech', 'Salesforce'],
  topRoles: [
    { title: 'Software Engineer', salary: '₹8-22 LPA', count: 5200 },
    { title: 'Data Engineer / Analyst', salary: '₹10-28 LPA', count: 2400 },
    { title: 'DevOps / SRE', salary: '₹12-30 LPA', count: 1800 },
    { title: 'Cloud Engineer (AWS/Azure)', salary: '₹10-28 LPA', count: 1600 },
    { title: 'Pharma Research Associate', salary: '₹6-18 LPA', count: 1400 },
    { title: 'QA / Test Automation', salary: '₹6-18 LPA', count: 1700 },
    { title: 'SAP Consultant', salary: '₹10-25 LPA', count: 1100 },
    { title: 'Full Stack Developer', salary: '₹7-22 LPA', count: 1900 },
    { title: 'Business Analyst', salary: '₹7-18 LPA', count: 1300 },
  ],
  keySectors: ['Information Technology', 'Pharmaceuticals', 'Biotech', 'Aerospace', 'Consulting', 'FinTech', 'Semiconductors', 'Life Sciences'],
  faqs: [
    { question: 'What are the top tech employers in Hyderabad?', answer: 'Microsoft, Amazon, Apple, Google, Facebook/Meta, Deloitte, Accenture, Infosys, TCS, and Wipro lead employment. HITEC City hosts most large tech campuses; Gachibowli has Microsoft and Apple\'s major dev centers.' },
    { question: 'Is Hyderabad good for pharma jobs?', answer: 'Yes — Hyderabad is India\'s pharma capital with Dr. Reddy\'s, Aurobindo, Bharat Biotech, Divis Labs, and dozens more. ~15% of all Indian pharma exports originate from here. 3BOX AI includes pharma-specific resume templates.' },
    { question: 'How is Hyderabad salary compared to Bangalore?', answer: 'Roughly similar for tech (within 5-10% either way). Cost of living in Hyderabad is 10-15% lower than Bangalore, so real purchasing power is higher for the same CTC.' },
    { question: 'Which areas in Hyderabad have most jobs?', answer: 'HITEC City / Madhapur (Microsoft, Deloitte, Amazon), Gachibowli (Apple, Wipro, Infosys), Financial District (Google, Facebook, ICICI), Kondapur (Capgemini, TCS). Most tech hiring is concentrated in Cyberabad\'s 5-6 km radius.' },
    { question: 'Does 3BOX AI work with Hyderabad-based ATS systems?', answer: 'Yes. Our resumes pass Workday (Microsoft, Apple), Taleo (used by many Indian majors), SuccessFactors (SAP, Deloitte), and proprietary ATS from Infosys, TCS, Wipro, and Dr. Reddy\'s.' },
    { question: 'Is this free for Hyderabad job seekers?', answer: 'Yes. Free plan includes 5 auto-applications per week, resume builder, ATS checker, interview prep. PRO at ₹2,400/mo unlocks 20 apps/day.' },
  ],
};

export default function HyderabadCityPage() {
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
