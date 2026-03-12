'use client';

import { cn } from '@/lib/utils';
import KanbanCard from './KanbanCard';
import type { ColumnDef, KanbanJob } from './KanbanBoard';

interface KanbanColumnProps {
  column: ColumnDef;
  jobs: KanbanJob[];
  onRefresh: () => void;
}

export default function KanbanColumn({ column, jobs, onRefresh }: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-64 lg:w-72">
      {/* Column header */}
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-t-lg border-t-2', column.color, 'bg-white dark:bg-gray-900 border-x border-b border-gray-200 dark:border-gray-800')}>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{column.label}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5 tabular-nums">
          {jobs.length}
        </span>
      </div>

      {/* Cards container */}
      <div className="bg-gray-50 dark:bg-gray-800 border-x border-b border-gray-200 dark:border-gray-800 rounded-b-lg p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
        {jobs.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">No jobs</p>
        ) : (
          jobs.map((job) => (
            <KanbanCard key={job.id} job={job} />
          ))
        )}
      </div>
    </div>
  );
}
