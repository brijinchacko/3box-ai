'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import { AGENTS, type AgentId } from '@/lib/agents/registry';

export interface TimelineEntry {
  id: string;
  agentId: string;
  action: string;
  summary: string;
  timestamp: string;
}

interface DailyTimelineProps {
  entries: TimelineEntry[];
  loading: boolean;
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function DailyTimeline({ entries, loading }: DailyTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Today&apos;s Activity</h3>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-12 h-3 bg-white/5 rounded" />
            <div className="w-4 h-4 rounded-full bg-white/5" />
            <div className="flex-1 h-3 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-5 h-5 mx-auto text-white/15 mb-2" />
        <p className="text-xs text-white/20">No activity yet today</p>
        <p className="text-[10px] text-white/10 mt-1">Run your agents to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h3 className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-3">Today&apos;s Activity</h3>
      <div className="space-y-0.5 max-h-[500px] overflow-y-auto pr-1">
        {entries.map((entry, i) => {
          const agent = AGENTS[entry.agentId as AgentId];
          const colorHex = agent?.colorHex || '#666';

          return (
            <motion.div
              key={entry.id || i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.03 * i }}
              className="flex items-start gap-2.5 py-1.5 group"
            >
              {/* Time */}
              <span className="text-[9px] text-white/15 w-12 flex-shrink-0 pt-0.5 text-right font-mono">
                {formatTime(entry.timestamp)}
              </span>

              {/* Dot + line */}
              <div className="flex flex-col items-center flex-shrink-0 pt-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colorHex }}
                />
                {i < entries.length - 1 && (
                  <div className="w-px h-full min-h-[16px] bg-white/5 mt-0.5" />
                )}
              </div>

              {/* Content */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {agent && <AgentAvatar agentId={entry.agentId as AgentId} size={16} />}
                <p className="text-[11px] text-white/40 truncate group-hover:text-white/60 transition-colors">
                  <span className="text-white/55 font-medium">{agent?.name || entry.agentId}</span>{' '}
                  {entry.summary || entry.action}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
