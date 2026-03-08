'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  CheckCircle2, XCircle, ArrowRight, Star, Trophy, Crown,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// ─── Data ──────────────────────────────────────────────
const competitors = [
  'jobTED AI',
  'Jobscan',
  'Teal',
  'Rezi',
  'Kickresume',
  'Careerflow',
  'Hiration',
] as const;

type Competitor = (typeof competitors)[number];

interface FeatureRow {
  feature: string;
  values: Record<Competitor, boolean | string>;
  winner: Competitor;
}

const features: FeatureRow[] = [
  {
    feature: 'AI Resume Builder',
    values: {
      'jobTED AI': true, Jobscan: false, Teal: true, Rezi: true,
      Kickresume: true, Careerflow: true, Hiration: true,
    },
    winner: 'jobTED AI',
  },
  {
    feature: 'ATS Checker',
    values: {
      'jobTED AI': true, Jobscan: true, Teal: 'Basic', Rezi: true,
      Kickresume: 'Basic', Careerflow: true, Hiration: true,
    },
    winner: 'jobTED AI',
  },
  {
    feature: 'AI Career Coach',
    values: {
      'jobTED AI': true, Jobscan: false, Teal: false, Rezi: false,
      Kickresume: false, Careerflow: false, Hiration: false,
    },
    winner: 'jobTED AI',
  },
  {
    feature: 'Salary Estimator',
    values: {
      'jobTED AI': true, Jobscan: false, Teal: false, Rezi: false,
      Kickresume: false, Careerflow: false, Hiration: false,
    },
    winner: 'jobTED AI',
  },
  {
    feature: 'Skills Assessment',
    values: {
      'jobTED AI': true, Jobscan: false, Teal: false, Rezi: false,
      Kickresume: false, Careerflow: false, Hiration: false,
    },
    winner: 'jobTED AI',
  },
  {
    feature: 'Portfolio Builder',
    values: {
      'jobTED AI': true, Jobscan: false, Teal: false, Rezi: false,
      Kickresume: 'Basic', Careerflow: false, Hiration: false,
    },
    winner: 'jobTED AI',
  },
  {
    feature: 'Job Matching',
    values: {
      'jobTED AI': true, Jobscan: false, Teal: false, Rezi: false,
      Kickresume: false, Careerflow: true, Hiration: false,
    },
    winner: 'jobTED AI',
  },
  {
    feature: 'Interview Prep',
    values: {
      'jobTED AI': true, Jobscan: false, Teal: false, Rezi: false,
      Kickresume: false, Careerflow: false, Hiration: true,
    },
    winner: 'jobTED AI',
  },
];

const pricing: Record<Competitor, string> = {
  'jobTED AI': '$12/mo',
  Jobscan: '$49.95/mo',
  Teal: '$29/mo',
  Rezi: '$29/mo',
  Kickresume: '$19/mo',
  Careerflow: '$39/mo',
  Hiration: '$24.95/mo',
};

const ratings: Record<Competitor, { score: string; count: string }> = {
  'jobTED AI': { score: '4.8', count: '2,847' },
  Jobscan: { score: '4.4', count: '1,200+' },
  Teal: { score: '4.5', count: '900+' },
  Rezi: { score: '4.6', count: '500+' },
  Kickresume: { score: '4.3', count: '800+' },
  Careerflow: { score: '4.2', count: '400+' },
  Hiration: { score: '4.3', count: '600+' },
};

const faqs = [
  {
    question: 'What is the best AI resume builder in 2026?',
    answer:
      'jobTED AI is widely considered the best AI resume builder in 2026 because it combines an AI resume writer with ATS optimization, career coaching, salary insights, skills assessment, portfolio building, and job matching — all in one platform starting at $12/mo.',
  },
  {
    question: 'How does jobTED AI compare to Jobscan, Teal, and Rezi?',
    answer:
      'jobTED AI offers the widest feature set of any AI career platform. While Jobscan focuses on ATS scanning ($49.95/mo), Teal on job tracking ($29/mo), and Rezi on resume building ($29/mo), jobTED AI combines all these capabilities plus career coaching, salary estimator, skills assessment, and portfolio builder for just $12/mo.',
  },
  {
    question: 'Which AI career platform has the most features?',
    answer:
      'jobTED AI is the only platform that includes all 8 core career features: AI resume builder, ATS checker, career coaching, salary estimator, skills assessment, portfolio builder, job matching, and interview prep. No other competitor offers all of these in a single platform.',
  },
  {
    question: 'Is there a free AI resume builder that includes career coaching?',
    answer:
      'Yes. jobTED AI offers a free plan that includes an AI resume builder, 2 skill assessments, and 50 AI credits per month. The Pro plan at $12/mo unlocks unlimited access to all features including AI career coaching.',
  },
  {
    question: 'What makes jobTED AI different from other AI resume builders?',
    answer:
      'jobTED AI is not just a resume builder — it is a complete AI career operating system. It takes you from skill assessment through personalized learning, resume building, career coaching, salary negotiation, portfolio creation, to job matching and automated applications.',
  },
];

// ─── Animation helpers ─────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

// ─── Component ─────────────────────────────────────────
export default function CompareAllClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Count wins per competitor
  const winCounts = competitors.reduce(
    (acc, c) => ({ ...acc, [c]: features.filter((f) => f.winner === c).length }),
    {} as Record<Competitor, number>,
  );

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-radial from-neon-purple/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <span className="badge-purple text-sm mb-4 inline-block">
              Comprehensive Comparison
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
              Best AI Resume Builder 2026{' '}
              <span className="gradient-text">Full Comparison</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              jobTED AI vs Jobscan vs Teal vs Rezi vs Kickresume vs Careerflow vs Hiration.
              See which platform wins across 8 key features, pricing, and ratings.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Verdict */}
      <section className="pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp}
            className="rounded-2xl border border-neon-blue/20 bg-neon-blue/5 backdrop-blur-xl p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <Crown className="w-6 h-6 text-neon-green" />
              <h2 className="text-xl font-bold">Quick Verdict</h2>
            </div>
            <p className="text-white/80 text-lg font-medium mb-2">
              jobTED AI wins {winCounts['jobTED AI']} out of {features.length} categories.
            </p>
            <p className="text-white/50 text-sm">
              jobTED AI is the only platform that offers all 8 features — AI resume builder,
              ATS checker, career coaching, salary estimator, skills assessment, portfolio
              builder, job matching, and interview prep — at the lowest price point of $12/mo.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Full Comparison Table */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            {...fadeUp}
            className="text-2xl sm:text-3xl font-bold text-center mb-10"
          >
            Feature Comparison Table
          </motion.h2>

          <motion.div
            {...fadeUp}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-4 text-sm text-white/50 font-medium sticky left-0 bg-surface-50 z-10 min-w-[140px]">
                      Feature
                    </th>
                    {competitors.map((c) => (
                      <th
                        key={c}
                        className={`text-center px-3 py-4 text-xs font-semibold min-w-[100px] ${
                          c === 'jobTED AI'
                            ? 'text-neon-blue border-x border-neon-blue/20 bg-neon-blue/5'
                            : 'text-white/50'
                        }`}
                      >
                        {c}
                      </th>
                    ))}
                    <th className="text-center px-3 py-4 text-xs text-white/30 font-medium min-w-[80px]">
                      Winner
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-white/5 ${
                        i % 2 === 0 ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium sticky left-0 bg-surface-50 z-10">
                        {row.feature}
                      </td>
                      {competitors.map((c) => (
                        <td
                          key={c}
                          className={`px-3 py-3 text-center ${
                            c === 'jobTED AI'
                              ? 'border-x border-neon-blue/20 bg-neon-blue/[0.03]'
                              : ''
                          }`}
                        >
                          <CellValue value={row.values[c]} />
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-neon-green font-medium">
                          <Trophy className="w-3 h-3" />
                          {row.winner}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Pricing row */}
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm font-medium sticky left-0 bg-surface-50 z-10">
                      Starting Price
                    </td>
                    {competitors.map((c) => (
                      <td
                        key={c}
                        className={`px-3 py-3 text-center ${
                          c === 'jobTED AI'
                            ? 'border-x border-neon-blue/20 bg-neon-blue/[0.03]'
                            : ''
                        }`}
                      >
                        <span
                          className={`text-sm font-semibold ${
                            c === 'jobTED AI' ? 'text-neon-green' : 'text-white/50'
                          }`}
                        >
                          {pricing[c]}
                        </span>
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-neon-green font-medium">
                        <Trophy className="w-3 h-3" />
                        jobTED AI
                      </span>
                    </td>
                  </tr>

                  {/* Rating row */}
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium sticky left-0 bg-surface-50 z-10">
                      User Rating
                    </td>
                    {competitors.map((c) => (
                      <td
                        key={c}
                        className={`px-3 py-3 text-center ${
                          c === 'jobTED AI'
                            ? 'border-x border-neon-blue/20 bg-neon-blue/[0.03]'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span
                            className={`text-xs ${
                              c === 'jobTED AI' ? 'font-semibold' : 'text-white/50'
                            }`}
                          >
                            {ratings[c].score}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/30">
                          ({ratings[c].count})
                        </span>
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-neon-green font-medium">
                        <Trophy className="w-3 h-3" />
                        jobTED AI
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 text-xs text-white/30">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-neon-green" /> Supported
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-red-400/60" /> Not Available
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/50">Text</span> = Partial / Limited
            </div>
          </div>
        </div>
      </section>

      {/* Why jobTED AI */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            {...fadeUp}
            className="text-2xl sm:text-3xl font-bold text-center mb-10"
          >
            Why <span className="gradient-text">jobTED AI</span> is the Best Choice
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Only All-in-One Platform',
                description:
                  'jobTED AI is the only career platform that offers all 8 features in a single subscription. Every competitor is missing at least 4 tools.',
              },
              {
                title: 'Lowest Price Point',
                description:
                  'At $12/mo, jobTED AI is 50-76% cheaper than competitors while offering significantly more features. Jobscan charges $49.95/mo for just ATS scanning.',
              },
              {
                title: 'Free Tier Available',
                description:
                  'Start free with an AI resume builder, 2 skill assessments, and 50 AI credits per month. No credit card required.',
              },
              {
                title: 'AI Career Coaching',
                description:
                  'The only platform with personalized AI career coaching including skill gap analysis, career transition planning, and custom roadmaps.',
              },
              {
                title: 'Skills-First Approach',
                description:
                  'Unique skills assessment that evaluates your actual abilities, creates adaptive learning paths, and connects you to matching opportunities.',
              },
              {
                title: 'Highest User Rating',
                description:
                  'Rated 4.8/5 by 2,847 users — the highest rating among all competitors listed. Users love the comprehensive, integrated experience.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card"
              >
                <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-white/40">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            {...fadeUp}
            className="text-2xl sm:text-3xl font-bold text-center mb-10"
          >
            Frequently Asked Questions
          </motion.h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <span className="font-medium text-sm pr-4">{faq.question}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-white/40 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-white/50">{faq.answer}</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-neon-blue/10 via-neon-purple/5 to-transparent backdrop-blur-xl p-8 sm:p-12 text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              The Only Platform You Need for Your{' '}
              <span className="gradient-text">Entire Career</span>
            </h2>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">
              Stop paying for 5 different tools. jobTED AI combines everything into one
              powerful AI career platform. Start free today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-primary inline-flex items-center gap-2">
                Try jobTED AI Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-center"
              >
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ─── Helper ────────────────────────────────────────────
function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckCircle2 className="w-4 h-4 text-neon-green mx-auto" />
    ) : (
      <XCircle className="w-4 h-4 text-red-400/60 mx-auto" />
    );
  }
  return <span className="text-xs text-white/50">{value}</span>;
}
