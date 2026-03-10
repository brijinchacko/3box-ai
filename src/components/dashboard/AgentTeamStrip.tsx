'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle2, Play } from 'lucide-react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import { AGENTS, type AgentId } from '@/lib/agents/registry';

/* ── Types ──────────────────────────────────────────── */
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
  lastMessages?: Record<string, string>;
  onRunPipeline?: () => void;
  /** If true render as vertical sidebar, else horizontal strip */
  vertical?: boolean;
  /** If true + vertical, show icon-only compact mode */
  collapsed?: boolean;
  /** Slot rendered at the bottom of the sidebar (e.g. UserMenu) */
  bottomSlot?: React.ReactNode;
  /** Slot rendered at bottom in collapsed mode (e.g. avatar-only UserMenu) */
  bottomSlotCollapsed?: React.ReactNode;
}

export default function AgentTeamStrip({
  agents,
  selectedAgent,
  runningAgents,
  recentlyDone,
  onSelect,
  lastMessages,
  onRunPipeline,
  vertical = false,
  collapsed = false,
  bottomSlot,
  bottomSlotCollapsed,
}: AgentTeamStripProps) {

  /* ── Horizontal strip (mobile) ────────────────────── */
  if (!vertical) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
        {agents.map((agent, i) => {
          const running = runningAgents.has(agent.id);
          const done = recentlyDone.has(agent.id);
          const selected = selectedAgent === agent.id;

          if (agent.locked) {
            return (
              <motion.div key={agent.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }} className="flex-shrink-0">
                <Link href="/pricing" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/5 bg-white/[0.015] opacity-35 hover:opacity-50 transition-all min-w-[140px]">
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
            <motion.div key={agent.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }} className="flex-shrink-0">
              <button
                onClick={() => onSelect(agent.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left min-w-[140px] ${
                  selected ? 'border-white/15 bg-white/[0.06] shadow-lg'
                  : running ? 'border-neon-blue/20 bg-neon-blue/[0.04]'
                  : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.03]'
                }`}
                style={selected ? { boxShadow: `0 0 20px ${agent.colorHex}15` } : undefined}
              >
                <div className="relative flex-shrink-0">
                  <AgentAvatar agentId={agent.id} size={32} pulse={running} />
                  {running && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon-blue border-2 border-surface" />}
                  {!running && done && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-neon-green border-2 border-surface flex items-center justify-center">
                      <CheckCircle2 className="w-2 h-2 text-white" />
                    </motion.div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold truncate">{agent.name}</span>
                    {running ? <Loader2 className="w-3 h-3 text-neon-blue animate-spin flex-shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-neon-green/50 flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] text-white/25 truncate">{running ? 'Working...' : agent.role}</p>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    );
  }

  /* ── Vertical sidebar — COLLAPSED (icon-only) ───── */
  if (collapsed) {
    return (
      <div className="flex flex-col h-full items-center">
        {/* Agent icons */}
        <div className="flex-1 overflow-y-auto py-2 flex flex-col items-center gap-1 w-full">
          {agents.map((agent, i) => {
            const running = runningAgents.has(agent.id);
            const done = recentlyDone.has(agent.id);
            const selected = selectedAgent === agent.id;

            if (agent.locked) {
              return (
                <Link key={agent.id} href="/pricing" className="relative p-2 rounded-lg opacity-30 hover:opacity-45 transition-all" title={agent.name}>
                  <AgentAvatar agentId={agent.id} size={28} />
                  <Lock className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-white/30" />
                </Link>
              );
            }

            return (
              <button
                key={agent.id}
                onClick={() => onSelect(agent.id)}
                className={`relative p-2 rounded-lg transition-all ${
                  selected ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                }`}
                style={selected ? { boxShadow: `0 0 12px ${agent.colorHex}20` } : undefined}
                title={agent.name}
              >
                <div className="relative">
                  <AgentAvatar agentId={agent.id} size={28} pulse={running} />
                  {running && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-neon-blue border-[1.5px] border-surface"
                    />
                  )}
                  {!running && done && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-neon-green border-[1.5px] border-surface flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-1.5 h-1.5 text-white" />
                    </motion.div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom slot collapsed (e.g. avatar-only user button) */}
        {bottomSlotCollapsed && (
          <div className="flex-shrink-0 border-t border-white/5 py-2 flex justify-center w-full">
            {bottomSlotCollapsed}
          </div>
        )}
      </div>
    );
  }

  /* ── Vertical sidebar — EXPANDED ──────────────────── */
  return (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Your Team</h2>
        {onRunPipeline && (
          <button
            onClick={onRunPipeline}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium
                       bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-colors"
          >
            <Play className="w-3 h-3" />
            Run All
          </button>
        )}
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto py-1">
        {agents.map((agent, i) => {
          const running = runningAgents.has(agent.id);
          const done = recentlyDone.has(agent.id);
          const selected = selectedAgent === agent.id;
          const lastMsg = lastMessages?.[agent.id];

          if (agent.locked) {
            return (
              <motion.div key={agent.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                <Link href="/pricing" className="flex items-center gap-3 px-4 py-3 mx-1 rounded-lg opacity-30 hover:opacity-45 transition-all">
                  <AgentAvatar agentId={agent.id} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold truncate">{agent.name}</span>
                      <Lock className="w-3 h-3 text-white/20 flex-shrink-0" />
                    </div>
                    <p className="text-[10px] text-white/15 truncate">{agent.role}</p>
                  </div>
                </Link>
              </motion.div>
            );
          }

          return (
            <motion.div key={agent.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
              <button
                onClick={() => onSelect(agent.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 mx-1 rounded-lg text-left transition-all ${
                  selected ? 'bg-white/[0.06] border-l-2'
                  : running ? 'bg-neon-blue/[0.03] hover:bg-neon-blue/[0.06]'
                  : 'hover:bg-white/[0.03]'
                }`}
                style={selected ? { borderLeftColor: agent.colorHex } : undefined}
              >
                <div className="relative flex-shrink-0">
                  <AgentAvatar agentId={agent.id} size={36} pulse={running} />
                  {running && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon-blue border-2 border-surface" />}
                  {!running && done && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-neon-green border-2 border-surface flex items-center justify-center">
                      <CheckCircle2 className="w-2 h-2 text-white" />
                    </motion.div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold truncate">{agent.name}</span>
                    {running ? <Loader2 className="w-3 h-3 text-neon-blue animate-spin flex-shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-neon-green/50 flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] text-white/25 truncate">{running ? 'Working...' : lastMsg || agent.role}</p>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom slot — UserMenu */}
      {bottomSlot && (
        <div className="flex-shrink-0 border-t border-white/5 p-2">
          {bottomSlot}
        </div>
      )}
    </div>
  );
}
