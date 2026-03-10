'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Lock, ArrowRight, Clock, Loader2 } from 'lucide-react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import CortexAvatar from '@/components/brand/CortexAvatar';
import { type AgentId } from '@/lib/agents/registry';
import { getAgentsWithStatus, type PlanTier } from '@/lib/agents/permissions';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [plan, setPlan] = useState<PlanTier>('STARTER');
  const [runningAll, setRunningAll] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/user/profile').then(r => r.ok ? r.json() : null),
      fetch('/api/agents/activity?limit=10').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([profile, actData]) => {
      if (profile) {
        setUserName(profile.name || '');
        setPlan((profile.plan as PlanTier) || 'STARTER');
      }
      if (actData) {
        const list = Array.isArray(actData) ? actData : actData.activities ?? [];
        setActivities(list.slice(0, 10));
      }
      setLoading(false);
    });
  }, []);

  const agents = getAgentsWithStatus(plan);
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const handleRunAll = async () => {
    setRunningAll(true);
    try {
      await fetch('/api/agents/run', { method: 'POST' });
    } catch {}
    setTimeout(() => setRunningAll(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ───── HEADER ───── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-4"
      >
        <CortexAvatar size={48} pulse />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">
            {loading ? (
              <span className="inline-block w-24 h-7 bg-white/5 rounded animate-pulse align-middle" />
            ) : (
              <>{greeting}, {userName || 'there'}</>
            )}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">Your AI career team</p>
        </div>
        <button
          onClick={handleRunAll}
          disabled={runningAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold text-sm
                     shadow-lg shadow-neon-blue/20 hover:shadow-neon-blue/40
                     transition-all disabled:opacity-50"
        >
          {runningAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span className="hidden sm:inline">{runningAll ? 'Running...' : 'Run All'}</span>
        </button>
      </motion.div>

      {/* ───── AGENT CARDS (2x3 grid) ───── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              {agent.locked ? (
                <Link
                  href="/pricing"
                  className="block rounded-xl border border-white/5 bg-white/[0.015] p-4 opacity-50 hover:opacity-70 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <AgentAvatar agentId={agent.id} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{agent.displayName}</span>
                        <Lock className="w-3 h-3 text-white/30" />
                      </div>
                      <p className="text-xs text-white/30">{agent.role}</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/20 mt-2 pl-12">
                    Upgrade to {agent.minPlan} to activate
                  </p>
                </Link>
              ) : (
                <Link
                  href={agent.linkedPage}
                  className="block rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/15 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <AgentAvatar agentId={agent.id} size={36} pulse />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{agent.displayName}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                      </div>
                      <p className="text-xs text-white/40">{agent.role}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/15 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-white/25 mt-2 pl-12">{agent.shortDescription}</p>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ───── RECENT ACTIVITY ───── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-white/5 bg-white/[0.02] p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/50">Recent Activity</h2>
          <Link href="/dashboard/agents" className="text-xs text-neon-blue hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-6 h-6 rounded-lg bg-white/5" />
                <div className="flex-1"><div className="h-3 bg-white/5 rounded w-3/4" /></div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((item: any, i: number) => (
              <div key={item.id || i} className="flex items-center gap-3 text-sm">
                {item.agentId ? (
                  <AgentAvatar agentId={item.agentId as AgentId} size={22} />
                ) : (
                  <div className="w-5.5 h-5.5 rounded bg-white/5" />
                )}
                <span className="text-white/60 flex-1 truncate">
                  {item.agentName && <span className="font-medium text-white/80">{item.agentName}</span>}{' '}
                  {item.action}
                </span>
                <span className="text-[10px] text-white/20 flex-shrink-0">
                  {item.timestamp ? timeAgo(item.timestamp) : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-white/25">
            <Clock className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No activity yet. Run your agents to get started.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function timeAgo(ts: string): string {
  try {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return ''; }
}
