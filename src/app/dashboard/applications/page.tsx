'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Send,
  Crown,
  Play,
  Search,
  Wifi,
  Target,
  Shield,
  Clock,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AgentPageHeader from '@/components/dashboard/AgentPageHeader';
import AgentLockedPage from '@/components/dashboard/AgentLockedPage';
import AgentAvatar from '@/components/brand/AgentAvatar';
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

// ── Relative Time Helper ──────────────────────────────
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

  // ── Locked ──
  if (agentLocked) return <AgentLockedPage agentId="archer" />;

  return (
    <div className="max-w-5xl mx-auto">
      <AgentPageHeader agentId="archer" />

      {/* ── Page Title ──────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <Target className="w-7 h-7 text-neon-orange" /> Applications
        </h1>
        <p className="text-white/40">Track every job application Archer sends on your behalf.</p>
      </motion.div>

      {/* ── Empty State ──────────────── */}
      {!loading && apps.length === 0 && statusFilter === 'all' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-orange/10 to-neon-purple/10 flex items-center justify-center mx-auto mb-6">
            <AgentAvatar agentId="archer" size={40} />
          </div>
          <h3 className="text-xl font-bold mb-2">No Applications Yet</h3>
          <p className="text-sm text-white/40 mb-6 max-w-md mx-auto">
            Archer hasn&apos;t sent any applications yet. Run the full auto-apply pipeline from Cortex, or let Scout find jobs first.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard" className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2">
              <Play className="w-4 h-4" /> Run Pipeline
            </Link>
            <Link href="/dashboard/jobs" className="btn-secondary text-sm px-6 py-2.5 flex items-center gap-2">
              <Search className="w-4 h-4" /> Find Jobs
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Stats Bar ──────────────── */}
      {stats && stats.total > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-white/40 mt-1">Total Applied</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-neon-green">{stats.applied + stats.interview + stats.offer}</p>
              <p className="text-xs text-white/40 mt-1">Active</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-neon-blue">{stats.interview}</p>
              <p className="text-xs text-white/40 mt-1">Interviewing</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-neon-purple">{stats.offer}</p>
              <p className="text-xs text-white/40 mt-1">Offers</p>
            </div>
          </div>

          {/* ── Method Breakdown ──────── */}
          <div className="flex items-center gap-4 text-xs text-white/40 flex-wrap">
            <span className="font-medium text-white/60">Applied via:</span>
            {stats.byMethod.ats_api > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neon-green/5 border border-neon-green/10 text-neon-green/80">
                <Wifi className="w-3 h-3" /> ATS API: {stats.byMethod.ats_api}
              </span>
            )}
            {stats.byMethod.cold_email > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neon-blue/5 border border-neon-blue/10 text-neon-blue/80">
                <Send className="w-3 h-3" /> Email: {stats.byMethod.cold_email}
              </span>
            )}
            {stats.byMethod.portal > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neon-orange/5 border border-neon-orange/10 text-neon-orange/80">
                <ExternalLink className="w-3 h-3" /> Portal: {stats.byMethod.portal}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Status Filters ──────── */}
      {(stats?.total ?? 0) > 0 && (
        <div className="flex gap-2 overflow-x-auto mt-6 mb-4">
          {[
            { id: 'all', label: `All${stats ? ` (${stats.total})` : ''}` },
            { id: 'QUEUED', label: `Queued${stats ? ` (${stats.queued})` : ''}` },
            { id: 'EMAILED', label: `Emailed${stats ? ` (${stats.emailed})` : ''}` },
            { id: 'APPLIED', label: `Applied${stats ? ` (${stats.applied})` : ''}` },
            { id: 'INTERVIEW', label: `Interview${stats ? ` (${stats.interview})` : ''}` },
            { id: 'OFFER', label: `Offer${stats ? ` (${stats.offer})` : ''}` },
            { id: 'REJECTED', label: `Rejected${stats ? ` (${stats.rejected})` : ''}` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => handleFilterChange(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
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

      {/* ── Loading State ──────── */}
      {loading && (
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-white/10 rounded" />
                  <div className="h-4 w-32 bg-white/5 rounded" />
                  <div className="h-3 w-64 bg-white/5 rounded" />
                </div>
                <div className="h-6 w-20 bg-white/5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Application Cards ──────── */}
      {!loading && apps.length > 0 && (
        <div className="space-y-3 mt-2">
          {apps.map((app) => {
            const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.QUEUED;
            const isExpanded = expandedId === app.id;

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4 hover:border-white/15 transition-all cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : app.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-sm text-white truncate">{app.jobTitle}</h4>
                      {app.matchScore != null && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          app.matchScore >= 70
                            ? 'bg-neon-green/10 text-neon-green border-neon-green/20'
                            : app.matchScore >= 40
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-white/5 text-white/40 border-white/10'
                        }`}>
                          {app.matchScore}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
                      <span className="font-medium text-white/60">{app.company}</span>
                      {app.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {app.location}
                        </span>
                      )}
                      {app.salaryRange && (
                        <span className="text-neon-green/70">{app.salaryRange}</span>
                      )}
                      <span className="text-white/20">{timeAgo(app.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Method badge */}
                    {app.applicationMethod && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
                        {METHOD_LABELS[app.applicationMethod] || app.applicationMethod}
                      </span>
                    )}
                    {/* Status badge */}
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${sc.bg} ${sc.color} border ${sc.border}`}>
                      {sc.label}
                    </span>
                  </div>
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
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                        {/* Details row */}
                        <div className="flex flex-wrap gap-3 text-xs">
                          {app.atsType && (
                            <span className="px-2 py-1 rounded bg-white/5 text-white/40">
                              ATS: {app.atsType}
                            </span>
                          )}
                          {app.source && (
                            <span className="px-2 py-1 rounded bg-white/5 text-white/40">
                              Source: {app.source}
                            </span>
                          )}
                          {app.emailSentTo && (
                            <span className="px-2 py-1 rounded bg-neon-blue/5 text-neon-blue/60 border border-neon-blue/10">
                              Emailed: {app.emailSentTo}
                              {app.emailConfidence != null && ` (${app.emailConfidence}%)`}
                            </span>
                          )}
                          {app.appliedAt && (
                            <span className="px-2 py-1 rounded bg-white/5 text-white/40">
                              Applied: {new Date(app.appliedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Cover letter preview */}
                        {app.coverLetter && (
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                              <FileText className="w-3 h-3" /> Cover Letter
                            </p>
                            <p className="text-xs text-white/50 line-clamp-4 leading-relaxed">{app.coverLetter}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {app.jobUrl && (
                            <a
                              href={app.jobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs px-3 py-1.5 rounded-lg bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-3 h-3" /> View Job
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── No results for filter ──── */}
      {!loading && apps.length === 0 && statusFilter !== 'all' && (
        <div className="text-center py-12">
          <p className="text-sm text-white/40">No applications with status &quot;{STATUS_CONFIG[statusFilter]?.label || statusFilter}&quot;.</p>
          <button onClick={() => handleFilterChange('all')} className="text-xs text-neon-blue mt-2 hover:underline">
            Show all applications
          </button>
        </div>
      )}

      {/* ── Pagination ──────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setAppPage(Math.max(1, appPage - 1))}
            disabled={appPage <= 1}
            className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-white/50">
            Page {appPage} of {totalPages} ({total} total)
          </span>
          <button
            onClick={() => setAppPage(Math.min(totalPages, appPage + 1))}
            disabled={appPage >= totalPages}
            className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Pipeline Info Card ──────── */}
      {!loading && (stats?.total ?? 0) > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-8">
          <div className="card p-4 border-neon-orange/10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-neon-orange/10">
                <Shield className="w-4 h-4 text-neon-orange" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-1">Application Pipeline</h4>
                <p className="text-xs text-white/40 leading-relaxed">
                  Every application goes through Forge (resume verification) and Sentinel (JD alignment check) before Archer sends it. Only verified, well-matched applications are sent.
                </p>
                <div className="flex items-center gap-4 mt-3 text-[10px] text-white/30">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Forge verifies resume</span>
                  <span className="text-white/10">→</span>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Sentinel checks alignment</span>
                  <span className="text-white/10">→</span>
                  <span className="flex items-center gap-1"><Target className="w-3 h-3 text-neon-orange" /> Archer applies</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
