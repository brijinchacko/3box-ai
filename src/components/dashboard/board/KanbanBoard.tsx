'use client';

import { useEffect, useState, useCallback } from 'react';
import KanbanColumn from './KanbanColumn';
import { Loader2 } from 'lucide-react';

export interface KanbanJob {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  matchScore: number | null;
  jobUrl: string;
  discoveredAt: string;
  appliedAt: string | null;
  status: string;
}

export interface ColumnDef {
  id: string;
  label: string;
  color: string;
  statuses: string[];
}

const COLUMNS: ColumnDef[] = [
  { id: 'discovered', label: 'Discovered', color: 'border-blue-400', statuses: ['NEW', 'SCORED'] },
  { id: 'saved', label: 'Saved', color: 'border-amber-400', statuses: ['SAVED', 'READY', 'FORGE_READY'] },
  { id: 'applied', label: 'Applied', color: 'border-green-400', statuses: ['APPLIED', 'EMAILED', 'QUEUED', 'APPLYING'] },
  { id: 'screening', label: 'Screening', color: 'border-purple-400', statuses: ['SCREENED'] },
  { id: 'interview', label: 'Interview', color: 'border-indigo-400', statuses: ['INTERVIEW'] },
  { id: 'offer', label: 'Offer', color: 'border-emerald-400', statuses: ['OFFER'] },
];

export default function KanbanBoard() {
  const [jobs, setJobs] = useState<KanbanJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/user/board-jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-400 dark:text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
      {COLUMNS.map((col) => {
        const columnJobs = jobs.filter(j => col.statuses.includes(j.status));
        return (
          <KanbanColumn
            key={col.id}
            column={col}
            jobs={columnJobs}
            onRefresh={fetchJobs}
          />
        );
      })}
    </div>
  );
}
