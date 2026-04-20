'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Search, FileText, Zap, Users, Briefcase, MapPin, TrendingUp } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export interface CityData {
  city: string;           // "Bangalore"
  cityLower: string;      // "bangalore"
  slug: string;           // "bangalore" for URLs
  alsoKnownAs?: string;   // "Bengaluru"
  tagline: string;        // One-line pitch
  heroStats: {
    jobCount: string;     // "35,000+"
    companies: string;    // "Microsoft, Amazon, Flipkart..."
    avgSalary: string;    // "₹12-28 LPA for experienced"
  };
  topCompanies: string[];
  topRoles: { title: string; salary: string; count: number }[];
  keySectors: string[];
  faqs: { question: string; answer: string }[];
}

export default function CityPageClient({ data }: { data: CityData }) {
  const display = data.alsoKnownAs ? `${data.city} (${data.alsoKnownAs})` : data.city;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-purple/10 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 mb-6">
              <MapPin className="w-4 h-4 text-neon-purple" />
              <span className="text-sm text-neon-purple">Jobs in {display} • India</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              AI That Applies to Jobs in {data.city} for You
            </h1>
            <p className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto mb-8">
              {data.tagline}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-blue text-white rounded-xl font-semibold hover:opacity-90 transition"
              >
                Start Free — 5 Applications/Week <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition"
              >
                View Pricing (from Free)
              </Link>
            </div>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-14">
            <div className="glass p-6 text-center">
              <Briefcase className="w-6 h-6 text-neon-blue mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{data.heroStats.jobCount}</div>
              <div className="text-sm text-white/40">active jobs in {data.city}</div>
            </div>
            <div className="glass p-6 text-center">
              <Users className="w-6 h-6 text-neon-purple mx-auto mb-2" />
              <div className="text-sm text-white/80 font-medium">{data.heroStats.companies}</div>
              <div className="text-sm text-white/40 mt-1">top hiring companies</div>
            </div>
            <div className="glass p-6 text-center">
              <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{data.heroStats.avgSalary}</div>
              <div className="text-sm text-white/40">typical salary range</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works in your city */}
      <section className="py-16 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-center">
            How 3BOX AI Finds {data.city} Jobs for You
          </h2>
          <p className="text-white/60 text-center max-w-2xl mx-auto mb-12">
            Our AI scans Naukri, Foundit, LinkedIn India, Indeed, and company ATS portals to find jobs matching your profile in {display}.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: 'Scout finds matching jobs',
                desc: `Scans 11+ sources including Naukri, Foundit, TimesJobs, Shine, LinkedIn India, and Indeed for ${data.city}-based roles.`,
              },
              {
                icon: FileText,
                title: 'Forge tailors your resume',
                desc: `AI rewrites your resume for each job, optimizing for ${data.city} hiring patterns and Indian ATS systems (TCS, Infosys, Wipro).`,
              },
              {
                icon: Zap,
                title: 'Archer applies automatically',
                desc: 'AI submits tailored applications through ATS APIs, email, or Chrome extension — while you focus on interviews.',
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-6"
              >
                <step.icon className="w-8 h-8 text-neon-blue mb-3" />
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-white/60">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Companies */}
      <section className="py-16 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-3 text-center">Top Companies Hiring in {data.city}</h2>
          <p className="text-white/50 text-center mb-10">3BOX AI applies to jobs at all of these and hundreds more.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {data.topCompanies.map((company) => (
              <span key={company} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/80">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Top Roles */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10 text-center">Most In-Demand Roles in {data.city}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.topRoles.map((role, i) => (
              <div key={i} className="glass p-5">
                <h3 className="text-base font-semibold mb-1">{role.title}</h3>
                <p className="text-sm text-neon-green mb-2">{role.salary}</p>
                <p className="text-xs text-white/40">{role.count.toLocaleString()} open roles</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Sectors */}
      <section className="py-16 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Key Sectors in {data.city}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.keySectors.map((s) => (
              <div key={s} className="glass p-4 text-center">
                <CheckCircle2 className="w-5 h-5 text-neon-green mx-auto mb-2" />
                <p className="text-sm text-white/80">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10 text-center">{data.city} Jobs FAQ</h2>
          <div className="space-y-4">
            {data.faqs.map((faq, i) => (
              <details key={i} className="glass p-5 group">
                <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                  {faq.question}
                  <ArrowRight className="w-4 h-4 text-white/40 group-open:rotate-90 transition" />
                </summary>
                <p className="mt-3 text-white/70 text-sm">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass p-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to stop applying manually?</h2>
            <p className="text-white/60 mb-6">
              Let 3BOX AI find matching jobs in {data.city} and apply for you. Start free with 5 applications per week.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-blue text-white rounded-xl font-semibold hover:opacity-90 transition"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-white/30 mt-4">No credit card required • 5 free applications every week</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
