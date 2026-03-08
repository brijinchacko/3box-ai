'use client';

import { motion } from 'framer-motion';
import { MapPin, Clock, Bookmark, ExternalLink } from 'lucide-react';

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
  if (score >= 70) return 'bg-neon-green/10 text-neon-green border-neon-green/20';
  if (score >= 40) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-white/5 text-white/40 border-white/10';
}

export default function ScoutJobGridCard({ job, index, isSaved, onSave, onClick }: ScoutJobGridCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="group relative rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05] transition-all cursor-pointer p-4 flex flex-col min-h-[180px]"
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
          {job.remote && <span className="text-neon-green/60 ml-1">(Remote)</span>}
        </div>
        {job.salary && (
          <p className="text-neon-green/60 font-medium">{job.salary}</p>
        )}
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 flex-shrink-0" />
          {timeAgo(job.postedAt)}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
        <button
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
            isSaved
              ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
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
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue transition-all ml-auto"
        >
          Apply <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}
