'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import KanbanColumn from './KanbanColumn';
import { Loader2, Search, Briefcase, ArrowRight } from 'lucide-react';

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

  // Empty state when no jobs at all
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-5">
          <Briefcase className="w-8 h-8 text-blue-400/60" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No jobs on your board yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
          Jobs you discover, save, and apply to will appear here organized by stage. Start by searching for jobs.
        </p>
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Search className="w-4 h-4" /> Search Jobs <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        {/* Show column labels as compact preview */}
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {COLUMNS.map((col) => (
            <div key={col.id} className={`px-3 py-1.5 rounded-full border-t-2 ${col.color} bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700`}>
              <span className="text-xs text-gray-500 dark:text-gray-400">{col.label}</span>
            </div>
          ))}
        </div>
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
