'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowRight, Play, Loader2, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import AgentStatusBadge from '@/components/dashboard/AgentStatusBadge';
import AgentActivityLog from '@/components/dashboard/AgentActivityLog';
import { type AgentId, AGENTS } from '@/lib/agents/registry';

interface AgentPageHeaderProps {
  agentId: AgentId;
  statusText?: string;
  onRunNow?: () => void;
}

interface AgentStatus {
  lastRun: string | null;
  todayCount: number;
  status: 'active' | 'idle' | 'running';
}

export default function AgentPageHeader({ agentId, statusText, onRunNow }: AgentPageHeaderProps) {
  const agent = AGENTS[agentId];
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [running, setRunning] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    fetch(`/api/agents/activity?agent=${agentId}&limit=1`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.activities?.length) {
          const last = data.activities[0];
          const ago = getTimeAgo(new Date(last.createdAt));
          setAgentStatus({
            lastRun: ago,
            todayCount: data.todayCount || 0,
            status: 'idle',
          });
        }
      })
      .catch(() => {});
  }, [agentId]);

  const handleRunNow = async () => {
    if (onRunNow) {
      onRunNow();
      return;
    }
    setRunning(true);
    try {
      await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ singleAgent: agentId }),
      });
    } catch {}
    setTimeout(() => setRunning(false), 3000);
  };

  const statusMessage = statusText || getDefaultStatus(agentId, agentStatus);

  // Derive status badge value
  const badgeStatus = running ? 'working' : (agentStatus ? 'idle' : 'idle');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl border border-white/5 bg-gradient-to-r from-white/[0.02] to-white/[0.04] overflow-hidden"
    >
      {/* Main header row */}
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <AgentAvatar agentId={agentId} size={40} pulse={running} sleeping={!running} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{agent.displayName}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${agent.color} bg-white/5`}>
                {agent.role}
              </span>
              <AgentStatusBadge status={badgeStatus} size="sm" />
            </div>
            <p className="text-xs text-white/40 mt-0.5 flex items-center gap-1.5">
              {statusMessage}
              {agentStatus?.lastRun && (
                <span className="flex items-center gap-1 text-white/25">
                  <Clock className="w-3 h-3" />
                  {agentStatus.lastRun}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowActivity(!showActivity)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showActivity
                ? 'bg-white/10 text-white'
                : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Activity
            {showActivity ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            onClick={handleRunNow}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all disabled:opacity-40"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {running ? 'Running...' : 'Run Now'}
          </button>
          <Link
            href="/dashboard/agents"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            Agent Details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Collapsible Activity Log */}
      <AnimatePresence>
        {showActivity && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-4 py-3 max-h-[400px] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Recent Activity</h4>
              </div>
              <AgentActivityLog agentId={agentId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function getDefaultStatus(agentId: AgentId, status: AgentStatus | null): string {
  const messages: Record<AgentId, string> = {
    scout: status?.todayCount ? `Found ${status.todayCount} matches today` : 'Watching for new jobs...',
    forge: 'Ready to optimize your resume',
    archer: 'Ready to send applications',
    atlas: 'Interview prep standing by',
    sage: 'Monitoring your skill gaps',
    sentinel: 'Reviewing application quality',
  };
  return messages[agentId] || 'Agent standing by';
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
