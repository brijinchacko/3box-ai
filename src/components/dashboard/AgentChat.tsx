'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Search, Hammer, Target, Compass, BookOpen, Shield,
  Loader2, Briefcase, FileText, Star, AlertTriangle, ExternalLink, Zap,
  Bookmark, BookmarkCheck, ArrowRight, MapPin, DollarSign, ChevronDown, ChevronUp,
  Info, CheckCircle2, X, Settings2,
} from 'lucide-react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import FeedbackButtons from '@/components/dashboard/FeedbackButtons';
import AgentConfigTab from '@/components/dashboard/AgentConfigTab';
import { AGENTS, COORDINATOR, type AgentId } from '@/lib/agents/registry';
import { AGENT_PAGES } from '@/lib/agents/agentContent';

/* ── Message Types ── */
export interface ChatMessage {
  id: string;
  role: 'agent' | 'user' | 'system';
  content: string;
  type: 'text' | 'job-cards' | 'resume-preview' | 'application-status' | 'interview-prep' | 'skill-gaps' | 'quality-report';
  data?: any;
  feedback?: 'up' | 'down' | null;
  timestamp: number;
  agentId?: string; // present in unified (Cortex) mode
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

/* ── Agent badge colors for unified mode ── */
const AGENT_BADGE_COLORS: Record<string, string> = {
  scout:    'bg-blue-400/10 text-blue-400',
  forge:    'bg-orange-400/10 text-orange-400',
  archer:   'bg-green-400/10 text-green-400',
  atlas:    'bg-purple-400/10 text-purple-400',
  sage:     'bg-teal-400/10 text-teal-400',
  sentinel: 'bg-rose-400/10 text-rose-400',
  cortex:   'bg-cyan-400/10 text-cyan-400',
};

function AgentBadge({ agentId }: { agentId: string }) {
  const label = (AGENTS[agentId as AgentId]?.name) || (agentId === 'cortex' ? COORDINATOR.name : agentId);
  const colors = AGENT_BADGE_COLORS[agentId] || 'bg-white/5 text-white/40';
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${colors}`}>
      {label}
    </span>
  );
}

/* ── Props ── */
interface AgentChatProps {
  agentId: AgentId | 'cortex';
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onQuickAction: (action: string) => void;
  onFeedback: (messageId: string, fb: 'up' | 'down' | null) => void;
  onApplyJob?: (job: any) => void;
  onSaveJob?: (job: any) => void;
  savedJobIds?: Set<string>;
  isWorking: boolean;
  /** Unified timeline mode — shows all agents with attribution badges */
  unifiedMode?: boolean;
  /** Optional panel content rendered above messages (e.g. Interview Prep for Atlas) */
  panelSlot?: React.ReactNode;
  /** Optional toolbar rendered sticky between header and messages (e.g. ScoutToolbar) */
  toolbarSlot?: React.ReactNode;
  /** Increment to programmatically open the Configure tab (from external triggers like ScoutToolbar) */
  openConfigTrigger?: number;
  /** Auto-hunt toggle callback (Scout only) */
  onAutoModeChange?: (enabled: boolean) => void;
}

/* ── Inline Output Renderers ── */
function JobCardItem({ job, onApply, onSave, isSaved }: { job: any; onApply?: (j: any) => void; onSave?: (j: any) => void; isSaved?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const url = job.jobUrl || job.url;
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden transition-all hover:border-white/10">
      <div className="px-3 py-2.5 flex items-start gap-3">
        {/* Company logo or placeholder */}
        {job.companyLogo ? (
          <img src={job.companyLogo} alt="" className="w-8 h-8 rounded-lg object-contain bg-white/5 flex-shrink-0 mt-0.5" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Briefcase className="w-3.5 h-3.5 text-white/20" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-white/80 truncate flex-1">{job.title}</p>
            {job.matchScore && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                job.matchScore >= 80 ? 'text-neon-green bg-neon-green/10' :
                job.matchScore >= 60 ? 'text-amber-400 bg-amber-400/10' :
                'text-white/40 bg-white/5'
              }`}>{job.matchScore}%</span>
            )}
          </div>
          <p className="text-[10px] text-white/35 truncate">{job.company}</p>

          {/* Location + Salary + Type row */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {(job.location || job.remote) && (
              <span className="flex items-center gap-0.5 text-[9px] text-white/25">
                <MapPin className="w-2.5 h-2.5" />{job.location || 'Remote'}
              </span>
            )}
            {job.salary && (
              <span className="flex items-center gap-0.5 text-[9px] text-white/25">
                <DollarSign className="w-2.5 h-2.5" />{job.salary}
              </span>
            )}
            {job.type && (
              <span className="text-[9px] text-white/20 px-1 bg-white/5 rounded">{job.type}</span>
            )}
            {job.remote && (
              <span className="text-[9px] text-blue-400/50 px-1 bg-blue-400/5 rounded">Remote</span>
            )}
            {job.source && (
              <span className="text-[9px] text-white/15">{job.source}</span>
            )}
          </div>

          {/* Expandable description */}
          {job.description && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-0.5 text-[9px] text-white/20 hover:text-white/40 mt-1 transition-colors"
            >
              {expanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              {expanded ? 'Less' : 'Details'}
            </button>
          )}
          {expanded && job.description && (
            <p className="text-[10px] text-white/30 mt-1 leading-relaxed line-clamp-4">{job.description}</p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 mt-2">
            {onApply && (
              <button
                onClick={() => onApply(job)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium
                           bg-gradient-to-r from-neon-blue/15 to-neon-purple/15 text-blue-300/80
                           hover:from-neon-blue/25 hover:to-neon-purple/25 transition-all"
              >
                <ArrowRight className="w-2.5 h-2.5" />Apply via Archer
              </button>
            )}
            {onSave && (
              <button
                onClick={() => onSave(job)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] transition-all ${
                  isSaved
                    ? 'bg-amber-400/10 text-amber-400/70'
                    : 'bg-white/5 text-white/30 hover:text-white/50 hover:bg-white/10'
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-2.5 h-2.5" /> : <Bookmark className="w-2.5 h-2.5" />}
                {isSaved ? 'Saved' : 'Save'}
              </button>
            )}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px]
                           bg-white/5 text-white/30 hover:text-white/50 hover:bg-white/10 transition-all"
              >
                <ExternalLink className="w-2.5 h-2.5" />View
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobCards({ data, onApply, onSave, savedJobIds }: { data: any[]; onApply?: (j: any) => void; onSave?: (j: any) => void; savedJobIds?: Set<string> }) {
  if (!data?.length) return null;
  const [showAll, setShowAll] = useState(false);
  const visibleJobs = showAll ? data : data.slice(0, 5);
  return (
    <div className="space-y-2 mt-2">
      {visibleJobs.map((job: any, i: number) => (
        <JobCardItem
          key={job.id || i}
          job={job}
          onApply={onApply}
          onSave={onSave}
          isSaved={savedJobIds?.has(job.id)}
        />
      ))}
      {data.length > 5 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-[10px] text-white/25 hover:text-white/40 text-center py-1 transition-colors"
        >
          Show all {data.length} jobs ↓
        </button>
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
function MessageOutput({ msg, onApplyJob, onSaveJob, savedJobIds }: { msg: ChatMessage; onApplyJob?: (j: any) => void; onSaveJob?: (j: any) => void; savedJobIds?: Set<string> }) {
  switch (msg.type) {
    case 'job-cards': return <JobCards data={msg.data} onApply={onApplyJob} onSave={onSaveJob} savedJobIds={savedJobIds} />;
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
  onApplyJob,
  onSaveJob,
  savedJobIds,
  isWorking,
  unifiedMode,
  panelSlot,
  toolbarSlot,
  openConfigTrigger,
  onAutoModeChange,
}: AgentChatProps) {
  const [input, setInput] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [infoTab, setInfoTab] = useState<'capabilities' | 'howItWorks' | 'configure'>('capabilities');
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Auto-Hunt state (Scout only) ──
  const [autoMode, setAutoMode] = useState(false);
  const [autoToggling, setAutoToggling] = useState(false);
  const [autoConfigLoaded, setAutoConfigLoaded] = useState(false);
  const [autoTargetRole, setAutoTargetRole] = useState('');
  const [showAutoWarning, setShowAutoWarning] = useState(false);

  useEffect(() => {
    if (agentId !== 'scout') return;
    async function loadAutoState() {
      try {
        const [configRes, profileRes] = await Promise.all([
          fetch('/api/agents/config'),
          fetch('/api/user/profile'),
        ]);
        const config = configRes.ok ? await configRes.json() : {};
        const profile = profileRes.ok ? await profileRes.json() : {};
        setAutoMode(config.scoutAutoMode ?? false);
        setAutoTargetRole(profile.targetRole || '');
        setAutoConfigLoaded(true);
      } catch {
        setAutoConfigLoaded(true);
      }
    }
    loadAutoState();
  }, [agentId]);

  const handleAutoToggle = async () => {
    if (!autoConfigLoaded) return;

    // When enabling: ALWAYS force config panel open + show usage warning
    if (!autoMode) {
      setShowInfo(true);
      setInfoTab('configure');
      setShowAutoWarning(true);
      setTimeout(() => setShowAutoWarning(false), 6000);

      // If no target role, don't enable — just show config
      if (!autoTargetRole?.trim()) return;
    }

    setAutoToggling(true);
    const newValue = !autoMode;
    try {
      await fetch('/api/agents/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoutAutoMode: newValue }),
      });
      setAutoMode(newValue);
      onAutoModeChange?.(newValue);
    } catch {}
    setAutoToggling(false);
  };
  const agent = agentId === 'cortex'
    ? { name: COORDINATOR.name, role: COORDINATOR.role, shortDescription: COORDINATOR.description }
    : AGENTS[agentId];
  const quickActions = QUICK_ACTIONS[agentId] || [];
  const agentDef = agentId !== 'cortex' ? AGENTS[agentId] : null;
  const agentPage = AGENT_PAGES[agentId];
  const howItWorksSteps = agentPage?.howItWorks || [];
  const capabilities = agentDef?.capabilities || [];

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Open config tab when triggered externally (e.g. from ScoutToolbar)
  useEffect(() => {
    if (openConfigTrigger && openConfigTrigger > 0) {
      setShowInfo(true);
      setInfoTab('configure');
    }
  }, [openConfigTrigger]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    onSendMessage(text);
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] rounded-xl border border-white/5 bg-white/[0.015] overflow-hidden">
      {/* ── Chat Header ── */}
      <div className="border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3 px-4 py-3">
          <AgentAvatar agentId={agentId} size={28} pulse={isWorking} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{agent.name}</p>
            <p className="text-[10px] text-white/25">
              {unifiedMode ? 'All agent conversations' : agent.role}
            </p>
          </div>
          {isWorking && (
            <div className="flex items-center gap-1.5 text-neon-blue">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[10px] font-medium">Working...</span>
            </div>
          )}
          {/* Scout Auto Hunt toggle */}
          {agentId === 'scout' && autoConfigLoaded && (
            <button
              onClick={handleAutoToggle}
              disabled={autoToggling}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all hover:bg-white/5"
              title={autoMode ? 'Disable auto-hunting' : 'Enable auto-hunting'}
            >
              <Zap className={`w-3.5 h-3.5 ${autoMode ? 'text-neon-green' : 'text-white/20'}`} />
              <span className={`text-[10px] font-medium ${autoMode ? 'text-neon-green/80' : 'text-white/30'}`}>
                Auto
              </span>
              <div className={`w-7 h-4 rounded-full transition-colors relative ${
                autoMode ? 'bg-neon-green/30' : 'bg-white/10'
              }`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                  autoMode
                    ? 'left-[14px] bg-neon-green shadow-sm shadow-neon-green/30'
                    : 'left-0.5 bg-white/30'
                }`} />
              </div>
              {autoToggling && <Loader2 className="w-3 h-3 text-white/30 animate-spin" />}
            </button>
          )}
          {/* Info toggle — shows capabilities & how it works */}
          {agentId !== 'cortex' && (
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-1.5 rounded-lg transition-all ${
                showInfo
                  ? 'bg-white/10 text-white/70'
                  : 'text-white/25 hover:text-white/50 hover:bg-white/5'
              }`}
              title={showInfo ? 'Hide agent info' : 'What can this agent do?'}
            >
              {showInfo ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* ── Auto-Hunt Usage Warning ── */}
        <AnimatePresence>
          {showAutoWarning && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-400/5 border-t border-amber-400/10">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-amber-400/80 font-medium">Auto-Hunt will increase token usage</p>
                  <p className="text-[9px] text-amber-400/50 mt-0.5 leading-relaxed">
                    Scout will run automatically on your schedule and consume tokens each time.
                    {!autoTargetRole?.trim() && ' Please set your Target Role below before enabling.'}
                    {' '}Review your Daily Limit and Hunt Frequency below.
                  </p>
                </div>
                <button onClick={() => setShowAutoWarning(false)} className="text-amber-400/30 hover:text-amber-400/60 p-0.5 flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Agent Info Dropdown ── */}
        <AnimatePresence>
          {showInfo && agentId !== 'cortex' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 border-t border-white/5 max-h-[50vh] overflow-y-auto">
                {/* Tab Selector */}
                <div className="flex items-center gap-1 pt-2.5 mb-2.5">
                  {([
                    { id: 'capabilities' as const, label: 'Capabilities', Icon: CheckCircle2 },
                    { id: 'howItWorks' as const, label: 'How It Works', Icon: Zap },
                    { id: 'configure' as const, label: 'Configure', Icon: Settings2 },
                  ]).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setInfoTab(tab.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        infoTab === tab.id
                          ? 'bg-white/[0.08] text-white/80'
                          : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                      }`}
                    >
                      <tab.Icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Capabilities */}
                {infoTab === 'capabilities' && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {capabilities.map((cap) => (
                      <div key={cap} className="flex items-center gap-2 text-xs text-white/50">
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: agentDef?.colorHex || '#22d3ee' }} />
                        {cap}
                      </div>
                    ))}
                  </div>
                )}

                {/* How It Works */}
                {infoTab === 'howItWorks' && howItWorksSteps.length > 0 && (
                  <div className="relative">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />
                    <div className="space-y-2.5">
                      {howItWorksSteps.map((step, i) => (
                        <div key={step.step} className="flex gap-3 relative">
                          <div
                            className="relative z-10 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold mt-0.5"
                            style={{
                              background: `${agentDef?.colorHex || '#22d3ee'}20`,
                              color: agentDef?.colorHex || '#22d3ee',
                              border: `1px solid ${agentDef?.colorHex || '#22d3ee'}40`,
                            }}
                          >
                            {i + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white/70">{step.title}</p>
                            <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Configure */}
                {infoTab === 'configure' && (
                  <AgentConfigTab agentId={agentId as AgentId} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Toolbar Slot (sticky, between header and messages) ── */}
      {toolbarSlot}

      {/* ── Sticky Panel Slot (pinned above chat, doesn't scroll away) ── */}
      {panelSlot && (
        <div className="border-b border-white/5 bg-white/[0.02] max-h-[45vh] overflow-y-auto">
          {panelSlot}
        </div>
      )}

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
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
            {messages.map(msg => {
              const msgAgent = (unifiedMode && msg.agentId) ? msg.agentId : agentId;
              return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} ${
                  msg.role === 'system' ? 'justify-center' : ''
                }`}
              >
                {msg.role === 'agent' && (
                  <AgentAvatar agentId={msgAgent as AgentId | 'cortex'} size={20} />
                )}

                <div className={`max-w-[85%] ${
                  msg.role === 'user'
                    ? 'rounded-2xl rounded-tr-sm bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border border-white/10 px-3 py-2'
                    : msg.role === 'system'
                      ? 'text-center'
                      : 'rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/5 px-3 py-2'
                }`}>
                  {/* Agent badge in unified mode */}
                  {unifiedMode && msg.role === 'agent' && msg.agentId && (
                    <div className="mb-1">
                      <AgentBadge agentId={msg.agentId} />
                    </div>
                  )}
                  <p className={`text-xs leading-relaxed ${
                    msg.role === 'system' ? 'text-white/20 text-[10px]' : 'text-white/60'
                  }`}>
                    {msg.content}
                  </p>

                  {/* Structured output */}
                  {msg.type !== 'text' && <MessageOutput msg={msg} onApplyJob={onApplyJob} onSaveJob={onSaveJob} savedJobIds={savedJobIds} />}

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
              );
            })}
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
        <div data-tour="quick-actions" className="flex gap-1.5 px-3 pt-2.5 overflow-x-auto scrollbar-none">
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
