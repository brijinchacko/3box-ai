'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import { AGENTS, type AgentId } from '@/lib/agents/registry';

interface AgentLockedPageProps {
  agentId: AgentId;
}

export default function AgentLockedPage({ agentId }: AgentLockedPageProps) {
  const agent = AGENTS[agentId];

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto"
      >
        <div className="mb-6">
          <AgentAvatar agentId={agentId} size={80} sleeping />
        </div>

        <h2 className="text-2xl font-bold mb-2">{agent.displayName}</h2>
        <p className={`text-sm font-medium ${agent.color} mb-3`}>{agent.role}</p>
        <p className="text-white/40 text-sm mb-6 leading-relaxed">{agent.description}</p>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 mb-6 text-left">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            What {agent.name} does
          </h3>
          <ul className="space-y-2">
            {agent.capabilities.map((cap) => (
              <li key={cap} className="flex items-center gap-2 text-sm text-white/50">
                <Sparkles className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                {cap}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold text-sm
                     shadow-lg shadow-neon-blue/20 hover:shadow-neon-blue/40 transition-all"
        >
          <Lock className="w-4 h-4" />
          Hire {agent.displayName}
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-xs text-white/20 mt-3">
          Included in {agent.minPlan} bundle and above
        </p>
      </motion.div>
    </div>
  );
}
