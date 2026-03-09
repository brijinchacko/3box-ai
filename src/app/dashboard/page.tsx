'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Lock, ArrowRight, Clock, Loader2,
  Shield, Target, TrendingUp, Zap, CheckCircle2,
  Brain, FileText, Send, MessageSquare, Trophy, ChevronRight, ChevronDown, Rocket,
} from 'lucide-react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import CortexAvatar from '@/components/brand/CortexAvatar';
import PersonalizedStory from '@/components/dashboard/PersonalizedStory';
import GuidedWorkflow from '@/components/dashboard/GuidedWorkflow';
import { type JourneyProgress } from '@/components/dashboard/CareerJourneyBar';
import { type AgentId } from '@/lib/agents/registry';
import { getAgentsWithStatus, type PlanTier } from '@/lib/agents/permissions';

const NEXT_STEPS: { key: keyof JourneyProgress; label: string; description: string; href: string; icon: any; agentId?: AgentId }[] = [
  { key: 'assessment', label: 'Take AI Skill Assessment', description: 'Discover your strengths and find skill gaps for your target role.', href: '/dashboard/assessment', icon: Brain },
  { key: 'careerPlan', label: 'Generate Career Plan', description: 'Get a personalized roadmap with milestones to reach your goals.', href: '/dashboard/career-plan', icon: Target },
  { key: 'resume', label: 'Build Your Resume', description: 'Agent Forge will craft an ATS-optimized resume tailored to your target role.', href: '/dashboard/resume', icon: FileText, agentId: 'forge' },
  { key: 'applied', label: 'Find & Apply to Jobs', description: 'Agent Scout finds matches, Agent Archer fires off applications.', href: '/dashboard/jobs', icon: Send, agentId: 'scout' },
  { key: 'interview', label: 'Prep for Interviews', description: 'Agent Atlas runs mock interviews tailored to each company.', href: '/dashboard/interview', icon: MessageSquare, agentId: 'atlas' },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanTier>('STARTER');
  const [runningAll, setRunningAll] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [journey, setJourney] = useState<JourneyProgress | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [pipelineStats, setPipelineStats] = useState({
    weeklyApps: 0,
    scamBlocked: 0,
    avgQuality: 0,
    interviewCallbacks: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/user/profile').then(r => r.ok ? r.json() : null),
      fetch('/api/agents/activity?limit=5').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/agents/pipeline-stats').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([profile, actData, stats]) => {
      if (profile) {
        setUserName(profile.name || '');
        setUserImage(profile.image || null);
        setPlan((profile.plan as PlanTier) || 'STARTER');
        if (profile.journey) setJourney(profile.journey);
      }
      if (actData) {
        const list = Array.isArray(actData) ? actData : actData.activities ?? [];
        setActivities(list.slice(0, 5));
      }
      if (stats) {
        setPipelineStats({
          weeklyApps: stats.weeklyApps ?? 0,
          scamBlocked: stats.scamBlocked ?? 0,
          avgQuality: stats.avgQuality ?? 0,
          interviewCallbacks: stats.interviewCallbacks ?? 0,
        });
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

      {/* ───── HERO HEADER ───── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 pt-4"
      >
        <CortexAvatar size={52} pulse />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">
            {loading ? (
              <span className="inline-block w-24 h-7 bg-white/5 rounded animate-pulse align-middle" />
            ) : (
              <>{greeting}, {userName || 'there'}</>
            )}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            {agents.filter(a => !a.locked).length} of {agents.length} agents hired
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
          >
            Hire Agents <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>

      {/* ───── GUIDED WORKFLOW ───── */}
      {!loading && journey && (
        <GuidedWorkflow journey={{
          onboarding: !!journey.onboarding,
          assessment: !!journey.assessment,
          careerPlan: !!journey.careerPlan,
          resume: !!journey.resume,
          applied: !!journey.applied,
          interview: !!journey.interview,
          offer: !!journey.offer,
        }} />
      )}

      {/* ───── NEXT STEP PROMPT ───── */}
      {!loading && journey && (() => {
        const nextStep = NEXT_STEPS.find(s => !journey[s.key]);
        if (!nextStep) return null; // All done
        const allDone = NEXT_STEPS.every(s => journey[s.key]) && journey.offer;
        if (allDone) return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-neon-green/20 bg-gradient-to-r from-neon-green/[0.06] to-neon-blue/[0.04] p-5 flex items-center gap-4"
          >
            <Trophy className="w-8 h-8 text-neon-green flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-neon-green">Mission Complete!</h3>
              <p className="text-xs text-white/50 mt-0.5">You&apos;ve completed every step. Your agents are working for you.</p>
            </div>
          </motion.div>
        );
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Link
              href={nextStep.href}
              className="group block rounded-2xl border border-neon-blue/20 bg-gradient-to-r from-neon-blue/[0.06] to-neon-purple/[0.04] p-4 sm:p-5 hover:border-neon-blue/40 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-neon-blue/10 flex items-center justify-center flex-shrink-0">
                  {nextStep.agentId ? (
                    <AgentAvatar agentId={nextStep.agentId} size={28} />
                  ) : (
                    <nextStep.icon className="w-5 h-5 text-neon-blue" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-neon-blue uppercase tracking-wider">Next Step</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5">{nextStep.label}</h3>
                  <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{nextStep.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-neon-blue group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        );
      })()}

      {/* ───── METRICS/ACTIVITY + STORY (side-by-side) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Metrics + Activity (2/5 width) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quality Metrics */}
          {!loading && plan !== 'BASIC' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Pipeline</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Target className="w-3.5 h-3.5 text-neon-blue" />
                  </div>
                  <div className="text-xl font-bold text-neon-blue">{pipelineStats.weeklyApps}</div>
                  <div className="text-[9px] text-white/30">Apps This Week</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Shield className="w-3.5 h-3.5 text-neon-green" />
                  </div>
                  <div className="text-xl font-bold text-neon-green">{pipelineStats.scamBlocked}</div>
                  <div className="text-[9px] text-white/30">Scams Blocked</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <TrendingUp className="w-3.5 h-3.5 text-neon-purple" />
                  </div>
                  <div className="text-xl font-bold text-neon-purple">{pipelineStats.avgQuality}%</div>
                  <div className="text-[9px] text-white/30">Avg Quality</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <div className="text-xl font-bold text-yellow-400">{pipelineStats.interviewCallbacks}</div>
                  <div className="text-[9px] text-white/30">Callbacks</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Recent Activity */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Recent Activity</h3>
              <Link href="/dashboard/agents" className="text-[10px] text-neon-blue hover:underline flex items-center gap-1">
                All <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2 animate-pulse">
                    <div className="w-6 h-6 rounded-lg bg-white/5" />
                    <div className="flex-1"><div className="h-2.5 bg-white/5 rounded w-3/4" /></div>
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-2">
                {activities.map((item: any, i: number) => (
                  <div key={item.id || i} className="flex items-center gap-2 text-xs">
                    {item.agentId ? (
                      <AgentAvatar agentId={item.agentId as AgentId} size={20} />
                    ) : (
                      <div className="w-5 h-5 rounded bg-white/5" />
                    )}
                    <span className="text-white/60 flex-1 truncate">
                      {item.agentName && <span className="font-medium text-white/80">{item.agentName}</span>}{' '}
                      {item.action}
                    </span>
                    <span className="text-[9px] text-white/20 flex-shrink-0">
                      {item.timestamp ? timeAgo(item.timestamp) : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-white/25">
                <Clock className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
                <p className="text-[11px]">No activity yet. Run your agents to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Story (3/5 width) */}
        <div className="lg:col-span-3">
          <PersonalizedStory userName={userName} userImage={userImage} />
        </div>
      </div>

      {/* ───── DEPLOY SCOUT QUICK ACTION ───── */}
      {!loading && !agents.find(a => a.id === 'scout')?.locked && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/dashboard/jobs?deploy=scout"
            className="group block rounded-2xl border border-neon-blue/15 bg-gradient-to-r from-neon-blue/[0.06] to-cyan-500/[0.04] p-4 hover:border-neon-blue/30 transition-all"
          >
            <div className="flex items-center gap-4">
              <AgentAvatar agentId="scout" size={40} pulse />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white">Deploy Scout</h3>
                <p className="text-xs text-white/40 mt-0.5">Search 6+ platforms for matching jobs right now</p>
              </div>
              <div className="flex items-center gap-2 text-neon-blue">
                <Rocket className="w-4 h-4" />
                <span className="text-xs font-semibold hidden sm:inline">Launch Mission</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* ───── 6 AGENT CARDS (expand in-place) ───── */}
      <div>
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4 text-center">Your Agent Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((agent, i) => {
            const isExpanded = expandedAgent === agent.id;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                {agent.locked ? (
                  <div
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                    className="rounded-xl border border-white/5 bg-white/[0.015] p-4 opacity-50 hover:opacity-70 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <AgentAvatar agentId={agent.id} size={36} sleeping />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{agent.displayName}</span>
                          <Lock className="w-3 h-3 text-white/30" />
                        </div>
                        <p className="text-xs text-white/30">{agent.role}</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-white/20 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <p className="text-xs text-white/40 mb-2">{agent.description}</p>
                            <p className="text-[10px] text-white/25 mb-2 uppercase tracking-wider">Capabilities</p>
                            <div className="space-y-1 mb-3">
                              {agent.capabilities.map((cap: string) => (
                                <div key={cap} className="flex items-center gap-1.5 text-[11px] text-white/35">
                                  <CheckCircle2 className="w-3 h-3 text-white/20 flex-shrink-0" />
                                  {cap}
                                </div>
                              ))}
                            </div>
                            <Link
                              href="/pricing"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-xs text-neon-purple hover:underline font-medium"
                            >
                              Upgrade to {agent.minPlan} <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                    className={`rounded-xl border p-4 transition-all cursor-pointer group ${
                      isExpanded
                        ? 'border-white/15 bg-white/[0.04]'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                    }`}
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
                      <ChevronDown className={`w-4 h-4 text-white/20 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    <p className="text-xs text-white/25 mt-2 pl-12">{agent.shortDescription}</p>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <p className="text-xs text-white/40 mb-3">{agent.description}</p>
                            <p className="text-[10px] text-white/25 mb-2 uppercase tracking-wider">Capabilities</p>
                            <div className="space-y-1 mb-3">
                              {agent.capabilities.map((cap: string) => (
                                <div key={cap} className="flex items-center gap-1.5 text-[11px] text-white/50">
                                  <CheckCircle2 className="w-3 h-3 text-neon-green flex-shrink-0" />
                                  {cap}
                                </div>
                              ))}
                            </div>
                            <Link
                              href={agent.linkedPage}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-blue/10 text-neon-blue text-xs font-medium hover:bg-neon-blue/20 transition-colors"
                            >
                              Open {agent.displayName.split(' ')[1]} <ArrowRight className="w-3 h-3" />
                            </Link>
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
      </div>
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
