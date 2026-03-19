'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, ExternalLink, Search, Calendar, BarChart3, List, LayoutGrid, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import KanbanBoard from '@/components/dashboard/board/KanbanBoard';

interface BoardJob {
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'New', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  SCORED: { label: 'Scored', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  SAVED: { label: 'Saved', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  READY: { label: 'Ready', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  FORGE_READY: { label: 'Resume Ready', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  QUEUED: { label: 'Queued', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10' },
  APPLYING: { label: 'Applying...', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  APPLIED: { label: 'Applied (Auto)', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10' },
  EMAILED: { label: 'Applied (Email)', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  SCREENED: { label: 'Screening', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  INTERVIEW: { label: 'Interview', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
  OFFER: { label: 'Offer', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  SKIPPED: { label: 'Apply Manually', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  EXPIRED: { label: 'Expired', color: 'text-gray-500 dark:text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' },
};

const PERIODS = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
];

const GRAPH_GROUPS = [
  { label: 'Discovered', statuses: ['NEW', 'SCORED'], color: 'bg-blue-500' },
  { label: 'Saved', statuses: ['SAVED', 'READY', 'FORGE_READY', 'FORGE_PENDING'], color: 'bg-amber-500' },
  { label: 'Applied', statuses: ['APPLIED', 'EMAILED', 'QUEUED', 'APPLYING'], color: 'bg-green-500' },
  { label: 'Interview', statuses: ['SCREENED', 'INTERVIEW'], color: 'bg-purple-500' },
  { label: 'Offer', statuses: ['OFFER'], color: 'bg-emerald-500' },
  { label: 'Manual', statuses: ['SKIPPED'], color: 'bg-orange-500' },
];

export default function BoardPage() {
  const [jobs, setJobs] = useState<BoardJob[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/board-jobs?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setStatusCounts(data.statusCounts || {});
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Filtered jobs
  const filtered = jobs.filter(j => {
    const matchesSearch = !searchQuery ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Graph data
  const graphTotal = Math.max(jobs.length, 1);
  const graphData = GRAPH_GROUPS.map(g => ({
    ...g,
    count: g.statuses.reduce((sum, s) => sum + (statusCounts[s] || 0), 0),
  })).filter(g => g.count > 0);

  const appliedCount = ['APPLIED', 'EMAILED', 'QUEUED', 'APPLYING'].reduce((sum, s) => sum + (statusCounts[s] || 0), 0);
  const interviewCount = (statusCounts['INTERVIEW'] || 0) + (statusCounts['SCREENED'] || 0);
  const offerCount = statusCounts['OFFER'] || 0;
  const manualCount = statusCounts['SKIPPED'] || 0;

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Board</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            All your discovered and applied jobs in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('list')}
            className={cn('p-2 rounded-lg transition-colors', view === 'list' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('kanban')}
            className={cn('p-2 rounded-lg transition-colors', view === 'kanban' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{jobs.length}</p>
          <p className="text-xs text-gray-500">Total Jobs</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{appliedCount}</p>
          <p className="text-xs text-gray-500">Applied</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{interviewCount}</p>
          <p className="text-xs text-gray-500">Interviews</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{offerCount}</p>
          <p className="text-xs text-gray-500">Offers</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{manualCount}</p>
          <p className="text-xs text-gray-500">Apply Manually</p>
        </div>
      </div>

      {/* Application Status Graph */}
      {graphData.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Application Pipeline</h3>
          </div>
          {/* Horizontal stacked bar */}
          <div className="h-6 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800">
            {graphData.map((g, i) => (
              <div
                key={g.label}
                className={cn(g.color, 'transition-all duration-500')}
                style={{ width: `${(g.count / graphTotal) * 100}%` }}
                title={`${g.label}: ${g.count}`}
              />
            ))}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3">
            {graphData.map(g => (
              <div key={g.label} className="flex items-center gap-1.5">
                <div className={cn('w-2.5 h-2.5 rounded-full', g.color)} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{g.label} ({g.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Filters + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                period === p.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
        >
          <option value="all">All Status</option>
          <option value="NEW">New</option>
          <option value="SAVED">Saved</option>
          <option value="APPLIED">Applied (Auto)</option>
          <option value="EMAILED">Applied (Email)</option>
          <option value="SKIPPED">Apply Manually</option>
          <option value="INTERVIEW">Interview</option>
          <option value="OFFER">Offer</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {jobs.length === 0 ? 'No jobs discovered yet. Create a search profile to get started.' : 'No jobs match your filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
            <div className="col-span-4">Position</div>
            <div className="col-span-2">Company</div>
            <div className="col-span-1">Match</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">When</div>
            <div className="col-span-1">Link</div>
          </div>

          {/* Job rows */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((job) => {
              const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.NEW;
              const isApplied = ['APPLIED', 'EMAILED'].includes(job.status);
              const needsManual = job.status === 'SKIPPED';

              return (
                <div key={job.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors items-center">
                  <div className="col-span-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{job.title}</p>
                    <p className="text-xs text-gray-400 sm:hidden">{job.company} - {job.location}</p>
                  </div>
                  <div className="col-span-2 hidden sm:block">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{job.company}</p>
                    <p className="text-xs text-gray-400 truncate">{job.location}</p>
                  </div>
                  <div className="col-span-1 hidden sm:block">
                    {job.matchScore ? (
                      <span className={cn(
                        'text-xs font-semibold',
                        job.matchScore >= 80 ? 'text-green-600' : job.matchScore >= 60 ? 'text-amber-600' : 'text-gray-500',
                      )}>
                        {Math.round(job.matchScore)}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', sc.color, sc.bg)}>
                      {sc.label}
                    </span>
                    {isApplied && job.appliedAt && (
                      <p className="text-[10px] text-green-500 mt-0.5">Sent via email</p>
                    )}
                    {needsManual && (
                      <a
                        href={job.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-orange-500 hover:text-orange-600 underline mt-0.5 block"
                      >
                        Apply manually here
                      </a>
                    )}
                  </div>
                  <div className="col-span-2 hidden sm:block">
                    <p className="text-xs text-gray-500">{relativeTime(job.discoveredAt)}</p>
                    {job.appliedAt && (
                      <p className="text-[10px] text-green-500">Applied {relativeTime(job.appliedAt)}</p>
                    )}
                  </div>
                  <div className="col-span-1 hidden sm:block">
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 inline-flex transition-colors"
                      title="Open job posting"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-400">
            Showing {filtered.length} of {jobs.length} jobs
          </div>
        </div>
      )}
    </div>
  );
}
