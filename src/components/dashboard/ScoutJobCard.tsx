'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ExternalLink, Bookmark, Shield, Hammer, ChevronDown, ChevronUp, BarChart3, Wifi, AlertTriangle, Flag, Zap, FileCheck, RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import { isAgentAvailable, type PlanTier } from '@/lib/agents/permissions';
import { detectScamSignals, type ScamSignals } from '@/lib/jobs/scamDetector';
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

interface ScoutJobCardProps {
  job: ScoutJob;
  index: number;
  userPlan: PlanTier;
  isSaved: boolean;
  onSave: () => void;
  onReport?: (jobId: string) => void;
  userSkills?: Record<string, number> | null;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

/** Color-coded job age badge: green (0-7d), yellow (8-14d), red (15d+) */
function jobAgeBadgeLabel(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays === 0) return 'Posted today';
  if (diffDays === 1) return 'Posted 1d ago';
  return `Posted ${diffDays}d ago`;
}

function jobAgeBadgeColor(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays <= 7) return 'bg-green-500/10 text-green-400';
  if (diffDays <= 14) return 'bg-amber-500/10 text-amber-400';
  return 'bg-red-500/10 text-red-400';
}

function getScoreColor(score: number) {
  if (score >= 70) return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
  if (score >= 40) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-white/5 text-white/40 border-white/10';
}

export default function ScoutJobCard({ job, index, userPlan, isSaved, onSave, onReport, userSkills }: ScoutJobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [scamCheck, setScamCheck] = useState<ScamSignals | null>(null);
  const [checkingScam, setCheckingScam] = useState(false);
  const [reportConfirm, setReportConfirm] = useState(false);
  const [reported, setReported] = useState(false);
  const [atsResult, setAtsResult] = useState<QuickATSResult | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'checking' | 'active' | 'expired'>('idle');

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

  // Skill gap analysis (memoised to avoid recalculating on every render)
  const skillGap = useMemo<SkillGapResult | null>(() => {
    if (!userSkills) return null;
    return analyseSkillGap(job.description, userSkills);
  }, [job.description, userSkills]);

  const sentinelAvailable = isAgentAvailable('sentinel', userPlan);
  const forgeAvailable = isAgentAvailable('forge', userPlan);

  const handleVerify = () => {
    setCheckingScam(true);
    // detectScamSignals is a pure function, no API cost
    const result = detectScamSignals({
      title: job.title,
      company: job.company,
      description: job.description,
      salary: job.salary,
      url: job.url,
      location: job.location,
    });
    setScamCheck(result);
    setCheckingScam(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all ${availabilityStatus === 'expired' ? 'opacity-50' : ''}`}
    >
      {/* Compact summary row */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Match score badge */}
        {typeof job.matchScore === 'number' && (
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center border ${getScoreColor(job.matchScore)}`}>
            <span className="text-sm font-bold">{job.matchScore}%</span>
          </div>
        )}

        {/* Job info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white truncate">{job.title}</h3>
            <span className="text-xs text-white/40">·</span>
            <span className="text-xs text-white/50 font-medium truncate">{job.company}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/30 mt-0.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
              {job.remote && <span className="text-blue-400/60 ml-1">(Remote)</span>}
            </span>
            {job.salary && (
              <span className="text-blue-400/60">{job.salary}</span>
            )}
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${jobAgeBadgeColor(job.postedAt)}`}>
              <Clock className="w-3 h-3" /> {jobAgeBadgeLabel(job.postedAt)}
            </span>
          </div>
        </div>

        {/* Source tag + expand */}
        <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">
          {job.source}
        </span>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-white/20 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-white/20 flex-shrink-0" />
        }
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-white/5 p-4 space-y-4"
        >
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
                ? 'bg-blue-400/5 border-blue-400/10 text-blue-400/80'
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

          {/* Agent suggestion bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-white/25">Scout found this match. What&apos;s next?</span>
            <div className="flex items-center gap-2 ml-auto">
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
                  disabled={checkingScam || !sentinelAvailable}
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-all disabled:opacity-40"
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
                onClick={() => onSave()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  isSaved
                    ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-blue-400/10 hover:bg-blue-400/20 text-blue-400 transition-all"
              >
                Apply <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
