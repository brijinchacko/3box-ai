'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Lock, Clock, Loader2, ChevronDown, Settings2,
  Search, Hammer, Target, Compass, BookOpen, Shield,
} from 'lucide-react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import CortexAvatar from '@/components/brand/CortexAvatar';
import { AGENTS, type AgentId } from '@/lib/agents/registry';
import { getAgentsWithStatus, type PlanTier } from '@/lib/agents/permissions';

/* ── Per-agent config fields ── */
const AGENT_CONFIGS: Record<AgentId, { fields: { key: string; label: string; type: 'text' | 'select' | 'toggle'; placeholder?: string; options?: string[] }[] }> = {
  scout: {
    fields: [
      { key: 'targetRole', label: 'Target Role', type: 'text', placeholder: 'e.g. Senior Frontend Developer' },
      { key: 'location', label: 'Location', type: 'text', placeholder: 'e.g. Remote, Bangalore' },
      { key: 'jobType', label: 'Job Type', type: 'select', options: ['Any', 'Remote', 'Hybrid', 'On-site'] },
    ],
  },
  forge: {
    fields: [
      { key: 'optimizeFor', label: 'Optimize For', type: 'select', options: ['ATS Score', 'Readability', 'Keywords'] },
      { key: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Creative', 'Technical'] },
    ],
  },
  archer: {
    fields: [
      { key: 'autoApply', label: 'Auto-Apply', type: 'toggle' },
      { key: 'dailyLimit', label: 'Max Apps/Day', type: 'text', placeholder: '10' },
      { key: 'coverLetter', label: 'Cover Letter', type: 'select', options: ['Always', 'When Required', 'Never'] },
    ],
  },
  atlas: {
    fields: [
      { key: 'company', label: 'Prep for Company', type: 'text', placeholder: 'e.g. Google, TCS' },
      { key: 'interviewType', label: 'Interview Type', type: 'select', options: ['Technical', 'Behavioral', 'HR', 'All'] },
    ],
  },
  sage: {
    fields: [
      { key: 'focusSkill', label: 'Focus Skill', type: 'text', placeholder: 'e.g. React, System Design' },
      { key: 'learningStyle', label: 'Learning Style', type: 'select', options: ['Quick Tasks', 'Deep Dive', 'Project-Based'] },
    ],
  },
  sentinel: {
    fields: [
      { key: 'qualityThreshold', label: 'Quality Threshold', type: 'select', options: ['Strict', 'Balanced', 'Lenient'] },
      { key: 'checkScam', label: 'Scam Detection', type: 'toggle' },
    ],
  },
};

const AGENT_ICONS: Record<AgentId, any> = {
  scout: Search, forge: Hammer, archer: Target,
  atlas: Compass, sage: BookOpen, sentinel: Shield,
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [plan, setPlan] = useState<PlanTier>('STARTER');
  const [runningAll, setRunningAll] = useState(false);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<AgentId | null>(null);
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>({});

  // Load saved configs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('3box_agent_configs');
      if (saved) setConfigs(JSON.parse(saved));
    } catch {}
  }, []);

  // Save configs to localStorage
  const updateConfig = useCallback((agentId: string, key: string, value: string) => {
    setConfigs(prev => {
      const next = { ...prev, [agentId]: { ...prev[agentId], [key]: value } };
      localStorage.setItem('3box_agent_configs', JSON.stringify(next));
      return next;
    });
  }, []);

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
    try { await fetch('/api/agents/run', { method: 'POST' }); } catch {}
    setTimeout(() => setRunningAll(false), 3000);
  };

  const handleRunAgent = async (agentId: string) => {
    setRunningAgent(agentId);
    try {
      await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, config: configs[agentId] || {} }),
      });
    } catch {}
    setTimeout(() => setRunningAgent(null), 3000);
  };

  return (
    <div className="space-y-6">

      {/* ───── HEADER ───── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <CortexAvatar size={44} pulse />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold">
            {loading ? (
              <span className="inline-block w-32 h-6 bg-white/5 rounded animate-pulse" />
            ) : (
              <>{greeting}, {userName || 'there'}</>
            )}
          </h1>
          <p className="text-white/35 text-sm">Workspace</p>
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
          <span className="hidden sm:inline">{runningAll ? 'Running...' : 'Run Pipeline'}</span>
        </button>
      </motion.div>

      {/* ───── AGENT WORKSPACE ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {agents.map((agent, i) => {
          const isExpanded = expandedAgent === agent.id;
          const isRunning = runningAgent === agent.id || runningAll;
          const agentConfig = configs[agent.id] || {};
          const configDef = AGENT_CONFIGS[agent.id as AgentId];
          const Icon = AGENT_ICONS[agent.id as AgentId];
          const recentForAgent = activities.filter(a => a.agentId === agent.id).slice(0, 3);

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              className={isExpanded ? 'sm:col-span-2 lg:col-span-3' : ''}
            >
              {agent.locked ? (
                /* ── Locked agent ── */
                <Link
                  href="/pricing"
                  className="block rounded-xl border border-white/5 bg-white/[0.015] p-4 opacity-40 hover:opacity-60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <AgentAvatar agentId={agent.id} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{agent.name}</span>
                        <Lock className="w-3 h-3 text-white/30" />
                      </div>
                      <p className="text-[11px] text-white/25">{agent.role}</p>
                    </div>
                  </div>
                </Link>
              ) : (
                /* ── Active agent card ── */
                <div
                  className={`rounded-xl border transition-all cursor-pointer ${
                    isExpanded
                      ? 'border-white/15 bg-white/[0.04]'
                      : isRunning
                        ? 'border-neon-blue/20 bg-neon-blue/[0.04]'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Card header — always visible */}
                  <div
                    className="p-4 flex items-center gap-3"
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id as AgentId)}
                  >
                    <AgentAvatar agentId={agent.id} size={32} pulse={isRunning} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{agent.name}</span>
                        {isRunning ? (
                          <span className="flex items-center gap-1 text-[10px] text-neon-blue font-medium">
                            <Loader2 className="w-3 h-3 animate-spin" /> Working
                          </span>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-neon-green/60" />
                        )}
                      </div>
                      <p className="text-[11px] text-white/30">{agent.role}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/20 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Expanded panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
                          {/* Description */}
                          <p className="text-xs text-white/40 leading-relaxed">{agent.description}</p>

                          {/* Capabilities */}
                          <div className="flex flex-wrap gap-1.5">
                            {agent.capabilities.map((cap: string) => (
                              <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                                {cap}
                              </span>
                            ))}
                          </div>

                          {/* Configuration */}
                          {configDef && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                                <Settings2 className="w-3 h-3" /> Configure
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {configDef.fields.map(field => (
                                  <div key={field.key}>
                                    <label className="text-[10px] text-white/30 mb-1 block">{field.label}</label>
                                    {field.type === 'text' && (
                                      <input
                                        type="text"
                                        value={agentConfig[field.key] || ''}
                                        onChange={e => updateConfig(agent.id, field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/15 transition-colors"
                                      />
                                    )}
                                    {field.type === 'select' && (
                                      <select
                                        value={agentConfig[field.key] || field.options?.[0] || ''}
                                        onChange={e => updateConfig(agent.id, field.key, e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-sm text-white focus:outline-none focus:border-white/15 transition-colors"
                                      >
                                        {field.options?.map(opt => (
                                          <option key={opt} value={opt} className="bg-surface text-white">{opt}</option>
                                        ))}
                                      </select>
                                    )}
                                    {field.type === 'toggle' && (
                                      <button
                                        onClick={() => updateConfig(agent.id, field.key, agentConfig[field.key] === 'true' ? 'false' : 'true')}
                                        className={`w-10 h-5 rounded-full transition-colors relative ${
                                          agentConfig[field.key] === 'true' ? 'bg-neon-green/40' : 'bg-white/10'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${
                                          agentConfig[field.key] === 'true' ? 'left-5' : 'left-0.5'
                                        }`} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleRunAgent(agent.id)}
                              disabled={isRunning}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                                isRunning
                                  ? 'bg-white/5 text-white/50'
                                  : 'bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 text-white hover:from-neon-blue/30 hover:to-neon-purple/30'
                              }`}
                            >
                              {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                              {isRunning ? 'Running...' : `Run ${agent.name}`}
                            </button>
                          </div>

                          {/* Recent activity for this agent */}
                          {recentForAgent.length > 0 && (
                            <div className="pt-2 border-t border-white/5">
                              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Recent</p>
                              <div className="space-y-1.5">
                                {recentForAgent.map((item: any, idx: number) => (
                                  <div key={item.id || idx} className="flex items-center gap-2 text-[11px] text-white/40">
                                    <span className="flex-1 truncate">{item.action}</span>
                                    <span className="text-white/15 flex-shrink-0">{item.timestamp ? timeAgo(item.timestamp) : ''}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ───── ACTIVITY FEED ───── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-xl border border-white/5 bg-white/[0.02] p-5"
      >
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Activity</h2>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 rounded bg-white/5" />
                <div className="flex-1"><div className="h-3 bg-white/5 rounded w-3/4" /></div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-2.5">
            {activities.map((item: any, i: number) => (
              <div key={item.id || i} className="flex items-center gap-3 text-sm">
                {item.agentId ? (
                  <AgentAvatar agentId={item.agentId as AgentId} size={20} />
                ) : (
                  <div className="w-5 h-5 rounded bg-white/5" />
                )}
                <span className="text-white/50 flex-1 truncate">
                  {item.agentName && <span className="font-medium text-white/70">{item.agentName}</span>}{' '}
                  {item.action}
                </span>
                <span className="text-[10px] text-white/15 flex-shrink-0">
                  {item.timestamp ? timeAgo(item.timestamp) : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-white/20">
            <Clock className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
            <p className="text-xs">No activity yet. Run your agents to get started.</p>
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
