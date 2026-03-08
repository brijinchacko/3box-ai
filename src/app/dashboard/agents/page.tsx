'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, Hammer, Target, Compass, BookOpen, Shield,
  Brain, Rocket, Lock, ChevronDown, ChevronRight, Settings2,
  Play, Clock, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, RefreshCw, Zap, Crown, Activity,
  MapPin, Building2, Filter, Timer, ToggleLeft, ToggleRight,
  TrendingUp, Send, Eye, FileCheck, GraduationCap, ShieldCheck
} from 'lucide-react';
import AgentAvatar, { AgentAvatarMini } from '@/components/brand/AgentAvatar';
import CortexLoader from '@/components/brand/CortexLoader';
import CortexAvatar from '@/components/brand/CortexAvatar';
import { AGENTS, AGENT_LIST, COORDINATOR, type AgentId, AUTOMATION_MODES, AUTOMATION_MODE_LIST } from '@/lib/agents/registry';

const PIPELINE_STAGES: Array<{
  key: string;
  label: string;
  icon: any;
  color: string;
  agentId?: AgentId;
}> = [
  { key: 'discovered', label: 'Discovered', icon: Search, color: 'text-blue-400', agentId: 'scout' },
  { key: 'optimized', label: 'Optimized', icon: FileCheck, color: 'text-orange-400', agentId: 'forge' },
  { key: 'applied', label: 'Applied', icon: Send, color: 'text-green-400', agentId: 'archer' },
  { key: 'reviewed', label: 'Reviewed', icon: ShieldCheck, color: 'text-rose-400', agentId: 'sentinel' },
  { key: 'interview', label: 'Interview', icon: GraduationCap, color: 'text-purple-400', agentId: 'atlas' },
  { key: 'offer', label: 'Offer', icon: Crown, color: 'text-yellow-400' },
];

interface AgentDef {
  id: string;
  name: string;
  displayName: string;
  role: string;
  description: string;
  shortDescription: string;
  icon: string;
  color: string;
  gradient: string;
  minPlan: string;
  capabilities: string[];
  locked: boolean;
}

interface AgentConfig {
  enabled: boolean;
  targetRoles: string[];
  targetLocations: string[];
  excludeCompanies: string[];
  excludeKeywords: string[];
  minMatchScore: number;
  maxAppliesPerRun: number;
  preferRemote: boolean;
  scheduleTime: string | null;
}

interface AgentRun {
  id: string;
  status: string;
  jobsFound: number;
  jobsApplied: number;
  jobsSkipped: number;
  creditsUsed: number;
  summary: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface AgentActivityItem {
  id: string;
  agent: string;
  action: string;
  summary: string;
  creditsUsed: number;
  createdAt: string;
}

const STATUS_BADGES: Record<string, { color: string; icon: any }> = {
  RUNNING: { color: 'text-blue-400 bg-blue-400/10', icon: RefreshCw },
  COMPLETED: { color: 'text-neon-green bg-neon-green/10', icon: CheckCircle2 },
  FAILED: { color: 'text-red-400 bg-red-400/10', icon: XCircle },
  PARTIAL: { color: 'text-yellow-400 bg-yellow-400/10', icon: AlertTriangle },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

export default function AgentDashboardPage() {
  const [agents, setAgents] = useState<AgentDef[]>([]);
  const [userPlan, setUserPlan] = useState('BASIC');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<AgentConfig>({
    enabled: false,
    targetRoles: [],
    targetLocations: [],
    excludeCompanies: [],
    excludeKeywords: [],
    minMatchScore: 60,
    maxAppliesPerRun: 5,
    preferRemote: false,
    scheduleTime: null,
  });
  const [configDirty, setConfigDirty] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [activities, setActivities] = useState<AgentActivityItem[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const [hasMoreActivities, setHasMoreActivities] = useState(false);

  // Config form state (as strings for inputs)
  const [targetRolesInput, setTargetRolesInput] = useState('');
  const [targetLocationsInput, setTargetLocationsInput] = useState('');
  const [excludeCompaniesInput, setExcludeCompaniesInput] = useState('');
  const [excludeKeywordsInput, setExcludeKeywordsInput] = useState('');

  // Fetch everything on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [profileRes, configRes, runsRes, activityRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/agents/config'),
          fetch('/api/agents/run?limit=10'),
          fetch('/api/agents/activity?limit=20'),
        ]);

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUserPlan(profile.plan || 'BASIC');

          // Build agents with status
          const agentDefs = buildAgentList(profile.plan || 'BASIC');
          setAgents(agentDefs);
        }

        if (configRes.ok) {
          const cfg = await configRes.json();
          setConfig(cfg);
          setTargetRolesInput((cfg.targetRoles || []).join(', '));
          setTargetLocationsInput((cfg.targetLocations || []).join(', '));
          setExcludeCompaniesInput((cfg.excludeCompanies || []).join(', '));
          setExcludeKeywordsInput((cfg.excludeKeywords || []).join(', '));
        }

        if (runsRes.ok) {
          const runsData = await runsRes.json();
          setRuns(runsData.runs || []);
        }

        if (activityRes.ok) {
          const actData = await activityRes.json();
          setActivities(actData.activities || []);
          setHasMoreActivities(actData.hasMore || false);
        }
      } catch (err) {
        console.error('Failed to load agent dashboard:', err);
      }
      setLoading(false);
    }
    load();
  }, []);

  function buildAgentList(plan: string): AgentDef[] {
    const PLAN_LEVELS: Record<string, number> = { BASIC: 0, STARTER: 1, PRO: 2, ULTRA: 3 };
    const userLevel = PLAN_LEVELS[plan] || 0;

    return AGENT_LIST.map(a => ({
      id: a.id,
      name: a.name,
      displayName: a.displayName,
      role: a.role,
      description: a.description,
      shortDescription: a.shortDescription,
      icon: a.icon,
      color: a.color,
      gradient: a.gradient,
      minPlan: a.minPlan,
      capabilities: a.capabilities,
      locked: userLevel < (PLAN_LEVELS[a.minPlan] || 0),
    }));
  }

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const body = {
        ...config,
        targetRoles: targetRolesInput.split(',').map(s => s.trim()).filter(Boolean),
        targetLocations: targetLocationsInput.split(',').map(s => s.trim()).filter(Boolean),
        excludeCompanies: excludeCompaniesInput.split(',').map(s => s.trim()).filter(Boolean),
        excludeKeywords: excludeKeywordsInput.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await fetch('/api/agents/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        setConfigDirty(false);
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    }
    setSavingConfig(false);
  };

  const runPipeline = async () => {
    setRunningPipeline(true);
    setPipelineResult(null);
    try {
      const res = await fetch('/api/agents/run', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setPipelineResult(data);
        // Refresh runs and activity
        const [runsRes, actRes] = await Promise.all([
          fetch('/api/agents/run?limit=10'),
          fetch('/api/agents/activity?limit=20'),
        ]);
        if (runsRes.ok) setRuns((await runsRes.json()).runs || []);
        if (actRes.ok) {
          const actData = await actRes.json();
          setActivities(actData.activities || []);
          setHasMoreActivities(actData.hasMore || false);
        }
      } else {
        setPipelineResult({ error: data.error || 'Pipeline failed' });
      }
    } catch (err) {
      setPipelineResult({ error: 'Network error' });
    }
    setRunningPipeline(false);
  };

  const loadMoreActivities = async () => {
    const nextPage = activityPage + 1;
    try {
      const res = await fetch(`/api/agents/activity?limit=20&page=${nextPage}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(prev => [...prev, ...(data.activities || [])]);
        setHasMoreActivities(data.hasMore || false);
        setActivityPage(nextPage);
      }
    } catch {}
  };

  const activeAgentCount = agents.filter(a => !a.locked).length;
  const latestRun = runs.length > 0 ? runs[0] : null;

  if (loading) {
    return <CortexLoader message="Assembling your team" />;
  }

  return (
    <div className="space-y-8">
      {/* ── Cortex Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <CortexAvatar size={48} pulse />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Agent Cortex &mdash; Command Center</h1>
            <p className="text-white/40 text-sm">
              One command activates all agents &middot;{' '}
              <span className="text-neon-green">{activeAgentCount} agents active</span>
              {userPlan === 'BASIC' && <span className="text-white/30"> — Upgrade to unlock agents</span>}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Agent Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent, i) => {
          const isExpanded = expandedAgent === agent.id;

          return (
            <motion.div
              key={agent.id}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
              className={`card cursor-pointer transition-all duration-300 relative overflow-hidden ${
                agent.locked
                  ? 'opacity-60 border-white/5'
                  : `border-${agent.color.replace('text-', '')}/20 hover:border-${agent.color.replace('text-', '')}/40`
              }`}
            >
              {/* Background gradient for unlocked agents */}
              {!agent.locked && (
                <div className={`absolute inset-0 bg-gradient-to-br ${agent.gradient} opacity-30`} />
              )}

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  {agent.locked ? (
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/5">
                      <Lock className="w-5 h-5 text-white/30" />
                    </div>
                  ) : (
                    <AgentAvatar agentId={agent.id as AgentId} size={44} />
                  )}
                  <div className="flex items-center gap-2">
                    {agent.locked ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 font-medium">
                        {agent.minPlan}
                      </span>
                    ) : (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon-green" />
                      </span>
                    )}
                  </div>
                </div>

                <h3 className={`font-bold text-lg ${agent.locked ? 'text-white/40' : 'text-white'}`}>
                  {agent.displayName}
                </h3>
                <p className={`text-sm font-medium mb-1 ${agent.locked ? 'text-white/20' : agent.color}`}>
                  {agent.role}
                </p>
                <p className={`text-xs ${agent.locked ? 'text-white/20' : 'text-white/50'}`}>
                  {agent.shortDescription}
                </p>

                {/* Expanded capabilities */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-white/5"
                    >
                      <p className="text-xs text-white/30 mb-2 uppercase tracking-wider">Capabilities</p>
                      <div className="space-y-1.5">
                        {agent.capabilities.map((cap) => (
                          <div key={cap} className="flex items-center gap-2 text-xs text-white/50">
                            <CheckCircle2 className="w-3 h-3 text-neon-green flex-shrink-0" />
                            {cap}
                          </div>
                        ))}
                      </div>
                      {agent.locked && (
                        <Link
                          href="/pricing"
                          className="mt-3 inline-flex items-center gap-1 text-xs text-neon-blue hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          Upgrade to {agent.minPlan} <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Run Agents Section ── */}
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-neon-purple" />
            <h3 className="font-semibold">Run Agent Pipeline</h3>
          </div>
          {latestRun && (
            <span className="text-xs text-white/30">
              Last run: {new Date(latestRun.startedAt).toLocaleDateString()} &middot;{' '}
              {latestRun.jobsFound} found, {latestRun.jobsApplied} applied
            </span>
          )}
        </div>

        {userPlan === 'BASIC' ? (
          <div className="text-center py-6">
            <Lock className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/40 mb-3">Upgrade to Starter or higher to run your AI agents</p>
            <Link href="/pricing" className="btn-primary text-sm inline-flex items-center gap-2">
              <Crown className="w-4 h-4" /> Upgrade Now
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={runPipeline}
              disabled={runningPipeline}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runningPipeline ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Running Pipeline...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" /> Run Agents Now
                </>
              )}
            </button>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-sm text-white/40 hover:text-white/70 flex items-center gap-1.5 transition-colors"
            >
              <Settings2 className="w-4 h-4" /> Configure
              <ChevronDown className={`w-3 h-3 transition-transform ${showConfig ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        {/* Pipeline Result */}
        <AnimatePresence>
          {pipelineResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              {pipelineResult.error ? (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {pipelineResult.error}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-neon-green/10 border border-neon-green/20 text-sm text-neon-green">
                  Pipeline complete! {pipelineResult.jobsFound || 0} jobs found, {pipelineResult.jobsApplied || 0} applied.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Configuration Panel ── */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-6">
              <Settings2 className="w-5 h-5 text-neon-blue" />
              <h3 className="font-semibold">Agent Configuration</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Target Roles (comma separated)</label>
                <input
                  type="text"
                  value={targetRolesInput}
                  onChange={e => { setTargetRolesInput(e.target.value); setConfigDirty(true); }}
                  placeholder="Software Engineer, Frontend Developer"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-neon-blue/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Target Locations (comma separated)</label>
                <input
                  type="text"
                  value={targetLocationsInput}
                  onChange={e => { setTargetLocationsInput(e.target.value); setConfigDirty(true); }}
                  placeholder="Bangalore, Mumbai, Remote"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-neon-blue/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Exclude Companies</label>
                <input
                  type="text"
                  value={excludeCompaniesInput}
                  onChange={e => { setExcludeCompaniesInput(e.target.value); setConfigDirty(true); }}
                  placeholder="Company A, Company B"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-neon-blue/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Exclude Keywords</label>
                <input
                  type="text"
                  value={excludeKeywordsInput}
                  onChange={e => { setExcludeKeywordsInput(e.target.value); setConfigDirty(true); }}
                  placeholder="intern, contract, parttime"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-neon-blue/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">
                  Min Match Score: <span className="text-white font-medium">{config.minMatchScore}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.minMatchScore}
                  onChange={e => { setConfig(c => ({ ...c, minMatchScore: Number(e.target.value) })); setConfigDirty(true); }}
                  className="w-full accent-neon-blue"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">
                  Max Applications: <span className="text-white font-medium">{config.maxAppliesPerRun}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={config.maxAppliesPerRun}
                  onChange={e => { setConfig(c => ({ ...c, maxAppliesPerRun: Number(e.target.value) })); setConfigDirty(true); }}
                  className="w-full accent-neon-blue"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Schedule Time (IST)</label>
                <input
                  type="time"
                  value={config.scheduleTime || ''}
                  onChange={e => { setConfig(c => ({ ...c, scheduleTime: e.target.value || null })); setConfigDirty(true); }}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-neon-blue/50 focus:outline-none transition-colors"
                />
              </div>
              <div className="flex flex-col justify-between">
                <label className="text-xs text-white/40 mb-1.5 block">Preferences</label>
                <div className="space-y-2">
                  <button
                    onClick={() => { setConfig(c => ({ ...c, preferRemote: !c.preferRemote })); setConfigDirty(true); }}
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {config.preferRemote ? (
                      <ToggleRight className="w-5 h-5 text-neon-green" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-white/30" />
                    )}
                    Prefer Remote
                  </button>
                  <button
                    onClick={() => { setConfig(c => ({ ...c, enabled: !c.enabled })); setConfigDirty(true); }}
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {config.enabled ? (
                      <ToggleRight className="w-5 h-5 text-neon-green" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-white/30" />
                    )}
                    Enable Auto-Run
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveConfig}
                disabled={!configDirty || savingConfig}
                className="px-5 py-2 rounded-xl bg-neon-blue/20 text-neon-blue text-sm font-medium hover:bg-neon-blue/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {savingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pipeline Kanban ── */}
      {latestRun && (
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="card">
          <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neon-blue" /> Pipeline Status
          </h3>
          <div className="flex items-center overflow-x-auto pb-2">
            {PIPELINE_STAGES.map((stage, i) => {
              const StageIcon = stage.icon;
              const count = stage.key === 'discovered' ? latestRun.jobsFound
                : stage.key === 'applied' ? latestRun.jobsApplied
                : stage.key === 'reviewed' ? latestRun.jobsApplied
                : 0;
              return (
                <div key={stage.key} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center px-4 py-3 min-w-[100px]">
                    {stage.agentId ? (
                      <div className={`mb-2 ${count > 0 ? 'opacity-100' : 'opacity-30'}`}>
                        <AgentAvatar agentId={stage.agentId} size={24} />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-2 ${count > 0 ? stage.color : 'text-white/20'}`}>
                        <StageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <span className={`text-lg font-bold ${count > 0 ? 'text-white' : 'text-white/20'}`}>
                      {count}
                    </span>
                    <span className="text-[10px] text-white/40">{stage.label}</span>
                  </div>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-white/10 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Activity Feed + Run History Grid ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2">
              <Activity className="w-4 h-4 text-neon-green" /> Agent Activity
            </h3>
          </div>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-white/30">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No agent activity yet</p>
              <p className="text-xs mt-1">Run your agents to see activity here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.map((act) => {
                const agentDef = agents.find(a => a.id === act.agent);
                return (
                  <div key={act.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                    <div className="flex-shrink-0">
                      {agentDef ? (
                        <AgentAvatarMini agentId={agentDef.id as AgentId} size={28} />
                      ) : (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5">
                          <Brain className="w-3.5 h-3.5 text-white/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white/70">{agentDef?.displayName || act.agent}</span>
                        <span className="text-[10px] text-white/30">{act.action.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5 truncate">{act.summary}</p>
                      <span className="text-[10px] text-white/20 mt-0.5 block">
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {act.creditsUsed > 0 && (
                      <span className="text-[10px] text-neon-purple flex-shrink-0">{act.creditsUsed} cr</span>
                    )}
                  </div>
                );
              })}
              {hasMoreActivities && (
                <button
                  onClick={loadMoreActivities}
                  className="w-full py-2 text-xs text-neon-blue hover:underline"
                >
                  Load more...
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Run History */}
        <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible" className="card">
          <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neon-blue" /> Run History
          </h3>
          {runs.length === 0 ? (
            <div className="text-center py-8 text-white/30">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No runs yet</p>
              <p className="text-xs mt-1">Click &quot;Run Agents Now&quot; to start</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {runs.map((run) => {
                const badge = STATUS_BADGES[run.status] || STATUS_BADGES.COMPLETED;
                const BadgeIcon = badge.icon;
                const isExpanded = expandedRun === run.id;
                return (
                  <div key={run.id}>
                    <button
                      onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors text-left"
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${badge.color}`}>
                        <BadgeIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium">
                          {new Date(run.startedAt).toLocaleDateString()} at{' '}
                          {new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-white/30">
                          {run.jobsFound} found &middot; {run.jobsApplied} applied &middot; {run.creditsUsed} credits
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-white/20 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isExpanded && run.summary && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-3 pb-3"
                        >
                          <p className="text-xs text-white/40 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                            {run.summary}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Schedule CTA ── */}
      {userPlan !== 'BASIC' && !config.scheduleTime && (
        <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible">
          <div className="card border border-neon-purple/20 bg-gradient-to-r from-neon-purple/5 to-neon-blue/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center flex-shrink-0">
                <Timer className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-0.5">Let agents work while you sleep</h3>
                <p className="text-sm text-white/40">
                  Set a daily schedule and your agents will automatically discover jobs, optimize resumes, and send applications — all in the background.
                </p>
              </div>
              <button
                onClick={() => setShowConfig(true)}
                className="px-4 py-2 rounded-xl bg-neon-purple/20 text-neon-purple text-sm font-medium hover:bg-neon-purple/30 transition-colors flex-shrink-0"
              >
                Set Schedule
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
