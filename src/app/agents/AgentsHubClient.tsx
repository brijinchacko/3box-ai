'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Bot, Sparkles, ChevronRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CortexAvatar from '@/components/brand/CortexAvatar';
import AgentAvatar from '@/components/brand/AgentAvatar';
import { AGENT_LIST, COORDINATOR } from '@/lib/agents/registry';
import { AGENT_PAGES } from '@/lib/agents/agentContent';
import { useVisitorName } from '@/hooks/useVisitorName';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

export default function AgentsHubClient() {
  const { firstName } = useVisitorName();
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-blue/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-semibold mb-6">
              <Bot className="w-3.5 h-3.5" /> 6 Specialized Agents + 1 Coordinator
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
              {firstName ? `${firstName}, Meet` : 'Meet'} Your <span className="gradient-text">AI Agent Team</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10">
              Each agent is purpose-built for a specific phase of your job search.
              Together, they form an autonomous pipeline that works while you sleep.
            </p>
          </motion.div>

          {/* Agent avatars row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <CortexAvatar size={48} pulse />
            <div className="w-px h-8 bg-white/10" />
            {AGENT_LIST.map((agent) => (
              <AgentAvatar key={agent.id} agentId={agent.id} size={40} autoSleep />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Cortex — The Coordinator */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-8 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border border-white/[0.08] overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-neon-blue/10 to-transparent rounded-full blur-3xl" />
            <div className="relative flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <CortexAvatar size={80} pulse />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="text-xs font-semibold text-neon-blue/70 mb-1">THE COORDINATOR</div>
                <h2 className="text-2xl font-bold mb-2">Agent Cortex</h2>
                <p className="text-white/40 text-sm leading-relaxed mb-4">
                  {COORDINATOR.description}
                </p>
                <Link
                  href="/agents/cortex"
                  className="inline-flex items-center gap-2 text-sm font-medium text-neon-blue hover:text-neon-blue/80 transition-colors"
                >
                  Learn about Cortex <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Agent Grid */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">The 6 Specialist Agents</h2>
            <p className="text-white/40">Each agent masters one phase of your career journey.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {AGENT_LIST.map((agent, i) => {
              const content = AGENT_PAGES[agent.id];
              return (
                <motion.div
                  key={agent.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Link
                    href={`/agents/${agent.id}`}
                    className="block p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all group h-full"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <AgentAvatar agentId={agent.id} size={44} />
                      <div>
                        <h3 className="font-semibold">{agent.displayName}</h3>
                        <span className="text-xs text-white/40">{agent.role}</span>
                      </div>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed mb-4">{agent.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {agent.capabilities.slice(0, 3).map((cap) => (
                        <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40">
                          {cap}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-neon-blue group-hover:gap-2.5 transition-all">
                      Read full story <ArrowRight className="w-4 h-4 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pipeline Overview */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">How They Work Together</h2>
            <p className="text-white/40">A fully autonomous pipeline, orchestrated by Cortex.</p>
          </motion.div>

          <div className="space-y-4">
            {[
              { agent: 'cortex', label: 'Cortex receives your career goals', color: 'from-cyan-500/20 to-purple-500/20' },
              { agent: 'scout', label: 'Scout discovers matching jobs', color: 'from-blue-500/20 to-cyan-500/20' },
              { agent: 'forge', label: 'Forge optimizes your resume per job', color: 'from-orange-500/20 to-amber-500/20' },
              { agent: 'sentinel', label: 'Sentinel reviews for quality', color: 'from-rose-500/20 to-pink-500/20' },
              { agent: 'archer', label: 'Archer sends applications', color: 'from-green-500/20 to-emerald-500/20' },
              { agent: 'atlas', label: 'Atlas preps your interviews', color: 'from-purple-500/20 to-violet-500/20' },
              { agent: 'sage', label: 'Sage builds your missing skills', color: 'from-teal-500/20 to-cyan-500/20' },
            ].map((item, i) => (
              <motion.div
                key={item.agent}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                  {item.agent === 'cortex' ? (
                    <CortexAvatar size={24} />
                  ) : (
                    <AgentAvatar agentId={item.agent as any} size={24} />
                  )}
                </div>
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-sm text-white/60">{item.label}</span>
                {i < 6 && <ChevronRight className="w-4 h-4 text-white/20" />}
              </motion.div>
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
            <h2 className="text-3xl font-bold mb-4">{firstName ? `${firstName}, Ready` : 'Ready'} to Activate Your Agent Team?</h2>
            <p className="text-white/40 mb-8">Set your career goals and let 6 AI agents handle the rest.</p>
            <Link href="/get-started" className="btn-primary text-sm inline-flex items-center gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
