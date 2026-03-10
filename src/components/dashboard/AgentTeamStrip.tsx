'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import { AGENTS, type AgentId } from '@/lib/agents/registry';
import { type PlanTier } from '@/lib/agents/permissions';

interface AgentStatus {
  id: AgentId;
  name: string;
  role: string;
  locked: boolean;
  colorHex: string;
}

interface AgentTeamStripProps {
  agents: AgentStatus[];
  selectedAgent: AgentId | null;
  runningAgents: Set<string>;
  recentlyDone: Set<string>;
  onSelect: (id: AgentId) => void;
}

export default function AgentTeamStrip({
  agents,
  selectedAgent,
  runningAgents,
  recentlyDone,
  onSelect,
}: AgentTeamStripProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
      {agents.map((agent, i) => {
        const running = runningAgents.has(agent.id);
        const done = recentlyDone.has(agent.id);
        const selected = selectedAgent === agent.id;
        const def = AGENTS[agent.id];

        if (agent.locked) {
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              className="flex-shrink-0"
            >
              <Link
                href="/pricing"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                           border border-white/5 bg-white/[0.015] opacity-35
                           hover:opacity-50 transition-all min-w-[140px]"
              >
                <AgentAvatar agentId={agent.id} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold truncate">{agent.name}</span>
                    <Lock className="w-3 h-3 text-white/20" />
                  </div>
                  <p className="text-[10px] text-white/15 truncate">{agent.role}</p>
                </div>
              </Link>
            </motion.div>
          );
        }

        return (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i }}
            className="flex-shrink-0"
          >
            <button
              onClick={() => onSelect(agent.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all
                          text-left min-w-[140px] ${
                selected
                  ? 'border-white/15 bg-white/[0.06] shadow-lg'
                  : running
                    ? 'border-neon-blue/20 bg-neon-blue/[0.04]'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.03]'
              }`}
              style={selected ? { boxShadow: `0 0 20px ${agent.colorHex}15` } : undefined}
            >
              <div className="relative flex-shrink-0">
                <AgentAvatar agentId={agent.id} size={32} pulse={running} />
                {running && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon-blue border-2 border-surface"
                  />
                )}
                {!running && done && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-neon-green border-2 border-surface flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-2 h-2 text-white" />
                  </motion.div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold truncate">{agent.name}</span>
                  {running ? (
                    <Loader2 className="w-3 h-3 text-neon-blue animate-spin flex-shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green/50 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-white/25 truncate">
                  {running ? 'Working...' : agent.role}
                </p>
              </div>
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
