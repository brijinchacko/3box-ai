'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Play, Loader2 } from 'lucide-react';
import CortexAvatar from '@/components/brand/CortexAvatar';
import AgentChat, { type ChatMessage } from '@/components/dashboard/AgentChat';
import DailyTimeline, { type TimelineEntry } from '@/components/dashboard/DailyTimeline';
import MetricsBar from '@/components/dashboard/MetricsBar';
import { AGENTS, COORDINATOR, type AgentId } from '@/lib/agents/registry';

type WorkspaceAgentId = AgentId | 'cortex';

/* ── Welcome messages per agent ── */
const WELCOME: Record<string, string> = {
  cortex: "I'm Cortex, your AI career strategist. I coordinate all 6 agents to help you land your dream job. What would you like to work on?",
  scout: "I'm ready to hunt for jobs matching your profile. Hit 'Search Jobs' or tell me what role you're looking for.",
  forge: "I'll optimize your resume for any job. Use 'Optimize Resume' or paste a job description and I'll tailor it.",
  archer: "I can send applications with tailored cover letters. Hit 'Apply to Top Matches' to get started.",
  atlas: "Let me prepare you for interviews. Pick a company or use 'Practice Interview' to start a mock session.",
  sage: "I'll analyze your skill gaps and recommend learning paths. Hit 'Find Skill Gaps' to begin.",
  sentinel: "I review applications for quality and catch issues before they go out. Use 'Review Queue' to check pending items.",
};

interface Metrics {
  jobsFound: number;
  appsSent: number;
  interviews: number;
  responseRate: number;
}

interface AgenticWorkspaceProps {
  /** Which agent to show chat for — supports all 6 agents + cortex */
  agentId: WorkspaceAgentId;
}

export default function AgenticWorkspace({ agentId }: AgenticWorkspaceProps) {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  const [loading, setLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activities, setActivities] = useState<TimelineEntry[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ jobsFound: 0, appsSent: 0, interviews: 0, responseRate: 0 });

  const isCortex = agentId === 'cortex';
  const agentName = isCortex ? COORDINATOR.name : AGENTS[agentId].name;
  const agentRole = isCortex ? COORDINATOR.role : AGENTS[agentId].role;
  const agentColor = isCortex ? COORDINATOR.colorHex : AGENTS[agentId].colorHex;

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  /* ── Data fetch ── */
  useEffect(() => {
    Promise.all([
      fetch('/api/agents/activity?limit=30').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/agents/pipeline-stats').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([actData, stats]) => {
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

  /* ── Initialize welcome message ── */
  useEffect(() => {
    const welcome = WELCOME[agentId];
    if (welcome) {
      setMessages([{
        id: `welcome-${agentId}`,
        role: 'agent' as const,
        content: welcome,
        type: 'text' as const,
        feedback: null,
        timestamp: Date.now(),
      }]);
    }
  }, [agentId]);

  /* ── Chat helpers ── */
  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const createMsg = (role: 'agent' | 'user' | 'system', content: string, type: ChatMessage['type'] = 'text', data?: any): ChatMessage => ({
    id: `${agentId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role,
    content,
    type,
    data,
    feedback: null,
    timestamp: Date.now(),
  });

  /* ── Quick action handler ── */
  const handleQuickAction = useCallback(async (action: string) => {
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
      addMessage(createMsg('agent', `I don't know how to handle "${action}" yet.`));
      return;
    }

    setIsWorking(true);
    addMessage(createMsg('system', api.label));

    try {
      const opts: RequestInit = { method: api.method, headers: { 'Content-Type': 'application/json' } };
      if (api.method === 'POST' && api.body) opts.body = JSON.stringify(api.body);
      const res = await fetch(api.url, opts);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        addMessage(createMsg('agent', data?.error || `Something went wrong (${res.status}).`));
      } else if (agentId === 'scout' && (data?.jobs || data?.results)) {
        const jobs = data.jobs || data.results || [];
        addMessage(createMsg('agent', `Found ${jobs.length} jobs matching your profile!`, 'job-cards', jobs));
      } else if (agentId === 'forge' && data) {
        addMessage(createMsg('agent', 'Resume optimized successfully!', 'resume-preview', data));
      } else if (agentId === 'archer' && (data?.applications || data?.applied)) {
        const apps = data.applications || data.applied || [];
        addMessage(createMsg('agent', `Sent ${apps.length} applications!`, 'application-status', apps));
      } else if (agentId === 'atlas' && data) {
        addMessage(createMsg('agent', 'Interview prep questions:', 'interview-prep', data));
      } else if (agentId === 'sage' && data) {
        addMessage(createMsg('agent', 'Skill gap analysis complete:', 'skill-gaps', data));
      } else if (agentId === 'sentinel' && data) {
        addMessage(createMsg('agent', 'Quality review complete:', 'quality-report', data));
      } else {
        addMessage(createMsg('agent', data?.summary || data?.message || 'Done!'));
      }
    } catch {
      addMessage(createMsg('agent', 'Connection error. Please try again.'));
    }

    setIsWorking(false);
  }, [agentId, addMessage]);

  /* ── Send text message ── */
  const handleSendMessage = useCallback(async (content: string) => {
    addMessage(createMsg('user', content));
    setIsWorking(true);

    try {
      const res = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          agentId,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json().catch(() => null);
      addMessage(createMsg('agent', data?.response || data?.reply || data?.message || "I'm not sure how to help with that. Try one of the quick actions above."));
    } catch {
      addMessage(createMsg('agent', 'Connection error. Please try again.'));
    }

    setIsWorking(false);
  }, [agentId, addMessage, messages]);

  /* ── Feedback handler ── */
  const handleFeedback = useCallback((messageId: string, fb: 'up' | 'down' | null) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, feedback: fb } : m
    ));
  }, []);

  /* ── Run this agent / Run full pipeline for Cortex ── */
  const handleRunAgent = useCallback(async () => {
    setIsWorking(true);

    if (isCortex) {
      // Cortex runs the full pipeline — all agents in sequence
      addMessage(createMsg('system', 'Running full pipeline — all agents activated...'));

      try {
        const res = await fetch('/api/agents/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId: 'scout' }),
        });
        const data = await res.json().catch(() => null);
        addMessage(createMsg('agent', data?.summary || data?.message || 'Pipeline run complete! All agents have finished their tasks.'));
      } catch {
        addMessage(createMsg('agent', 'Connection error. Please try again.'));
      }
    } else {
      addMessage(createMsg('system', `${agentName} started working...`));

      try {
        const res = await fetch('/api/agents/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId }),
        });
        const data = await res.json().catch(() => null);
        if (data?.error) {
          addMessage(createMsg('agent', data.error || 'Something went wrong.'));
        } else {
          addMessage(createMsg('agent', data?.summary || `Done! ${agentName} completed the task.`));
        }
      } catch {
        addMessage(createMsg('agent', 'Connection error. Please try again.'));
      }
    }

    setIsWorking(false);

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
  }, [agentId, agentName, isCortex, addMessage]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">

      {/* ═══ HERO ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <CortexAvatar size={40} pulse={isWorking} />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white">
            {loading ? (
              <span className="inline-block w-32 h-5 bg-white/5 rounded animate-pulse" />
            ) : (
              <>{greeting}, {firstName}</>
            )}
          </h1>
          <p className="text-white/25 text-xs">
            Talking to <span className="text-white/50 font-medium" style={{ color: agentColor }}>{agentName}</span> — {agentRole}
          </p>
        </div>
        <button
          onClick={handleRunAgent}
          disabled={isWorking}
          className="flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold text-sm
                     shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40
                     transition-all disabled:opacity-50"
        >
          {isWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span className="hidden sm:inline">{isWorking ? 'Working...' : isCortex ? 'Run Pipeline' : `Run ${agentName}`}</span>
        </button>
      </motion.div>

      {/* ═══ WORKSPACE + TIMELINE ═══ */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Workspace — Chat */}
        <div className="flex-1 min-w-0">
          <AgentChat
            agentId={agentId}
            messages={messages}
            onSendMessage={handleSendMessage}
            onQuickAction={handleQuickAction}
            onFeedback={handleFeedback}
            isWorking={isWorking}
            unifiedMode={isCortex}
          />
        </div>

        {/* Timeline sidebar */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 lg:sticky lg:top-20">
            <DailyTimeline entries={activities} loading={loading} />
          </div>
        </div>
      </div>

      {/* ═══ METRICS BAR ═══ */}
      <MetricsBar metrics={metrics} loading={loading} />
    </div>
  );
}
