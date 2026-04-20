import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JsonLd from '@/components/seo/JsonLd';
import { ArrowRight, MapPin, Zap, Shield, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Job Search in India — Auto-Apply to Jobs | 3BOX AI',
  description: 'AI finds and applies to jobs in India automatically. Works with Naukri, LinkedIn India, Foundit, TimesJobs. Free plan, 5 applications/week. ATS-optimized for TCS, Infosys, Wipro.',
  keywords: [
    'AI job search India',
    'auto apply jobs India',
    'AI resume builder India',
    'Naukri alternative',
    'jobs in India AI',
    'free AI resume builder India',
    'AI that applies to jobs India',
    'TCS ATS resume',
    'Infosys ATS resume',
    'Indian job portal AI',
  ],
  alternates: { canonical: 'https://3box.ai/in' },
  openGraph: {
    title: 'AI Job Search in India — Auto-Apply to Jobs',
    description: 'AI finds and applies to jobs in India. Works with Naukri, LinkedIn India, Foundit. Free plan.',
    url: 'https://3box.ai/in',
    type: 'website',
  },
};

const cities = [
  { slug: 'bangalore', name: 'Bangalore', subtitle: 'Silicon Valley of India — 35K+ tech jobs', jobs: '35,000+' },
  { slug: 'hyderabad', name: 'Hyderabad', subtitle: 'Cyberabad — major IT and pharma hub', jobs: '22,000+' },
  { slug: 'mumbai', name: 'Mumbai', subtitle: 'Finance, media, startup capital', jobs: '28,000+' },
  { slug: 'delhi', name: 'Delhi NCR', subtitle: 'Government, consulting, enterprise', jobs: '31,000+' },
  { slug: 'pune', name: 'Pune', subtitle: 'IT hub with manufacturing edge', jobs: '18,000+' },
];

const indiaSchemaCollection = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'AI Job Search in India',
  description: 'City-by-city guide to AI-powered job applications across India',
  url: 'https://3box.ai/in',
  hasPart: cities.map((city) => ({
    '@type': 'WebPage',
    name: `Jobs in ${city.name}`,
    url: `https://3box.ai/in/${city.slug}`,
  })),
};

export default function IndiaHubPage() {
  return (
    <>
      <JsonLd data={indiaSchemaCollection} />
      <div className="min-h-screen">
        <Navbar />

        <section className="pt-32 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-purple/10 via-transparent to-transparent rounded-full blur-3xl" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 mb-6">
              <MapPin className="w-4 h-4 text-neon-purple" />
              <span className="text-sm text-neon-purple">Made for Indian Job Seekers</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              AI That Applies to Jobs in India for You
            </h1>
            <p className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto mb-8">
              Stop manually applying to jobs on Naukri, LinkedIn, and Foundit. Our AI agents find matching roles, tailor your resume for Indian ATS systems (TCS, Infosys, Wipro), and apply automatically — while you focus on interviews.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-blue text-white rounded-xl font-semibold hover:opacity-90 transition">
                Start Free — 5 Applications/Week <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition">
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-3 text-center">Jobs by City</h2>
            <p className="text-white/60 text-center mb-10">Pick your city — we handle the rest.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities.map((city) => (
                <Link key={city.slug} href={`/in/${city.slug}`} className="glass p-6 hover:bg-white/[0.05] transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold">{city.name}</h3>
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-neon-purple group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-white/60 mb-3">{city.subtitle}</p>
                  <p className="text-xs text-neon-blue font-medium">{city.jobs} active jobs</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-10 text-center">Why 3BOX AI for Indian Job Search</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Search, title: 'Naukri, Foundit, LinkedIn India', desc: 'We scan all major Indian job boards plus company career pages across TCS, Infosys, Wipro, HCL, and more.' },
                { icon: Shield, title: 'ATS-Optimized for Indian Companies', desc: 'Our resumes pass TCS Ignite, Infosys BPM, Wipro Elite, and most Indian ATS filters built on Taleo, Workday, or custom systems.' },
                { icon: Zap, title: 'Pricing in INR, Payment in INR', desc: 'Free plan with 5 applications/week. PRO from ₹2,400/mo, MAX from ₹4,900/mo. UPI, cards, and net banking accepted.' },
              ].map((f, i) => (
                <div key={i} className="glass p-6">
                  <f.icon className="w-8 h-8 text-neon-blue mb-3" />
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-white/60">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="glass p-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to stop manually applying?</h2>
              <p className="text-white/60 mb-6">Join thousands of Indian job seekers letting AI do the work.</p>
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-blue text-white rounded-xl font-semibold hover:opacity-90 transition">
                Start Free — No Credit Card <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
