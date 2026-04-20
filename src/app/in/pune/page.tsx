import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import CityPageClient, { type CityData } from '../CityPageClient';

export const metadata: Metadata = {
  title: 'Jobs in Pune — AI That Applies for You | 3BOX AI',
  description: 'AI finds and applies to jobs in Pune automatically. 18,000+ jobs in IT, automotive, manufacturing, startups. Free plan, 5 applications/week.',
  keywords: ['jobs in Pune', 'Pune jobs AI', 'Hinjewadi jobs', 'IT jobs Pune', 'automotive jobs Pune', 'manufacturing Pune', 'auto apply Pune', 'AI job search Pune'],
  alternates: { canonical: 'https://3box.ai/in/pune' },
  openGraph: {
    title: 'AI That Applies to Pune Jobs for You',
    description: '18K+ jobs in Pune — IT, automotive, manufacturing. AI applies automatically.',
    url: 'https://3box.ai/in/pune',
    type: 'website',
  },
};

const data: CityData = {
  city: 'Pune',
  cityLower: 'pune',
  slug: 'pune',
  tagline: 'Oxford of the East — 18,000+ jobs across Hinjewadi IT park, Chakan automotive belt, and growing startup scene. Let AI apply while you focus on interview prep.',
  heroStats: {
    jobCount: '18,000+',
    companies: 'Infosys, TCS, Bajaj, Tata Motors, Mercedes-Benz',
    avgSalary: '₹8-25 LPA (mid-senior)',
  },
  topCompanies: ['Infosys', 'TCS', 'Wipro', 'Cognizant', 'Tech Mahindra', 'Persistent Systems', 'Bajaj Auto', 'Bajaj Finserv', 'Tata Motors', 'Mercedes-Benz', 'Force Motors', 'Cummins India', 'Mahindra', 'John Deere', 'Kohler', 'Zensar Technologies'],
  topRoles: [
    { title: 'Software Engineer (Java/Python)', salary: '₹7-20 LPA', count: 3800 },
    { title: 'DevOps / SRE', salary: '₹10-25 LPA', count: 1400 },
    { title: 'Automotive Design / Mechanical', salary: '₹6-20 LPA', count: 1600 },
    { title: 'Full Stack Developer', salary: '₹7-18 LPA', count: 1900 },
    { title: 'Data Analyst', salary: '₹7-20 LPA', count: 1300 },
    { title: 'Quality Engineer', salary: '₹5-16 LPA', count: 1100 },
    { title: 'SAP / Oracle Consultant', salary: '₹10-22 LPA', count: 900 },
    { title: 'Embedded Engineer', salary: '₹8-22 LPA', count: 1200 },
    { title: 'Manufacturing Engineer', salary: '₹5-15 LPA', count: 1400 },
  ],
  keySectors: ['Information Technology', 'Automotive Manufacturing', 'Mechanical Engineering', 'Education & Research', 'Startups (SaaS)', 'BPO / KPO', 'Defense', 'Pharma'],
  faqs: [
    { question: 'What are the top tech areas in Pune?', answer: 'Hinjewadi Phase 1-3 (Infosys, TCS, Cognizant, Wipro — largest IT park in India), Kharadi / EON IT Park (Zensar, Allstate, Synechron), Aundh / Baner (startups, product companies), Magarpatta (Accenture, Amdocs).' },
    { question: 'Can I find automotive and manufacturing jobs on 3BOX AI?', answer: 'Yes — Pune is India\'s automotive capital. 3BOX AI covers Tata Motors, Bajaj Auto, Mahindra, Force Motors, Mercedes-Benz India, John Deere, Cummins, and tier-1 auto suppliers. Specific resume templates for mechanical / automotive / manufacturing roles.' },
    { question: 'How does Pune salary compare to Bangalore?', answer: 'IT salaries in Pune are 10-15% lower than Bangalore for similar roles, but cost of living is 20-25% lower — so real purchasing power is often higher. Manufacturing/automotive pays similarly or better than Bangalore IT for equivalent experience.' },
    { question: 'What are the biggest employers in Pune?', answer: 'By headcount: Infosys (Hinjewadi, ~25K employees), TCS, Cognizant, Wipro, Bajaj Auto, Tech Mahindra. Product companies: Persistent Systems, Symphony, Mastek. Global captives: Credit Suisse Pune, Barclays, Deutsche Bank.' },
    { question: 'Does 3BOX AI work for fresher / campus roles in Pune?', answer: 'Yes. For entry-level roles at Infosys, TCS, Wipro (BPM), and Cognizant GSC, 3BOX AI generates a fresher-optimized resume matching their ATS patterns. We also cover startup intern and trainee roles.' },
    { question: 'Is 3BOX AI free for Pune job seekers?', answer: 'Yes. Free plan: 5 applications/week. PRO at ₹2,400/mo adds 20 apps/day. MAX ₹4,900/mo adds 50/day plus priority support.' },
  ],
};

export default function PuneCityPage() {
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
