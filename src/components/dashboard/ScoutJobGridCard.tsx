'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { MapPin, Clock, Bookmark, ExternalLink, Flag, Zap, FileCheck, RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { analyseSkillGap, type SkillGapResult, quickATSCheck, type QuickATSResult } from '@/lib/jobs/skillGap';

interface ScoutJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  url: string;
  source: string;
  postedAt: string;
  remote: boolean;
  matchScore?: number;
}

interface ScoutJobGridCardProps {
  job: ScoutJob;
  index: number;
  isSaved: boolean;
  onSave: () => void;
  onClick: () => void;
  onReport?: (jobId: string) => void;
  userSkills?: Record<string, number> | null;
}

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
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

/** Color-coded job age badge: green (0-7d), yellow (8-14d), red (15d+) */
function jobAgeBadgeLabel(dateStr: string): string {
  const diffDays = safeDiffDays(dateStr);
  if (diffDays < 0) return 'Recently posted';
  if (diffDays === 0) return 'Posted today';
  if (diffDays === 1) return 'Posted 1d ago';
  return `Posted ${diffDays}d ago`;
}

function jobAgeBadgeColor(dateStr: string): string {
  const diffDays = safeDiffDays(dateStr);
  if (diffDays < 0 || diffDays <= 7) return 'bg-green-500/10 text-green-400';
  if (diffDays <= 14) return 'bg-amber-500/10 text-amber-400';
  return 'bg-red-500/10 text-red-400';
}

function getScoreColor(score: number) {
  if (score >= 70) return 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20';
  if (score >= 40) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-white/5 text-white/40 border-white/10';
}

export default function ScoutJobGridCard({ job, index, isSaved, onSave, onClick, onReport, userSkills }: ScoutJobGridCardProps) {
  const [reportConfirm, setReportConfirm] = useState(false);
  const [reported, setReported] = useState(false);
  const [atsResult, setAtsResult] = useState<QuickATSResult | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'checking' | 'active' | 'expired'>('idle');

  const handleCheckAvailability = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const skillGap = useMemo<SkillGapResult | null>(() => {
    if (!userSkills) return null;
    return analyseSkillGap(job.description, userSkills);
  }, [job.description, userSkills]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className={`group relative rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05] transition-all cursor-pointer p-4 flex flex-col min-h-[180px] ${availabilityStatus === 'expired' ? 'opacity-50' : ''}`}
    >
      {/* Top row: score + source */}
      <div className="flex items-center justify-between mb-3">
        {typeof job.matchScore === 'number' ? (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getScoreColor(job.matchScore)}`}>
            {job.matchScore}%
          </span>
        ) : (
          <span />
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">
          {job.source}
        </span>
      </div>

      {/* Title + Company */}
      <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 mb-1">
        {job.title}
      </h3>
      <p className="text-xs text-white/50 font-medium truncate mb-2">{job.company}</p>

      {/* Location + Salary */}
      <div className="space-y-1 text-xs text-white/30 flex-1">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{job.location}</span>
          {job.remote && <span className="text-cyan-400/60 ml-1">(Remote)</span>}
        </div>
        {job.salary && (
          <p className="text-cyan-400/60 font-medium">{job.salary}</p>
        )}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium w-fit ${jobAgeBadgeColor(job.postedAt)}`}>
          <Clock className="w-3 h-3 flex-shrink-0" />
          {jobAgeBadgeLabel(job.postedAt)}
        </div>
      </div>

      {/* Skill Gap Indicator */}
      {skillGap && skillGap.totalRequired >= 2 && (
        <div className={`flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg text-[10px] font-medium ${
          skillGap.ratio >= 0.8
            ? 'bg-green-500/5 text-green-400/80'
            : skillGap.ratio >= 0.5
              ? 'bg-amber-500/5 text-amber-400/80'
              : 'bg-red-500/5 text-red-400/80'
        }`}>
          <Zap className="w-3 h-3 flex-shrink-0" />
          <span>{skillGap.matched}/{skillGap.totalRequired} skills</span>
          {skillGap.missing.length > 0 && (
            <span className="opacity-60 truncate">
              | Gap: {skillGap.missing.slice(0, 3).join(', ')}
              {skillGap.missing.length > 3 && ` +${skillGap.missing.length - 3}`}
            </span>
          )}
        </div>
      )}

      {/* Quick ATS Check result */}
      {atsResult && (
        <div className={`flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg text-[10px] font-medium ${
          atsResult.tier === 'green'
            ? 'bg-green-500/5 text-green-400/80'
            : atsResult.tier === 'yellow'
              ? 'bg-amber-500/5 text-amber-400/80'
              : 'bg-red-500/5 text-red-400/80'
        }`}>
          <FileCheck className="w-3 h-3 flex-shrink-0" />
          <span>ATS: {atsResult.score}%</span>
          <span className="opacity-60 truncate">
            ({atsResult.matched}/{atsResult.total} keywords)
          </span>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
        {/* Quick ATS Check button */}
        {!atsResult && userSkills && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const result = quickATSCheck(job.description, userSkills);
              if (result) setAtsResult(result);
            }}
            className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/60 transition-all"
            title="Quick ATS compatibility check (free)"
          >
            <FileCheck className="w-3 h-3" />
          </button>
        )}
        {/* Report as scam */}
        {!reported ? (
          reportConfirm ? (
            <span className="flex items-center gap-1 text-[10px] text-red-400/80" onClick={(e) => e.stopPropagation()}>
              <span>Scam?</span>
              <button
                onClick={(e) => { e.stopPropagation(); setReported(true); setReportConfirm(false); onReport?.(job.id); }}
                className="px-1.5 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-all"
              >
                Yes
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setReportConfirm(false); }}
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/40 font-medium transition-all"
              >
                No
              </button>
            </span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setReportConfirm(true); }}
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all"
              title="Report this job as a scam"
            >
              <Flag className="w-3 h-3" />
            </button>
          )
        ) : (
          <span className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-red-400/60">
            <Flag className="w-3 h-3" /> Reported
          </span>
        )}
        {/* Check availability */}
        {availabilityStatus === 'idle' ? (
          <button
            onClick={handleCheckAvailability}
            className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/60 transition-all"
            title="Check if job listing is still live"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        ) : availabilityStatus === 'checking' ? (
          <span className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-white/40">
            <Loader2 className="w-3 h-3 animate-spin" />
          </span>
        ) : availabilityStatus === 'active' ? (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            <CheckCircle className="w-3 h-3" /> Active
          </span>
        ) : (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3 h-3" /> Expired
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
            isSaved
              ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
              : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60'
          }`}
        >
          <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
          {isSaved ? 'Saved' : 'Save'}
        </button>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-400/10 hover:bg-blue-400/20 text-blue-400 transition-all ml-auto"
        >
          Apply <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}
