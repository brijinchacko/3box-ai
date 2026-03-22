'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Search,
  Zap,
  AlertCircle,
  ShieldOff,
  ChevronDown,
  ExternalLink,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* ── Types ── */
interface AutoAppliedJob {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  method: 'ATS_API' | 'COLD_EMAIL' | 'PORTAL' | string;
}

interface DigestData {
  id: string;
  jobsDiscovered: number;
  autoApplied: number;
  needsReview: number;
  blocked: number;
  budgetUsed: number;
  budgetTotal: number;
  budgetPeriod: string;
  appliedJobs: AutoAppliedJob[];
  reviewCount: number;
  createdAt: string;
}

/* ── Method badge helper ── */
function MethodBadge({ method }: { method: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    ATS_API: {
      label: 'ATS API',
      cls: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
    },
    COLD_EMAIL: {
      label: 'Cold Email',
      cls: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
    },
    PORTAL: {
      label: 'Portal',
      cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
    },
  };
  const c = config[method] || {
    label: method,
    cls: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };
  return (
    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', c.cls)}>
      {c.label}
    </span>
  );
}

/* ── Score badge ── */
function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 80
      ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20'
      : score >= 60
        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
        : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20';
  return (
    <span className={cn('text-[11px] font-bold px-1.5 py-0.5 rounded-md border', cls)}>
      {score}%
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   OVERNIGHT ACTIVITY CARD
   ═══════════════════════════════════════════════════════ */
export default function OvernightActivity() {
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchDigest() {
      try {
        const res = await fetch('/api/agents/digest?unviewed=true');
        if (!res.ok) {
          setDigest(null);
          return;
        }
        const data = await res.json();
        if (data?.digest) {
          setDigest(data.digest);
        }
      } catch {
        setDigest(null);
      } finally {
        setLoading(false);
      }
    }
    fetchDigest();
  }, []);

  const handleDismiss = async () => {
    if (!digest) return;
    setDismissed(true);
    try {
      await fetch(`/api/agents/digest/${digest.id}/viewed`, { method: 'POST' });
    } catch {}
  };

  if (loading || !digest || dismissed) return null;

  const budgetPercent =
    digest.budgetTotal > 0
      ? Math.min(100, Math.round((digest.budgetUsed / digest.budgetTotal) * 100))
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/5 dark:to-purple-500/5 rounded-xl border border-indigo-200 dark:border-indigo-500/20 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
            <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Overnight Activity
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pb-4">
        {[
          {
            label: 'Discovered',
            value: digest.jobsDiscovered,
            icon: Search,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-500/10',
          },
          {
            label: 'Auto-Applied',
            value: digest.autoApplied,
            icon: Zap,
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-500/10',
          },
          {
            label: 'Needs Review',
            value: digest.needsReview,
            icon: AlertCircle,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-500/10',
          },
          {
            label: 'Blocked',
            value: digest.blocked,
            icon: ShieldOff,
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-500/10',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white/60 dark:bg-white/5 rounded-lg p-3 flex items-center gap-2.5"
          >
            <div className={cn('w-7 h-7 rounded-md flex items-center justify-center', stat.bg)}>
              <stat.icon className={cn('w-3.5 h-3.5', stat.color)} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums leading-none">
                {stat.value}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Application Budget Bar */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">
          <span>Application Budget ({digest.budgetPeriod})</span>
          <span className="tabular-nums">
            {digest.budgetUsed}/{digest.budgetTotal} used
          </span>
        </div>
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              budgetPercent >= 90
                ? 'bg-red-500'
                : budgetPercent >= 70
                  ? 'bg-amber-500'
                  : 'bg-green-500',
            )}
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
      </div>

      {/* Expandable Auto-Applied Jobs List */}
      {digest.appliedJobs.length > 0 && (
        <div className="border-t border-indigo-100 dark:border-indigo-500/10">
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/30 dark:hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Auto-Applied Jobs ({digest.appliedJobs.length})
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform duration-200',
                expanded && 'rotate-180',
              )}
            />
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 space-y-2">
                  {digest.appliedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between gap-3 bg-white/60 dark:bg-white/5 rounded-lg px-3 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {job.title}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {job.company}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <ScoreBadge score={job.matchScore} />
                        <MethodBadge method={job.method} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Review Queue Link */}
      {digest.reviewCount > 0 && (
        <div className="border-t border-indigo-100 dark:border-indigo-500/10 px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {digest.reviewCount} job{digest.reviewCount !== 1 ? 's' : ''} need your review
          </span>
          <Link
            href="/dashboard/board"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            Review on Job Board
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </motion.div>
  );
}
