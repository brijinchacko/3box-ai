'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  ExternalLink,
  Bookmark,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Sparkles,
  Send,
  Zap,
  Crown,
  Settings,
  Play,
  Pause,
  Eye,
  CheckCircle2,
  XCircle,
  BarChart3,
  Wifi,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────
interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  description: string;
  salary: string | null;
  url: string;
  postedAt: string;
  type: string;
  remote: boolean;
  matchScore?: number;
  source?: string;
}

interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  isDemo: boolean;
  error?: string;
}

// ── Skeleton Loader ────────────────────────────────────
function JobCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-5 w-48 bg-white/10 rounded" />
            <div className="h-5 w-20 bg-white/5 rounded-full" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-28 bg-white/5 rounded" />
            <div className="h-4 w-32 bg-white/5 rounded" />
            <div className="h-4 w-36 bg-white/5 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-white/5 rounded" />
            <div className="h-3 w-3/4 bg-white/5 rounded" />
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="h-9 w-24 bg-white/10 rounded-lg" />
          <div className="h-9 w-24 bg-white/5 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Relative Time Helper ───────────────────────────────
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} month(s) ago`;
}

const SAVED_JOBS_KEY = 'nxted_saved_jobs';

// ── Main Page ──────────────────────────────────────────
export default function JobsPage() {
  const [tab, setTab] = useState<'discover' | 'saved' | 'applications'>('discover');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Saved jobs
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_JOBS_KEY);
      if (stored) setSavedJobs(JSON.parse(stored));
    } catch {}
  }, []);

  const toggleSaveJob = (job: Job) => {
    setSavedJobs(prev => {
      const exists = prev.some(j => j.id === job.id);
      const updated = exists ? prev.filter(j => j.id !== job.id) : [...prev, job];
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isJobSaved = (jobId: string) => savedJobs.some(j => j.id === jobId);

  // ── Fetch Jobs ─────────────────────────────────────
  const fetchJobs = useCallback(async (q: string, loc: string, remote: boolean, pg: number) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (loc.trim()) params.set('location', loc.trim());
      if (remote) params.set('remote_only', 'true');
      params.set('page', String(pg));

      const res = await fetch(`/api/jobs/search?${params.toString()}`);

      if (!res.ok) {
        if (res.status === 401) {
          setError('Please sign in to search for jobs.');
          return;
        }
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to fetch jobs. Please try again.');
        return;
      }

      const data: JobsResponse = await res.json();

      if (data.error) {
        // Soft error (e.g., rate limit) -- still show jobs if available
        setError(data.error);
      }

      setJobs(data.jobs || []);
      setTotal(data.total || 0);
      setIsDemo(data.isDemo || false);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load with user's target role and location from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem('nxted_target_role');
    const savedLocation = localStorage.getItem('nxted_user_location');
    if (savedRole && !searchQuery) {
      setSearchQuery(savedRole);
    }
    if (savedLocation && !locationQuery) {
      setLocationQuery(savedLocation);
    }
    fetchJobs(savedRole || searchQuery, savedLocation || locationQuery, remoteOnly, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle Search Submit ───────────────────────────
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs(searchQuery, locationQuery, remoteOnly, 1);
  };

  // ── Pagination ─────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / 10));
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchJobs(searchQuery, locationQuery, remoteOnly, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <Briefcase className="w-7 h-7 text-neon-orange" /> Job Matching
        </h1>
        <p className="text-white/40">Find and track job opportunities powered by real-time data.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'discover' as const, label: 'Discover Jobs', icon: Search },
          { id: 'saved' as const, label: 'Saved Jobs', icon: Bookmark },
          { id: 'applications' as const, label: 'Applications', icon: Send },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              tab === t.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Discover Jobs Tab ─────────────────────────── */}
      {tab === 'discover' && (
        <>
          {/* Demo Data Banner */}
          <AnimatePresence>
            {isDemo && !loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-xl bg-neon-blue/5 border border-neon-blue/10 text-sm text-neon-blue/80 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Showing demo data. Add a <code className="px-1 py-0.5 bg-white/5 rounded text-xs">RAPIDAPI_KEY</code> to your environment for live job listings from JSearch.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="card mb-6">
            <div className="flex gap-3 flex-wrap items-end">
              <div className="relative flex-1 min-w-[180px]">
                <label className="block text-xs text-white/40 mb-1.5">Role / Keywords</label>
                <Search className="absolute left-3 bottom-2.5 w-4 h-4 text-white/30" />
                <input
                  className="input-field pl-10"
                  placeholder="Software engineer, React, ML..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative flex-1 min-w-[180px]">
                <label className="block text-xs text-white/40 mb-1.5">Location</label>
                <MapPin className="absolute left-3 bottom-2.5 w-4 h-4 text-white/30" />
                <input
                  className="input-field pl-10"
                  placeholder="City, state, or country..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRemoteOnly(!remoteOnly)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                    remoteOnly
                      ? 'bg-neon-green/10 border-neon-green/30 text-neon-green'
                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                  }`}
                >
                  <Wifi className="w-4 h-4" />
                  Remote
                </button>
                <button
                  type="submit"
                  className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-sm text-red-400 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Skeletons */}
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && jobs.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card text-center py-12"
            >
              <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-1">No jobs found</h3>
              <p className="text-sm text-white/40">Try adjusting your search keywords or filters.</p>
            </motion.div>
          )}

          {/* Job Listings */}
          {!loading && jobs.length > 0 && (
            <div className="space-y-4">
              {jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card hover:border-white/10 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="font-semibold text-white truncate">{job.title}</h3>
                        {typeof job.matchScore === 'number' && (
                          <span className={`badge text-xs flex-shrink-0 ${
                            job.matchScore >= 70 ? 'bg-neon-green/10 text-neon-green' :
                            job.matchScore >= 40 ? 'bg-amber-500/10 text-amber-400' :
                            'bg-white/5 text-white/40'
                          }`}>
                            <BarChart3 className="w-3 h-3 mr-0.5" /> {job.matchScore}% match
                          </span>
                        )}
                        {job.remote && (
                          <span className="badge text-xs bg-neon-green/10 text-neon-green flex-shrink-0">
                            <Wifi className="w-3 h-3 mr-0.5" /> Remote
                          </span>
                        )}
                        <span className="badge text-xs bg-white/5 text-white/50 flex-shrink-0">
                          {job.type}
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-4 text-sm text-white/40 flex-wrap mb-2">
                        <span className="font-medium text-white/60">{job.company}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                        {job.salary && (
                          <span className="text-neon-green/80 font-medium">{job.salary}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeAgo(job.postedAt)}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-white/30 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      {/* AI Match Score placeholder */}
                      <div className="mt-3 flex items-center gap-2 text-xs text-white/20">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Match Score -- Coming soon</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Job <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveJob(job);
                        }}
                        className={`text-xs px-4 py-2 flex items-center gap-1.5 whitespace-nowrap ${
                          isJobSaved(job.id) ? 'btn-primary' : 'btn-secondary'
                        }`}
                      >
                        <Bookmark className={`w-3 h-3 ${isJobSaved(job.id) ? 'fill-current' : ''}`} />
                        {isJobSaved(job.id) ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && jobs.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className={`p-2 rounded-lg transition-all ${
                  page <= 1
                    ? 'text-white/20 cursor-not-allowed'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      page === pageNum
                        ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange/30'
                        : 'text-white/40 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className={`p-2 rounded-lg transition-all ${
                  page >= totalPages
                    ? 'text-white/20 cursor-not-allowed'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Result count */}
          {!loading && jobs.length > 0 && (
            <p className="text-center text-xs text-white/20 mt-3">
              Showing {jobs.length} of {total} results {isDemo && '(demo data)'}
            </p>
          )}
        </>
      )}

      {/* ── Saved Jobs Tab ────────────────────────────── */}
      {tab === 'saved' && (
        savedJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-16"
          >
            <Bookmark className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No saved jobs yet</h3>
            <p className="text-sm text-white/40 mb-4">Save jobs to see them here for quick access later.</p>
            <button
              onClick={() => setTab('discover')}
              className="btn-primary text-sm px-5 py-2 inline-flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Discover Jobs
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {savedJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h3 className="font-semibold text-white truncate">{job.title}</h3>
                      {job.remote && (
                        <span className="badge text-xs bg-neon-green/10 text-neon-green flex-shrink-0">
                          <Wifi className="w-3 h-3 mr-0.5" /> Remote
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/40 flex-wrap mb-2">
                      <span className="font-medium text-white/60">{job.company}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                      {job.salary && <span className="text-neon-green/80 font-medium">{job.salary}</span>}
                    </div>
                    <p className="text-sm text-white/30 line-clamp-2">{job.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 whitespace-nowrap">
                      View Job <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => toggleSaveJob(job)}
                      className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 whitespace-nowrap text-red-400 hover:text-red-300"
                    >
                      <XCircle className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* ── Applications Tab ──────────────────────────── */}
      {tab === 'applications' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-16"
        >
          <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-1">Track your applications here</h3>
          <p className="text-sm text-white/40 mb-4">
            When you apply to jobs, they will appear here so you can track your progress.
          </p>
          <button
            onClick={() => setTab('discover')}
            className="btn-primary text-sm px-5 py-2 inline-flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4" /> Browse Jobs
          </button>
        </motion.div>
      )}
    </div>
  );
}
