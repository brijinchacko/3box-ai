'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Trophy, Layers } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const competitors = [
  {
    name: 'Jobscan',
    slug: 'jobscan',
    tagline: 'ATS checker & keyword optimization',
    boxAiEdge: 'Full career platform at 76% less cost',
    badge: 'Most Popular',
  },
  {
    name: 'Teal',
    slug: 'teal',
    tagline: 'Job tracking & resume builder',
    boxAiEdge: 'Salary tools, skills assessment, portfolio builder',
    badge: null,
  },
  {
    name: 'Rezi',
    slug: 'rezi',
    tagline: 'AI resume builder',
    boxAiEdge: 'Career coaching, salary estimator, job matching',
    badge: null,
  },
  {
    name: 'All Competitors',
    slug: 'all',
    tagline: 'Jobscan vs Teal vs Rezi vs Kickresume vs Careerflow vs Hiration',
    boxAiEdge: '3BOX AI is the only all-in-one platform',
    badge: 'Comprehensive',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function CompareHubClient() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-radial from-neon-purple/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <span className="badge-purple text-sm mb-4 inline-block">Comparisons</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
              3BOX AI vs Competitors{' '}
              <span className="gradient-text">See How We Compare</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl mx-auto mb-8">
              3BOX AI is the only all-in-one AI career platform with resume builder, career
              coaching, salary estimator, skills assessment, portfolio builder, and job matching
              , with a free plan and Pro from $29/mo.
            </p>
            <Link
              href="/compare/all"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              View Full Comparison
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Comparison Cards */}
      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-6">
            {competitors.map((comp, i) => (
              <motion.div
                key={comp.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/compare/${comp.slug}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:bg-white/[0.07] hover:border-white/15 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold group-hover:text-neon-blue transition-colors">
                        3BOX AI vs {comp.name}
                      </h2>
                      <p className="text-sm text-white/40 mt-1">{comp.tagline}</p>
                    </div>
                    {comp.badge && (
                      <span className="badge-blue text-xs shrink-0">{comp.badge}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-neon-green shrink-0" />
                    <span className="text-sm text-neon-green">{comp.boxAiEdge}</span>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-white/30 group-hover:text-neon-blue/60 transition-colors">
                    View Comparison <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-neon-blue/10 via-neon-purple/5 to-transparent backdrop-blur-xl p-8 sm:p-12 text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Why settle for one tool when you can have{' '}
              <span className="gradient-text">everything</span>?
            </h2>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">
              3BOX AI replaces 5+ career tools. Resume builder, ATS checker, career coach,
              salary estimator, skills assessment, portfolio builder, and job matching, all in one.
            </p>
            <Link href="/signup" className="btn-primary inline-flex items-center gap-2">
              Get Started Today <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
