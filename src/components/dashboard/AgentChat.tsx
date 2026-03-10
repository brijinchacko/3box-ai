'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Search, Hammer, Target, Compass, BookOpen, Shield,
  Loader2, Briefcase, FileText, Star, AlertTriangle, ExternalLink, Zap,
} from 'lucide-react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import FeedbackButtons from '@/components/dashboard/FeedbackButtons';
import { AGENTS, COORDINATOR, type AgentId } from '@/lib/agents/registry';

/* ── Message Types ── */
export interface ChatMessage {
  id: string;
  role: 'agent' | 'user' | 'system';
  content: string;
  type: 'text' | 'job-cards' | 'resume-preview' | 'application-status' | 'interview-prep' | 'skill-gaps' | 'quality-report';
  data?: any;
  feedback?: 'up' | 'down' | null;
  timestamp: number;
}

/* ── Quick Actions per Agent ── */
const QUICK_ACTIONS: Record<AgentId | 'cortex', { label: string; icon: any; action: string }[]> = {
  scout:    [{ label: 'Search Jobs', icon: Search, action: 'search' }, { label: 'Scan LinkedIn', icon: Briefcase, action: 'linkedin' }],
  forge:    [{ label: 'Optimize Resume', icon: Hammer, action: 'optimize' }, { label: 'ATS Check', icon: FileText, action: 'ats' }],
  archer:   [{ label: 'Apply to Top Matches', icon: Target, action: 'apply' }, { label: 'Send Cover Letters', icon: Send, action: 'cover' }],
  atlas:    [{ label: 'Practice Interview', icon: Compass, action: 'practice' }, { label: 'Company Research', icon: Search, action: 'research' }],
  sage:     [{ label: 'Find Skill Gaps', icon: BookOpen, action: 'gaps' }, { label: 'Learning Path', icon: Star, action: 'learn' }],
  sentinel: [{ label: 'Review Queue', icon: Shield, action: 'review' }, { label: 'Quality Report', icon: AlertTriangle, action: 'report' }],
  cortex:   [{ label: 'Team Status', icon: Briefcase, action: 'status' }, { label: 'Run Pipeline', icon: Zap, action: 'pipeline' }],
};

/* ── Props ── */
interface AgentChatProps {
  agentId: AgentId | 'cortex';
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onQuickAction: (action: string) => void;
  onFeedback: (messageId: string, fb: 'up' | 'down' | null) => void;
  isWorking: boolean;
  /** Optional panel content rendered above messages (e.g. Interview Prep for Atlas) */
  panelSlot?: React.ReactNode;
}

/* ── Inline Output Renderers ── */
function JobCards({ data }: { data: any[] }) {
  if (!data?.length) return null;
  return (
    <div className="space-y-2 mt-2">
      {data.slice(0, 5).map((job: any, i: number) => (
        <div key={job.id || i} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/80 truncate">{job.title}</p>
            <p className="text-[10px] text-white/35 truncate">{job.company} · {job.location || 'Remote'}</p>
          </div>
          {job.matchScore && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
              job.matchScore >= 80 ? 'text-neon-green bg-neon-green/10' :
              job.matchScore >= 60 ? 'text-amber-400 bg-amber-400/10' :
              'text-white/40 bg-white/5'
            }`}>
              {job.matchScore}%
            </span>
          )}
          {job.jobUrl && (
            <a href={job.jobUrl} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white/40">
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      ))}
      {data.length > 5 && (
        <p className="text-[10px] text-white/20 text-center">+{data.length - 5} more jobs</p>
      )}
    </div>
  );
}

function ResumePreview({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="mt-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white/70">Resume Optimized</span>
        {data.atsScore && (
          <span className="text-[10px] font-bold text-neon-green bg-neon-green/10 px-2 py-0.5 rounded-full">
            ATS: {data.atsScore}%
          </span>
        )}
      </div>
      {data.changes?.length > 0 && (
        <ul className="space-y-1">
          {data.changes.slice(0, 4).map((c: string, i: number) => (
            <li key={i} className="text-[10px] text-white/35 flex items-start gap-1.5">
              <span className="text-neon-green mt-0.5">✓</span> {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AppStatus({ data }: { data: any[] }) {
  if (!data?.length) return null;
  return (
    <div className="mt-2 space-y-1.5">
      {data.slice(0, 5).map((app: any, i: number) => (
        <div key={app.id || i} className="flex items-center gap-2 text-[11px]">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            app.status === 'applied' ? 'bg-neon-green' :
            app.status === 'emailed' ? 'bg-neon-blue' :
            'bg-white/20'
          }`} />
          <span className="text-white/50 truncate flex-1">{app.company} — {app.jobTitle}</span>
          <span className="text-[9px] text-white/20 capitalize flex-shrink-0">{app.status}</span>
        </div>
      ))}
    </div>
  );
}

function InterviewPrep({ data }: { data: any }) {
  if (!data) return null;
  const questions = data.questions || data || [];
  return (
    <div className="mt-2 space-y-2">
      {(Array.isArray(questions) ? questions : []).slice(0, 4).map((q: any, i: number) => (
        <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
          <p className="text-[11px] text-white/60 font-medium">Q{i + 1}: {typeof q === 'string' ? q : q.question}</p>
          {q.tip && <p className="text-[10px] text-white/25 mt-1">💡 {q.tip}</p>}
        </div>
      ))}
    </div>
  );
}

function SkillGaps({ data }: { data: any }) {
  if (!data) return null;
  const skills = data.gaps || data.skills || [];
  return (
    <div className="mt-2 space-y-2">
      {(Array.isArray(skills) ? skills : []).slice(0, 5).map((s: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] text-white/40 w-20 truncate">{typeof s === 'string' ? s : s.skill}</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-400"
              style={{ width: `${s.level || s.score || 40}%` }}
            />
          </div>
          <span className="text-[9px] text-white/20 w-8 text-right">{s.level || s.score || 40}%</span>
        </div>
      ))}
    </div>
  );
}

function QualityReport({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="mt-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
      {data.score && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-white/50">Quality Score</span>
          <span className={`text-sm font-bold ${
            data.score >= 80 ? 'text-neon-green' : data.score >= 60 ? 'text-amber-400' : 'text-rose-400'
          }`}>{data.score}/100</span>
        </div>
      )}
      {data.issues?.length > 0 && (
        <ul className="space-y-1">
          {data.issues.map((issue: string, i: number) => (
            <li key={i} className="text-[10px] text-white/35 flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" /> {issue}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Render Output by Type ── */
function MessageOutput({ msg }: { msg: ChatMessage }) {
  switch (msg.type) {
    case 'job-cards': return <JobCards data={msg.data} />;
    case 'resume-preview': return <ResumePreview data={msg.data} />;
    case 'application-status': return <AppStatus data={msg.data} />;
    case 'interview-prep': return <InterviewPrep data={msg.data} />;
    case 'skill-gaps': return <SkillGaps data={msg.data} />;
    case 'quality-report': return <QualityReport data={msg.data} />;
    default: return null;
  }
}

/* ── Main Chat Component ── */
export default function AgentChat({
  agentId,
  messages,
  onSendMessage,
  onQuickAction,
  onFeedback,
  isWorking,
  panelSlot,
}: AgentChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const agent = agentId === 'cortex'
    ? { name: COORDINATOR.name, role: COORDINATOR.role, shortDescription: COORDINATOR.description }
    : AGENTS[agentId];
  const quickActions = QUICK_ACTIONS[agentId] || [];

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    onSendMessage(text);
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] rounded-xl border border-white/5 bg-white/[0.015] overflow-hidden">
      {/* ── Chat Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <AgentAvatar agentId={agentId} size={28} pulse={isWorking} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{agent.name}</p>
          <p className="text-[10px] text-white/25">{agent.role}</p>
        </div>
        {isWorking && (
          <div className="flex items-center gap-1.5 text-neon-blue">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-[10px] font-medium">Working...</span>
          </div>
        )}
      </div>

      {/* ── Panel Slot + Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Embedded panel (e.g. Interview Prep, Learning Path, Quality Review) */}
        {panelSlot && (
          <div className="mb-2 -mx-4 -mt-3">
            {panelSlot}
          </div>
        )}

        {messages.length === 0 && !panelSlot ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <AgentAvatar agentId={agentId} size={48} />
            <p className="text-sm text-white/30 mt-3">
              Hi! I&apos;m <span className="text-white/50 font-medium">{agent.name}</span>, your {agent.role}.
            </p>
            <p className="text-xs text-white/15 mt-1">{agent.shortDescription}</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} ${
                  msg.role === 'system' ? 'justify-center' : ''
                }`}
              >
                {msg.role === 'agent' && (
                  <AgentAvatar agentId={agentId} size={20} />
                )}

                <div className={`max-w-[85%] ${
                  msg.role === 'user'
                    ? 'rounded-2xl rounded-tr-sm bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border border-white/10 px-3 py-2'
                    : msg.role === 'system'
                      ? 'text-center'
                      : 'rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/5 px-3 py-2'
                }`}>
                  <p className={`text-xs leading-relaxed ${
                    msg.role === 'system' ? 'text-white/20 text-[10px]' : 'text-white/60'
                  }`}>
                    {msg.content}
                  </p>

                  {/* Structured output */}
                  {msg.type !== 'text' && <MessageOutput msg={msg} />}

                  {/* Feedback + time */}
                  {msg.role === 'agent' && (
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
                      <FeedbackButtons
                        messageId={msg.id}
                        current={msg.feedback || null}
                        onFeedback={onFeedback}
                      />
                      <span className="text-[9px] text-white/10">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Typing indicator */}
        {isWorking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <AgentAvatar agentId={agentId} size={20} />
            <div className="flex gap-1 px-3 py-2 rounded-2xl bg-white/[0.04] border border-white/5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-white/20"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Quick Actions + Input ── */}
      <div className="border-t border-white/5 bg-white/[0.02]">
        {/* Quick action buttons */}
        <div className="flex gap-1.5 px-3 pt-2.5 overflow-x-auto scrollbar-none">
          {quickActions.map(qa => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.action}
                onClick={() => onQuickAction(qa.action)}
                disabled={isWorking}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium
                           bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60
                           transition-all disabled:opacity-30 flex-shrink-0 whitespace-nowrap"
              >
                <Icon className="w-3 h-3" />
                {qa.label}
              </button>
            );
          })}
        </div>

        {/* Text input */}
        <div className="flex items-center gap-2 p-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={`Message ${agent.name}...`}
            disabled={isWorking}
            className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-white
                       placeholder:text-white/15 focus:outline-none focus:border-white/15
                       disabled:opacity-40 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isWorking}
            className="p-2 rounded-xl bg-gradient-to-r from-neon-blue/20 to-neon-purple/20
                       text-white hover:from-neon-blue/30 hover:to-neon-purple/30
                       transition-all disabled:opacity-30 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
