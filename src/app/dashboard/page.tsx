'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import CortexAvatar from '@/components/brand/CortexAvatar';
import AgentTeamStrip from '@/components/dashboard/AgentTeamStrip';
import AgentChat, { type ChatMessage } from '@/components/dashboard/AgentChat';
import InterviewPrepPanel from '@/components/dashboard/InterviewPrepPanel';
import LearningPathPanel from '@/components/dashboard/LearningPathPanel';
import QualityReviewPanel from '@/components/dashboard/QualityReviewPanel';
import ScoutToolbar from '@/components/dashboard/ScoutToolbar';
import ForgeToolbar from '@/components/dashboard/ForgeToolbar';
import ArcherToolbar from '@/components/dashboard/ArcherToolbar';
import DailyTimeline, { type TimelineEntry } from '@/components/dashboard/DailyTimeline';
import MetricsBar from '@/components/dashboard/MetricsBar';
import UserMenu from '@/components/dashboard/UserMenu';
import { AGENTS, COORDINATOR, type AgentId } from '@/lib/agents/registry';
import { getAgentsWithStatus, type PlanTier } from '@/lib/agents/permissions';
import { getInitials } from '@/lib/utils';

/* ── Types ── */
interface Metrics { jobsFound: number; appsSent: number; interviews: number; responseRate: number }

const planBadges: Record<string, { label: string; color: string }> = {
  BASIC:   { label: 'Free',    color: 'text-white/40 bg-white/5' },
  STARTER: { label: 'Starter', color: 'text-neon-green bg-neon-green/10' },
  PRO:     { label: 'Pro',     color: 'text-neon-blue bg-neon-blue/10' },
  ULTRA:   { label: 'Ultra',   color: 'text-neon-purple bg-neon-purple/10' },
};

/* ── Selected agent can include cortex ── */
type SelectedAgentId = AgentId | 'cortex';

/* ── Welcome messages per agent ── */
const WELCOME: Record<SelectedAgentId, string> = {
  scout: "I'm ready to hunt for jobs matching your profile. Hit 'Search Jobs' or tell me what role you're looking for.",
  forge: "I'll optimize your resume for any job. Use 'Optimize Resume' or paste a job description and I'll tailor it.",
  archer: "I can send applications with tailored cover letters. Hit 'Apply to Top Matches' to get started.",
  atlas: "Let me prepare you for interviews. Pick a company or use 'Practice Interview' to start a mock session.",
  sage: "I'll analyze your skill gaps and recommend learning paths. Hit 'Find Skill Gaps' to begin.",
  sentinel: "I review applications for quality and catch issues before they go out. Use 'Review Queue' to check pending items.",
  cortex: "I'm Cortex — your AI team coordinator. I oversee all six agents and can give you a status report or run the full pipeline. What would you like to do?",
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanTier>('STARTER');
  const [selectedAgent, setSelectedAgent] = useState<SelectedAgentId>('scout');
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());
  const [recentlyDone, setRecentlyDone] = useState<Set<string>>(new Set());
  const [agentChats, setAgentChats] = useState<Record<string, ChatMessage[]>>({});
  const [activities, setActivities] = useState<TimelineEntry[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ jobsFound: 0, appsSent: 0, interviews: 0, responseRate: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadedAgents = useRef<Set<string>>(new Set());
  const handleRunPipelineRef = useRef<(() => void) | null>(null);

  /* ── Initial data fetch ── */
  useEffect(() => {
    Promise.all([
      fetch('/api/user/profile').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/agents/activity?limit=30').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/agents/pipeline-stats').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([profile, actData, stats]) => {
      if (profile) {
        setUserName(profile.name || '');
        setUserEmail(profile.email || null);
        setUserImage(profile.image || null);
        setPlan((profile.plan as PlanTier) || 'STARTER');
      }
      if (actData) {
        const list: any[] = Array.isArray(actData) ? actData : actData.activities ?? [];
        setActivities(list.slice(0, 30).map((a: any) => ({
          id: a.id || String(Math.random()),
          agentId: a.agent || a.agentId || '',
          action: a.action || '',
          summary: a.summary || a.action || '',
          timestamp: a.createdAt || a.timestamp || '',
        })));
      }
      if (stats) {
        setMetrics({
          jobsFound: stats.jobsFound ?? stats.totalJobsFound ?? 0,
          appsSent: stats.applicationsSent ?? stats.totalApplied ?? 0,
          interviews: stats.interviews ?? stats.interviewsScheduled ?? 0,
          responseRate: stats.responseRate ?? 0,
        });
      }
      setLoading(false);
    });
  }, []);

  const agents = getAgentsWithStatus(plan);
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const initials = getInitials(userName || 'User');
  const badge = planBadges[plan] || planBadges.BASIC;

  /* ── Persist a message to DB (fire-and-forget) ── */
  const persistMsg = useCallback((agentId: string, msg: ChatMessage) => {
    if (msg.role === 'system') return;
    fetch('/api/agents/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, role: msg.role, content: msg.content, type: msg.type, data: msg.data }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(saved => {
        if (saved?.id) {
          setAgentChats(prev => ({
            ...prev,
            [agentId]: (prev[agentId] || []).map(m => m.id === msg.id ? { ...m, id: saved.id } : m),
          }));
        }
      })
      .catch(() => {});
  }, []);

  /* ── Chat helpers ── */
  const addMessage = useCallback((agentId: SelectedAgentId, msg: ChatMessage) => {
    setAgentChats(prev => ({ ...prev, [agentId]: [...(prev[agentId] || []), msg] }));
    persistMsg(agentId, msg);
  }, [persistMsg]);

  const createMsg = (agentId: SelectedAgentId, role: 'agent' | 'user' | 'system', content: string, type: ChatMessage['type'] = 'text', data?: any): ChatMessage => ({
    id: `${agentId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role, content, type, data, feedback: null, timestamp: Date.now(),
  });

  /* ── Load chat history from DB ── */
  useEffect(() => {
    if (!selectedAgent) return;
    if (loadedAgents.current.has(selectedAgent)) return;
    loadedAgents.current.add(selectedAgent);

    fetch(`/api/agents/chat?agentId=${selectedAgent}&limit=50`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.messages?.length) {
          setAgentChats(prev => ({ ...prev, [selectedAgent]: data.messages }));
        } else {
          const welcome = WELCOME[selectedAgent as SelectedAgentId];
          if (welcome) {
            const msg: ChatMessage = { id: `welcome-${selectedAgent}`, role: 'agent', content: welcome, type: 'text', feedback: null, timestamp: Date.now() };
            setAgentChats(prev => ({ ...prev, [selectedAgent]: [msg] }));
            persistMsg(selectedAgent, msg);
          }
        }
      })
      .catch(() => {
        const welcome = WELCOME[selectedAgent as SelectedAgentId];
        if (welcome) {
          setAgentChats(prev => ({ ...prev, [selectedAgent]: [{ id: `welcome-${selectedAgent}`, role: 'agent', content: welcome, type: 'text', feedback: null, timestamp: Date.now() }] }));
        }
      });
  }, [selectedAgent, persistMsg]);

  /* ── Agent run handler ── */
  const handleRunAgent = useCallback(async (agentId: AgentId) => {
    const agent = AGENTS[agentId];
    if (!agent) return;
    setRunningAgents(prev => new Set(prev).add(agentId));
    addMessage(agentId, createMsg(agentId, 'system', `${agent.name} started working...`));

    try {
      const res = await fetch('/api/agents/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId }) });
      const data = await res.json().catch(() => null);
      if (data?.error) addMessage(agentId, createMsg(agentId, 'agent', data.error || 'Something went wrong.'));
      else addMessage(agentId, createMsg(agentId, 'agent', data?.summary || `Done! ${agent.name} completed the task.`));
    } catch { addMessage(agentId, createMsg(agentId, 'agent', 'Connection error. Please try again.')); }

    setRunningAgents(prev => { const n = new Set(prev); n.delete(agentId); return n; });
    setRecentlyDone(prev => new Set(prev).add(agentId));
    setTimeout(() => { setRecentlyDone(prev => { const n = new Set(prev); n.delete(agentId); return n; }); }, 30000);

    fetch('/api/agents/activity?limit=30').then(r => r.ok ? r.json() : null).then(actData => {
      if (actData) {
        const list: any[] = Array.isArray(actData) ? actData : actData.activities ?? [];
        setActivities(list.slice(0, 30).map((a: any) => ({ id: a.id || String(Math.random()), agentId: a.agent || a.agentId || '', action: a.action || '', summary: a.summary || a.action || '', timestamp: a.createdAt || a.timestamp || '' })));
      }
    }).catch(() => {});
  }, [addMessage]);

  /* ── Quick action handler ── */
  const handleQuickAction = useCallback(async (agentId: SelectedAgentId, action: string) => {
    /* Cortex-specific quick actions */
    if (agentId === 'cortex') {
      if (action === 'pipeline') {
        addMessage('cortex', createMsg('cortex', 'system', 'Running full pipeline...'));
        handleRunPipelineRef.current?.();
        return;
      }
      if (action === 'status') {
        const unlocked = agents.filter(a => !a.locked);
        const running = [...runningAgents];
        const status = unlocked.map(a => `• ${AGENTS[a.id as AgentId].name}: ${running.includes(a.id) ? '🔄 Working' : '✅ Ready'}`).join('\n');
        addMessage('cortex', createMsg('cortex', 'agent', `Team status:\n${status}`));
        return;
      }
      return;
    }

    const agent = AGENTS[agentId];
    if (!agent) return;

    const apiMap: Record<string, { url: string; method: string; body?: any; label: string }> = {
      'scout:search':    { url: '/api/agents/scout/run', method: 'POST', body: {}, label: 'Searching for jobs...' },
      'scout:linkedin':  { url: '/api/agents/scout/run', method: 'POST', body: { platforms: ['linkedin'] }, label: 'Scanning LinkedIn...' },
      'forge:optimize':  { url: '/api/forge/auto-generate', method: 'POST', body: {}, label: 'Optimizing your resume...' },
      'forge:ats':       { url: '/api/forge/status', method: 'GET', label: 'Checking ATS score...' },
      'archer:apply':    { url: '/api/agents/run', method: 'POST', body: { agentId: 'archer' }, label: 'Applying to top matches...' },
      'archer:cover':    { url: '/api/agents/run', method: 'POST', body: { agentId: 'archer', coverOnly: true }, label: 'Generating cover letters...' },
      'atlas:practice':  { url: '/api/ai/interview', method: 'POST', body: { mode: 'practice' }, label: 'Preparing interview questions...' },
      'atlas:research':  { url: '/api/ai/interview', method: 'POST', body: { mode: 'research' }, label: 'Researching company...' },
      'sage:gaps':       { url: '/api/agents/skill-gaps', method: 'GET', label: 'Analyzing skill gaps...' },
      'sage:learn':      { url: '/api/agents/skill-gaps', method: 'GET', label: 'Building learning path...' },
      'sentinel:review': { url: '/api/agents/run', method: 'POST', body: { agentId: 'sentinel' }, label: 'Reviewing application queue...' },
      'sentinel:report': { url: '/api/agents/run', method: 'POST', body: { agentId: 'sentinel' }, label: 'Generating quality report...' },
    };

    const key = `${agentId}:${action}`;
    const api = apiMap[key];
    if (!api) { addMessage(agentId, createMsg(agentId, 'agent', `I don't know how to handle "${action}" yet.`)); return; }

    setRunningAgents(prev => new Set(prev).add(agentId));
    addMessage(agentId, createMsg(agentId, 'system', api.label));

    try {
      const opts: RequestInit = { method: api.method, headers: { 'Content-Type': 'application/json' } };
      if (api.method === 'POST' && api.body) opts.body = JSON.stringify(api.body);
      const res = await fetch(api.url, opts);
      const data = await res.json().catch(() => null);

      if (!res.ok) addMessage(agentId, createMsg(agentId, 'agent', data?.error || `Something went wrong (${res.status}).`));
      else if (agentId === 'scout' && (data?.jobs || data?.results)) { const jobs = data.jobs || data.results || []; addMessage(agentId, createMsg(agentId, 'agent', `Found ${jobs.length} jobs matching your profile!`, 'job-cards', jobs)); }
      else if (agentId === 'forge' && data) addMessage(agentId, createMsg(agentId, 'agent', 'Resume optimized successfully!', 'resume-preview', data));
      else if (agentId === 'archer' && (data?.applications || data?.applied)) { const apps = data.applications || data.applied || []; addMessage(agentId, createMsg(agentId, 'agent', `Sent ${apps.length} applications!`, 'application-status', apps)); }
      else if (agentId === 'atlas' && data) addMessage(agentId, createMsg(agentId, 'agent', 'Here are your interview prep questions:', 'interview-prep', data));
      else if (agentId === 'sage' && data) addMessage(agentId, createMsg(agentId, 'agent', 'Skill gap analysis complete:', 'skill-gaps', data));
      else if (agentId === 'sentinel' && data) addMessage(agentId, createMsg(agentId, 'agent', 'Quality review complete:', 'quality-report', data));
      else addMessage(agentId, createMsg(agentId, 'agent', data?.summary || data?.message || 'Done!'));
    } catch { addMessage(agentId, createMsg(agentId, 'agent', 'Connection error. Please try again.')); }

    setRunningAgents(prev => { const n = new Set(prev); n.delete(agentId); return n; });
    setRecentlyDone(prev => new Set(prev).add(agentId));
    setTimeout(() => { setRecentlyDone(prev => { const n = new Set(prev); n.delete(agentId); return n; }); }, 30000);
  }, [addMessage]);

  /* ── Send text message ── */
  const handleSendMessage = useCallback(async (agentId: SelectedAgentId, content: string) => {
    addMessage(agentId, createMsg(agentId, 'user', content));
    setRunningAgents(prev => new Set(prev).add(agentId));
    const agentName = agentId === 'cortex' ? COORDINATOR.name : AGENTS[agentId].name;
    const agentRole = agentId === 'cortex' ? COORDINATOR.role : AGENTS[agentId].role;
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: content, context: { agentId, agentName, agentRole } }) });
      const data = await res.json().catch(() => null);
      addMessage(agentId, createMsg(agentId, 'agent', data?.reply || data?.message || "I'm not sure how to help with that. Try using one of the quick actions above."));
    } catch { addMessage(agentId, createMsg(agentId, 'agent', 'Connection error. Please try again.')); }
    setRunningAgents(prev => { const n = new Set(prev); n.delete(agentId); return n; });
  }, [addMessage]);

  /* ── Feedback handler ── */
  const handleFeedback = useCallback((agentId: SelectedAgentId, messageId: string, fb: 'up' | 'down' | null) => {
    setAgentChats(prev => ({ ...prev, [agentId]: (prev[agentId] || []).map(m => m.id === messageId ? { ...m, feedback: fb } : m) }));
    fetch(`/api/agents/chat/${messageId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ feedback: fb }) }).catch(() => {});
  }, []);

  /* ── Run full pipeline ── */
  const handleRunPipeline = useCallback(async () => {
    const unlocked = agents.filter(a => !a.locked);
    for (const agent of unlocked) {
      setSelectedAgent(agent.id as AgentId);
      await handleRunAgent(agent.id as AgentId);
      await new Promise(r => setTimeout(r, 400));
    }
  }, [agents, handleRunAgent]);
  handleRunPipelineRef.current = handleRunPipeline;

  /* ── Agent strip data ── */
  const agentStripData = agents.map(a => ({
    id: a.id as AgentId,
    name: AGENTS[a.id as AgentId].name,
    role: AGENTS[a.id as AgentId].role,
    locked: a.locked,
    colorHex: AGENTS[a.id as AgentId].colorHex,
  }));

  /* ── Last message per agent ── */
  const lastMessages: Record<string, string> = {};
  for (const [agentId, msgs] of Object.entries(agentChats)) {
    const last = [...msgs].reverse().find(m => m.role !== 'system');
    if (last) lastMessages[agentId] = last.content.slice(0, 60);
  }

  /* ── Sidebar dimensions ── */
  const SIDEBAR_EXPANDED = 260;
  const SIDEBAR_COLLAPSED = 60;

  return (
    <div className="flex h-screen">

      {/* ═══ LEFT SIDEBAR (desktop, always visible — expanded / icon-only) ═══ */}
      <motion.aside
        animate={{ width: sidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="relative flex-shrink-0 border-r border-white/5 bg-white/[0.01] hidden lg:flex flex-col overflow-hidden"
      >
        {/* Sidebar top — Cortex branding (clickable → opens Cortex chat) */}
        {sidebarOpen ? (
          <button
            onClick={() => setSelectedAgent('cortex')}
            className={`w-full px-4 py-3 border-b border-white/5 flex items-center gap-2.5 flex-shrink-0 text-left transition-all hover:bg-white/[0.03] ${
              selectedAgent === 'cortex' ? 'bg-white/[0.05]' : ''
            }`}
          >
            <CortexAvatar size={32} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/70 truncate">
                {loading ? <span className="inline-block w-20 h-3 bg-white/5 rounded animate-pulse" /> : <>{COORDINATOR.name}</>}
              </p>
              <p className="text-[9px] text-white/20">{COORDINATOR.role}</p>
            </div>
          </button>
        ) : (
          <button
            onClick={() => setSelectedAgent('cortex')}
            className={`w-full flex justify-center py-3 border-b border-white/5 flex-shrink-0 transition-all hover:bg-white/[0.03] ${
              selectedAgent === 'cortex' ? 'bg-white/[0.05]' : ''
            }`}
            title="Cortex"
          >
            <CortexAvatar size={28} />
          </button>
        )}

        {/* Agent team + UserMenu at bottom */}
        <AgentTeamStrip
          vertical
          collapsed={!sidebarOpen}
          agents={agentStripData}
          selectedAgent={selectedAgent === 'cortex' ? null : selectedAgent}
          runningAgents={runningAgents}
          recentlyDone={recentlyDone}
          onSelect={(id) => setSelectedAgent(id)}
          lastMessages={lastMessages}
          onRunPipeline={handleRunPipeline}
          bottomSlot={
            <UserMenu
              userName={userName || 'User'}
              userEmail={userEmail}
              userImage={userImage}
              initials={initials}
              planBadge={badge}
              collapsed={false}
            />
          }
          bottomSlotCollapsed={
            <UserMenu
              userName={userName || 'User'}
              userEmail={userEmail}
              userImage={userImage}
              initials={initials}
              planBadge={badge}
              collapsed={true}
            />
          }
        />

        {/* ── Toggle arrow — fixed at the edge ── */}
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          className="absolute top-3 -right-3 z-50 w-6 h-6 rounded-full
                     bg-surface border border-white/10 flex items-center justify-center
                     text-white/40 hover:text-white/70 hover:border-white/20
                     shadow-lg transition-all"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </motion.aside>

      {/* ═══ RIGHT MAIN AREA ═══ */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar — mobile greeting + Run All */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
          {/* Cortex greeting — mobile only (clickable → opens Cortex chat) */}
          <button
            onClick={() => setSelectedAgent('cortex')}
            className="lg:hidden flex items-center gap-2.5 flex-1 min-w-0 text-left"
          >
            <CortexAvatar size={26} pulse />
            <div className="min-w-0">
              <span className="text-sm font-semibold">
                {loading ? <span className="inline-block w-28 h-4 bg-white/5 rounded animate-pulse" /> : <>{COORDINATOR.name}</>}
              </span>
              <p className="text-[10px] text-white/20">{COORDINATOR.role}</p>
            </div>
          </button>

          {/* Desktop: empty spacer */}
          <div className="hidden lg:flex flex-1" />

          {/* Run All — mobile only */}
          <button
            onClick={handleRunPipeline}
            disabled={runningAgents.size > 0}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                       bg-gradient-to-r from-neon-blue to-neon-purple text-white
                       disabled:opacity-50 transition-all"
          >
            {runningAgents.size > 0 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {runningAgents.size > 0 ? 'Running...' : 'Run All'}
          </button>
        </div>

        {/* Mobile agent strip */}
        <div className="lg:hidden px-4 py-2 border-b border-white/5">
          <AgentTeamStrip
            agents={agentStripData}
            selectedAgent={selectedAgent === 'cortex' ? null : selectedAgent}
            runningAgents={runningAgents}
            recentlyDone={recentlyDone}
            onSelect={(id) => setSelectedAgent(id)}
          />
        </div>

        {/* Workspace: Chat + Timeline/Metrics */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

          {/* Agent workspace area */}
          <div className="flex-1 min-w-0 flex flex-col">
            {selectedAgent !== 'cortex' && agents.find(a => a.id === selectedAgent)?.locked ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-dashed border-white/5 flex-1 flex flex-col items-center justify-center m-4 sm:m-6"
              >
                <p className="text-sm text-white/25">This agent is locked</p>
                <p className="text-xs text-white/15 mt-1">
                  Upgrade your plan to unlock this agent
                </p>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col p-4 sm:p-6">
                <AgentChat
                  agentId={selectedAgent}
                  messages={agentChats[selectedAgent] || []}
                  onSendMessage={(content) => handleSendMessage(selectedAgent, content)}
                  onQuickAction={(action) => handleQuickAction(selectedAgent, action)}
                  onFeedback={(msgId, fb) => handleFeedback(selectedAgent, msgId, fb)}
                  isWorking={runningAgents.has(selectedAgent)}
                  toolbarSlot={
                    selectedAgent === 'scout' ? (
                      <ScoutToolbar
                        onDeploy={() => handleQuickAction('scout', 'search')}
                        isWorking={runningAgents.has('scout')}
                      />
                    ) :
                    selectedAgent === 'forge' ? (
                      <ForgeToolbar />
                    ) :
                    selectedAgent === 'archer' ? (
                      <ArcherToolbar />
                    ) :
                    undefined
                  }
                  panelSlot={
                    selectedAgent === 'atlas' ? <InterviewPrepPanel /> :
                    selectedAgent === 'sage' ? <LearningPathPanel /> :
                    selectedAgent === 'sentinel' ? <QualityReviewPanel /> :
                    undefined
                  }
                />
              </div>
            )}
          </div>

          {/* Right sidebar — Timeline + Metrics */}
          <div className="lg:w-72 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 p-4 overflow-y-auto">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 mb-4">
              <DailyTimeline entries={activities} loading={loading} />
            </div>
            <MetricsBar metrics={metrics} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
