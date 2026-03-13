'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, ExternalLink, MapPin, Filter, Loader2, Bookmark, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, Clock, Plus, X, Check } from 'lucide-react';
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

const STATUS_OPTIONS = ['ALL', 'NEW', 'SAVED', 'APPLIED'];
const SOURCE_OPTIONS = ['ALL', 'JSearch', 'Adzuna', 'Search', 'Manual', 'linkedin', 'indeed', 'naukri', 'google', 'glassdoor', 'dice'];

type SortField = 'title' | 'company' | 'match' | 'date' | 'source' | 'status';
type SortDir = 'asc' | 'desc';

function timeAgo(dateStr: string): string {
  if (!dateStr) return '—';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    NEW: 'New', SCORED: 'New', SAVED: 'Saved', READY: 'Saved',
    FORGE_READY: 'Saved', FORGE_PENDING: 'Saved',
    APPLIED: 'Applied', QUEUED: 'Applied', APPLYING: 'Applied', EMAILED: 'Applied',
    SCREENED: 'Screening', INTERVIEW: 'Interview', OFFER: 'Offer', SKIPPED: 'Skipped',
  };
  return map[status] || status;
}

export default function MatchesPage() {
  const [jobs, setJobs] = useState<MatchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Manual apply modal
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'match' ? 'desc' : field === 'date' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  // Filter and sort
  const filtered = jobs
    .filter(j => {
      if (statusFilter !== 'ALL') {
        const statusGroups: Record<string, string[]> = {
          'NEW': ['NEW', 'SCORED'],
          'SAVED': ['SAVED', 'READY', 'FORGE_READY', 'FORGE_PENDING'],
          'APPLIED': ['APPLIED', 'QUEUED', 'APPLYING', 'EMAILED'],
        };
        const allowed = statusGroups[statusFilter] || [statusFilter];
        if (!allowed.includes(j.status)) return false;
      }
      if (sourceFilter !== 'ALL' && j.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || (j.location || '').toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'title': return dir * a.title.localeCompare(b.title);
        case 'company': return dir * a.company.localeCompare(b.company);
        case 'match': return dir * ((a.matchScore || 0) - (b.matchScore || 0));
        case 'source': return dir * a.source.localeCompare(b.source);
        case 'status': return dir * getStatusLabel(a.status).localeCompare(getStatusLabel(b.status));
        case 'date':
        default:
          return dir * (new Date(a.discoveredAt).getTime() - new Date(b.discoveredAt).getTime());
      }
    });

  const handleManualSave = async () => {
    if (!manualTitle.trim() || !manualCompany.trim()) return;
    setManualSaving(true);
    try {
      const res = await fetch('/api/user/board-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle.trim(),
          company: manualCompany.trim(),
          jobUrl: manualUrl.trim() || `https://manual-entry/${Date.now()}`,
          location: manualLocation.trim(),
          source: 'Manual',
          description: '',
          status: 'APPLIED',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(prev => [data.job, ...prev]);
        setShowManualAdd(false);
        setManualTitle('');
        setManualCompany('');
        setManualUrl('');
        setManualLocation('');
      }
    } catch {} finally {
      setManualSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Matches</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {jobs.length} jobs found across all platforms.
          </p>
        </div>
        <button
          onClick={() => setShowManualAdd(true)}
          className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Track Application
        </button>
      </div>

      {/* Manual add modal */}
      {showManualAdd && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Track External Application</h3>
            <button onClick={() => setShowManualAdd(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Add jobs you applied to outside of 3BOX to track them on your board.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Job Title *"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              type="text"
              placeholder="Company *"
              value={manualCompany}
              onChange={(e) => setManualCompany(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              type="text"
              placeholder="Job URL (optional)"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              type="text"
              placeholder="Location (optional)"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowManualAdd(false)}
              className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleManualSave}
              disabled={!manualTitle.trim() || !manualCompany.trim() || manualSaving}
              className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {manualSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search jobs, companies, or locations..."
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
                <th
                  onClick={() => handleSort('title')}
                  className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                >
                  <span className="flex items-center gap-1">Job <SortIcon field="title" /></span>
                </th>
                <th
                  onClick={() => handleSort('company')}
                  className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                >
                  <span className="flex items-center gap-1">Company <SortIcon field="company" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Location</th>
                <th
                  onClick={() => handleSort('match')}
                  className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                >
                  <span className="flex items-center justify-center gap-1">Match <SortIcon field="match" /></span>
                </th>
                <th
                  onClick={() => handleSort('source')}
                  className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                >
                  <span className="flex items-center justify-center gap-1">Source <SortIcon field="source" /></span>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                >
                  <span className="flex items-center justify-center gap-1">Status <SortIcon field="status" /></span>
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                >
                  <span className="flex items-center justify-center gap-1">Age <SortIcon field="date" /></span>
                </th>
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
                        {Math.round(job.matchScore)}%
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
                      getStatusLabel(job.status) === 'Applied' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400' :
                      getStatusLabel(job.status) === 'New' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' :
                      getStatusLabel(job.status) === 'Saved' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                      getStatusLabel(job.status) === 'Interview' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' :
                      getStatusLabel(job.status) === 'Offer' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                      'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                    )}>
                      {getStatusLabel(job.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(job.discoveredAt)}
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
                      {job.jobUrl && !job.jobUrl.startsWith('https://manual-entry/') && (
                        <a
                          href={job.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={async () => {
                            try {
                              await fetch(`/api/user/board-jobs/${job.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'APPLIED' }),
                              });
                              setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'APPLIED' } : j));
                            } catch {}
                          }}
                          className={cn(
                            'px-2.5 py-1 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1',
                            job.status === 'APPLIED'
                              ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20'
                              : 'bg-blue-600 text-white hover:bg-blue-700',
                          )}
                        >
                          {job.status === 'APPLIED' ? 'Applied' : 'Apply'} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {job.jobUrl?.startsWith('https://manual-entry/') && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">Manual</span>
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
