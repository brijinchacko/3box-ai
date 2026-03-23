'use client';

import { ExternalLink, MapPin, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanJob } from './KanbanBoard';

interface KanbanCardProps {
  job: KanbanJob;
}

export default function KanbanCard({ job }: KanbanCardProps) {
  const matchColor = job.matchScore
    ? job.matchScore >= 80 ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10'
    : job.matchScore >= 60 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
    : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800'
    : null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 hover:shadow-sm transition-shadow group">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 flex-1">
          {job.title}
        </h4>
        {job.jobUrl && (
          <a
            href={job.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400" />
          </a>
        )}
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">{job.company}</p>

      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
        {job.location && (
          <span className="flex items-center gap-0.5">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{job.location}</span>
          </span>
        )}
        {job.matchScore && matchColor && (
          <span className={cn('flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold', matchColor)}>
            <Star className="w-2.5 h-2.5" />
            {job.matchScore}%
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{job.source}</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {formatDate(job.discoveredAt)}
        </span>
      </div>
    </div>
  );
}

function formatDate(isoString: string): string {
  try {
    if (!isoString) return 'Recently';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}
