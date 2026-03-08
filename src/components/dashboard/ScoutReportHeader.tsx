'use client';

import { motion } from 'framer-motion';
import AgentAvatar from '@/components/brand/AgentAvatar';

interface ScoutReportHeaderProps {
  totalFound: number;
  totalFiltered: number;
  scamJobsFiltered: number;
  sources: string[];
  topMatchScore?: number;
  completedAt?: string;
}

export default function ScoutReportHeader({
  totalFound,
  totalFiltered,
  scamJobsFiltered,
  sources,
  topMatchScore,
  completedAt,
}: ScoutReportHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 p-4 rounded-2xl border border-neon-blue/10 bg-gradient-to-r from-neon-blue/5 to-neon-purple/5"
    >
      <div className="flex items-center gap-3 mb-3">
        <AgentAvatar agentId="scout" size={32} />
        <div>
          <h3 className="text-sm font-bold text-white">
            Scout Report
            <span className="text-white/40 font-normal ml-2">
              Found {totalFiltered} qualifying jobs from {sources.length} sources
            </span>
          </h3>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap text-xs">
        <span className="text-white/40">
          Total scanned: <span className="text-white/60 font-medium">{totalFound}</span>
        </span>
        {scamJobsFiltered > 0 && (
          <span className="text-red-400/80">
            Scam filtered: <span className="font-medium">{scamJobsFiltered}</span>
          </span>
        )}
        {topMatchScore != null && (
          <span className="text-neon-green/80">
            Top match: <span className="font-medium">{topMatchScore}%</span>
          </span>
        )}
        <div className="flex items-center gap-1.5">
          {sources.map(s => (
            <span key={s} className="px-2 py-0.5 rounded-full bg-white/5 text-white/40 text-[10px]">
              {s}
            </span>
          ))}
        </div>
        {completedAt && (
          <span className="text-white/25 ml-auto">
            {new Date(completedAt).toLocaleString()}
          </span>
        )}
      </div>
    </motion.div>
  );
}
