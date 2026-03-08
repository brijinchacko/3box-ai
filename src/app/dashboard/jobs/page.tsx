'use client';

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Send,
  Crown,
  Play,
  XCircle,
  BarChart3,
  Wifi,
  Lock,
  X,
  Radar,
  LayoutGrid,
  List,
  History,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AgentPageHeader from '@/components/dashboard/AgentPageHeader';
import AgentLockedPage from '@/components/dashboard/AgentLockedPage';
import AgentLoader from '@/components/brand/AgentLoader';
import AgentAvatar from '@/components/brand/AgentAvatar';
import ScoutMissionModal, { type ScoutMissionResult } from '@/components/dashboard/ScoutMissionModal';
import ScoutJobCard from '@/components/dashboard/ScoutJobCard';
import ScoutJobGridCard from '@/components/dashboard/ScoutJobGridCard';
import ScoutReportHeader from '@/components/dashboard/ScoutReportHeader';
import { useScoutStatus } from '@/hooks/useScoutStatus';
import { isAgentAvailable, type PlanTier } from '@/lib/agents/permissions';
import { detectScamSignals, type ScamSignals } from '@/lib/jobs/scamDetector';
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
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} month(s) ago`;
}

const SAVED_JOBS_KEY = 'jobted_saved_jobs';

// ── Job Detail Overlay for Grid View ───────────────────
function JobDetailOverlay({
  job,
  userPlan,
  isSaved,
  onSave,
  onClose,
}: {
  job: Job;
  userPlan: PlanTier;
  isSaved: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const [scamCheck, setScamCheck] = useState<ScamSignals | null>(null);
  const sentinelAvailable = isAgentAvailable('sentinel', userPlan);
  const forgeAvailable = isAgentAvailable('forge', userPlan);

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
        className="w-full max-w-xl glass border border-white/10 rounded-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">{job.title}</h3>
              {typeof job.matchScore === 'number' && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                  job.matchScore >= 70 ? 'bg-neon-green/10 text-neon-green border-neon-green/20' :
                  job.matchScore >= 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-white/5 text-white/40 border-white/10'
                }`}>
                  {job.matchScore}%
                </span>
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
              {job.remote && <span className="text-neon-green/60 ml-1">(Remote)</span>}
            </span>
            {job.salary && <span className="text-neon-green/60">{job.salary}</span>}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo(job.postedAt)}
            </span>
            {job.source && (
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/30 text-[10px]">{job.source}</span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-white/40 leading-relaxed">{job.description}</p>

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
              {!scamCheck && (
                <button
                  onClick={handleVerify}
                  disabled={!sentinelAvailable}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-all disabled:opacity-40"
                  title={!sentinelAvailable ? 'Sentinel requires Ultra plan' : ''}
                >
                  <AgentAvatar agentId="sentinel" size={16} sleeping={!sentinelAvailable} />
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
                <AgentAvatar agentId="forge" size={16} sleeping={!forgeAvailable} />
                Tailor Resume
              </a>
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

// ── Main Page ──────────────────────────────────────────
export default function JobsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const userPlan = ((session?.user as any)?.plan ?? 'BASIC').toUpperCase() as PlanTier;
  const agentLocked = !isAgentAvailable('scout', userPlan);
  const initialTab = (searchParams.get('tab') as 'scout-report' | 'discover' | 'saved' | 'applications') || 'scout-report';
  const [tab, setTab] = useState<'scout-report' | 'discover' | 'saved' | 'applications'>(initialTab);

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

  const isUltra = userPlan === 'ULTRA';

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_JOBS_KEY);
      if (stored) setSavedJobs(JSON.parse(stored));
    } catch {}
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

  // Handle "View Job" click: ULTRA users go directly, others see upgrade modal
  const handleViewJob = (job: Job) => {
    if (isUltra) {
      window.open(job.url, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedJob(job);
      setShowUpgradeModal(true);
    }
  };

  const toggleSaveJob = (job: Job) => {
    setSavedJobs(prev => {
      const exists = prev.some(j => j.id === job.id);
      const updated = exists ? prev.filter(j => j.id !== job.id) : [...prev, job];
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isJobSaved = (jobId: string) => savedJobs.some(j => j.id === jobId);

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

      setJobs(data.jobs || []);
      setTotal(data.total || 0);
      setIsDemo(data.isDemo || false);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load with user's target role and location from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem('jobted_target_role');
    const savedLocation = localStorage.getItem('jobted_user_location');
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
            isSaved={isJobSaved(detailJob.id)}
            onSave={() => toggleSaveJob(detailJob)}
            onClose={() => setDetailJob(null)}
          />
        )}
      </AnimatePresence>

      {/* Upgrade Modal for non-ULTRA users */}
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-orange/20 to-neon-purple/20 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-neon-orange" />
              </div>
              <h3 className="text-xl font-bold mb-2">Upgrade to Ultra</h3>
              <p className="text-sm text-white/50 mb-2">
                You found a great match!
              </p>
              <p className="text-sm text-white/40 mb-6">
                Upgrade to the <span className="text-neon-orange font-semibold">Ultra plan</span> to view full job details, apply directly, and get AI-powered application assistance.
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
          <Briefcase className="w-7 h-7 text-neon-orange" /> Job Matching
        </h1>
        <p className="text-white/40">Find and track job opportunities powered by real-time data.</p>
      </motion.div>

      {/* Tabs — Scout Report first */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'scout-report' as const, label: `Scout Report${scoutJobs.length ? ` (${scoutJobs.length})` : ''}`, icon: Radar },
          { id: 'discover' as const, label: 'Discover Jobs', icon: Search },
          { id: 'saved' as const, label: 'Saved Jobs', icon: Bookmark },
          { id: 'applications' as const, label: 'Applications', icon: Send },
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
                        <span className="text-white/50 truncate">{run.summary?.split(' — ')[0] || 'Scout mission'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] flex-shrink-0 ${
                          run.status === 'completed' ? 'bg-neon-green/10 text-neon-green' :
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
                            run.status === 'completed' ? 'bg-neon-green/10 text-neon-green' :
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
                    isSaved={isJobSaved(job.id)}
                    onSave={() => toggleSaveJob(job)}
                    onClick={() => setDetailJob(job)}
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
                    isSaved={isJobSaved(job.id)}
                    onSave={() => toggleSaveJob(job)}
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
                      ? 'bg-neon-green/10 border-neon-green/30 text-neon-green'
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
              className="card text-center py-12"
            >
              <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-1">No jobs found</h3>
              <p className="text-sm text-white/40">Try adjusting your search keywords or filters.</p>
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
                          <span className={`badge text-xs flex-shrink-0 ${
                            job.matchScore >= 70 ? 'bg-neon-green/10 text-neon-green' :
                            job.matchScore >= 40 ? 'bg-amber-500/10 text-amber-400' :
                            'bg-white/5 text-white/40'
                          }`}>
                            <BarChart3 className="w-3 h-3 mr-0.5" /> {job.matchScore}% match
                          </span>
                        )}
                        {job.remote && (
                          <span className="badge text-xs bg-neon-green/10 text-neon-green flex-shrink-0">
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
                          <span className="text-neon-green/80 font-medium">{job.salary}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeAgo(job.postedAt)}
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
                        {!isUltra && <Lock className="w-3 h-3 ml-0.5 opacity-60" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveJob(job);
                        }}
                        className={`text-xs px-4 py-2 flex items-center gap-1.5 whitespace-nowrap ${
                          isJobSaved(job.id) ? 'btn-primary' : 'btn-secondary'
                        }`}
                      >
                        <Bookmark className={`w-3 h-3 ${isJobSaved(job.id) ? 'fill-current' : ''}`} />
                        {isJobSaved(job.id) ? 'Saved' : 'Save'}
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
                        ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange/30'
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
                        <span className="badge text-xs bg-neon-green/10 text-neon-green flex-shrink-0">
                          <Wifi className="w-3 h-3 mr-0.5" /> Remote
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/40 flex-wrap mb-2">
                      <span className="font-medium text-white/60">{job.company}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                      {job.salary && <span className="text-neon-green/80 font-medium">{job.salary}</span>}
                    </div>
                    <p className="text-sm text-white/30 line-clamp-2">{job.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewJob(job)}
                      className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      View Job <ExternalLink className="w-3 h-3" />
                      {!isUltra && <Lock className="w-3 h-3 ml-0.5 opacity-60" />}
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

      {/* ── Applications Tab ──────────────────────────── */}
      {tab === 'applications' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-16"
        >
          <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-1">Track your applications here</h3>
          <p className="text-sm text-white/40 mb-4">
            When you apply to jobs, they will appear here so you can track your progress.
          </p>
          <button
            onClick={() => setTab('discover')}
            className="btn-primary text-sm px-5 py-2 inline-flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4" /> Browse Jobs
          </button>
        </motion.div>
      )}
    </div>
  );
}
