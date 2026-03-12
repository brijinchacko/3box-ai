'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  CheckCircle2, XCircle, ArrowRight, Star, Trophy, Zap,
  Shield, DollarSign, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// ─── Types ─────────────────────────────────────────────
export interface FeatureRow {
  feature: string;
  boxAi: boolean | string;
  competitor: boolean | string;
}

export interface Advantage {
  icon: 'zap' | 'shield' | 'dollar' | 'trophy' | 'star';
  title: string;
  description: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ComparisonData {
  competitorName: string;
  competitorSlug: string;
  heroTitle: string;
  heroSubtitle: string;
  verdict: string;
  verdictDetail: string;
  features: FeatureRow[];
  boxAiPrice: string;
  competitorPrice: string;
  boxAiEntryPlan: string;
  competitorEntryPlan: string;
  boxAiRating: string;
  competitorRating: string;
  boxAiReviewCount: string;
  competitorReviewCount: string;
  advantages: Advantage[];
  faqs: FAQ[];
}

// ─── Icon Map ──────────────────────────────────────────
const iconMap = {
  zap: Zap,
  shield: Shield,
  dollar: DollarSign,
  trophy: Trophy,
  star: Star,
};

// ─── Fade-in animation helper ──────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

// ─── Main Component ────────────────────────────────────
export default function ComparePageClient({ data }: { data: ComparisonData }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-radial from-neon-blue/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <span className="badge-blue text-sm mb-4 inline-block">Comparison</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
              {data.heroTitle.split(data.competitorName).map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="gradient-text">{data.competitorName}</span>
                  )}
                </span>
              ))}
            </h1>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">{data.heroSubtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Quick Verdict ────────────────────────────── */}
      <section className="pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp}
            className="rounded-2xl border border-neon-blue/20 bg-neon-blue/5 backdrop-blur-xl p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-6 h-6 text-neon-green" />
              <h2 className="text-xl font-bold">Quick Verdict</h2>
            </div>
            <p className="text-white/80 text-lg font-medium mb-2">{data.verdict}</p>
            <p className="text-white/50 text-sm">{data.verdictDetail}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Feature Comparison Table ─────────────────── */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            {...fadeUp}
            className="text-2xl sm:text-3xl font-bold text-center mb-10"
          >
            Feature-by-Feature Comparison
          </motion.h2>

          <motion.div
            {...fadeUp}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-sm text-white/50 font-medium w-1/3">
                      Feature
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-neon-blue border-x border-neon-blue/20 bg-neon-blue/5 w-1/3">
                      3BOX AI
                    </th>
                    <th className="text-center px-6 py-4 text-sm text-white/50 font-medium w-1/3">
                      {data.competitorName}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.features.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-white/5 ${
                        i % 2 === 0 ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium">{row.feature}</td>
                      <td className="px-6 py-4 text-center border-x border-neon-blue/20 bg-neon-blue/[0.03]">
                        <CellValue value={row.boxAi} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CellValue value={row.competitor} />
                      </td>
                    </tr>
                  ))}

                  {/* Pricing row */}
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <td className="px-6 py-4 text-sm font-medium">Starting Price</td>
                    <td className="px-6 py-4 text-center border-x border-neon-blue/20 bg-neon-blue/[0.03]">
                      <span className="text-neon-green font-semibold">{data.boxAiPrice}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-white/60">{data.competitorPrice}</span>
                    </td>
                  </tr>

                  {/* Entry plan row */}
                  <tr className="border-b border-white/5">
                    <td className="px-6 py-4 text-sm font-medium">Entry Plan</td>
                    <td className="px-6 py-4 text-center border-x border-neon-blue/20 bg-neon-blue/[0.03]">
                      <span className="text-neon-green text-sm">{data.boxAiEntryPlan}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-white/40 text-sm">{data.competitorEntryPlan}</span>
                    </td>
                  </tr>

                  {/* Rating row */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium">User Rating</td>
                    <td className="px-6 py-4 text-center border-x border-neon-blue/20 bg-neon-blue/[0.03]">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold">{data.boxAiRating}</span>
                        <span className="text-white/30 text-xs">({data.boxAiReviewCount})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white/60">{data.competitorRating}</span>
                        <span className="text-white/30 text-xs">({data.competitorReviewCount})</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Why Choose 3BOX AI ──────────────────────── */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            {...fadeUp}
            className="text-2xl sm:text-3xl font-bold text-center mb-10"
          >
            Why Choose <span className="gradient-text">3BOX AI</span> Over{' '}
            {data.competitorName}
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {data.advantages.map((adv, i) => {
              const Icon = iconMap[adv.icon];
              return (
                <motion.div
                  key={adv.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card"
                >
                  <Icon className="w-8 h-8 text-neon-blue mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{adv.title}</h3>
                  <p className="text-sm text-white/40">{adv.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            {...fadeUp}
            className="text-2xl sm:text-3xl font-bold text-center mb-10"
          >
            Frequently Asked Questions
          </motion.h2>

          <div className="space-y-3">
            {data.faqs.map((faq, i) => (
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

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-neon-blue/10 via-neon-purple/5 to-transparent backdrop-blur-xl p-8 sm:p-12 text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to Switch to <span className="gradient-text">3BOX AI</span>?
            </h2>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">
              Join thousands of professionals who chose the all-in-one AI career platform.
              7-day money-back guarantee on all plans.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-primary inline-flex items-center gap-2">
                Try 3BOX AI <ArrowRight className="w-4 h-4" />
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

// ─── Helper: render boolean or string cell value ───────
function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckCircle2 className="w-5 h-5 text-neon-green mx-auto" />
    ) : (
      <XCircle className="w-5 h-5 text-red-400/60 mx-auto" />
    );
  }
  return <span className="text-sm text-white/70">{value}</span>;
}
