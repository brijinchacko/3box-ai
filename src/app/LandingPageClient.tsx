'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Upload, Search, Sparkles, Rocket, ChevronDown, ChevronUp } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AgentAvatar from '@/components/brand/AgentAvatar';
import CortexAvatar from '@/components/brand/CortexAvatar';
import { AGENT_LIST, COORDINATOR } from '@/lib/agents/registry';

const steps = [
  { num: '01', icon: Upload, title: 'Upload Resume & Set Goal', desc: 'Share your resume and tell us your target role. AI maps your skills instantly.', gradient: 'from-neon-blue to-cyan-400' },
  { num: '02', icon: Search, title: 'Agents Search & Tailor', desc: 'Scout finds jobs. Forge tailors your resume. Sentinel reviews quality.', gradient: 'from-neon-purple to-violet-400' },
  { num: '03', icon: Sparkles, title: 'AI Applies For You', desc: 'Archer sends personalized applications with custom cover letters overnight.', gradient: 'from-amber-400 to-orange-400' },
  { num: '04', icon: Rocket, title: 'Wake Up to Results', desc: 'Check your dashboard for matched jobs, sent applications, and interview prep.', gradient: 'from-neon-green to-emerald-400' },
];

const faqItems = [
  { q: 'Do I really get 20 free applications?', a: 'Yes. Upload your resume, pick your target role, and our AI agents find 20 matching jobs and apply to each one with a tailored cover letter. No credit card needed.' },
  { q: 'How does the AI actually apply?', a: 'Agent Archer generates a unique cover letter for each job, then submits through job portals or sends a professional email to HR. Every application is tracked in your dashboard.' },
  { q: 'Will it send wrong or spammy applications?', a: 'No. Agent Sentinel reviews every application for quality before it goes out. Each has a unique, tailored cover letter \u2014 not a template.' },
  { q: 'Is my data safe?', a: 'All data is encrypted in transit and at rest. We never sell your information. You can delete your account and all data anytime.' },
];

export default function LandingPageClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-blue/8 via-neon-purple/5 to-transparent rounded-full blur-3xl" aria-hidden="true" />

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
          >
            AI agents that apply for jobs
            <br />
            <span className="gradient-text">while you sleep.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-lg sm:text-xl text-white/50 max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Upload your resume. Pick your target role. 6 AI agents search, tailor, and apply to jobs for you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/get-started"
              className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 shadow-lg shadow-neon-blue/20"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-white/30">20 free applications &middot; No credit card</p>
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              How it <span className="gradient-text">works</span>
            </h2>
            <p className="text-white/40 max-w-md mx-auto">Upload once. AI handles the rest.</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 relative">
            <div className="hidden lg:block absolute top-1/2 left-[12%] right-[12%] h-px bg-gradient-to-r from-neon-blue/30 via-neon-purple/30 to-neon-green/30 -translate-y-1/2 z-0" aria-hidden="true" />
            {steps.map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative z-10 text-center"
              >
                <div className="glass p-5 sm:p-6 flex flex-col items-center hover:border-white/15 transition-all duration-300 group h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-[10px] text-white/30 font-medium uppercase tracking-wider mb-1">Step {item.num}</div>
                  <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Meet Your Agents ─── */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Your AI <span className="gradient-text">team</span>
            </h2>
            <p className="text-white/40 max-w-md mx-auto">6 specialist agents, orchestrated by Cortex.</p>
          </motion.div>

          {/* Cortex coordinator */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <CortexAvatar size={36} pulse />
            <div>
              <div className="text-sm font-semibold text-white">{COORDINATOR.displayName}</div>
              <div className="text-xs text-white/40">Orchestrates all agents &middot; Your career coordinator</div>
            </div>
          </motion.div>

          {/* Agent grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AGENT_LIST.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="glass p-4 flex items-start gap-3 hover:border-white/15 transition-all group"
              >
                <AgentAvatar agentId={agent.id} size={32} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">{agent.name}</div>
                  <div className={`text-[11px] font-medium ${agent.color}`}>{agent.role}</div>
                  <p className="text-[11px] text-white/35 mt-1 leading-snug">{agent.shortDescription}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="relative py-16 sm:py-20">
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-center mb-10"
          >
            Questions & answers
          </motion.h2>
          <div className="space-y-2">
            {faqItems.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-white/80">{faq.q}</span>
                    {openFaq === i ? (
                      <ChevronUp className="w-4 h-4 text-white/30 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />
                    )}
                  </div>
                  {openFaq === i && (
                    <p className="text-xs text-white/40 mt-3 leading-relaxed">{faq.a}</p>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-neon-blue/5 via-transparent to-transparent" aria-hidden="true" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to hire your <span className="gradient-text">AI team</span>?
            </h2>
            <p className="text-white/40 mb-8">Start free. 20 applications. No credit card.</p>
            <Link
              href="/get-started"
              className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2 shadow-lg shadow-neon-blue/20"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>

            {/* Mini agent row */}
            <div className="flex items-center justify-center gap-2 mt-10">
              {AGENT_LIST.map((agent) => (
                <div key={agent.id} className="opacity-40 hover:opacity-100 transition-opacity">
                  <AgentAvatar agentId={agent.id} size={20} />
                </div>
              ))}
              <div className="ml-1 opacity-40 hover:opacity-100 transition-opacity">
                <CortexAvatar size={22} />
              </div>
            </div>
            <p className="text-[10px] text-white/20 mt-3">7 AI agents working together to land your dream job.</p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
