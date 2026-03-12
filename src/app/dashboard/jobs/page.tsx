'use client';

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  ExternalLink,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Sparkles,
  Crown,
  Play,
  XCircle,
  BarChart3,
  Wifi,
  Lock,
  X,
  Radar,
  LayoutGrid,
  List,
  History,
  Shield,
  AlertTriangle,
  Target,
  Hammer,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import AgenticWorkspace from '@/components/dashboard/shared/AgenticWorkspace';
import { cn } from '@/lib/utils';
import AgentPageHeader from '@/components/dashboard/AgentPageHeader';
import AgentConfigPanel from '@/components/dashboard/AgentConfigPanel';
import AgentLockedPage from '@/components/dashboard/AgentLockedPage';
import AgentLoader from '@/components/brand/AgentLoader';
import AgentAvatar from '@/components/brand/AgentAvatar';
import ScoutMissionModal, { type ScoutMissionResult } from '@/components/dashboard/ScoutMissionModal';
import ScoutJobCard from '@/components/dashboard/ScoutJobCard';
import ScoutJobGridCard from '@/components/dashboard/ScoutJobGridCard';
import ScoutReportHeader from '@/components/dashboard/ScoutReportHeader';
import { useScoutStatus } from '@/hooks/useScoutStatus';
import { isAgentAvailable, type PlanTier } from '@/lib/agents/permissions';
import { detectScamSignals, type ScamSignals } from '@/lib/jobs/scamDetector';
import { notifyAgentCompleted } from '@/lib/notifications/toast';

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

interface ScoutRunHistoryEntry {
  runId: string;
  status: string;
  jobsFound: number;
  summary: string | null;
  startedAt: string;
  completedAt: string | null;
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

const SAVED_JOBS_KEY = '3box_saved_jobs';

// ── Job Detail Overlay for Grid View ───────────────────
function JobDetailOverlay({
  job,
  userPlan,
  isSaved,
  onSave,
  onClose,
}: {
  job: Job;
  userPlan: PlanTier;
  isSaved: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const [scamCheck, setScamCheck] = useState<ScamSignals | null>(null);
  const sentinelAvailable = isAgentAvailable('sentinel', userPlan);
  const forgeAvailable = isAgentAvailable('forge', userPlan);

  const handleVerify = () => {
    const result = detectScamSignals({
      title: job.title,
      company: job.company,
      description: job.description,
      salary: job.salary,
      url: job.url,
      location: job.location,
    });
    setScamCheck(result);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl glass border border-white/10 rounded-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">{job.title}</h3>
              {typeof job.matchScore === 'number' && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                  job.matchScore >= 70 ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                  job.matchScore >= 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-white/5 text-white/40 border-white/10'
                }`}>
                  {job.matchScore}%
                </span>
              )}
            </div>
            <p className="text-xs text-white/50 mt-0.5">{job.company}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/40">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-white/30 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {job.location}
              {job.remote && <span className="text-cyan-400/60 ml-1">(Remote)</span>}
            </span>
            {job.salary && <span className="text-cyan-400/60">{job.salary}</span>}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo(job.postedAt)}
            </span>
            {job.source && (
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/30 text-[10px]">{job.source}</span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-white/40 leading-relaxed">{job.description}</p>

          {/* Scam check result */}
          {scamCheck && (
            <div className={`p-3 rounded-xl text-xs border ${
              scamCheck.verdict === 'safe'
                ? 'bg-neon-green/5 border-neon-green/10 text-neon-green/80'
                : scamCheck.verdict === 'suspicious'
                  ? 'bg-amber-500/5 border-amber-500/10 text-amber-400/80'
                  : 'bg-red-500/5 border-red-500/10 text-red-400/80'
            }`}>
              <div className="flex items-center gap-2 mb-1 font-semibold">
                <Shield className="w-3.5 h-3.5" />
                Sentinel Verdict: {scamCheck.verdict === 'safe' ? 'Safe' : scamCheck.verdict === 'suspicious' ? 'Suspicious' : 'Likely Scam'}
                <span className="text-[10px] font-normal opacity-60">Score: {scamCheck.score}/100</span>
              </div>
              {scamCheck.signals.length > 0 && (
                <ul className="space-y-0.5 ml-5">
                  {scamCheck.signals.map((r, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Agent action bar */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
            <span className="text-[10px] text-white/25">Scout found this match. What&apos;s next?</span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {!scamCheck && (
                <button
                  onClick={handleVerify}
                  disabled={!sentinelAvailable}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-all disabled:opacity-40"
                  title={!sentinelAvailable ? 'Sentinel requires Ultra plan' : ''}
                >
                  <AgentAvatar agentId="sentinel" size={16} />
                  Verify Listing
                </button>
              )}
              <a
                href={forgeAvailable ? `/dashboard/resume?optimizeFor=${encodeURIComponent(job.title)}` : '#'}
                onClick={(e) => { if (!forgeAvailable) e.preventDefault(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-all"
                title={!forgeAvailable ? 'Forge requires Starter plan' : ''}
                style={!forgeAvailable ? { opacity: 0.4, pointerEvents: 'none' } : {}}
              >
                <AgentAvatar agentId="forge" size={16} />
                Tailor Resume
              </a>
              <button
                onClick={onSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  isSaved
                    ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                    : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue transition-all"
              >
                Apply <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Autopilot Mode — Job Search with Saved Search Profiles ────────────────

const JOB_BOARDS = [
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'indeed', label: 'Indeed', icon: '🔍' },
  { id: 'glassdoor', label: 'Glassdoor', icon: '🏢' },
  { id: 'google', label: 'Google Jobs', icon: '🌐' },
  { id: 'dice', label: 'Dice', icon: '🎲' },
  { id: 'naukri', label: 'Naukri', icon: '📋' },
];

const EXPERIENCE_LEVELS = [
  { value: '', label: 'Any Experience' },
  { value: 'internship', label: 'Internship' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'lead', label: 'Lead / Manager' },
  { value: 'executive', label: 'Executive' },
];

interface SavedProfile {
  id: string;
  name: string;
  jobTitle: string;
  location: string;
  remote: boolean;
  active: boolean;
  jobsFound: number;
  appliedCount: number;
  createdAt: string;
}

function AutopilotJobSearch() {
  // Search profile creation state
  const [step, setStep] = useState(1);
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [selectedBoards, setSelectedBoards] = useState<string[]>(['linkedin', 'indeed', 'google']);
  const [includeKeywords, setIncludeKeywords] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState('');
  const [excludeCompanies, setExcludeCompanies] = useState('');
  const [matchTolerance, setMatchTolerance] = useState(70);
  const [autoApply, setAutoApply] = useState(false);
  const [autoSearch, setAutoSearch] = useState(true);

  // My Profiles state
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search results state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'profiles' | 'search'>('profiles');

  // Fetch saved search profiles
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const res = await fetch('/api/user/loops');
        if (res.ok) {
          const data = await res.json();
          setProfiles(data.profiles || []);
        }
      } catch {} finally {
        setLoadingProfiles(false);
      }
    }
    fetchProfiles();
  }, []);

  const toggleBoard = (id: string) => {
    setSelectedBoards(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleSearch = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    if (!jobTitle.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setActiveTab('search');
    try {
      const params = new URLSearchParams({ q: jobTitle, page: String(page) });
      if (location) params.set('location', location);
      if (remoteOnly) params.set('remote', 'true');
      if (experienceLevel) params.set('experience', experienceLevel);
      if (includeKeywords) params.set('keywords', includeKeywords);
      if (excludeKeywords) params.set('exclude', excludeKeywords);
      if (selectedBoards.length > 0) params.set('sources', selectedBoards.join(','));
      const res = await fetch(`/api/jobs/search?${params}`);
      if (res.ok) {
        const data: JobsResponse = await res.json();
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [jobTitle, location, remoteOnly, experienceLevel, includeKeywords, excludeKeywords, selectedBoards, page]);

  const handleSaveProfile = async () => {
    if (!jobTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user/loops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${jobTitle}${location ? ` in ${location}` : ''}`,
          jobTitle,
          location,
          remote: remoteOnly,
          experienceLevel,
          boards: selectedBoards,
          includeKeywords,
          excludeKeywords,
          excludeCompanies,
          matchTolerance,
          autoApply,
          autoSearch,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfiles(prev => [data.profile, ...prev]);
        setShowCreateForm(false);
        setStep(1);
        setJobTitle('');
        setLocation('');
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const toggleProfileActive = async (profileId: string, active: boolean) => {
    try {
      await fetch(`/api/user/loops/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      setProfiles(prev => prev.map(l => l.id === profileId ? { ...l, active } : l));
    } catch {}
  };

  const deleteProfile = async (profileId: string) => {
    try {
      await fetch(`/api/user/loops/${profileId}`, { method: 'DELETE' });
      setProfiles(prev => prev.filter(l => l.id !== profileId));
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Search</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create search profiles to automatically find and apply to jobs.
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            New Search Profile
          </button>
        )}
      </div>

      {/* Search Profile Creation Wizard */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-6 overflow-hidden">
          {/* Steps indicator */}
          <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <button
                    onClick={() => setStep(s)}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      step === s
                        ? 'bg-blue-600 text-white'
                        : step > s
                          ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
                    )}
                  >
                    {s}
                  </button>
                  <span className={cn(
                    'text-sm font-medium hidden sm:inline',
                    step === s ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500',
                  )}>
                    {s === 1 ? 'Job Details' : s === 2 ? 'Sources' : s === 3 ? 'Keywords' : 'Automation'}
                  </span>
                  {s < 4 && <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Step 1: Job Details */}
            {step === 1 && (
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer, Product Manager..."
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. San Francisco, New York, London..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={remoteOnly}
                    onChange={(e) => setRemoteOnly(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Remote Only</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Only show remote-friendly positions</p>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    {EXPERIENCE_LEVELS.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Job Boards / Sources */}
            {step === 2 && (
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Job Boards
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Select which job boards to search. We&apos;ll aggregate results from all selected sources.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {JOB_BOARDS.map(board => (
                      <button
                        key={board.id}
                        onClick={() => toggleBoard(board.id)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left',
                          selectedBoards.includes(board.id)
                            ? 'border-blue-300 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600',
                        )}
                      >
                        <span className="text-base">{board.icon}</span>
                        <span>{board.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Keywords */}
            {step === 3 && (
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Include Keywords
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Jobs must contain at least one of these keywords (comma-separated)
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. React, TypeScript, Node.js..."
                    value={includeKeywords}
                    onChange={(e) => setIncludeKeywords(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Exclude Keywords
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Filter out jobs containing these keywords (comma-separated)
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. Sales, Marketing, Unpaid..."
                    value={excludeKeywords}
                    onChange={(e) => setExcludeKeywords(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Exclude Companies
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Skip jobs from these companies (comma-separated)
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp, Initech..."
                    value={excludeCompanies}
                    onChange={(e) => setExcludeCompanies(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Match Tolerance: <span className="text-blue-600 dark:text-blue-400">{matchTolerance}%</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Minimum match score to include a job. Lower values = more results.
                  </p>
                  <input
                    type="range"
                    min={30}
                    max={100}
                    step={5}
                    value={matchTolerance}
                    onChange={(e) => setMatchTolerance(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <span>More results</span>
                    <span>More precise</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Automation */}
            {step === 4 && (
              <div className="space-y-4 max-w-lg">
                <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Auto-Search</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Automatically run this search daily and notify you of new matches
                    </p>
                  </div>
                  <div className="relative ml-4">
                    <input
                      type="checkbox"
                      checked={autoSearch}
                      onChange={(e) => setAutoSearch(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      onClick={() => setAutoSearch(!autoSearch)}
                      className={cn(
                        'w-10 h-5 rounded-full transition-colors cursor-pointer',
                        autoSearch ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600',
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5',
                        autoSearch ? 'translate-x-5.5 ml-[22px]' : 'translate-x-0.5 ml-[2px]',
                      )} />
                    </div>
                  </div>
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Auto-Apply</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Automatically apply to jobs with a match score above {matchTolerance}%
                    </p>
                  </div>
                  <div className="relative ml-4">
                    <input
                      type="checkbox"
                      checked={autoApply}
                      onChange={(e) => setAutoApply(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      onClick={() => setAutoApply(!autoApply)}
                      className={cn(
                        'w-10 h-5 rounded-full transition-colors cursor-pointer',
                        autoApply ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600',
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5',
                        autoApply ? 'translate-x-5.5 ml-[22px]' : 'translate-x-0.5 ml-[2px]',
                      )} />
                    </div>
                  </div>
                </label>

                {autoApply && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      <strong>Note:</strong> Auto-apply uses your uploaded resume and generates a tailored cover letter for each application. Make sure your resume is up to date.
                    </p>
                  </div>
                )}

                {/* Summary */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Profile Summary</h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p><span className="font-medium text-gray-900 dark:text-white">Title:</span> {jobTitle || '—'}</p>
                    <p><span className="font-medium text-gray-900 dark:text-white">Location:</span> {location || 'Any'} {remoteOnly ? '(Remote)' : ''}</p>
                    <p><span className="font-medium text-gray-900 dark:text-white">Experience:</span> {EXPERIENCE_LEVELS.find(l => l.value === experienceLevel)?.label || 'Any'}</p>
                    <p><span className="font-medium text-gray-900 dark:text-white">Sources:</span> {selectedBoards.length ? selectedBoards.join(', ') : 'None'}</p>
                    <p><span className="font-medium text-gray-900 dark:text-white">Match Tolerance:</span> {matchTolerance}%</p>
                    <p><span className="font-medium text-gray-900 dark:text-white">Auto-Search:</span> {autoSearch ? 'On' : 'Off'}</p>
                    <p><span className="font-medium text-gray-900 dark:text-white">Auto-Apply:</span> {autoApply ? 'On' : 'Off'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => { setShowCreateForm(false); setStep(1); }}
                  className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <div className="flex items-center gap-2">
                {step < 4 ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={step === 1 && !jobTitle.trim()}
                    className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { handleSearch(); }}
                      disabled={!jobTitle.trim() || loading}
                      className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors flex items-center gap-1.5"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Search Now
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={!jobTitle.trim() || saving}
                      className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />}
                      Save Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs: My Profiles | Search Results */}
      {!showCreateForm && (
        <>
          <div className="flex items-center gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('profiles')}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === 'profiles'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              My Profiles
              {profiles.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                  {profiles.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === 'search'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              Search Results
              {hasSearched && total > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                  {total}
                </span>
              )}
            </button>
          </div>

          {/* My Profiles Tab */}
          {activeTab === 'profiles' && (
            <div>
              {loadingProfiles ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-16">
                  <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-900 dark:text-white font-medium">No search profiles yet</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-sm mx-auto">
                    Create a search profile to automatically find and apply to jobs matching your criteria.
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Create Your First Profile
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {profiles.map(profile => (
                    <div
                      key={profile.id}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile.name}</h3>
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              profile.active
                                ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
                            )}>
                              {profile.active ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {profile.location || 'Any location'}
                              {profile.remote && ' · Remote'}
                            </span>
                            <span>{profile.jobsFound} jobs found</span>
                            <span>{profile.appliedCount} applied</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => toggleProfileActive(profile.id, !profile.active)}
                            className={cn(
                              'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                              profile.active
                                ? 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                                : 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30 hover:bg-green-50 dark:hover:bg-green-500/10',
                            )}
                          >
                            {profile.active ? 'Pause' : 'Resume'}
                          </button>
                          <button
                            onClick={() => deleteProfile(profile.id)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            title="Delete profile"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Results Tab */}
          {activeTab === 'search' && (
            <div>
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              )}

              {!loading && !hasSearched && (
                <div className="text-center py-16">
                  <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Create a search profile and click &quot;Search Now&quot; to see results.</p>
                </div>
              )}

              {!loading && hasSearched && jobs.length === 0 && (
                <div className="text-center py-16">
                  <Briefcase className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No jobs found. Try different keywords or broaden your filters.</p>
                </div>
              )}

              {!loading && jobs.length > 0 && (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{total} jobs found</p>
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                              {typeof job.matchScore === 'number' && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                  {job.matchScore}% match
                                </span>
                              )}
                              {job.remote && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400">
                                  Remote
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {job.company} {job.location ? `\u00B7 ${job.location}` : ''}
                            </p>
                            {job.salary && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{job.salary}</p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 line-clamp-2">
                              {job.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              Save
                            </button>
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Apply
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(job.postedAt)}
                          </span>
                          {job.source && (
                            <span className="capitalize">{job.source}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {total > 20 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => { setPage(p => Math.max(1, p - 1)); handleSearch(); }}
                        disabled={page <= 1}
                        className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Page {page}</span>
                      <button
                        onClick={() => { setPage(p => p + 1); handleSearch(); }}
                        disabled={page * 20 >= total}
                        className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function JobsPage() {
  const { isAutopilot, isAgentic } = useDashboardMode();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const userPlan = ((session?.user as any)?.plan ?? 'FREE').toUpperCase() as PlanTier;
  const agentLocked = !isAgentAvailable('scout', userPlan);

  // In Autopilot mode, render simplified job search
  if (isAutopilot) return <AutopilotJobSearch />;

  // In Agentic mode, render Cortex-style agent workspace
  if (isAgentic) return <AgenticWorkspace agentId="scout" />;
  const initialTab = (searchParams.get('tab') as 'scout-report' | 'discover' | 'saved') || 'scout-report';
  const [tab, setTab] = useState<'scout-report' | 'discover' | 'saved'>(initialTab);

  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Scout Mission Modal — auto-open if ?deploy=scout
  const [showMissionModal, setShowMissionModal] = useState(searchParams.get('deploy') === 'scout');

  // Scout Report state
  const [scoutJobs, setScoutJobs] = useState<any[]>([]);
  const [scoutSummary, setScoutSummary] = useState<{
    totalFound: number;
    totalFiltered: number;
    scamJobsFiltered: number;
    sources: string[];
  } | null>(null);
  const [scoutRunId, setScoutRunId] = useState<string | null>(null);
  const [scoutCompletedAt, setScoutCompletedAt] = useState<string | undefined>();

  // View mode for Scout Report
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Grid card detail overlay
  const [detailJob, setDetailJob] = useState<Job | null>(null);

  // Scout run history
  const [runHistory, setRunHistory] = useState<ScoutRunHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Background mode watcher
  const [backgroundRunId, setBackgroundRunId] = useState<string | null>(null);
  const { status: scoutStatus } = useScoutStatus(true);
  const prevScoutStatusRef = useRef<string>('idle');

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

  const isMax = userPlan === 'MAX';

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_JOBS_KEY);
      if (stored) setSavedJobs(JSON.parse(stored));
    } catch {}
  }, []);

  // Fetch latest scout results on mount (persists across navigation)
  useEffect(() => {
    fetch('/api/agents/scout/results')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.jobs?.length) {
          setScoutJobs(data.jobs);
          setScoutSummary(data.summary);
          setScoutRunId(data.runId);
          setScoutCompletedAt(data.completedAt);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch run history
  useEffect(() => {
    fetch('/api/agents/scout/history')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.runs) setRunHistory(data.runs);
      })
      .catch(() => {});
  }, [scoutRunId]);

  // Background completion watcher
  useEffect(() => {
    if (prevScoutStatusRef.current === 'running' && scoutStatus === 'completed' && backgroundRunId) {
      fetch('/api/agents/scout/results')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.jobs?.length) {
            setScoutJobs(data.jobs);
            setScoutSummary(data.summary);
            setScoutRunId(data.runId);
            setScoutCompletedAt(data.completedAt);
            setTab('scout-report');
            notifyAgentCompleted('scout', `Found ${data.jobs.length} matching jobs!`, '/dashboard/jobs?tab=scout-report');
          }
        })
        .catch(() => {});
      setBackgroundRunId(null);
    }
    prevScoutStatusRef.current = scoutStatus;
  }, [scoutStatus, backgroundRunId]);

  // Handle Scout mission complete
  const handleScoutComplete = (result: ScoutMissionResult) => {
    setScoutJobs(result.jobs);
    setScoutSummary(result.summary);
    setScoutRunId(result.runId);
    setScoutCompletedAt(new Date().toISOString());
    setShowMissionModal(false);
    setTab('scout-report');
    notifyAgentCompleted('scout', `Scout found ${result.jobs.length} jobs matching your criteria.`, '/dashboard/jobs?tab=scout-report');
  };

  // Handle background mode
  const handleBackground = () => {
    setBackgroundRunId('pending');
  };

  // Handle "View Job" click: MAX users go directly, others see upgrade modal
  const handleViewJob = (job: Job) => {
    if (isMax) {
      window.open(job.url, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedJob(job);
      setShowUpgradeModal(true);
    }
  };

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
    const savedRole = localStorage.getItem('3box_target_role');
    const savedLocation = localStorage.getItem('3box_user_location');
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

  // ── Locked agent check ─────────────
  if (agentLocked) return <AgentLockedPage agentId="scout" />;

  // ── Normal Job Search UI ─────────────
  return (
    <div className="max-w-5xl mx-auto">
      <AgentPageHeader agentId="scout" onRunNow={() => setShowMissionModal(true)} />
      <AgentConfigPanel agentId="scout" variant="collapsible" />

      {/* Scout Mission Modal */}
      <ScoutMissionModal
        open={showMissionModal}
        onClose={() => setShowMissionModal(false)}
        onComplete={handleScoutComplete}
        onBackground={handleBackground}
      />

      {/* Grid card detail overlay */}
      <AnimatePresence>
        {detailJob && (
          <JobDetailOverlay
            job={detailJob}
            userPlan={userPlan}
            isSaved={isJobSaved(detailJob.id)}
            onSave={() => toggleSaveJob(detailJob)}
            onClose={() => setDetailJob(null)}
          />
        )}
      </AnimatePresence>

      {/* Upgrade Modal for non-MAX users */}
      <AnimatePresence>
        {showUpgradeModal && selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass border border-white/10 rounded-2xl p-6 text-center"
            >
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400/20 to-cyan-400/20 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Upgrade to Max</h3>
              <p className="text-sm text-white/50 mb-2">
                You found a great match!
              </p>
              <p className="text-sm text-white/40 mb-6">
                Upgrade to the <span className="text-blue-400 font-semibold">Max plan</span> to view full job details, apply directly, and get AI-powered application assistance.
              </p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-6 text-left">
                <p className="text-sm font-medium text-white/80">{selectedJob.title}</p>
                <p className="text-xs text-white/40">{selectedJob.company} - {selectedJob.location}</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/pricing"
                  className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <Crown className="w-4 h-4" /> Upgrade Now
                </Link>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 btn-secondary py-2.5 text-sm"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <Briefcase className="w-7 h-7 text-blue-400" /> Job Matching
        </h1>
        <p className="text-white/40">Find and track job opportunities powered by real-time data.</p>
      </motion.div>

      {/* Tabs — Scout Report first */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'scout-report' as const, label: `Scout Report${scoutJobs.length ? ` (${scoutJobs.length})` : ''}`, icon: Radar },
          { id: 'discover' as const, label: 'Discover Jobs', icon: Search },
          { id: 'saved' as const, label: 'Saved Jobs', icon: Bookmark },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              tab === t.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Scout Report Tab ──────────────────────────── */}
      {tab === 'scout-report' && (
        scoutJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-16"
          >
            <Radar className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Scout Report Yet</h3>
            <p className="text-sm text-white/40 mb-4">Deploy Agent Scout to hunt for jobs across 6+ platforms.</p>
            <button
              onClick={() => setShowMissionModal(true)}
              className="btn-primary text-sm px-5 py-2 inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Deploy Scout
            </button>

            {/* Run History */}
            {runHistory.length > 0 && (
              <div className="mt-8 text-left max-w-md mx-auto">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Previous Runs
                </h4>
                <div className="space-y-2">
                  {runHistory.slice(0, 5).map(run => (
                    <div key={run.runId} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 truncate">{run.summary?.split(' — ')[0] || 'Scout mission'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] flex-shrink-0 ${
                          run.status === 'completed' ? 'bg-blue-400/10 text-blue-400' :
                          run.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {run.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-white/25">
                        <span>{run.jobsFound} jobs found</span>
                        <span>{new Date(run.startedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <>
            {scoutSummary && (
              <ScoutReportHeader
                totalFound={scoutSummary.totalFound}
                totalFiltered={scoutSummary.totalFiltered}
                scamJobsFiltered={scoutSummary.scamJobsFiltered}
                sources={scoutSummary.sources}
                topMatchScore={scoutJobs[0]?.matchScore}
                completedAt={scoutCompletedAt}
              />
            )}

            {/* ── Post-Scout Action Bar ── */}
            {scoutSummary && scoutJobs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-xl bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-orange-500/5 border border-white/10"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Scout found {scoutSummary.totalFiltered} qualifying jobs
                    </h4>
                    <p className="text-xs text-white/40 mt-0.5">
                      Deploy Archer to auto-apply, or refine your resume with Forge first.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      href="/dashboard/applications"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 transition-all shadow-lg shadow-green-500/20"
                    >
                      <AgentAvatar agentId="archer" size={18} />
                      Deploy Archer
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href="/dashboard/resume"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
                    >
                      <AgentAvatar agentId="forge" size={18} />
                      Modify Resume
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* View toggle + actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {runHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-all"
                  >
                    <History className="w-3.5 h-3.5" />
                    History ({runHistory.length})
                  </button>
                )}
                <button
                  onClick={() => setShowMissionModal(true)}
                  className="btn-secondary text-xs px-4 py-1.5 inline-flex items-center gap-1.5"
                >
                  <Radar className="w-3.5 h-3.5" /> New Mission
                </button>
              </div>
            </div>

            {/* Run History panel */}
            <AnimatePresence>
              {showHistory && runHistory.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Run History</h4>
                    {runHistory.map(run => (
                      <div key={run.runId} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] text-xs">
                        <div className="flex-1 min-w-0">
                          <span className="text-white/50 truncate block">{run.summary?.replace(/\[Cancelled by user\]/, '').trim() || 'Scout mission'}</span>
                          <span className="text-white/25">{new Date(run.startedAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-white/30">{run.jobsFound} jobs</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            run.status === 'completed' ? 'bg-blue-400/10 text-blue-400' :
                            run.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {run.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {scoutJobs.map((job, i) => (
                  <ScoutJobGridCard
                    key={job.id}
                    job={job}
                    index={i}
                    isSaved={isJobSaved(job.id)}
                    onSave={() => toggleSaveJob(job)}
                    onClick={() => setDetailJob(job)}
                  />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-2">
                {scoutJobs.map((job, i) => (
                  <ScoutJobCard
                    key={job.id}
                    job={job}
                    index={i}
                    userPlan={userPlan}
                    isSaved={isJobSaved(job.id)}
                    onSave={() => toggleSaveJob(job)}
                  />
                ))}
              </div>
            )}
          </>
        )
      )}

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
                      ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-400'
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

          {/* Loading */}
          {loading && (
            <AgentLoader agentId="scout" message="Agent Scout is hunting for jobs" />
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
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="font-semibold text-white truncate">{job.title}</h3>
                        {typeof job.matchScore === 'number' && (
                          <span className={`badge text-xs flex-shrink-0 ${
                            job.matchScore >= 70 ? 'bg-blue-400/10 text-blue-400' :
                            job.matchScore >= 40 ? 'bg-amber-500/10 text-amber-400' :
                            'bg-white/5 text-white/40'
                          }`}>
                            <BarChart3 className="w-3 h-3 mr-0.5" /> {job.matchScore}% match
                          </span>
                        )}
                        {job.remote && (
                          <span className="badge text-xs bg-cyan-400/10 text-cyan-400 flex-shrink-0">
                            <Wifi className="w-3 h-3 mr-0.5" /> Remote
                          </span>
                        )}
                        <span className="badge text-xs bg-white/5 text-white/50 flex-shrink-0">
                          {job.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/40 flex-wrap mb-2">
                        <span className="font-medium text-white/60">{job.company}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                        {job.salary && (
                          <span className="text-cyan-400/80 font-medium">{job.salary}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeAgo(job.postedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-white/30 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-white/20">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Match Score -- Coming soon</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewJob(job);
                        }}
                        className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 whitespace-nowrap"
                      >
                        View Job <ExternalLink className="w-3 h-3" />
                      </button>
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
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
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
                        <span className="badge text-xs bg-cyan-400/10 text-cyan-400 flex-shrink-0">
                          <Wifi className="w-3 h-3 mr-0.5" /> Remote
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/40 flex-wrap mb-2">
                      <span className="font-medium text-white/60">{job.company}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                      {job.salary && <span className="text-cyan-400/80 font-medium">{job.salary}</span>}
                    </div>
                    <p className="text-sm text-white/30 line-clamp-2">{job.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewJob(job)}
                      className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      View Job <ExternalLink className="w-3 h-3" />
                    </button>
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

    </div>
  );
}

