'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ExternalLink, Bookmark, Shield, Hammer, ChevronDown, ChevronUp, BarChart3, Wifi, AlertTriangle } from 'lucide-react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import { isAgentAvailable, type PlanTier } from '@/lib/agents/permissions';
import { detectScamSignals, type ScamSignals } from '@/lib/jobs/scamDetector';

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

function getScoreColor(score: number) {
  if (score >= 70) return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
  if (score >= 40) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-white/5 text-white/40 border-white/10';
}

export default function ScoutJobCard({ job, index, userPlan, isSaved, onSave }: ScoutJobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [scamCheck, setScamCheck] = useState<ScamSignals | null>(null);
  const [checkingScam, setCheckingScam] = useState(false);

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
      className="group rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all"
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
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo(job.postedAt)}
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
              {!scamCheck && (
                <button
                  onClick={handleVerify}
                  disabled={checkingScam || !sentinelAvailable}
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-all disabled:opacity-40"
                title={!forgeAvailable ? 'Forge requires Starter plan' : ''}
                style={!forgeAvailable ? { opacity: 0.4, pointerEvents: 'none' } : {}}
              >
                <AgentAvatar agentId="forge" size={16} sleeping={!forgeAvailable} />
                Tailor Resume
              </a>
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
