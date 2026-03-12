'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, ExternalLink, MapPin, Star, Filter, Loader2, Bookmark, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchJob {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  matchScore: number | null;
  jobUrl: string;
  status: string;
  discoveredAt: string;
}

const STATUS_OPTIONS = ['ALL', 'NEW', 'SCORED', 'SAVED', 'READY', 'APPLIED', 'REJECTED'];
const SOURCE_OPTIONS = ['ALL', 'linkedin', 'indeed', 'naukri', 'google', 'glassdoor', 'dice'];

export default function MatchesPage() {
  const [jobs, setJobs] = useState<MatchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'match' | 'date'>('match');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/board-jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Filter and sort
  const filtered = jobs
    .filter(j => {
      if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;
      if (sourceFilter !== 'ALL' && j.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'match') return (b.matchScore || 0) - (a.matchScore || 0);
      return new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime();
    });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Matches</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {jobs.length} jobs found by Scout across all platforms.
        </p>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search jobs or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {SOURCE_OPTIONS.map(s => (
            <option key={s} value={s}>{s === 'ALL' ? 'All Sources' : s}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'match' | 'date')}
          className="text-sm border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="match">Best Match</option>
          <option value="date">Most Recent</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-gray-400 dark:text-gray-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Filter className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No matches found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Job</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Location</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Match</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Source</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((job) => (
                <tr key={job.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900 dark:text-white line-clamp-1">{job.title}</span>
                    <span className="text-gray-500 dark:text-gray-400 md:hidden text-xs block">{job.company}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">{job.company}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{job.location || '—'}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {job.matchScore ? (
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                        job.matchScore >= 80 ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400' :
                        job.matchScore >= 60 ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                        'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
                      )}>
                        {job.matchScore}%
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{job.source}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      'inline-block px-2 py-0.5 rounded text-xs font-medium',
                      job.status === 'APPLIED' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400' :
                      job.status === 'NEW' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' :
                      job.status === 'SAVED' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                      'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                    )}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={async () => {
                          try {
                            await fetch(`/api/user/board-jobs/${job.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'SAVED' }),
                            });
                            setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'SAVED' } : j));
                          } catch {}
                        }}
                        disabled={job.status === 'SAVED' || job.status === 'APPLIED'}
                        className={cn(
                          'px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors',
                          job.status === 'SAVED' || job.status === 'APPLIED'
                            ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400'
                            : 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800',
                        )}
                        title="Save to board"
                      >
                        <Bookmark className="w-3 h-3" />
                      </button>
                      {job.jobUrl && (
                        <a
                          href={job.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                        >
                          Apply <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 100 && (
            <div className="px-4 py-3 text-center text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800">
              Showing 100 of {filtered.length} matches
            </div>
          )}
        </div>
      )}
    </div>
  );
}
