import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import CityPageClient, { type CityData } from '../CityPageClient';

export const metadata: Metadata = {
  title: 'Jobs in Bangalore — AI That Applies for You | 3BOX AI',
  description: 'AI finds and applies to jobs in Bangalore automatically. 35,000+ tech jobs at Microsoft, Amazon, Flipkart, Infosys, Google India. Free plan, 5 applications/week.',
  keywords: [
    'jobs in Bangalore',
    'Bangalore jobs AI',
    'auto apply jobs Bangalore',
    'software engineer jobs Bangalore',
    'tech jobs Bangalore',
    'Bengaluru jobs',
    'AI job search Bangalore',
    'Bangalore IT jobs',
    'startup jobs Bangalore',
  ],
  alternates: { canonical: 'https://3box.ai/in/bangalore' },
  openGraph: {
    title: 'AI That Applies to Bangalore Jobs for You',
    description: '35K+ tech jobs across Bangalore. AI applies for you. Free plan.',
    url: 'https://3box.ai/in/bangalore',
    type: 'website',
  },
};

const data: CityData = {
  city: 'Bangalore',
  cityLower: 'bangalore',
  slug: 'bangalore',
  alsoKnownAs: 'Bengaluru',
  tagline: 'Silicon Valley of India. 35,000+ tech jobs across Whitefield, Electronic City, Koramangala, and HSR Layout. Let AI apply while you focus on interview prep.',
  heroStats: {
    jobCount: '35,000+',
    companies: 'Microsoft, Amazon, Flipkart, Infosys, Google India',
    avgSalary: '₹12-35 LPA (tech, mid-senior)',
  },
  topCompanies: ['Microsoft', 'Amazon', 'Google India', 'Flipkart', 'Infosys', 'Wipro', 'TCS', 'Accenture', 'Swiggy', 'Razorpay', 'Zerodha', 'PhonePe', 'Oracle', 'SAP', 'Intel', 'Cisco'],
  topRoles: [
    { title: 'Software Engineer', salary: '₹8-25 LPA', count: 8500 },
    { title: 'Data Scientist / ML Engineer', salary: '₹12-35 LPA', count: 3200 },
    { title: 'DevOps / Cloud Engineer', salary: '₹10-28 LPA', count: 2800 },
    { title: 'Product Manager', salary: '₹18-45 LPA', count: 1900 },
    { title: 'Frontend Engineer (React/Angular)', salary: '₹7-22 LPA', count: 2400 },
    { title: 'Backend Engineer (Java/Python/Go)', salary: '₹8-28 LPA', count: 3100 },
    { title: 'Mobile Engineer (iOS/Android)', salary: '₹9-24 LPA', count: 1500 },
    { title: 'QA / SDET', salary: '₹6-18 LPA', count: 2100 },
    { title: 'Data Engineer', salary: '₹10-30 LPA', count: 1800 },
  ],
  keySectors: ['Information Technology', 'E-commerce', 'FinTech', 'SaaS & Startups', 'EdTech', 'Electronics', 'Biotech', 'Aerospace'],
  faqs: [
    {
      question: 'How many jobs are available in Bangalore right now?',
      answer: 'At any time there are 30,000-40,000 active job openings in Bangalore across all sectors. Tech dominates with ~60%, followed by finance, consulting, and BPO. 3BOX AI scans all major boards (Naukri, LinkedIn, Foundit, Indeed) plus company career pages to find the freshest listings.',
    },
    {
      question: 'Which areas in Bangalore have the most jobs?',
      answer: 'Whitefield (Microsoft, Accenture, tech parks), Electronic City (Infosys, Wipro, HCL), Manyata Tech Park (IBM, Cognizant, Target), Koramangala (Flipkart, Swiggy, startups), Outer Ring Road / Marathahalli (Intel, SAP), and HSR/Sarjapur (product companies).',
    },
    {
      question: 'What is the average salary in Bangalore tech?',
      answer: 'Freshers: ₹3.5-6 LPA. 2-5 years: ₹8-18 LPA. 5-10 years: ₹18-45 LPA. 10+ years: ₹35-80 LPA. Senior principal / staff engineer roles at FAANG / unicorns can exceed ₹1 Cr total comp.',
    },
    {
      question: 'Does 3BOX AI work with Naukri for Bangalore jobs?',
      answer: 'Yes. Our Scout agent scans Naukri, Foundit, LinkedIn India, Indeed India, TimesJobs, Shine, Hirist, and Instahyre for Bangalore-based listings. Archer agent applies through Naukri\'s system and company ATS portals.',
    },
    {
      question: 'Can 3BOX AI apply to jobs at Microsoft or Amazon Bangalore?',
      answer: 'Yes. We integrate with Workday (used by Microsoft, Adobe, Intel) and Amazon\'s hiring system. For companies where direct API apply isn\'t available, we use email apply to the recruiter inbox or Chrome extension autofill.',
    },
    {
      question: 'Is 3BOX AI free for Bangalore job seekers?',
      answer: 'Yes. Free plan includes 5 auto-applications per week, AI resume builder, ATS checker, interview prep, and skill analysis. PRO at ₹2,400/mo (~$29) unlocks 20 applications per day — ideal for active job seekers.',
    },
  ],
};

export default function BangaloreCityPage() {
  return (
    <>
      <JsonLd data={[
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: data.faqs.map(f => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://3box.ai' },
            { '@type': 'ListItem', position: 2, name: 'India', item: 'https://3box.ai/in' },
            { '@type': 'ListItem', position: 3, name: `Jobs in ${data.city}`, item: `https://3box.ai/in/${data.slug}` },
          ],
        },
      ]} />
      <CityPageClient data={data} />
    </>
  );
}
