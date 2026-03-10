'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import CortexAvatar from '@/components/brand/CortexAvatar';
import AgentTeamStrip from '@/components/dashboard/AgentTeamStrip';
import AgentChat, { type ChatMessage } from '@/components/dashboard/AgentChat';
import DailyTimeline, { type TimelineEntry } from '@/components/dashboard/DailyTimeline';
import MetricsBar from '@/components/dashboard/MetricsBar';
import { AGENTS, type AgentId } from '@/lib/agents/registry';
import { getAgentsWithStatus, type PlanTier } from '@/lib/agents/permissions';

/* ── Types ── */
interface Metrics { jobsFound: number; appsSent: number; interviews: number; responseRate: number }

/* ── Welcome messages per agent ── */
const WELCOME: Record<AgentId, string> = {
  scout: "I'm ready to hunt for jobs matching your profile. Hit 'Search Jobs' or tell me what role you're looking for.",
  forge: "I'll optimize your resume for any job. Use 'Optimize Resume' or paste a job description and I'll tailor it.",
  archer: "I can send applications with tailored cover letters. Hit 'Apply to Top Matches' to get started.",
  atlas: "Let me prepare you for interviews. Pick a company or use 'Practice Interview' to start a mock session.",
  sage: "I'll analyze your skill gaps and recommend learning paths. Hit 'Find Skill Gaps' to begin.",
  sentinel: "I review applications for quality and catch issues before they go out. Use 'Review Queue' to check pending items.",
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [plan, setPlan] = useState<PlanTier>('STARTER');
  const [selectedAgent, setSelectedAgent] = useState<AgentId>('scout');
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());
  const [recentlyDone, setRecentlyDone] = useState<Set<string>>(new Set());
  const [agentChats, setAgentChats] = useState<Record<string, ChatMessage[]>>({});
  const [activities, setActivities] = useState<TimelineEntry[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ jobsFound: 0, appsSent: 0, interviews: 0, responseRate: 0 });

  // Track which agents already had their chat loaded from DB
  const loadedAgents = useRef<Set<string>>(new Set());

  /* ── Initial data fetch ── */
  useEffect(() => {
    Promise.all([
      fetch('/api/user/profile').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/agents/activity?limit=30').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/agents/pipeline-stats').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([profile, actData, stats]) => {
      if (profile) {
        setUserName(profile.name || '');
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

  /* ── Persist a message to DB (fire-and-forget) ── */
  const persistMsg = useCallback((agentId: string, msg: ChatMessage) => {
    // Don't persist system messages (transient status indicators)
    if (msg.role === 'system') return;

    fetch('/api/agents/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId,
        role: msg.role,
        content: msg.content,
        type: msg.type,
        data: msg.data,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(saved => {
        // Swap client-generated ID → DB ID so feedback PATCH works
        if (saved?.id) {
          setAgentChats(prev => ({
            ...prev,
            [agentId]: (prev[agentId] || []).map(m =>
              m.id === msg.id ? { ...m, id: saved.id } : m
            ),
          }));
        }
      })
      .catch(() => {});
  }, []);

  /* ── Chat helpers ── */
  const addMessage = useCallback((agentId: AgentId, msg: ChatMessage) => {
    setAgentChats(prev => ({
      ...prev,
      [agentId]: [...(prev[agentId] || []), msg],
    }));
    persistMsg(agentId, msg);
  }, [persistMsg]);

  const createMsg = (agentId: AgentId, role: 'agent' | 'user' | 'system', content: string, type: ChatMessage['type'] = 'text', data?: any): ChatMessage => ({
    id: `${agentId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role,
    content,
    type,
    data,
    feedback: null,
    timestamp: Date.now(),
  });

  /* ── Load chat history from DB when selecting an agent ── */
  useEffect(() => {
    if (!selectedAgent) return;
    if (loadedAgents.current.has(selectedAgent)) return;

    loadedAgents.current.add(selectedAgent);

    fetch(`/api/agents/chat?agentId=${selectedAgent}&limit=50`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.messages?.length) {
          setAgentChats(prev => ({
            ...prev,
            [selectedAgent]: data.messages,
          }));
        } else {
          // No history — show welcome message and save it
          const welcome = WELCOME[selectedAgent];
          if (welcome) {
            const msg: ChatMessage = {
              id: `welcome-${selectedAgent}`,
              role: 'agent',
              content: welcome,
              type: 'text',
              feedback: null,
              timestamp: Date.now(),
            };
            setAgentChats(prev => ({
              ...prev,
              [selectedAgent]: [msg],
            }));
            persistMsg(selectedAgent, msg);
          }
        }
      })
      .catch(() => {
        // Fallback: show welcome message
        const welcome = WELCOME[selectedAgent];
        if (welcome) {
          setAgentChats(prev => ({
            ...prev,
            [selectedAgent]: [{
              id: `welcome-${selectedAgent}`,
              role: 'agent',
              content: welcome,
              type: 'text',
              feedback: null,
              timestamp: Date.now(),
            }],
          }));
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
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      const data = await res.json().catch(() => null);

      if (data?.error) {
        addMessage(agentId, createMsg(agentId, 'agent', data.error || 'Something went wrong. Please try again.'));
      } else {
        const summary = data?.summary || `Done! ${agent.name} completed the task.`;
        addMessage(agentId, createMsg(agentId, 'agent', summary));
      }
    } catch {
      addMessage(agentId, createMsg(agentId, 'agent', 'Connection error. Please try again.'));
    }

    setRunningAgents(prev => { const next = new Set(prev); next.delete(agentId); return next; });
    setRecentlyDone(prev => new Set(prev).add(agentId));
    setTimeout(() => { setRecentlyDone(prev => { const next = new Set(prev); next.delete(agentId); return next; }); }, 30000);

    // Refresh activity
    fetch('/api/agents/activity?limit=30').then(r => r.ok ? r.json() : null).then(actData => {
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
    }).catch(() => {});
  }, [addMessage]);

  /* ── Quick action handler ── */
  const handleQuickAction = useCallback(async (agentId: AgentId, action: string) => {
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
    if (!api) {
      addMessage(agentId, createMsg(agentId, 'agent', `I don't know how to handle "${action}" yet.`));
      return;
    }

    setRunningAgents(prev => new Set(prev).add(agentId));
    addMessage(agentId, createMsg(agentId, 'system', api.label));

    try {
      const opts: RequestInit = { method: api.method, headers: { 'Content-Type': 'application/json' } };
      if (api.method === 'POST' && api.body) opts.body = JSON.stringify(api.body);

      const res = await fetch(api.url, opts);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        addMessage(agentId, createMsg(agentId, 'agent', data?.error || `Something went wrong (${res.status}). Please try again.`));
      } else if (agentId === 'scout' && (data?.jobs || data?.results)) {
        const jobs = data.jobs || data.results || [];
        addMessage(agentId, createMsg(agentId, 'agent', `Found ${jobs.length} jobs matching your profile!`, 'job-cards', jobs));
      } else if (agentId === 'forge' && data) {
        addMessage(agentId, createMsg(agentId, 'agent', 'Resume optimized successfully!', 'resume-preview', data));
      } else if (agentId === 'archer' && (data?.applications || data?.applied)) {
        const apps = data.applications || data.applied || [];
        addMessage(agentId, createMsg(agentId, 'agent', `Sent ${apps.length} applications!`, 'application-status', apps));
      } else if (agentId === 'atlas' && data) {
        addMessage(agentId, createMsg(agentId, 'agent', 'Here are your interview prep questions:', 'interview-prep', data));
      } else if (agentId === 'sage' && data) {
        addMessage(agentId, createMsg(agentId, 'agent', 'Skill gap analysis complete:', 'skill-gaps', data));
      } else if (agentId === 'sentinel' && data) {
        addMessage(agentId, createMsg(agentId, 'agent', 'Quality review complete:', 'quality-report', data));
      } else {
        addMessage(agentId, createMsg(agentId, 'agent', data?.summary || data?.message || 'Done!'));
      }
    } catch {
      addMessage(agentId, createMsg(agentId, 'agent', 'Connection error. Please try again.'));
    }

    setRunningAgents(prev => { const next = new Set(prev); next.delete(agentId); return next; });
    setRecentlyDone(prev => new Set(prev).add(agentId));
    setTimeout(() => { setRecentlyDone(prev => { const next = new Set(prev); next.delete(agentId); return next; }); }, 30000);
  }, [addMessage]);

  /* ── Send text message ── */
  const handleSendMessage = useCallback(async (agentId: AgentId, content: string) => {
    addMessage(agentId, createMsg(agentId, 'user', content));
    setRunningAgents(prev => new Set(prev).add(agentId));

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          context: { agentId, agentName: AGENTS[agentId].name, agentRole: AGENTS[agentId].role },
        }),
      });
      const data = await res.json().catch(() => null);
      addMessage(agentId, createMsg(agentId, 'agent', data?.reply || data?.message || "I'm not sure how to help with that. Try using one of the quick actions above."));
    } catch {
      addMessage(agentId, createMsg(agentId, 'agent', 'Connection error. Please try again.'));
    }

    setRunningAgents(prev => { const next = new Set(prev); next.delete(agentId); return next; });
  }, [addMessage]);

  /* ── Feedback handler (persists to DB) ── */
  const handleFeedback = useCallback((agentId: AgentId, messageId: string, fb: 'up' | 'down' | null) => {
    setAgentChats(prev => ({
      ...prev,
      [agentId]: (prev[agentId] || []).map(m =>
        m.id === messageId ? { ...m, feedback: fb } : m
      ),
    }));
    // Persist feedback
    fetch(`/api/agents/chat/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: fb }),
    }).catch(() => {});
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

  /* ── Agent strip data ── */
  const agentStripData = agents.map(a => ({
    id: a.id as AgentId,
    name: AGENTS[a.id as AgentId].name,
    role: AGENTS[a.id as AgentId].role,
    locked: a.locked,
    colorHex: AGENTS[a.id as AgentId].colorHex,
  }));

  /* ── Last message per agent (for sidebar preview) ── */
  const lastMessages: Record<string, string> = {};
  for (const [agentId, msgs] of Object.entries(agentChats)) {
    const last = [...msgs].reverse().find(m => m.role !== 'system');
    if (last) lastMessages[agentId] = last.content.slice(0, 60);
  }

  return (
    <div className="flex -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>

      {/* ═══ LEFT SIDEBAR (desktop) ═══ */}
      <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-white/[0.01] hidden lg:flex flex-col">
        <AgentTeamStrip
          vertical
          agents={agentStripData}
          selectedAgent={selectedAgent}
          runningAgents={runningAgents}
          recentlyDone={recentlyDone}
          onSelect={(id) => setSelectedAgent(id)}
          lastMessages={lastMessages}
          onRunPipeline={handleRunPipeline}
        />
      </aside>

      {/* ═══ RIGHT MAIN AREA ═══ */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Compact greeting bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 sm:px-6 py-3 border-b border-white/5 flex items-center gap-3 flex-shrink-0"
        >
          <CortexAvatar size={28} pulse />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold">
              {loading ? <span className="inline-block w-28 h-4 bg-white/5 rounded animate-pulse" /> : <>{greeting}, {userName || 'there'}</>}
            </span>
            <p className="text-[10px] text-white/20">Your AI team is ready</p>
          </div>
          {/* Run Pipeline button — visible only on mobile where sidebar is hidden */}
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
        </motion.div>

        {/* Mobile agent strip */}
        <div className="lg:hidden px-4 py-2 border-b border-white/5">
          <AgentTeamStrip
            agents={agentStripData}
            selectedAgent={selectedAgent}
            runningAgents={runningAgents}
            recentlyDone={recentlyDone}
            onSelect={(id) => setSelectedAgent(id)}
          />
        </div>

        {/* Workspace: Chat + Timeline/Metrics */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

          {/* Chat area */}
          <div className="flex-1 min-w-0 flex flex-col p-4 sm:p-6">
            {selectedAgent && !agents.find(a => a.id === selectedAgent)?.locked ? (
              <AgentChat
                agentId={selectedAgent}
                messages={agentChats[selectedAgent] || []}
                onSendMessage={(content) => handleSendMessage(selectedAgent, content)}
                onQuickAction={(action) => handleQuickAction(selectedAgent, action)}
                onFeedback={(msgId, fb) => handleFeedback(selectedAgent, msgId, fb)}
                isWorking={runningAgents.has(selectedAgent)}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-dashed border-white/5 flex-1 flex flex-col items-center justify-center"
              >
                <CortexAvatar size={56} />
                <p className="text-sm text-white/25 mt-4">Select an agent to start a conversation</p>
                <p className="text-xs text-white/15 mt-1">
                  Or hit <span className="text-white/30 font-medium">Run All</span> to launch all agents
                </p>
              </motion.div>
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
