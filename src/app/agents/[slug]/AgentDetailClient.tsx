'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Zap,
  BookOpen, Quote, ChevronRight,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CortexAvatar from '@/components/brand/CortexAvatar';
import AgentAvatar from '@/components/brand/AgentAvatar';
import { AGENT_LIST } from '@/lib/agents/registry';
import { AGENT_PAGES, type AgentPageContent } from '@/lib/agents/agentContent';
import { useVisitorName } from '@/hooks/useVisitorName';

interface Props {
  slug: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

export default function AgentDetailClient({ slug }: Props) {
  const { firstName } = useVisitorName();
  const agent = AGENT_PAGES[slug];
  if (!agent) return null;

  const isCortex = slug === 'cortex';

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${agent.colorHex}10, transparent)` }}
        />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back */}
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> All Agents
          </Link>

          {/* Avatar + Badge */}
          <div className="flex items-center gap-4 mb-6">
            {isCortex ? (
              <CortexAvatar size={64} pulse />
            ) : (
              <AgentAvatar agentId={slug as any} size={64} pulse />
            )}
            <div>
              <span
                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1"
                style={{
                  background: `${agent.colorHex}15`,
                  color: agent.colorHex,
                  border: `1px solid ${agent.colorHex}30`,
                }}
              >
                {agent.role.toUpperCase()}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold">{agent.displayName}</h1>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-xl text-white/60 font-medium mb-4">{agent.tagline}</p>
          <p className="text-white/40 leading-relaxed mb-8">{agent.heroDescription}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {agent.stats.map((stat) => (
              <div key={stat.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <div className="text-lg font-bold" style={{ color: agent.colorHex }}>{stat.value}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-6">Why {agent.displayName} Was Built</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-white/50 leading-relaxed text-[15px]">{agent.origin}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-surface-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-3">Core Capabilities</h2>
            <p className="text-white/40">What {agent.displayName} does for your career.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {agent.features.map((feat, i) => (
              <motion.div
                key={feat.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: `${agent.colorHex}15` }}
                >
                  <CheckCircle2 className="w-4 h-4" style={{ color: agent.colorHex }} />
                </div>
                <h3 className="text-sm font-semibold mb-2">{feat.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{feat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-white/40">Step by step, from activation to results.</p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
            <div className="space-y-8">
              {agent.howItWorks.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-5"
                >
                  <div
                    className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: `${agent.colorHex}15`,
                      color: agent.colorHex,
                      border: `1px solid ${agent.colorHex}30`,
                    }}
                  >
                    {step.step}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 bg-surface-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-3">Real Results</h2>
            <p className="text-white/40">How {agent.displayName} has helped real job seekers.</p>
          </motion.div>

          <div className="space-y-6">
            {agent.caseStudies.map((cs, i) => (
              <motion.div
                key={cs.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${agent.colorHex}15`,
                      color: agent.colorHex,
                    }}
                  >
                    {cs.industry}
                  </span>
                  <h3 className="text-base font-semibold">{cs.title}</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-white/30 text-xs font-semibold uppercase tracking-wider">Challenge</span>
                    <p className="text-white/50 mt-1">{cs.challenge}</p>
                  </div>
                  <div>
                    <span className="text-white/30 text-xs font-semibold uppercase tracking-wider">Solution</span>
                    <p className="text-white/50 mt-1">{cs.solution}</p>
                  </div>
                  <div className="pt-2 border-t border-white/[0.04]">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: agent.colorHex }}>Result</span>
                    <p className="text-white/70 mt-1 font-medium">{cs.result}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Agents */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8 text-center">Meet the Other Agents</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Cortex */}
            {!isCortex && (
              <Link
                href="/agents/cortex"
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all text-center group"
              >
                <CortexAvatar size={32} />
                <div className="text-xs font-semibold mt-2">Cortex</div>
                <div className="text-[10px] text-white/30">Coordinator</div>
              </Link>
            )}
            {/* Other agents */}
            {AGENT_LIST.filter((a) => a.id !== slug).map((a) => (
              <Link
                key={a.id}
                href={`/agents/${a.id}`}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all text-center group"
              >
                <AgentAvatar agentId={a.id} size={32} />
                <div className="text-xs font-semibold mt-2">{a.name}</div>
                <div className="text-[10px] text-white/30">{a.role}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-8 h-8 text-neon-blue mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              {firstName ? `${firstName}, Activate ${agent.displayName}` : `Activate ${agent.displayName}`}
            </h2>
            <p className="text-white/40 mb-8">Start your free account and let the agent team go to work.</p>
            <Link href="/get-started" className="btn-primary text-sm inline-flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
