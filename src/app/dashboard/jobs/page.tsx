'use client';

import { useState, useEffect, useCallback, useRef, useMemo, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  ExternalLink,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Sparkles,
  Crown,
  Play,
  XCircle,
  BarChart3,
  Wifi,
  X,
  Radar,
  LayoutGrid,
  List,
  History,
  Shield,
  AlertTriangle,
  ArrowRight,
  Flag,
  Zap,
  FileCheck,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import AgenticWorkspace from '@/components/dashboard/shared/AgenticWorkspace';
import { cn } from '@/lib/utils';
import AgentPageHeader from '@/components/dashboard/AgentPageHeader';
import AgentConfigPanel from '@/components/dashboard/AgentConfigPanel';
import AgentLockedPage from '@/components/dashboard/AgentLockedPage';
import AgentLoader from '@/components/brand/AgentLoader';
import AgentAvatar from '@/components/brand/AgentAvatar';
import SearchProfileWizard from '@/components/dashboard/jobs/SearchProfileWizard';
import ScoutMissionModal, { type ScoutMissionResult } from '@/components/dashboard/ScoutMissionModal';
import ScoutJobCard from '@/components/dashboard/ScoutJobCard';
import ScoutJobGridCard from '@/components/dashboard/ScoutJobGridCard';
import ScoutReportHeader from '@/components/dashboard/ScoutReportHeader';
import { useScoutStatus } from '@/hooks/useScoutStatus';
import { isAgentAvailable, type PlanTier } from '@/lib/agents/permissions';
import { detectScamSignals, type ScamSignals } from '@/lib/jobs/scamDetector';
import { analyseSkillGap, quickATSCheck, type QuickATSResult } from '@/lib/jobs/skillGap';
import { notifyAgentCompleted } from '@/lib/notifications/toast';

// ── Types ──────────────────────────────────────────────
interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  description: string;
  salary: string | null;
  url: string;
  postedAt: string;
  type: string;
  remote: boolean;
  matchScore?: number;
  source?: string;
}

interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  isDemo: boolean;
  error?: string;
}

interface ScoutRunHistoryEntry {
  runId: string;
  status: string;
  jobsFound: number;
  summary: string | null;
  startedAt: string;
  completedAt: string | null;
}

// ── Skeleton Loader ────────────────────────────────────
function JobCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-5 w-48 bg-white/10 rounded" />
            <div className="h-5 w-20 bg-white/5 rounded-full" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-28 bg-white/5 rounded" />
            <div className="h-4 w-32 bg-white/5 rounded" />
            <div className="h-4 w-36 bg-white/5 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-white/5 rounded" />
            <div className="h-3 w-3/4 bg-white/5 rounded" />
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="h-9 w-24 bg-white/10 rounded-lg" />
          <div className="h-9 w-24 bg-white/5 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Relative Time Helper ───────────────────────────────
function safeDiffDays(dateStr: string): number {
  if (!dateStr) return -1;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return -1;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function timeAgo(dateStr: string): string {
  const diffDays = safeDiffDays(dateStr);
  if (diffDays < 0) return 'Recently';

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} month(s) ago`;
}

/** Color-coded job age badge: green (0-7d), yellow (8-14d), red (15d+) */
function jobAgeBadgeLabel(dateStr: string): string {
  const diffDays = safeDiffDays(dateStr);
  if (diffDays < 0) return 'Recently posted';
  if (diffDays === 0) return 'Posted today';
  if (diffDays === 1) return 'Posted 1d ago';
  return `Posted ${diffDays}d ago`;
}

function jobAgeBadgeColor(dateStr: string, mode: 'dark' | 'light' = 'dark'): string {
  const diffDays = safeDiffDays(dateStr);
  if (mode === 'light') {
    if (diffDays < 0 || diffDays <= 7) return 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400';
    if (diffDays <= 14) return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
    return 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400';
  }
  if (diffDays < 0 || diffDays <= 7) return 'bg-green-500/10 text-green-400';
  if (diffDays <= 14) return 'bg-amber-500/10 text-amber-400';
  return 'bg-red-500/10 text-red-400';
}

const SAVED_JOBS_KEY = '3box_saved_jobs';

// ── Job Detail Overlay for Grid View ───────────────────
function JobDetailOverlay({
  job,
  userPlan,
  isSaved,
  onSave,
  onClose,
  onReport,
  userSkills,
}: {
  job: Job;
  userPlan: PlanTier;
  isSaved: boolean;
  onSave: () => void;
  onClose: () => void;
  onReport?: (jobId: string) => void;
  userSkills?: Record<string, number> | null;
}) {
  const overlayRouter = useRouter();
  const [scamCheck, setScamCheck] = useState<ScamSignals | null>(null);
  const [reportConfirm, setReportConfirm] = useState(false);
  const [reported, setReported] = useState(false);
  const [atsResult, setAtsResult] = useState<QuickATSResult | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'checking' | 'active' | 'expired'>('idle');
  const sentinelAvailable = isAgentAvailable('sentinel', userPlan);
  const forgeAvailable = isAgentAvailable('forge', userPlan);

  const handleCheckAvailability = async () => {
    setAvailabilityStatus('checking');
    try {
      const res = await fetch('/api/jobs/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      setAvailabilityStatus(data.available ? 'active' : 'expired');
    } catch {
      setAvailabilityStatus('expired');
    }
  };

  const skillGap = useMemo(() => {
    if (!userSkills) return null;
    return analyseSkillGap(job.description, userSkills);
  }, [job.description, userSkills]);

  const goToImproveScore = () => {
    const params = new URLSearchParams();
    params.set('title', job.title);
    if (job.company) params.set('company', job.company);
    if (job.description) params.set('description', job.description.slice(0, 500));
    if (job.location) params.set('location', job.location);
    if (job.matchScore) params.set('score', String(Math.round(job.matchScore)));
    if (job.salary) params.set('salary', job.salary);
    if (job.remote) params.set('remote', 'true');
    overlayRouter.push(`/dashboard/resume/improve?${params}`);
  };

  const handleVerify = () => {
    const result = detectScamSignals({
      title: job.title,
      company: job.company,
      description: job.description,
      salary: job.salary,
      url: job.url,
      location: job.location,
    });
    setScamCheck(result);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl glass border border-white/10 rounded-2xl overflow-hidden max-h-[80vh] overflow-y-auto ${availabilityStatus === 'expired' ? 'opacity-60' : ''}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">{job.title}</h3>
              {typeof job.matchScore === 'number' && (
                <button
                  onClick={(e) => { e.stopPropagation(); goToImproveScore(); }}
                  className={`text-xs font-bold px-2 py-0.5 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${
                  job.matchScore >= 70 ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                  job.matchScore >= 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-white/5 text-white/40 border-white/10'
                }`}>
                  {job.matchScore}%
                </button>
              )}
            </div>
            <p className="text-xs text-white/50 mt-0.5">{job.company}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/40">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-white/30 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {job.location}
              {job.remote && <span className="text-cyan-400/60 ml-1">(Remote)</span>}
            </span>
            {job.salary && <span className="text-cyan-400/60">{job.salary}</span>}
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${jobAgeBadgeColor(job.postedAt)}`}>
              <Clock className="w-3 h-3" /> {jobAgeBadgeLabel(job.postedAt)}
            </span>
            {job.source && (
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/30 text-[10px]">{job.source}</span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-white/40 leading-relaxed">{job.description}</p>

          {/* Skill Gap Indicator */}
          {skillGap && skillGap.totalRequired >= 2 && (
            <div className={`flex items-start gap-2 p-2.5 rounded-lg text-xs border ${
              skillGap.ratio >= 0.8
                ? 'bg-green-500/5 border-green-500/10 text-green-400/90'
                : skillGap.ratio >= 0.5
                  ? 'bg-amber-500/5 border-amber-500/10 text-amber-400/90'
                  : 'bg-red-500/5 border-red-500/10 text-red-400/90'
            }`}>
              <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold">
                  Skills: {skillGap.matched}/{skillGap.totalRequired} matched
                </span>
                {skillGap.missing.length > 0 && (
                  <span className="opacity-70">
                    {' '}| Missing: {skillGap.missing.slice(0, 5).join(', ')}
                    {skillGap.missing.length > 5 && ` +${skillGap.missing.length - 5} more`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick ATS Check result */}
          {atsResult && (
            <div className={`flex items-start gap-2 p-2.5 rounded-lg text-xs border ${
              atsResult.tier === 'green'
                ? 'bg-green-500/5 border-green-500/10 text-green-400/90'
                : atsResult.tier === 'yellow'
                  ? 'bg-amber-500/5 border-amber-500/10 text-amber-400/90'
                  : 'bg-red-500/5 border-red-500/10 text-red-400/90'
            }`}>
              <FileCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold">
                  ATS Score: {atsResult.score}%
                </span>
                <span className="opacity-70">
                  {' '}({atsResult.matched}/{atsResult.total} keywords)
                </span>
                {atsResult.topMissing.length > 0 && (
                  <span className="opacity-60 block mt-0.5">
                    Missing: {atsResult.topMissing.join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Scam check result */}
          {scamCheck && (
            <div className={`p-3 rounded-xl text-xs border ${
              scamCheck.verdict === 'safe'
                ? 'bg-neon-green/5 border-neon-green/10 text-neon-green/80'
                : scamCheck.verdict === 'suspicious'
                  ? 'bg-amber-500/5 border-amber-500/10 text-amber-400/80'
                  : 'bg-red-500/5 border-red-500/10 text-red-400/80'
            }`}>
              <div className="flex items-center gap-2 mb-1 font-semibold">
                <Shield className="w-3.5 h-3.5" />
                Sentinel Verdict: {scamCheck.verdict === 'safe' ? 'Safe' : scamCheck.verdict === 'suspicious' ? 'Suspicious' : 'Likely Scam'}
                <span className="text-[10px] font-normal opacity-60">Score: {scamCheck.score}/100</span>
              </div>
              {scamCheck.signals.length > 0 && (
                <ul className="space-y-0.5 ml-5">
                  {scamCheck.signals.map((r, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Agent action bar */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
            <span className="text-[10px] text-white/25">Scout found this match. What&apos;s next?</span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {!atsResult && userSkills && (
                <button
                  onClick={() => {
                    const result = quickATSCheck(job.description, userSkills);
                    if (result) setAtsResult(result);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-all"
                  title="Quick ATS compatibility check (free, no AI cost)"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  ATS Check
                </button>
              )}
              {!scamCheck && (
                <button
                  onClick={handleVerify}
                  disabled={!sentinelAvailable}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-all disabled:opacity-40"
                  title={!sentinelAvailable ? 'Sentinel requires Ultra plan' : ''}
                >
                  <AgentAvatar agentId="sentinel" size={16} />
                  Verify Listing
                </button>
              )}
              <a
                href={forgeAvailable ? `/dashboard/resume?optimizeFor=${encodeURIComponent(job.title)}` : '#'}
                onClick={(e) => { if (!forgeAvailable) e.preventDefault(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-all"
                title={!forgeAvailable ? 'Forge requires Starter plan' : ''}
                style={!forgeAvailable ? { opacity: 0.4, pointerEvents: 'none' } : {}}
              >
                <AgentAvatar agentId="forge" size={16} />
                Tailor Resume
              </a>
              {/* Report as scam */}
              {!reported ? (
                reportConfirm ? (
                  <span className="flex items-center gap-1.5 text-[11px] text-red-400/80">
                    <span>Report as suspicious?</span>
                    <button
                      onClick={() => { setReported(true); setReportConfirm(false); onReport?.(job.id); }}
                      className="px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-all"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setReportConfirm(false)}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/40 font-medium transition-all"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setReportConfirm(true)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all"
                    title="Report this job as a scam"
                  >
                    <Flag className="w-3 h-3" />
                  </button>
                )
              ) : (
                <span className="flex items-center gap-1 px-2 py-1.5 text-[11px] text-red-400/60">
                  <Flag className="w-3 h-3" /> Reported
                </span>
              )}
              {/* Check availability */}
              {availabilityStatus === 'idle' ? (
                <button
                  onClick={handleCheckAvailability}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-all"
                  title="Check if job listing is still live"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Check availability
                </button>
              ) : availabilityStatus === 'checking' ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-white/40">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...
                </span>
              ) : availabilityStatus === 'active' ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  <CheckCircle className="w-3.5 h-3.5" /> Still Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  <XCircle className="w-3.5 h-3.5" /> Expired
                </span>
              )}
              <button
                onClick={onSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  isSaved
                    ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                    : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue transition-all"
              >
                Apply <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Review Queue — Jobs needing user review ───────────────────────────────

function ReviewQueue() {
  const [reviewJobs, setReviewJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviewJobs() {
      try {
        const res = await fetch('/api/agents/scout-jobs?status=READY&belowThreshold=true&limit=10');
        if (res.ok) {
          const data = await res.json();
          setReviewJobs(data.jobs || []);
        }
      } catch {}
      setLoading(false);
    }
    fetchReviewJobs();
  }, []);

  const handleApply = async (jobId: string) => {
    setActioning(jobId);
    try {
      await fetch('/api/agents/quick-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      setReviewJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch {}
    setActioning(null);
  };

  const handleSkip = async (jobId: string) => {
    setActioning(jobId);
    try {
      await fetch(`/api/agents/scout-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SKIPPED' }),
      });
      setReviewJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch {}
    setActioning(null);
  };

  if (loading || reviewJobs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="bg-amber-50 dark:bg-amber-500/5 rounded-xl border border-amber-200 dark:border-amber-500/20 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 pt-4 pb-3">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Needs Your Review
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
            {reviewJobs.length}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 px-5 pb-3">
          These jobs scored below your auto-apply threshold and need a manual decision.
        </p>
        <div className="px-5 pb-4 space-y-2">
          <AnimatePresence>
            {reviewJobs.map((job) => (
              <motion.div
                key={job.id}
                layout
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between gap-3 bg-white dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {job.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {job.company}
                    </span>
                    {job.missingSkills && job.missingSkills.length > 0 && (
                      <span className="text-[10px] text-red-500 dark:text-red-400 flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        {job.missingSkills.length} missing skill{job.missingSkills.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {typeof job.matchScore === 'number' && (
                    <span
                      className={cn(
                        'text-[11px] font-bold px-1.5 py-0.5 rounded-md border',
                        job.matchScore >= 70
                          ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20'
                          : job.matchScore >= 50
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
                      )}
                    >
                      {job.matchScore}%
                    </span>
                  )}
                  <button
                    onClick={() => handleApply(job.id)}
                    disabled={actioning === job.id}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {actioning === job.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </button>
                  <button
                    onClick={() => handleSkip(job.id)}
                    disabled={actioning === job.id}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
                  >
                    Skip
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Autopilot Mode — Job Search with Saved Search Profiles ────────────────


interface SavedProfile {
  id: string;
  name: string;
  jobTitle: string;
  location: string;
  remote: boolean;
  active: boolean;
  jobsFound: number;
  appliedCount: number;
  createdAt: string;
  experienceLevel?: string;
  boards?: string;
  includeKeywords?: string;
  excludeKeywords?: string;
  excludeCompanies?: string;
  matchTolerance?: number;
  autoApply?: boolean;
  autoSearch?: boolean;
}


function AutopilotJobSearch() {
  const autopilotRouter = useRouter();
  const jobSearchParams = useSearchParams();
  // My Profiles state
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SavedProfile | null>(null);
  const [stoppedProfiles, setStoppedProfiles] = useState<SavedProfile[]>([]);

  // Search results state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'profiles' | 'search'>(
    jobSearchParams.get('tab') === 'search' ? 'search' : 'profiles'
  );
  const [scoutJobsLoaded, setScoutJobsLoaded] = useState(false);

  // Fetch ScoutJob records (jobs discovered by Scout agent)
  const fetchScoutJobs = useCallback(async () => {
    if (scoutJobsLoaded) return;
    setLoading(true);
    try {
      const res = await fetch('/api/agents/scout/jobs?limit=100');
      if (res.ok) {
        const data = await res.json();
        if (data.jobs && data.jobs.length > 0) {
          setJobs(data.jobs.map((j: any) => ({
            id: j.id,
            title: j.title || '',
            company: j.company || '',
            companyLogo: null,
            location: j.location || '',
            description: j.description || '',
            salary: j.salary || null,
            url: j.jobUrl || '',
            postedAt: j.discoveredAt || new Date().toISOString(),
            type: '',
            remote: j.remote || false,
            matchScore: j.matchScore,
            source: j.source || '',
          })));
          setTotal(data.total || data.jobs.length);
          setHasSearched(true);
        }
      }
    } catch {} finally {
      setLoading(false);
      setScoutJobsLoaded(true);
    }
  }, [scoutJobsLoaded]);

  // Auto-load scout jobs when switching to Search Results tab
  useEffect(() => {
    if (activeTab === 'search' && !hasSearched && !scoutJobsLoaded) {
      fetchScoutJobs();
    }
  }, [activeTab, hasSearched, scoutJobsLoaded, fetchScoutJobs]);

  // Fetch saved search profiles
  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch('/api/user/loops');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles || []);
      }
    } catch {} finally {
      setLoadingProfiles(false);
    }
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const toggleProfileActive = async (profileId: string, active: boolean) => {
    try {
      await fetch(`/api/user/loops/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      setProfiles(prev => prev.map(l => l.id === profileId ? { ...l, active } : l));
    } catch {}
  };

  const stopProfile = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    try {
      await fetch(`/api/user/loops/${profileId}`, { method: 'DELETE' });
      setProfiles(prev => prev.filter(l => l.id !== profileId));
      // Move to history
      if (profile) setStoppedProfiles(prev => [{ ...profile, active: false }, ...prev]);
    } catch {}
  };

  const openEditWizard = (profile: SavedProfile) => {
    setEditingProfile(profile);
    setShowWizard(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Search</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create search profiles to automatically find and apply to jobs.
          </p>
        </div>
        {/* Only show "New Search Profile" button when user already has profiles */}
        {profiles.length > 0 && (
          <button
            onClick={() => setShowWizard(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            New Search Profile
          </button>
        )}
      </div>

      {/* Review Queue — jobs below auto-apply threshold */}
      <ReviewQueue />

      {/* Search Profile Wizard Modal */}
      {showWizard && (
        <SearchProfileWizard
          onClose={() => { setShowWizard(false); setEditingProfile(null); }}
          onComplete={() => {
            setShowWizard(false);
            setEditingProfile(null);
            fetchProfiles();
          }}
          editProfile={editingProfile ? {
            id: editingProfile.id,
            jobTitle: editingProfile.jobTitle,
            location: editingProfile.location,
            remote: editingProfile.remote,
            experienceLevel: editingProfile.experienceLevel,
            boards: editingProfile.boards,
            includeKeywords: editingProfile.includeKeywords,
            excludeKeywords: editingProfile.excludeKeywords,
            excludeCompanies: editingProfile.excludeCompanies,
            matchTolerance: editingProfile.matchTolerance,
            autoSearch: editingProfile.autoSearch,
            autoApply: editingProfile.autoApply,
          } : undefined}
        />
      )}

      {/* Tabs: My Profiles | Search Results */}
      {(
        <>
          <div className="flex items-center gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('profiles')}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === 'profiles'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              My Profiles
              {profiles.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                  {profiles.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === 'search'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              Search Results
              {hasSearched && total > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                  {total}
                </span>
              )}
            </button>
          </div>

          {/* My Profiles Tab */}
          {activeTab === 'profiles' && (
            <div>
              {loadingProfiles ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-16">
                  <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-900 dark:text-white font-medium">No search profiles yet</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-sm mx-auto">
                    Create a search profile to automatically find and apply to jobs matching your criteria.
                  </p>
                  <button
                    onClick={() => setShowWizard(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Create Your First Profile
                  </button>
                </div>
              ) : (
                <>
                <div className="space-y-3">
                  {profiles.map(profile => (
                    <div
                      key={profile.id}
                      className={cn(
                        'bg-white dark:bg-gray-900 border rounded-xl p-4 transition-colors',
                        profile.active
                          ? 'border-green-200 dark:border-green-500/20 hover:border-green-300 dark:hover:border-green-500/30'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 opacity-70',
                      )}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile.jobTitle}</h3>
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              profile.active
                                ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
                            )}>
                              {profile.active ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {profile.location || 'Any location'}
                              {profile.remote && ' · Remote'}
                            </span>
                            <span>{profile.jobsFound} jobs found</span>
                            <span>{profile.appliedCount} applied</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => openEditWizard(profile)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            Edit
                          </button>
                          {/* Toggle on/off */}
                          <button
                            onClick={() => toggleProfileActive(profile.id, !profile.active)}
                            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                            style={{ backgroundColor: profile.active ? '#22c55e' : '#374151' }}
                            title={profile.active ? 'Pause search - your existing results are kept' : 'Resume search - start scanning for new jobs'}
                          >
                            <span className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                              profile.active ? 'translate-x-6' : 'translate-x-1'
                            )} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this search profile and all its results? This cannot be undone.')) {
                                stopProfile(profile.id);
                              }
                            }}
                            className="px-2 py-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete this search profile"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stopped / History */}
                {stoppedProfiles.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <History className="w-3.5 h-3.5" />
                      History
                    </h4>
                    <div className="space-y-2">
                      {stoppedProfiles.map(profile => (
                        <div
                          key={profile.id}
                          className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-lg p-3 opacity-60"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{profile.jobTitle}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                                {profile.location || 'Any location'} | {profile.jobsFound} found, {profile.appliedCount} applied
                              </span>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                              Stopped
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </>
              )}
            </div>
          )}

          {/* Search Results Tab */}
          {activeTab === 'search' && (
            <div>
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              )}

              {!loading && !hasSearched && (
                <div className="text-center py-16">
                  <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  {profiles.length > 0 ? (
                    <>
                      <p className="text-gray-500 dark:text-gray-400">Scout is searching for jobs matching your profile.</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Results will appear here shortly.</p>
                    </>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">Create a search profile to find matching jobs.</p>
                  )}
                </div>
              )}

              {!loading && hasSearched && jobs.length === 0 && (
                <div className="text-center py-16">
                  <Briefcase className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No jobs found. Try different keywords or broaden your filters.</p>
                </div>
              )}

              {!loading && jobs.length > 0 && (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{total} jobs found</p>
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                              {typeof job.matchScore === 'number' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const params = new URLSearchParams();
                                    params.set('title', job.title);
                                    if (job.company) params.set('company', job.company);
                                    if (job.description) params.set('description', job.description.slice(0, 500));
                                    if (job.location) params.set('location', job.location);
                                    if (job.matchScore) params.set('score', String(Math.round(job.matchScore)));
                                    if (job.salary) params.set('salary', job.salary);
                                    if (job.remote) params.set('remote', 'true');
                                    autopilotRouter.push(`/dashboard/resume/improve?${params}`);
                                  }}
                                  className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                  {job.matchScore}% match
                                </button>
                              )}
                              {job.remote && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400">
                                  Remote
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {job.company} {job.location ? `\u00B7 ${job.location}` : ''}
                            </p>
                            {job.salary && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{job.salary}</p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 line-clamp-2">
                              {job.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={async () => {
                                try {
                                  await fetch('/api/user/board-jobs', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      title: job.title,
                                      company: job.company,
                                      jobUrl: job.url,
                                      location: job.location,
                                      source: job.source || 'Search',
                                      matchScore: job.matchScore,
                                      description: job.description,
                                      status: 'SAVED',
                                    }),
                                  });
                                  // Visual feedback — mark as saved in local state
                                  setJobs(prev => prev.map(j => j.id === job.id ? { ...j, source: `${j.source || 'Search'} · Saved` } : j));
                                } catch {}
                              }}
                              className={cn(
                                'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                                job.source?.includes('Saved')
                                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                  : 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800',
                              )}
                            >
                              <Bookmark className={cn('w-3.5 h-3.5 inline mr-1', job.source?.includes('Saved') ? 'fill-current' : '')} />
                              {job.source?.includes('Saved') ? 'Saved' : 'Save'}
                            </button>
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={async () => {
                                try {
                                  await fetch('/api/user/board-jobs', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      title: job.title,
                                      company: job.company,
                                      jobUrl: job.url,
                                      location: job.location,
                                      source: job.source || 'Search',
                                      matchScore: job.matchScore,
                                      description: job.description,
                                      status: 'APPLIED',
                                    }),
                                  });
                                } catch {}
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                            >
                              Apply <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${jobAgeBadgeColor(job.postedAt, 'light')}`}>
                            <Clock className="w-3 h-3" />
                            {jobAgeBadgeLabel(job.postedAt)}
                          </span>
                          {job.source && (
                            <span className="capitalize">{job.source}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function JobsPage() {
  const { isAutopilot, isAgentic } = useDashboardMode();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const mainRouter = useRouter();
  const rawPlan = ((session?.user as any)?.plan ?? 'FREE').toUpperCase();
  const PLAN_NORMALIZE: Record<string, PlanTier> = { BASIC: 'FREE', STARTER: 'PRO', ULTRA: 'MAX', FREE: 'FREE', PRO: 'PRO', MAX: 'MAX' };
  const userPlan = PLAN_NORMALIZE[rawPlan] ?? 'FREE';
  const agentLocked = !isAgentAvailable('scout', userPlan);

  // In Autopilot mode, render simplified job search
  if (isAutopilot) return <AutopilotJobSearch />;

  // In Agentic mode, render Cortex-style agent workspace
  if (isAgentic) return <AgenticWorkspace agentId="scout" />;
  const initialTab = (searchParams.get('tab') as 'scout-report' | 'discover' | 'saved') || 'scout-report';
  const [tab, setTab] = useState<'scout-report' | 'discover' | 'saved'>(initialTab);

  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Scout Mission Modal — auto-open if ?deploy=scout
  const [showMissionModal, setShowMissionModal] = useState(searchParams.get('deploy') === 'scout');

  // Scout Report state
  const [scoutJobs, setScoutJobs] = useState<any[]>([]);
  const [scoutSummary, setScoutSummary] = useState<{
    totalFound: number;
    totalFiltered: number;
    scamJobsFiltered: number;
    sources: string[];
  } | null>(null);
  const [scoutRunId, setScoutRunId] = useState<string | null>(null);
  const [scoutCompletedAt, setScoutCompletedAt] = useState<string | undefined>();

  // View mode for Scout Report
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Grid card detail overlay
  const [detailJob, setDetailJob] = useState<Job | null>(null);

  // Scout run history
  const [runHistory, setRunHistory] = useState<ScoutRunHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Background mode watcher
  const [backgroundRunId, setBackgroundRunId] = useState<string | null>(null);
  const { status: scoutStatus } = useScoutStatus(true);
  const prevScoutStatusRef = useRef<string>('idle');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Saved jobs
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  // DB-backed saved job IDs (ScoutJob IDs with SAVED status)
  const [savedJobDbIds, setSavedJobDbIds] = useState<Map<string, string>>(new Map());

  // User skills from CareerTwin for skill gap analysis
  const [userSkills, setUserSkills] = useState<Record<string, number> | null>(null);

  const isMax = userPlan === 'MAX';

  // Load saved jobs: merge localStorage cache with DB source of truth
  useEffect(() => {
    // 1. Immediate: load from localStorage cache for instant UI
    try {
      const stored = localStorage.getItem(SAVED_JOBS_KEY);
      if (stored) setSavedJobs(JSON.parse(stored));
    } catch {}

    // 2. Fetch DB-backed saved jobs to restore state across sessions
    fetch('/api/user/board-jobs')
      .then(r => r.json())
      .then(data => {
        if (data.jobs && Array.isArray(data.jobs)) {
          const savedStatuses = new Set(['SAVED', 'READY', 'FORGE_READY']);
          const dbSaved = data.jobs.filter((j: any) => savedStatuses.has(j.status));
          // Build a map of jobUrl -> dbId for matching with search results
          const idMap = new Map<string, string>();
          const dbJobs: Job[] = dbSaved.map((j: any) => {
            idMap.set(j.jobUrl, j.id);
            return {
              id: j.id,
              title: j.title,
              company: j.company,
              companyLogo: null,
              location: j.location || '',
              description: '',
              salary: null,
              url: j.jobUrl,
              postedAt: j.discoveredAt || '',
              type: '',
              remote: false,
              matchScore: j.matchScore,
              source: j.source,
            };
          });
          setSavedJobDbIds(idMap);
          // Merge: DB is source of truth, but keep localStorage entries that aren't in DB yet
          setSavedJobs(prev => {
            const dbUrls = new Set(dbJobs.map(j => j.url));
            const localOnly = prev.filter(j => !dbUrls.has(j.url));
            const merged = [...dbJobs, ...localOnly];
            localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch user skills from CareerTwin on mount
  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((data) => {
        const snap = data?.careerTwin?.skillSnapshot;
        if (snap && typeof snap === 'object') {
          setUserSkills(snap);
        }
      })
      .catch(() => {}); // non-critical — skill gap just won't show
  }, []);

  // Fetch latest scout results on mount (persists across navigation)
  useEffect(() => {
    fetch('/api/agents/scout/results')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.jobs?.length) {
          setScoutJobs(data.jobs);
          setScoutSummary(data.summary);
          setScoutRunId(data.runId);
          setScoutCompletedAt(data.completedAt);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch run history
  useEffect(() => {
    fetch('/api/agents/scout/history')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.runs) setRunHistory(data.runs);
      })
      .catch(() => {});
  }, [scoutRunId]);

  // Background completion watcher
  useEffect(() => {
    if (prevScoutStatusRef.current === 'running' && scoutStatus === 'completed' && backgroundRunId) {
      fetch('/api/agents/scout/results')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.jobs?.length) {
            setScoutJobs(data.jobs);
            setScoutSummary(data.summary);
            setScoutRunId(data.runId);
            setScoutCompletedAt(data.completedAt);
            setTab('scout-report');
            notifyAgentCompleted('scout', `Found ${data.jobs.length} matching jobs!`, '/dashboard/jobs?tab=scout-report');
          }
        })
        .catch(() => {});
      setBackgroundRunId(null);
    }
    prevScoutStatusRef.current = scoutStatus;
  }, [scoutStatus, backgroundRunId]);

  // Handle Scout mission complete
  const handleScoutComplete = (result: ScoutMissionResult) => {
    setScoutJobs(result.jobs);
    setScoutSummary(result.summary);
    setScoutRunId(result.runId);
    setScoutCompletedAt(new Date().toISOString());
    setShowMissionModal(false);
    setTab('scout-report');
    notifyAgentCompleted('scout', `Scout found ${result.jobs.length} jobs matching your criteria.`, '/dashboard/jobs?tab=scout-report');
  };

  // Handle background mode
  const handleBackground = () => {
    setBackgroundRunId('pending');
  };

  // Handle "View Job" click: MAX users go directly, others see upgrade modal
  const handleViewJob = (job: Job) => {
    if (isMax) {
      window.open(job.url, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedJob(job);
      setShowUpgradeModal(true);
    }
  };

  const toggleSaveJob = (job: Job) => {
    setSavedJobs(prev => {
      const exists = prev.some(j => j.id === job.id || j.url === job.url);
      const updated = exists ? prev.filter(j => j.id !== job.id && j.url !== job.url) : [...prev, job];
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(updated));

      if (!exists) {
        // Save to DB
        fetch('/api/user/board-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: job.title,
            company: job.company,
            jobUrl: job.url,
            location: job.location,
            source: job.source || 'Job Search',
            matchScore: job.matchScore,
            description: job.description,
            status: 'SAVED',
          }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.job?.id) {
              setSavedJobDbIds(m => new Map(m).set(job.url, data.job.id));
            }
          })
          .catch(() => {});
      } else {
        // Unsave: update status in DB to SKIPPED
        const dbId = savedJobDbIds.get(job.url);
        if (dbId) {
          fetch(`/api/user/board-jobs/${dbId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'SKIPPED' }),
          }).catch(() => {});
          setSavedJobDbIds(m => { const n = new Map(m); n.delete(job.url); return n; });
        }
      }

      return updated;
    });
  };

  const isJobSaved = (jobId: string, jobUrl?: string) => savedJobs.some(j => j.id === jobId || (jobUrl && j.url === jobUrl));

  // ── Report scam ──────────────────────────────────────
  const handleReportScam = async (jobId: string) => {
    try {
      await fetch('/api/jobs/report-scam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      // Remove reported job from the scout list
      setScoutJobs(prev => prev.filter((j: any) => j.id !== jobId));
      // Close overlay if the reported job is currently shown
      if (detailJob?.id === jobId) setDetailJob(null);
    } catch (err) {
      console.error('Failed to report scam:', err);
    }
  };

  // ── Fetch Jobs ─────────────────────────────────────
  const fetchJobs = useCallback(async (q: string, loc: string, remote: boolean, pg: number) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (loc.trim()) params.set('location', loc.trim());
      if (remote) params.set('remote_only', 'true');
      params.set('page', String(pg));

      const res = await fetch(`/api/jobs/search?${params.toString()}`);

      if (!res.ok) {
        if (res.status === 401) {
          setError('Please sign in to search for jobs.');
          return;
        }
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to fetch jobs. Please try again.');
        return;
      }

      const data: JobsResponse = await res.json();

      if (data.error) {
        setError(data.error);
      }

      const foundJobs = data.jobs || [];
      setJobs(foundJobs);
      setTotal(data.total || 0);
      setIsDemo(data.isDemo || false);

      // Auto-save search results to board in background
      if (foundJobs.length > 0) {
        fetch('/api/user/board-jobs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobs: foundJobs.map((j: Job) => ({
              title: j.title,
              company: j.company,
              url: j.url,
              location: j.location,
              source: j.source || 'Live Search',
              matchScore: j.matchScore,
              description: j.description,
            })),
          }),
        }).catch(() => {}); // Silent — don't block search UX
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load with user's target role and location from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem('3box_target_role');
    const savedLocation = localStorage.getItem('3box_user_location');
    if (savedRole && !searchQuery) {
      setSearchQuery(savedRole);
    }
    if (savedLocation && !locationQuery) {
      setLocationQuery(savedLocation);
    }
    fetchJobs(savedRole || searchQuery, savedLocation || locationQuery, remoteOnly, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle Search Submit ───────────────────────────
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs(searchQuery, locationQuery, remoteOnly, 1);
  };

  // ── Pagination ─────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / 10));
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchJobs(searchQuery, locationQuery, remoteOnly, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Locked agent check ─────────────
  if (agentLocked) return <AgentLockedPage agentId="scout" />;

  // ── Normal Job Search UI ─────────────
  return (
    <div className="max-w-5xl mx-auto">
      <AgentPageHeader agentId="scout" onRunNow={() => setShowMissionModal(true)} />
      <AgentConfigPanel agentId="scout" variant="collapsible" />

      {/* Scout Mission Modal */}
      <ScoutMissionModal
        open={showMissionModal}
        onClose={() => setShowMissionModal(false)}
        onComplete={handleScoutComplete}
        onBackground={handleBackground}
      />

      {/* Grid card detail overlay */}
      <AnimatePresence>
        {detailJob && (
          <JobDetailOverlay
            job={detailJob}
            userPlan={userPlan}
            isSaved={isJobSaved(detailJob.id, detailJob.url)}
            onSave={() => toggleSaveJob(detailJob)}
            onClose={() => setDetailJob(null)}
            onReport={handleReportScam}
            userSkills={userSkills}
          />
        )}
      </AnimatePresence>

      {/* Upgrade Modal for non-MAX users */}
      <AnimatePresence>
        {showUpgradeModal && selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass border border-white/10 rounded-2xl p-6 text-center"
            >
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400/20 to-cyan-400/20 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Upgrade to Max</h3>
              <p className="text-sm text-white/50 mb-2">
                You found a great match!
              </p>
              <p className="text-sm text-white/40 mb-6">
                Upgrade to the <span className="text-blue-400 font-semibold">Max plan</span> to view full job details, apply directly, and get AI-powered application assistance.
              </p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-6 text-left">
                <p className="text-sm font-medium text-white/80">{selectedJob.title}</p>
                <p className="text-xs text-white/40">{selectedJob.company} - {selectedJob.location}</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/pricing"
                  className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <Crown className="w-4 h-4" /> Upgrade Now
                </Link>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 btn-secondary py-2.5 text-sm"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <Briefcase className="w-7 h-7 text-blue-400" /> Job Matching
        </h1>
        <p className="text-white/40">Find and track job opportunities powered by real-time data.</p>
      </motion.div>

      {/* Tabs — Scout Report first */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'scout-report' as const, label: `Scout Report${scoutJobs.length ? ` (${scoutJobs.length})` : ''}`, icon: Radar },
          { id: 'discover' as const, label: 'Discover Jobs', icon: Search },
          { id: 'saved' as const, label: 'Saved Jobs', icon: Bookmark },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              tab === t.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Scout Report Tab ──────────────────────────── */}
      {tab === 'scout-report' && (
        scoutJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-16"
          >
            <Radar className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Scout Report Yet</h3>
            <p className="text-sm text-white/40 mb-4">Deploy Agent Scout to hunt for jobs across 6+ platforms.</p>
            <button
              onClick={() => setShowMissionModal(true)}
              className="btn-primary text-sm px-5 py-2 inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Deploy Scout
            </button>

            {/* Run History */}
            {runHistory.length > 0 && (
              <div className="mt-8 text-left max-w-md mx-auto">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Previous Runs
                </h4>
                <div className="space-y-2">
                  {runHistory.slice(0, 5).map(run => (
                    <div key={run.runId} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 truncate">{run.summary?.split(' - ')[0] || 'Scout mission'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] flex-shrink-0 ${
                          run.status === 'completed' ? 'bg-blue-400/10 text-blue-400' :
                          run.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {run.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-white/25">
                        <span>{run.jobsFound} jobs found</span>
                        <span>{new Date(run.startedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <>
            {scoutSummary && (
              <ScoutReportHeader
                totalFound={scoutSummary.totalFound}
                totalFiltered={scoutSummary.totalFiltered}
                scamJobsFiltered={scoutSummary.scamJobsFiltered}
                sources={scoutSummary.sources}
                topMatchScore={scoutJobs[0]?.matchScore}
                completedAt={scoutCompletedAt}
              />
            )}

            {/* ── Post-Scout Action Bar ── */}
            {scoutSummary && scoutJobs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-xl bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-orange-500/5 border border-white/10"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Scout found {scoutSummary.totalFiltered} qualifying jobs
                    </h4>
                    <p className="text-xs text-white/40 mt-0.5">
                      Deploy Archer to auto-apply, or refine your resume with Forge first.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      href="/dashboard/applications"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 transition-all shadow-lg shadow-green-500/20"
                    >
                      <AgentAvatar agentId="archer" size={18} />
                      Deploy Archer
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href="/dashboard/resume"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
                    >
                      <AgentAvatar agentId="forge" size={18} />
                      Modify Resume
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* View toggle + actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {runHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-all"
                  >
                    <History className="w-3.5 h-3.5" />
                    History ({runHistory.length})
                  </button>
                )}
                <button
                  onClick={() => setShowMissionModal(true)}
                  className="btn-secondary text-xs px-4 py-1.5 inline-flex items-center gap-1.5"
                >
                  <Radar className="w-3.5 h-3.5" /> New Mission
                </button>
              </div>
            </div>

            {/* Run History panel */}
            <AnimatePresence>
              {showHistory && runHistory.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Run History</h4>
                    {runHistory.map(run => (
                      <div key={run.runId} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] text-xs">
                        <div className="flex-1 min-w-0">
                          <span className="text-white/50 truncate block">{run.summary?.replace(/\[Cancelled by user\]/, '').trim() || 'Scout mission'}</span>
                          <span className="text-white/25">{new Date(run.startedAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-white/30">{run.jobsFound} jobs</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            run.status === 'completed' ? 'bg-blue-400/10 text-blue-400' :
                            run.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {run.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {scoutJobs.map((job, i) => (
                  <ScoutJobGridCard
                    key={job.id}
                    job={job}
                    index={i}
                    isSaved={isJobSaved(job.id, job.url)}
                    onSave={() => toggleSaveJob(job)}
                    onClick={() => setDetailJob(job)}
                    onReport={handleReportScam}
                    userSkills={userSkills}
                  />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-2">
                {scoutJobs.map((job, i) => (
                  <ScoutJobCard
                    key={job.id}
                    job={job}
                    index={i}
                    userPlan={userPlan}
                    isSaved={isJobSaved(job.id, job.url)}
                    onSave={() => toggleSaveJob(job)}
                    onReport={handleReportScam}
                    userSkills={userSkills}
                  />
                ))}
              </div>
            )}
          </>
        )
      )}

      {/* ── Discover Jobs Tab ─────────────────────────── */}
      {tab === 'discover' && (
        <>
          {/* Demo Data Banner */}
          <AnimatePresence>
            {isDemo && !loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-xl bg-neon-blue/5 border border-neon-blue/10 text-sm text-neon-blue/80 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Showing demo data. Add a <code className="px-1 py-0.5 bg-white/5 rounded text-xs">RAPIDAPI_KEY</code> to your environment for live job listings from JSearch.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="card mb-6">
            <div className="flex gap-3 flex-wrap items-end">
              <div className="relative flex-1 min-w-[180px]">
                <label className="block text-xs text-white/40 mb-1.5">Role / Keywords</label>
                <Search className="absolute left-3 bottom-2.5 w-4 h-4 text-white/30" />
                <input
                  className="input-field pl-10"
                  placeholder="Software engineer, React, ML..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative flex-1 min-w-[180px]">
                <label className="block text-xs text-white/40 mb-1.5">Location</label>
                <MapPin className="absolute left-3 bottom-2.5 w-4 h-4 text-white/30" />
                <input
                  className="input-field pl-10"
                  placeholder="City, state, or country..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRemoteOnly(!remoteOnly)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                    remoteOnly
                      ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-400'
                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                  }`}
                >
                  <Wifi className="w-4 h-4" />
                  Remote
                </button>
                <button
                  type="submit"
                  className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-sm text-red-400 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading */}
          {loading && (
            <AgentLoader agentId="scout" message="Agent Scout is hunting for jobs" />
          )}

          {/* Empty State */}
          {!loading && jobs.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <Search className="w-16 h-16 text-white/10 mb-4" />
              <h3 className="text-lg font-semibold text-white/70 mb-2">No jobs found yet</h3>
              <p className="text-sm text-white/40 mb-6 max-w-md">
                Tell us your target role and let Scout find matching jobs across 6+ platforms
              </p>
              <button
                onClick={() => setShowMissionModal(true)}
                className="btn-primary text-sm px-5 py-2.5 inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> Start Job Search
              </button>
            </motion.div>
          )}

          {/* Job Listings */}
          {!loading && jobs.length > 0 && (
            <div className="space-y-4">
              {jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card hover:border-white/10 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="font-semibold text-white truncate">{job.title}</h3>
                        {typeof job.matchScore === 'number' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const params = new URLSearchParams();
                              params.set('title', job.title);
                              if (job.company) params.set('company', job.company);
                              if (job.description) params.set('description', job.description.slice(0, 500));
                              if (job.location) params.set('location', job.location);
                              if (job.matchScore) params.set('score', String(Math.round(job.matchScore)));
                              if (job.salary) params.set('salary', job.salary);
                              if (job.remote) params.set('remote', 'true');
                              mainRouter.push(`/dashboard/resume/improve?${params}`);
                            }}
                            className={`badge text-xs flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity ${
                            job.matchScore >= 70 ? 'bg-blue-400/10 text-blue-400' :
                            job.matchScore >= 40 ? 'bg-amber-500/10 text-amber-400' :
                            'bg-white/5 text-white/40'
                          }`}>
                            <BarChart3 className="w-3 h-3 mr-0.5" /> {job.matchScore}% match
                          </button>
                        )}
                        {job.remote && (
                          <span className="badge text-xs bg-cyan-400/10 text-cyan-400 flex-shrink-0">
                            <Wifi className="w-3 h-3 mr-0.5" /> Remote
                          </span>
                        )}
                        <span className="badge text-xs bg-white/5 text-white/50 flex-shrink-0">
                          {job.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/40 flex-wrap mb-2">
                        <span className="font-medium text-white/60">{job.company}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                        {job.salary && (
                          <span className="text-cyan-400/80 font-medium">{job.salary}</span>
                        )}
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${jobAgeBadgeColor(job.postedAt)}`}>
                          <Clock className="w-3 h-3" /> {jobAgeBadgeLabel(job.postedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-white/30 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-white/20">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Match Score -- Coming soon</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewJob(job);
                        }}
                        className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 whitespace-nowrap"
                      >
                        View Job <ExternalLink className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveJob(job);
                        }}
                        className={`text-xs px-4 py-2 flex items-center gap-1.5 whitespace-nowrap ${
                          isJobSaved(job.id, job.url) ? 'btn-primary' : 'btn-secondary'
                        }`}
                      >
                        <Bookmark className={`w-3 h-3 ${isJobSaved(job.id, job.url) ? 'fill-current' : ''}`} />
                        {isJobSaved(job.id, job.url) ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && jobs.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className={`p-2 rounded-lg transition-all ${
                  page <= 1
                    ? 'text-white/20 cursor-not-allowed'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      page === pageNum
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-white/40 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className={`p-2 rounded-lg transition-all ${
                  page >= totalPages
                    ? 'text-white/20 cursor-not-allowed'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {!loading && jobs.length > 0 && (
            <p className="text-center text-xs text-white/20 mt-3">
              Showing {jobs.length} of {total} results {isDemo && '(demo data)'}
            </p>
          )}
        </>
      )}

      {/* ── Saved Jobs Tab ────────────────────────────── */}
      {tab === 'saved' && (
        savedJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-16"
          >
            <Bookmark className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No saved jobs yet</h3>
            <p className="text-sm text-white/40 mb-4">Save jobs to see them here for quick access later.</p>
            <button
              onClick={() => setTab('discover')}
              className="btn-primary text-sm px-5 py-2 inline-flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Discover Jobs
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {savedJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h3 className="font-semibold text-white truncate">{job.title}</h3>
                      {job.remote && (
                        <span className="badge text-xs bg-cyan-400/10 text-cyan-400 flex-shrink-0">
                          <Wifi className="w-3 h-3 mr-0.5" /> Remote
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/40 flex-wrap mb-2">
                      <span className="font-medium text-white/60">{job.company}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                      {job.salary && <span className="text-cyan-400/80 font-medium">{job.salary}</span>}
                    </div>
                    <p className="text-sm text-white/30 line-clamp-2">{job.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewJob(job)}
                      className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      View Job <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => toggleSaveJob(job)}
                      className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 whitespace-nowrap text-red-400 hover:text-red-300"
                    >
                      <XCircle className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

    </div>
  );
}

