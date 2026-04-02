'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ExternalLink, Search, Calendar, BarChart3, List, LayoutGrid, Filter, Radar, MapPin, Bookmark, Globe, ArrowRight, Clock, X, XCircle, Zap, AlertTriangle, CheckCircle2, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import LocationInput from '@/components/ui/LocationInput';
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

interface LiveSearchJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  url: string;
  source: string;
  matchScore: number;
  remote: boolean;
}

interface SearchHistoryItem {
  query: string;
  location: string;
  resultCount: number;
  timestamp: number;
}

interface SearchHistoryWithResults {
  query: string;
  location: string;
  jobs: LiveSearchJob[];
  sources: Record<string, number>;
  timestamp: number;
}

interface ImproveScoreJob {
  title: string;
  company: string;
  location?: string;
  description?: string;
  matchScore?: number | null;
  salary?: string | null;
  remote?: boolean;
}

const SEARCH_HISTORY_KEY = '3box-search-history';
const SEARCH_RESULTS_KEY = '3box-search-results';
const MAX_HISTORY = 10;
const MAX_STORED_SEARCHES = 5; // Store results for last 5 searches

function getSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_e) {
    return [];
  }
}

function saveSearchHistory(item: SearchHistoryItem) {
  try {
    let history = getSearchHistory();
    // Remove duplicate (same query + location)
    history = history.filter(
      (h) => !(h.query.toLowerCase() === item.query.toLowerCase() && h.location.toLowerCase() === item.location.toLowerCase()),
    );
    history.unshift(item);
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (_e) { /* ignore */ }
}

function getStoredSearchResults(): SearchHistoryWithResults[] {
  try {
    const raw = localStorage.getItem(SEARCH_RESULTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_e) {
    return [];
  }
}

function saveSearchResults(entry: SearchHistoryWithResults) {
  try {
    let stored = getStoredSearchResults();
    // Remove duplicate
    stored = stored.filter(
      (s) => !(s.query.toLowerCase() === entry.query.toLowerCase() && s.location.toLowerCase() === entry.location.toLowerCase()),
    );
    stored.unshift(entry);
    if (stored.length > MAX_STORED_SEARCHES) stored = stored.slice(0, MAX_STORED_SEARCHES);
    localStorage.setItem(SEARCH_RESULTS_KEY, JSON.stringify(stored));
  } catch (_e) { /* ignore — localStorage may be full */ }
}

function getLastSearchResults(): SearchHistoryWithResults | null {
  const stored = getStoredSearchResults();
  return stored.length > 0 ? stored[0] : null;
}

function getSearchResultsFor(query: string, location: string): SearchHistoryWithResults | null {
  const stored = getStoredSearchResults();
  return stored.find(
    (s) => s.query.toLowerCase() === query.toLowerCase() && s.location.toLowerCase() === location.toLowerCase(),
  ) || null;
}

function removeSearchHistoryItem(query: string, location: string) {
  try {
    let history = getSearchHistory();
    history = history.filter(
      (h) => !(h.query.toLowerCase() === query.toLowerCase() && h.location.toLowerCase() === location.toLowerCase()),
    );
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    // Also remove stored results
    let stored = getStoredSearchResults();
    stored = stored.filter(
      (s) => !(s.query.toLowerCase() === query.toLowerCase() && s.location.toLowerCase() === location.toLowerCase()),
    );
    localStorage.setItem(SEARCH_RESULTS_KEY, JSON.stringify(stored));
  } catch (_e) { /* ignore */ }
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
  WITHDRAWN: { label: 'Withdrawn', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800' },
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
  const router = useRouter();
  const [jobs, setJobs] = useState<BoardJob[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Live Search state
  const [activeTab, setActiveTab] = useState<'board' | 'search'>('board');
  const [liveQuery, setLiveQuery] = useState('');
  const [liveLocation, setLiveLocation] = useState('');
  const [liveJobs, setLiveJobs] = useState<LiveSearchJob[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveSources, setLiveSources] = useState<Record<string, number>>({});
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [searchTier, setSearchTier] = useState<{ tier: string; used: number; premiumLeft: number } | null>(null);

  // Auto Apply state
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [autoApplyStatus, setAutoApplyStatus] = useState<{
    resumeReady: boolean;
    resumeStatus: string;
    cap: { allowed: boolean; used: number; limit: number; remaining: number; limitType: string };
  } | null>(null);
  const [autoApplyError, setAutoApplyError] = useState<string | null>(null);

  // Application Preview Modal state
  const [showApplyPreview, setShowApplyPreview] = useState(false);
  const [previewJob, setPreviewJob] = useState<LiveSearchJob | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Board-level apply/withdraw state
  const [boardApplyingId, setBoardApplyingId] = useState<string | null>(null);
  const [boardWithdrawingId, setBoardWithdrawingId] = useState<string | null>(null);

  const openApplyPreview = (job: LiveSearchJob) => {
    setAutoApplyError(null);
    // Check resume first
    if (autoApplyStatus && !autoApplyStatus.resumeReady) {
      setAutoApplyError('resume');
      return;
    }
    // Check cap
    if (autoApplyStatus && !autoApplyStatus.cap.allowed) {
      setAutoApplyError('limit');
      return;
    }
    setPreviewJob(job);
    setShowApplyPreview(true);
  };

  const confirmApply = async () => {
    if (!previewJob) return;
    setPreviewLoading(true);
    setShowApplyPreview(false);
    await autoApply(previewJob);
    setPreviewLoading(false);
    setPreviewJob(null);
  };

  const cancelPreview = () => {
    setShowApplyPreview(false);
    setPreviewJob(null);
  };

  // Apply to a board job via quick-apply
  const handleBoardApply = async (job: BoardJob) => {
    if (!confirm(`Apply to "${job.title}" at ${job.company}?`)) return;
    setBoardApplyingId(job.id);
    try {
      const res = await fetch('/api/jobs/quick-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.jobUrl,
          source: job.source,
          matchScore: job.matchScore,
          sendConfirmation: true,
        }),
      });
      if (res.ok) {
        fetchJobs();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to apply. Please try again.');
      }
    } catch { alert('Network error. Please try again.'); } finally {
      setBoardApplyingId(null);
    }
  };

  // Withdraw a board job application
  const handleBoardWithdraw = async (job: BoardJob) => {
    if (!confirm('Withdraw this application? This will stop it from being processed.')) return;
    setBoardWithdrawingId(job.id);
    try {
      const res = await fetch('/api/user/board-jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id, status: 'WITHDRAWN' }),
      });
      if (res.ok) fetchJobs();
    } catch { /* ignore */ } finally {
      setBoardWithdrawingId(null);
    }
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/board-jobs?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setStatusCounts(data.statusCounts || {});
      }
    } catch (_e) { /* ignore */ } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => {
    setSearchHistory(getSearchHistory());
    // Restore last search results so they're visible immediately
    const lastSearch = getLastSearchResults();
    if (lastSearch && lastSearch.jobs.length > 0) {
      setLiveJobs(lastSearch.jobs);
      setLiveSources(lastSearch.sources || {});
      setLiveQuery(lastSearch.query);
      setLiveLocation(lastSearch.location || '');
    }
  }, []);

  // Fetch auto-apply eligibility when switching to search tab
  useEffect(() => {
    if (activeTab === 'search' && !autoApplyStatus) {
      fetch('/api/jobs/quick-apply')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setAutoApplyStatus(data); })
        .catch(() => {});
    }
  }, [activeTab, autoApplyStatus]);

  // Shared search execution
  const executeSearch = async (query: string, location: string) => {
    setLiveLoading(true);
    setLiveJobs([]);
    try {
      const params = new URLSearchParams({ q: query });
      if (location) params.set('location', location);
      const res = await fetch(`/api/jobs/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        const foundJobs = data.jobs || [];
        setLiveJobs(foundJobs);
        setLiveSources(data.sources || {});
        if (data.searchTier) {
          setSearchTier({ tier: data.searchTier, used: data.searchesUsed, premiumLeft: data.premiumSearchesLeft });
        }
        const count = foundJobs.length;
        saveSearchHistory({ query: query.trim(), location: location.trim(), resultCount: count, timestamp: Date.now() });
        saveSearchResults({ query: query.trim(), location: location.trim(), jobs: foundJobs, sources: data.sources || {}, timestamp: Date.now() });
        setSearchHistory(getSearchHistory());

        // Auto-save all search results to the board in background
        if (foundJobs.length > 0) {
          fetch('/api/user/board-jobs', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobs: foundJobs.map((j: LiveSearchJob) => ({
                title: j.title,
                company: j.company,
                url: j.url,
                location: j.location,
                source: j.source,
                matchScore: j.matchScore,
                description: j.description,
              })),
            }),
          })
            .then(() => fetchJobs()) // Refresh board after saving
            .catch(() => {}); // Silent — don't block search UX
        }
      }
    } catch (_e) { /* ignore */ } finally {
      setLiveLoading(false);
    }
  };

  // Run search with specific query/location (used by history clicks)
  const runSearchWith = async (query: string, location: string) => {
    setLiveQuery(query);
    setLiveLocation(location);
    // Check for cached results first (instant load)
    const cached = getSearchResultsFor(query, location);
    if (cached && cached.jobs.length > 0) {
      setLiveJobs(cached.jobs);
      setLiveSources(cached.sources || {});
    }
    // Always re-fetch for fresh results (will update UI when done)
    await executeSearch(query, location);
  };

  // Live Search function
  const runLiveSearch = async () => {
    if (!liveQuery.trim()) return;
    await executeSearch(liveQuery, liveLocation);
  };

  // Save a live search job to the board
  const saveToBoard = async (job: LiveSearchJob) => {
    setSavingJobId(job.id);
    try {
      await fetch('/api/user/board-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.title,
          company: job.company,
          jobUrl: job.url,
          location: job.location,
          source: job.source,
          matchScore: job.matchScore,
          description: job.description,
          status: 'SAVED',
        }),
      });
      // Refresh board jobs
      fetchJobs();
    } catch (_e) { /* ignore */ } finally {
      setSavingJobId(null);
    }
  };

  // Auto Apply a live search job
  const autoApply = async (job: LiveSearchJob) => {
    setAutoApplyError(null);

    // Check resume first
    if (autoApplyStatus && !autoApplyStatus.resumeReady) {
      setAutoApplyError('resume');
      return;
    }

    // Check cap
    if (autoApplyStatus && !autoApplyStatus.cap.allowed) {
      setAutoApplyError('limit');
      return;
    }

    setApplyingJobId(job.id);
    try {
      const res = await fetch('/api/jobs/quick-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          url: job.url,
          source: job.source,
          matchScore: job.matchScore,
          salary: job.salary,
          remote: job.remote,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'resume_not_ready') {
          setAutoApplyError('resume');
        } else if (data.error === 'limit_reached') {
          setAutoApplyError('limit');
          if (autoApplyStatus) {
            setAutoApplyStatus({ ...autoApplyStatus, cap: { ...autoApplyStatus.cap, allowed: false, remaining: 0 } });
          }
        } else {
          setAutoApplyError(data.message || 'Failed to apply');
        }
        return;
      }

      // Mark as applied
      setAppliedJobIds(prev => new Set([...prev, job.id]));
      // Update cap remaining
      if (autoApplyStatus && data.cap) {
        setAutoApplyStatus({
          ...autoApplyStatus,
          cap: { ...autoApplyStatus.cap, remaining: data.cap.remaining, used: autoApplyStatus.cap.used + 1 },
        });
      }
      // Refresh board
      fetchJobs();
    } catch (_e) {
      setAutoApplyError('Network error. Please try again.');
    } finally {
      setApplyingJobId(null);
    }
  };

  // Get unique sources for filter
  const uniqueSources = [...new Set(jobs.map(j => j.source).filter(Boolean))];

  // Filtered jobs
  const filtered = jobs.filter(j => {
    const matchesSearch = !searchQuery ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || (j.source || '').includes(sourceFilter);
    return matchesSearch && matchesStatus && matchesSource;
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

  // Navigate to score improvement page
  const goToImproveScore = (job: ImproveScoreJob) => {
    const params = new URLSearchParams();
    params.set('title', job.title);
    if (job.company) params.set('company', job.company);
    if (job.description) params.set('description', job.description.slice(0, 500));
    if (job.location) params.set('location', job.location);
    if (job.matchScore) params.set('score', String(Math.round(job.matchScore)));
    if (job.salary) params.set('salary', job.salary);
    if (job.remote) params.set('remote', 'true');
    router.push(`/dashboard/resume/improve?${params}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Discover, track, and apply to jobs across LinkedIn, Naukri, Indeed &amp; more.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'board' && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Tabs: My Board | Live Search */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 mb-6 w-fit">
        <button
          onClick={() => setActiveTab('board')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
            activeTab === 'board'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
          )}
        >
          <LayoutGrid className="w-4 h-4" /> My Board
          {jobs.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">{jobs.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
            activeTab === 'search'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
          )}
        >
          <Radar className="w-4 h-4" /> Live Search
        </button>
      </div>

      {/* ═══ LIVE SEARCH TAB ═══ */}
      {activeTab === 'search' && (
        <div>
          {/* Search Form */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={liveQuery}
                onChange={(e) => setLiveQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runLiveSearch()}
                placeholder="Job title (e.g. Software Engineer, Data Analyst)"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </div>
            <div className="w-full sm:w-48">
              <LocationInput
                value={liveLocation}
                onChange={setLiveLocation}
                placeholder="Location"
                icon={MapPin}
                inputClassName="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={runLiveSearch}
              disabled={liveLoading || !liveQuery.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {liveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
              Search Jobs
            </button>
          </div>

          {/* Search History — always visible when there's history */}
          {searchHistory.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Recent Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((item, i) => (
                  <button
                    key={`${item.query}-${item.location}-${i}`}
                    onClick={() => runSearchWith(item.query, item.location)}
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-colors"
                  >
                    <Search className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
                    <span className="font-medium">{item.query}</span>
                    {item.location && <span className="text-gray-400">in {item.location}</span>}
                    <span className="text-gray-400 dark:text-gray-500">({item.resultCount})</span>
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSearchHistoryItem(item.query, item.location);
                        setSearchHistory(getSearchHistory());
                      }}
                      className="ml-0.5 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Auto Apply Status Bar */}
          {autoApplyStatus && (
            <div className={cn(
              'mb-4 p-3 rounded-xl border flex items-center justify-between text-sm',
              autoApplyStatus.resumeReady && autoApplyStatus.cap.allowed
                ? 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20'
                : 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20',
            )}>
              <div className="flex items-center gap-2">
                {autoApplyStatus.resumeReady && autoApplyStatus.cap.allowed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-green-700 dark:text-green-400 font-medium">Auto Apply Ready</span>
                    <span className="text-green-600 dark:text-green-500 text-xs">
                      {autoApplyStatus.cap.remaining} of {autoApplyStatus.cap.limit} applications remaining {autoApplyStatus.cap.limitType === 'daily' ? 'today' : ''}
                    </span>
                  </>
                ) : !autoApplyStatus.resumeReady ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-700 dark:text-amber-400 font-medium">Resume Required</span>
                    <Link href="/dashboard/resume" className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-1">
                      Create & verify your resume
                    </Link>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-700 dark:text-amber-400 font-medium">Application Limit Reached</span>
                    <span className="text-amber-600 dark:text-amber-500 text-xs">
                      {autoApplyStatus.cap.used}/{autoApplyStatus.cap.limit} {autoApplyStatus.cap.limitType === 'daily' ? 'today' : 'total'}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {autoApplyError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                {autoApplyError === 'resume' ? (
                  <span className="text-red-700 dark:text-red-400">
                    You need a verified resume to auto-apply.{' '}
                    <Link href="/dashboard/resume" className="font-medium underline">Create Resume</Link>
                  </span>
                ) : autoApplyError === 'limit' ? (
                  <span className="text-red-700 dark:text-red-400">
                    Application limit reached. Upgrade your plan for more applications.
                  </span>
                ) : (
                  <span className="text-red-700 dark:text-red-400">{autoApplyError}</span>
                )}
              </div>
              <button onClick={() => setAutoApplyError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-500/10 rounded">
                <X className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          )}

          {/* Source breakdown chips */}
          {Object.keys(liveSources).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(liveSources).map(([src, count]) => (
                <span key={src} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <Globe className="w-3 h-3" /> {src}: {count}
                </span>
              ))}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Total: {liveJobs.length}
              </span>
              {searchTier && (
                <span className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                  searchTier.tier === 'premium'
                    ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
                )}>
                  <Sparkles className="w-3 h-3" />
                  {searchTier.tier === 'premium'
                    ? `Premium sources (${searchTier.premiumLeft} left today)`
                    : 'All sources'}
                </span>
              )}
            </div>
          )}

          {/* Loading */}
          {liveLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Searching LinkedIn, Naukri, Indeed, Google Jobs, Adzuna, Jooble...</p>
            </div>
          )}

          {/* Results */}
          {!liveLoading && liveJobs.length > 0 && (
            <div className="space-y-3">
              {liveJobs.map((job) => (
                <div key={job.id} className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-500/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{job.title}</h3>
                        {job.matchScore >= 70 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); goToImproveScore(job); }}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 font-medium flex-shrink-0 hover:bg-green-200 dark:hover:bg-green-500/20 transition-colors cursor-pointer"
                            title="Click to see how to improve your score"
                          >
                            {Math.round(job.matchScore)}% match
                          </button>
                        )}
                        {job.matchScore > 0 && job.matchScore < 70 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); goToImproveScore(job); }}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium flex-shrink-0 hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-colors cursor-pointer"
                            title="Click to see how to improve your score"
                          >
                            {Math.round(job.matchScore)}% match
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span>{job.company}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                        {job.salary && <span className="text-green-600 dark:text-green-400 font-medium">{job.salary}</span>}
                        {job.remote && <span className="text-blue-500 text-[10px] font-medium">Remote</span>}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{job.description}</p>
                      <div className="mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">{job.source}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {appliedJobIds.has(job.id) ? (
                        <span className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => openApplyPreview(job)}
                          disabled={applyingJobId === job.id || previewLoading}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          {applyingJobId === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          Auto Apply
                        </button>
                      )}
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Manual
                      </a>
                      <button
                        onClick={() => saveToBoard(job)}
                        disabled={savingJobId === job.id}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        {savingJobId === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bookmark className="w-3 h-3" />}
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!liveLoading && liveJobs.length === 0 && liveQuery && (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No jobs found. Try different keywords or location.</p>
            </div>
          )}

          {/* Initial state — show when no query typed and no results */}
          {!liveLoading && liveJobs.length === 0 && !liveQuery && searchHistory.length === 0 && (
            <div className="text-center py-16">
              <Radar className="w-12 h-12 text-blue-300 dark:text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Search jobs across the web</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Search LinkedIn, Naukri, Indeed, Google Jobs, Adzuna, and Jooble, all from one place. Enter a job title to get started.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ BOARD TAB ═══ */}
      {activeTab === 'board' && (<>
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
          <option value="WITHDRAWN">Withdrawn</option>
        </select>

        {uniqueSources.length > 1 && (
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Sources</option>
            {uniqueSources.map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        )}
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
            <div className="col-span-3">Position</div>
            <div className="col-span-2">Company</div>
            <div className="col-span-1">Match</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">When</div>
            <div className="col-span-2">Actions</div>
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
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{job.title}</p>
                    <p className="text-xs text-gray-400 sm:hidden">{job.company} - {job.location}</p>
                  </div>
                  <div className="col-span-2 hidden sm:block">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{job.company}</p>
                    <p className="text-xs text-gray-400 truncate">{job.location}</p>
                  </div>
                  <div className="col-span-1 hidden sm:block">
                    {job.matchScore ? (
                      <button
                        onClick={() => goToImproveScore({ title: job.title, company: job.company, location: job.location, matchScore: job.matchScore })}
                        className={cn(
                          'text-xs font-semibold hover:underline cursor-pointer',
                          job.matchScore >= 80 ? 'text-green-600' : job.matchScore >= 60 ? 'text-amber-600' : 'text-gray-500',
                        )}
                        title="Click to see how to improve your score"
                      >
                        {Math.round(job.matchScore)}%
                      </button>
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
                  <div className="col-span-1 hidden sm:block">
                    <p className="text-xs text-gray-500">{relativeTime(job.discoveredAt)}</p>
                  </div>
                  <div className="col-span-2 hidden sm:flex items-center gap-1.5">
                    {/* Apply button — for NEW/SAVED/SCORED jobs */}
                    {['NEW', 'SAVED', 'SCORED', 'READY'].includes(job.status) && (
                      <button
                        onClick={() => handleBoardApply(job)}
                        disabled={boardApplyingId === job.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                        title="Apply to this job"
                      >
                        {boardApplyingId === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Apply
                      </button>
                    )}
                    {/* Withdraw button — for APPLIED/EMAILED/QUEUED jobs */}
                    {['APPLIED', 'EMAILED', 'QUEUED', 'APPLYING'].includes(job.status) && (
                      <button
                        onClick={() => handleBoardWithdraw(job)}
                        disabled={boardWithdrawingId === job.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-colors disabled:opacity-50"
                        title="Withdraw application"
                      >
                        {boardWithdrawingId === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                        Withdraw
                      </button>
                    )}
                    {/* Manual apply link for SKIPPED */}
                    {job.status === 'SKIPPED' && job.jobUrl && (
                      <a
                        href={job.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Apply Manual
                      </a>
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
      </>)}

      {/* ═══ APPLICATION PREVIEW MODAL ═══ */}
      {showApplyPreview && previewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={cancelPreview} />

          {/* Modal */}
          <div className="relative w-full max-w-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header gradient bar */}
            <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />

            <div className="p-6">
              {/* Title */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{previewJob.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{previewJob.company} &middot; {previewJob.location}</p>
                </div>
                <button onClick={cancelPreview} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview details */}
              <div className="space-y-3 mb-6">
                {/* Resume */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Resume</p>
                    {autoApplyStatus?.resumeReady ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Finalized resume ({autoApplyStatus.resumeStatus === 'APPROVED' ? 'Verified' : 'Pending review'})
                        {previewJob.matchScore && (
                          <span className={cn(
                            'ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold',
                            previewJob.matchScore >= 80
                              ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                              : previewJob.matchScore >= 60
                              ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
                          )}>
                            ATS Score: {Math.round(previewJob.matchScore)}%
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-red-500 mt-0.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> No resume uploaded
                      </p>
                    )}
                  </div>
                </div>

                {/* Cover Letter */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex-shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Cover Letter</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      Will be auto-generated for this role
                    </p>
                  </div>
                </div>

                {/* Application Channel */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Channel</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      Best available (ATS API &rarr; Cold Email &rarr; Portal Queue)
                    </p>
                  </div>
                </div>

                {/* Match Score */}
                {previewJob.matchScore != null && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Match Score</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              previewJob.matchScore >= 80 ? 'bg-green-500' : previewJob.matchScore >= 60 ? 'bg-amber-500' : 'bg-gray-400',
                            )}
                            style={{ width: `${previewJob.matchScore}%` }}
                          />
                        </div>
                        <span className={cn(
                          'text-sm font-bold',
                          previewJob.matchScore >= 80 ? 'text-green-600 dark:text-green-400' : previewJob.matchScore >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500',
                        )}>
                          {Math.round(previewJob.matchScore)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cap info */}
              {autoApplyStatus?.cap && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 text-center">
                  {autoApplyStatus.cap.remaining} of {autoApplyStatus.cap.limit} applications remaining {autoApplyStatus.cap.limitType === 'daily' ? 'today' : ''}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={cancelPreview}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApply}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Confirm & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
