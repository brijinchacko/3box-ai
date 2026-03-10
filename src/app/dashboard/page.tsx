'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Lock, Clock, Loader2, Settings2, CheckCircle2, ArrowRight, ChevronDown,
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

interface CompletedTask {
  id: string;
  agentId: AgentId;
  agentName: string;
  result: string;
  timestamp: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [plan, setPlan] = useState<PlanTier>('STARTER');
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('3box_agent_configs');
      if (saved) setConfigs(JSON.parse(saved));
    } catch {}
  }, []);

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
      fetch('/api/agents/activity?limit=15').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([profile, actData]) => {
      if (profile) {
        setUserName(profile.name || '');
        setPlan((profile.plan as PlanTier) || 'STARTER');
      }
      if (actData) {
        const list = Array.isArray(actData) ? actData : actData.activities ?? [];
        setActivities(list.slice(0, 15));
      }
      setLoading(false);
    });
  }, []);

  const agents = getAgentsWithStatus(plan);
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const handleRunAgent = useCallback(async (agentId: string) => {
    const agent = AGENTS[agentId as AgentId];
    if (!agent) return;

    setRunningAgents(prev => new Set(prev).add(agentId));
    try {
      await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, config: configs[agentId] || {} }),
      });
    } catch {}

    // Agent finishes → move back home, add completed task
    setTimeout(() => {
      setRunningAgents(prev => {
        const next = new Set(prev);
        next.delete(agentId);
        return next;
      });
      setCompletedTasks(prev => [{
        id: `${agentId}-${Date.now()}`,
        agentId: agentId as AgentId,
        agentName: agent.name,
        result: `${agent.name} completed task successfully`,
        timestamp: Date.now(),
      }, ...prev].slice(0, 20));
    }, 4000);
  }, [configs]);

  const handleRunAll = useCallback(async () => {
    const unlocked = agents.filter(a => !a.locked);
    for (const agent of unlocked) {
      handleRunAgent(agent.id);
      await new Promise(r => setTimeout(r, 600)); // Stagger starts
    }
  }, [agents, handleRunAgent]);

  const isRunning = (id: string) => runningAgents.has(id);
  const workingAgents = agents.filter(a => !a.locked && isRunning(a.id));

  return (
    <div className="space-y-0">

      {/* ───── HEADER ───── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <CortexAvatar size={40} pulse />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold">
            {loading ? (
              <span className="inline-block w-32 h-5 bg-white/5 rounded animate-pulse" />
            ) : (
              <>{greeting}, {userName || 'there'}</>
            )}
          </h1>
          <p className="text-white/30 text-xs">Workspace</p>
        </div>
        <button
          onClick={handleRunAll}
          disabled={runningAgents.size > 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold text-sm
                     shadow-lg shadow-neon-blue/20 hover:shadow-neon-blue/40
                     transition-all disabled:opacity-50"
        >
          {runningAgents.size > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span className="hidden sm:inline">{runningAgents.size > 0 ? 'Running...' : 'Run Pipeline'}</span>
        </button>
      </motion.div>

      {/* ───── MAIN LAYOUT: Agent Home (left) + Workspace (right) ───── */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* ══════ LEFT: AGENT HOME ══════ */}
        <div className="lg:w-64 flex-shrink-0">
          {/* Mobile: horizontal scroll, Desktop: vertical stack */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1">
            {agents.map((agent, i) => {
              const running = isRunning(agent.id);
              const selected = selectedAgent === agent.id;
              const lastDone = completedTasks.find(t => t.agentId === agent.id);

              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                  className="flex-shrink-0 lg:flex-shrink"
                >
                  {agent.locked ? (
                    <Link
                      href="/pricing"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/5 bg-white/[0.015] opacity-40 hover:opacity-60 transition-all min-w-[180px] lg:min-w-0"
                    >
                      <AgentAvatar agentId={agent.id} size={28} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold truncate">{agent.name}</span>
                          <Lock className="w-3 h-3 text-white/20 flex-shrink-0" />
                        </div>
                        <p className="text-[10px] text-white/20 truncate">{agent.role}</p>
                      </div>
                    </Link>
                  ) : (
                    <button
                      onClick={() => setSelectedAgent(selected ? null : agent.id as AgentId)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left min-w-[180px] lg:min-w-0 ${
                        selected
                          ? 'border-white/15 bg-white/[0.06]'
                          : running
                            ? 'border-neon-blue/20 bg-neon-blue/[0.04]'
                            : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="relative">
                        <AgentAvatar agentId={agent.id} size={28} pulse={running} />
                        {/* Working indicator — agent "leaves home" */}
                        {running && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon-blue border-2 border-surface"
                          />
                        )}
                        {/* Done indicator */}
                        {!running && lastDone && (Date.now() - lastDone.timestamp) < 60000 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon-green border-2 border-surface flex items-center justify-center"
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
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ══════ RIGHT: WORKSPACE ══════ */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Active Work — agents currently in the workspace */}
          <AnimatePresence>
            {workingAgents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <h3 className="text-[10px] font-semibold text-neon-blue/60 uppercase tracking-wider">Working Now</h3>
                {workingAgents.map(agent => (
                  <motion.div
                    key={`working-${agent.id}`}
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="rounded-xl border border-neon-blue/15 bg-gradient-to-r from-neon-blue/[0.06] to-transparent p-4 flex items-center gap-4"
                  >
                    <AgentAvatar agentId={agent.id} size={36} pulse />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{agent.name} <span className="text-white/30 font-normal">is working</span></p>
                      <p className="text-[11px] text-white/30 mt-0.5">{agent.shortDescription}</p>
                      {/* Progress bar */}
                      <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-purple"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 4, ease: 'easeInOut' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completed Work — recent results */}
          <AnimatePresence>
            {completedTasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <h3 className="text-[10px] font-semibold text-neon-green/60 uppercase tracking-wider">Done</h3>
                {completedTasks.slice(0, 6).map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-xl border border-neon-green/10 bg-neon-green/[0.03] px-4 py-3 flex items-center gap-3"
                  >
                    <AgentAvatar agentId={task.agentId} size={24} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/60">
                        <span className="font-semibold text-white/80">{task.agentName}</span>{' '}
                        completed task
                      </p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-neon-green/60 flex-shrink-0" />
                    <span className="text-[10px] text-white/20 flex-shrink-0">{timeAgo(task.timestamp)}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agent Config Panel — shown when agent is selected from home */}
          <AnimatePresence>
            {selectedAgent && !agents.find(a => a.id === selectedAgent)?.locked && (
              <motion.div
                key={`config-${selectedAgent}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4"
              >
                {(() => {
                  const agent = AGENTS[selectedAgent];
                  const configDef = AGENT_CONFIGS[selectedAgent];
                  const agentConfig = configs[selectedAgent] || {};
                  const running = isRunning(selectedAgent);

                  return (
                    <>
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <AgentAvatar agentId={selectedAgent} size={36} pulse={running} />
                        <div className="flex-1">
                          <h3 className="text-sm font-bold">{agent.name}</h3>
                          <p className="text-[11px] text-white/30">{agent.role}</p>
                        </div>
                        <button
                          onClick={() => handleRunAgent(selectedAgent)}
                          disabled={running}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50
                                     bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 text-white hover:from-neon-blue/30 hover:to-neon-purple/30"
                        >
                          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                          {running ? 'Working...' : `Run ${agent.name}`}
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-white/35 leading-relaxed">{agent.description}</p>

                      {/* Capabilities */}
                      <div className="flex flex-wrap gap-1.5">
                        {agent.capabilities.map(cap => (
                          <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/35">{cap}</span>
                        ))}
                      </div>

                      {/* Config fields */}
                      {configDef && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/25 uppercase tracking-wider">
                            <Settings2 className="w-3 h-3" /> Configuration
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {configDef.fields.map(field => (
                              <div key={field.key}>
                                <label className="text-[10px] text-white/25 mb-1 block">{field.label}</label>
                                {field.type === 'text' && (
                                  <input
                                    type="text"
                                    value={agentConfig[field.key] || ''}
                                    onChange={e => updateConfig(selectedAgent, field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/15"
                                  />
                                )}
                                {field.type === 'select' && (
                                  <select
                                    value={agentConfig[field.key] || field.options?.[0] || ''}
                                    onChange={e => updateConfig(selectedAgent, field.key, e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-sm text-white focus:outline-none focus:border-white/15"
                                  >
                                    {field.options?.map(opt => (
                                      <option key={opt} value={opt} className="bg-surface text-white">{opt}</option>
                                    ))}
                                  </select>
                                )}
                                {field.type === 'toggle' && (
                                  <button
                                    onClick={() => updateConfig(selectedAgent, field.key, agentConfig[field.key] === 'true' ? 'false' : 'true')}
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
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty workspace state */}
          {workingAgents.length === 0 && completedTasks.length === 0 && !selectedAgent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-dashed border-white/5 p-8 text-center"
            >
              <CortexAvatar size={48} />
              <p className="text-sm text-white/25 mt-3">
                Select an agent to configure, or hit <span className="text-white/50 font-medium">Run Pipeline</span> to start
              </p>
            </motion.div>
          )}

          {/* Activity Feed */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <h3 className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-3">Activity Log</h3>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-5 h-5 rounded bg-white/5" />
                    <div className="flex-1"><div className="h-2.5 bg-white/5 rounded w-3/4" /></div>
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-2">
                {activities.map((item: any, i: number) => (
                  <div key={item.id || i} className="flex items-center gap-2.5 text-xs">
                    {item.agentId ? (
                      <AgentAvatar agentId={item.agentId as AgentId} size={18} />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded bg-white/5" />
                    )}
                    <span className="text-white/45 flex-1 truncate">
                      {item.agentName && <span className="font-medium text-white/60">{item.agentName}</span>}{' '}
                      {item.action}
                    </span>
                    <span className="text-[9px] text-white/15 flex-shrink-0">
                      {item.timestamp ? timeAgo(item.timestamp) : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-white/15">
                <Clock className="w-4 h-4 mx-auto mb-1 opacity-40" />
                <p className="text-[11px]">No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function timeAgo(ts: string | number): string {
  try {
    const diff = Date.now() - (typeof ts === 'number' ? ts : new Date(ts).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return ''; }
}
