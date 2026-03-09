'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Send,
  Play,
  Search,
  Wifi,
  Target,
  Shield,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  XCircle,
  ArrowRight,
  Inbox,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import AgentLockedPage from '@/components/dashboard/AgentLockedPage';
import { isAgentAvailable, type PlanTier } from '@/lib/agents/permissions';

// ── Types ──────────────────────────────────────────────
interface ApplicationEntry {
  id: string;
  jobTitle: string;
  company: string;
  location: string | null;
  salaryRange: string | null;
  matchScore: number | null;
  status: string;
  appliedAt: string | null;
  source: string | null;
  applicationMethod: string | null;
  atsType: string | null;
  emailSentTo: string | null;
  emailConfidence: number | null;
  coverLetter: string | null;
  jobUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationsResponse {
  applications: ApplicationEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    total: number;
    queued: number;
    emailed: number;
    applied: number;
    interview: number;
    offer: number;
    rejected: number;
    byMethod: { ats_api: number; cold_email: number; portal: number };
  };
}

interface LastRun {
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

interface PreflightData {
  hasResume: boolean;
  resumeTitle: string | null;
  configEnabled: boolean;
  targetRoles: string[];
  lastRun: LastRun | null;
  runningNow: boolean;
}

// ── Config ─────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  QUEUED:    { label: 'Queued',    color: 'text-white/60',    bg: 'bg-white/5',        border: 'border-white/10' },
  EMAILED:   { label: 'Emailed',   color: 'text-neon-blue',   bg: 'bg-neon-blue/10',   border: 'border-neon-blue/20' },
  APPLIED:   { label: 'Applied',   color: 'text-neon-green',  bg: 'bg-neon-green/10',  border: 'border-neon-green/20' },
  VIEWED:    { label: 'Viewed',    color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  INTERVIEW: { label: 'Interview', color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/20' },
  OFFER:     { label: 'Offer',     color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
  REJECTED:  { label: 'Rejected',  color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
  WITHDRAWN: { label: 'Withdrawn', color: 'text-white/40',    bg: 'bg-white/5',        border: 'border-white/10' },
};

const METHOD_LABELS: Record<string, string> = {
  ats_api: 'ATS API',
  cold_email: 'Cold Email',
  portal: 'Job Portal',
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

// ── Main Page ──────────────────────────────────────────
export default function ApplicationsPage() {
  const { data: session } = useSession();
  const userPlan = ((session?.user as any)?.plan ?? 'BASIC').toUpperCase() as PlanTier;
  const agentLocked = !isAgentAvailable('archer', userPlan);

  const [apps, setApps] = useState<ApplicationEntry[]>([]);
  const [stats, setStats] = useState<ApplicationsResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [appPage, setAppPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Archer workflow state
  const [preflight, setPreflight] = useState<PreflightData | null>(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [runError, setRunError] = useState<string | null>(null);

  // Fetch preflight data (resume status, config, last run)
  useEffect(() => {
    if (agentLocked) return;
    Promise.all([
      fetch('/api/agents/config').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/agents/run?limit=1').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/user/profile').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([config, runsData, profile]) => {
      const runs = runsData?.runs || [];
      const lastRun = runs[0] || null;
      const hasResume = profile?.journey?.resume || false;
      setPreflight({
        hasResume,
        resumeTitle: null,
        configEnabled: config?.enabled || false,
        targetRoles: config?.targetRoles || [],
        lastRun,
        runningNow: lastRun?.status === 'running',
      });
      if (lastRun?.status === 'running') setRunning(true);
    });
  }, [agentLocked]);

  // Poll for run completion when running
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/agents/run?limit=1');
        if (!res.ok) return;
        const data = await res.json();
        const run = data.runs?.[0];
        if (run && run.status !== 'running') {
          setRunning(false);
          setRunResult(run);
          setPreflight(prev => prev ? { ...prev, lastRun: run, runningNow: false } : prev);
          // Refresh applications
          fetchApplications(statusFilter, 1);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [running, statusFilter]);

  const fetchApplications = useCallback(async (status: string, pg: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      params.set('page', String(pg));
      params.set('limit', '20');
      const res = await fetch(`/api/applications?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data: ApplicationsResponse = await res.json();
      setApps(data.applications);
      setStats(data.stats);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!agentLocked) fetchApplications(statusFilter, appPage);
  }, [statusFilter, appPage, fetchApplications, agentLocked]);

  const handleFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    setAppPage(1);
  };

  // ── Run Archer ──
  const handleRunArcher = async () => {
    setRunning(true);
    setRunResult(null);
    setRunError(null);
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setRunError(data.error || 'Failed to start pipeline');
        setRunning(false);
        return;
      }
      // Pipeline started — poll will pick up completion
      if (data.status && data.status !== 'running') {
        // Already completed (sync response)
        setRunning(false);
        setRunResult(data);
        fetchApplications(statusFilter, 1);
      }
    } catch (err: any) {
      setRunError(err.message || 'Failed to start');
      setRunning(false);
    }
  };

  if (agentLocked) return <AgentLockedPage agentId="archer" />;

  const hasApps = (stats?.total ?? 0) > 0;
  const noJobsFound = preflight?.lastRun && preflight.lastRun.jobsFound === 0 && preflight.lastRun.status !== 'running';

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Agent Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <AgentAvatar agentId="archer" size={36} pulse={running} sleeping={!running && !hasApps} />
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              Archer
              <span className="text-[10px] px-2 py-0.5 rounded-full text-neon-orange bg-neon-orange/10 font-medium">
                Auto-Apply Agent
              </span>
            </h1>
            <p className="text-xs text-white/40">
              {running ? 'Running pipeline — finding and applying to jobs...' : 'Sends applications to matched jobs on your behalf'}
            </p>
          </div>
          <button
            onClick={handleRunArcher}
            disabled={running}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              running
                ? 'bg-neon-orange/10 text-neon-orange/70 border border-neon-orange/20'
                : 'bg-gradient-to-r from-neon-orange to-amber-500 text-white shadow-lg shadow-neon-orange/20 hover:shadow-neon-orange/40'
            } disabled:opacity-70`}
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Running...' : 'Run Archer'}
          </button>
        </div>
      </motion.div>

      {/* ── Run Error ── */}
      {runError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-300">{runError}</p>
            <p className="text-xs text-white/40 mt-1">Make sure your auto-apply config is enabled and you have a finalized resume.</p>
          </div>
          <button onClick={() => setRunError(null)} className="text-white/30 hover:text-white/60">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* ── Running Progress ── */}
      {running && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-2xl border border-neon-orange/20 bg-gradient-to-r from-neon-orange/[0.04] to-amber-500/[0.02]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-neon-orange/15 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-neon-orange animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pipeline Running</h3>
              <p className="text-[11px] text-white/40">Scout is finding jobs, Forge verifies your resume, Sentinel checks alignment, then Archer applies...</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/30">
            <span className="flex items-center gap-1 text-neon-green"><CheckCircle2 className="w-3 h-3" /> Scout</span>
            <span className="text-white/10">→</span>
            <span className="flex items-center gap-1 text-neon-blue"><RefreshCw className="w-3 h-3 animate-spin" /> Forge</span>
            <span className="text-white/10">→</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Sentinel</span>
            <span className="text-white/10">→</span>
            <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Archer</span>
          </div>
        </motion.div>
      )}

      {/* ── Last Run Result Banner ── */}
      {!running && runResult && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              runResult.jobsApplied > 0 ? 'bg-neon-green/15' : 'bg-amber-500/15'
            }`}>
              {runResult.jobsApplied > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-neon-green" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white mb-0.5">
                {runResult.jobsApplied > 0
                  ? `Applied to ${runResult.jobsApplied} jobs`
                  : runResult.jobsFound > 0
                    ? `Found ${runResult.jobsFound} jobs but none applied`
                    : 'No matching jobs found'}
              </h3>
              <p className="text-xs text-white/40 leading-relaxed">
                {runResult.summary || `Found ${runResult.jobsFound} jobs, applied to ${runResult.jobsApplied}, skipped ${runResult.jobsSkipped}.`}
              </p>
              {runResult.jobsFound === 0 && (
                <Link href="/dashboard/jobs" className="inline-flex items-center gap-1.5 mt-2 text-xs text-neon-blue hover:underline">
                  <Search className="w-3 h-3" /> Go to Scout to find jobs first
                </Link>
              )}
            </div>
            <button onClick={() => setRunResult(null)} className="text-white/20 hover:text-white/40">
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Last Run (from preflight) — shown if no new runResult ── */}
      {!running && !runResult && preflight?.lastRun && preflight.lastRun.status !== 'running' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
          <Clock className="w-4 h-4 text-white/30 flex-shrink-0" />
          <p className="text-xs text-white/40 flex-1">
            Last run: {preflight.lastRun.summary || `${preflight.lastRun.jobsFound} found, ${preflight.lastRun.jobsApplied} applied`}
            <span className="text-white/20 ml-2">{timeAgo(preflight.lastRun.startedAt)}</span>
          </p>
        </motion.div>
      )}

      {/* ── Empty State — Workflow Guidance ── */}
      {!loading && !hasApps && !running && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-orange/10 to-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <AgentAvatar agentId="archer" size={36} />
            </div>
            <h3 className="text-lg font-bold mb-1.5">No Applications Yet</h3>
            <p className="text-sm text-white/40 max-w-md mx-auto">
              Archer needs jobs from Scout and a finalized resume from Forge to start applying.
            </p>
          </div>

          {/* Step-by-step workflow guide */}
          <div className="max-w-lg mx-auto space-y-3">
            {/* Step 1: Find Jobs */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              preflight?.lastRun?.jobsFound
                ? 'border-neon-green/20 bg-neon-green/[0.03]'
                : 'border-neon-blue/20 bg-neon-blue/[0.03]'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                preflight?.lastRun?.jobsFound ? 'bg-neon-green/15' : 'bg-neon-blue/15'
              }`}>
                {preflight?.lastRun?.jobsFound ? (
                  <CheckCircle2 className="w-4 h-4 text-neon-green" />
                ) : (
                  <Search className="w-4 h-4 text-neon-blue" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">
                  {preflight?.lastRun?.jobsFound ? `${preflight.lastRun.jobsFound} jobs found by Scout` : '1. Find jobs with Scout'}
                </p>
                <p className="text-[10px] text-white/30">
                  {preflight?.lastRun?.jobsFound ? 'Jobs ready for Archer' : 'Scout searches job boards for matches'}
                </p>
              </div>
              {!preflight?.lastRun?.jobsFound && (
                <Link href="/dashboard/jobs" className="text-xs px-3 py-1.5 rounded-lg bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all flex items-center gap-1 flex-shrink-0">
                  Find Jobs <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {/* Step 2: Resume Ready */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              preflight?.hasResume
                ? 'border-neon-green/20 bg-neon-green/[0.03]'
                : 'border-white/10 bg-white/[0.02]'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                preflight?.hasResume ? 'bg-neon-green/15' : 'bg-white/5'
              }`}>
                {preflight?.hasResume ? (
                  <CheckCircle2 className="w-4 h-4 text-neon-green" />
                ) : (
                  <FileText className="w-4 h-4 text-white/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">
                  {preflight?.hasResume ? 'Resume ready' : '2. Build your resume with Forge'}
                </p>
                <p className="text-[10px] text-white/30">
                  {preflight?.hasResume ? 'Finalized and ATS-optimized' : 'Forge creates an ATS-optimized resume'}
                </p>
              </div>
              {!preflight?.hasResume && (
                <Link href="/dashboard/resume" className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 transition-all flex items-center gap-1 flex-shrink-0">
                  Build Resume <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {/* Step 3: Run Archer */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-neon-orange/20 bg-neon-orange/[0.03]">
              <div className="w-8 h-8 rounded-lg bg-neon-orange/15 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-neon-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">3. Run Archer to apply</p>
                <p className="text-[10px] text-white/30">Sends applications with cover letters via email or ATS</p>
              </div>
              <button
                onClick={handleRunArcher}
                disabled={running}
                className="text-xs px-3 py-1.5 rounded-lg bg-neon-orange/10 text-neon-orange hover:bg-neon-orange/20 transition-all flex items-center gap-1 flex-shrink-0 disabled:opacity-40"
              >
                <Play className="w-3 h-3" /> Run Now
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Stats Bar ── */}
      {hasApps && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
              <p className="text-xl font-bold text-white">{stats!.total}</p>
              <p className="text-[10px] text-white/30 mt-0.5">Total Applied</p>
            </div>
            <div className="p-3 rounded-xl bg-neon-green/[0.03] border border-neon-green/10 text-center">
              <p className="text-xl font-bold text-neon-green">{stats!.applied + stats!.interview + stats!.offer}</p>
              <p className="text-[10px] text-white/30 mt-0.5">Active</p>
            </div>
            <div className="p-3 rounded-xl bg-neon-blue/[0.03] border border-neon-blue/10 text-center">
              <p className="text-xl font-bold text-neon-blue">{stats!.interview}</p>
              <p className="text-[10px] text-white/30 mt-0.5">Interviewing</p>
            </div>
            <div className="p-3 rounded-xl bg-neon-purple/[0.03] border border-neon-purple/10 text-center">
              <p className="text-xl font-bold text-neon-purple">{stats!.offer}</p>
              <p className="text-[10px] text-white/30 mt-0.5">Offers</p>
            </div>
          </div>

          {/* Method Breakdown */}
          <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
            <span className="font-medium text-white/50">Via:</span>
            {stats!.byMethod.ats_api > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-neon-green/5 text-neon-green/70 text-[10px]">
                <Wifi className="w-2.5 h-2.5" /> ATS {stats!.byMethod.ats_api}
              </span>
            )}
            {stats!.byMethod.cold_email > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-neon-blue/5 text-neon-blue/70 text-[10px]">
                <Send className="w-2.5 h-2.5" /> Email {stats!.byMethod.cold_email}
              </span>
            )}
            {stats!.byMethod.portal > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-neon-orange/5 text-neon-orange/70 text-[10px]">
                <ExternalLink className="w-2.5 h-2.5" /> Portal {stats!.byMethod.portal}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Status Filters ── */}
      {hasApps && (
        <div className="flex gap-1.5 overflow-x-auto mb-4 scrollbar-hide">
          {[
            { id: 'all', label: `All (${stats!.total})` },
            { id: 'APPLIED', label: `Applied (${stats!.applied})` },
            { id: 'EMAILED', label: `Emailed (${stats!.emailed})` },
            { id: 'INTERVIEW', label: `Interview (${stats!.interview})` },
            { id: 'OFFER', label: `Offer (${stats!.offer})` },
            { id: 'QUEUED', label: `Queued (${stats!.queued})` },
            { id: 'REJECTED', label: `Rejected (${stats!.rejected})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => handleFilterChange(f.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                statusFilter === f.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/50 hover:bg-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse p-4 rounded-xl border border-white/5">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-white/10 rounded" />
                  <div className="h-3 w-32 bg-white/5 rounded" />
                </div>
                <div className="h-5 w-16 bg-white/5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Application Cards ── */}
      {!loading && apps.length > 0 && (
        <div className="space-y-2">
          {apps.map((app) => {
            const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.QUEUED;
            const isExpanded = expandedId === app.id;

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/10 transition-all cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : app.id)}
              >
                <div className="p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-semibold text-sm text-white truncate">{app.jobTitle}</h4>
                      {app.matchScore != null && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          app.matchScore >= 70 ? 'bg-neon-green/10 text-neon-green' :
                          app.matchScore >= 40 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-white/5 text-white/40'
                        }`}>
                          {app.matchScore}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-white/35">
                      <span className="text-white/50 font-medium">{app.company}</span>
                      {app.location && (
                        <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{app.location}</span>
                      )}
                      {app.applicationMethod && (
                        <span className="px-1.5 py-0 rounded bg-white/5 text-white/30">
                          {METHOD_LABELS[app.applicationMethod] || app.applicationMethod}
                        </span>
                      )}
                      <span className="text-white/20">{timeAgo(app.createdAt)}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color} border ${sc.border} flex-shrink-0`}>
                    {sc.label}
                  </span>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-2.5">
                        {/* Detail chips */}
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          {app.atsType && <span className="px-2 py-0.5 rounded bg-white/5 text-white/40">ATS: {app.atsType}</span>}
                          {app.source && <span className="px-2 py-0.5 rounded bg-white/5 text-white/40">Source: {app.source}</span>}
                          {app.emailSentTo && (
                            <span className="px-2 py-0.5 rounded bg-neon-blue/5 text-neon-blue/60">
                              Emailed: {app.emailSentTo} {app.emailConfidence != null && `(${app.emailConfidence}%)`}
                            </span>
                          )}
                          {app.salaryRange && <span className="px-2 py-0.5 rounded bg-neon-green/5 text-neon-green/60">{app.salaryRange}</span>}
                          {app.appliedAt && <span className="px-2 py-0.5 rounded bg-white/5 text-white/40">Applied {new Date(app.appliedAt).toLocaleDateString()}</span>}
                        </div>

                        {/* Cover letter */}
                        {app.coverLetter && (
                          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                            <p className="text-[9px] font-semibold text-white/25 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <FileText className="w-2.5 h-2.5" /> Cover Letter
                            </p>
                            <p className="text-[11px] text-white/45 line-clamp-4 leading-relaxed">{app.coverLetter}</p>
                          </div>
                        )}

                        {/* Actions */}
                        {app.jobUrl && (
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all"
                          >
                            <ExternalLink className="w-3 h-3" /> View Job Posting
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── No results for filter ── */}
      {!loading && apps.length === 0 && statusFilter !== 'all' && hasApps && (
        <div className="text-center py-12">
          <Inbox className="w-8 h-8 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/40">No &quot;{STATUS_CONFIG[statusFilter]?.label || statusFilter}&quot; applications.</p>
          <button onClick={() => handleFilterChange('all')} className="text-xs text-neon-blue mt-2 hover:underline">
            Show all
          </button>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setAppPage(Math.max(1, appPage - 1))}
            disabled={appPage <= 1}
            className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-white/40">
            {appPage} / {totalPages} ({total} total)
          </span>
          <button
            onClick={() => setAppPage(Math.min(totalPages, appPage + 1))}
            disabled={appPage >= totalPages}
            className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
