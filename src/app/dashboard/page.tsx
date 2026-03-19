'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import AgenticWorkspace from '@/components/dashboard/shared/AgenticWorkspace';
import { Plus, Search, MapPin, Pause, Play, Trash2, Loader2, FileEdit, Mic, Target, CheckCircle2, Sparkles, ArrowRight, Chrome, X, Zap, Power } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* ── Autopilot imports ── */
import StatsCards from '@/components/dashboard/overview/StatsCards';
import QuickActions from '@/components/dashboard/overview/QuickActions';
import RecentActivity from '@/components/dashboard/overview/RecentActivity';
import ApplicationLimitBar from '@/components/dashboard/shared/ApplicationLimitBar';
import SearchProfileWizard from '@/components/dashboard/jobs/SearchProfileWizard';

interface SearchProfile {
  id: string;
  name: string;
  jobTitle: string;
  location: string;
  remote?: boolean;
  active: boolean;
  jobsFound: number;
  appliedCount: number;
  createdAt: string;
}

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const { isAutopilot } = useDashboardMode();
  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  if (isAutopilot) {
    return <AutopilotDashboard firstName={firstName} />;
  }

  /* Agentic mode — render Cortex workspace (same as /dashboard/chat) */
  return <AgenticWorkspace agentId="cortex" />;
}

/* ═══════════════════════════════════════════════════════
   CHROME EXTENSION BANNER
   ═══════════════════════════════════════════════════════ */
function ExtensionBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('3box_ext_banner_dismissed')) setDismissed(true);
    } catch {}
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem('3box_ext_banner_dismissed', '1'); } catch {}
  };

  return (
    <div className="mt-4 p-4 rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
        <Chrome className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-apply on LinkedIn, Indeed, Naukri & more</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Install the 3BOX Chrome Extension to apply directly on job portals with one click.</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/extension-auth"
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
        >
          Get Extension
        </Link>
        <button onClick={dismiss} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   AUTOPILOT DASHBOARD — Clean, minimal overview
   ═══════════════════════════════════════════════════════ */
function AutopilotDashboard({ firstName }: { firstName: string }) {
  const [showWizard, setShowWizard] = useState(false);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [bulkToggling, setBulkToggling] = useState(false);
  const [resumeVerified, setResumeVerified] = useState(false);

  const activeCount = profiles.filter(p => p.active).length;
  const totalFound = profiles.reduce((sum, p) => sum + p.jobsFound, 0);
  const totalApplied = profiles.reduce((sum, p) => sum + p.appliedCount, 0);
  const hasProfiles = profiles.length > 0;
  const allPaused = hasProfiles && activeCount === 0;
  // Auto-apply is truly active only when resume is verified AND pipelines are running
  const isActive = activeCount > 0 && resumeVerified;
  const needsSetup = activeCount > 0 && !resumeVerified;

  const fetchProfiles = useCallback(() => {
    fetch('/api/user/loops')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.profiles) setProfiles(data.profiles);
        setLoadingProfiles(false);
      })
      .catch(() => setLoadingProfiles(false));
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  // Check resume verification status
  useEffect(() => {
    fetch('/api/user/resume')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.isFinalized) setResumeVerified(true); })
      .catch(() => {});
  }, []);

  const toggleProfile = async (id: string, active: boolean) => {
    setTogglingId(id);
    try {
      await fetch(`/api/user/loops/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      });
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
    } catch {}
    setTogglingId(null);
  };

  const bulkToggle = async (action: 'pause_all' | 'resume_all') => {
    setBulkToggling(true);
    try {
      const res = await fetch('/api/user/loops', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.profiles) setProfiles(data.profiles);
      }
    } catch {}
    setBulkToggling(false);
  };

  const deleteProfile = async (id: string) => {
    try {
      await fetch(`/api/user/loops/${id}`, { method: 'DELETE' });
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {firstName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here&apos;s what your 3BOX is doing for you.
          </p>
        </div>
        {hasProfiles && (
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Pipeline
          </button>
        )}
      </div>

      {/* ═══ AUTO-APPLY STATUS BANNER ═══ */}
      {!loadingProfiles && (
        <>
          {isActive && (
            <div className="mb-6 p-4 rounded-xl border border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-green-800 dark:text-green-300">Auto-Apply is Active</p>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400/70 mt-0.5">
                      {activeCount} pipeline{activeCount !== 1 ? 's' : ''} running — {totalFound} jobs found, {totalApplied} applied
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => bulkToggle('pause_all')}
                  disabled={bulkToggling}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                >
                  {bulkToggling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                  Pause All
                </button>
              </div>
            </div>
          )}

          {needsSetup && (
            <div className="mb-6 p-4 rounded-xl border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">Auto-Apply Needs Setup</p>
                    <p className="text-xs text-red-600 dark:text-red-400/70 mt-0.5">
                      Verify your resume before auto-apply can start sending applications.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/resume"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 dark:border-red-500/30 bg-white dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
                >
                  Verify Resume
                </Link>
              </div>
            </div>
          )}

          {allPaused && (
            <div className="mb-6 p-4 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                    <Pause className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Auto-Apply is Paused</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400/70 mt-0.5">
                      {profiles.length} pipeline{profiles.length !== 1 ? 's' : ''} paused — resume to continue searching & applying
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => bulkToggle('resume_all')}
                  disabled={bulkToggling}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors"
                >
                  {bulkToggling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Resume All
                </button>
              </div>
            </div>
          )}

          {!hasProfiles && (
            <div className="mb-6 p-6 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Start Auto-Applying to Jobs</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
                Set up your pipeline in 3 simple steps: verify your resume, choose your target role, and let AI agents search & apply automatically.
              </p>
              <button
                onClick={() => setShowWizard(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Power className="w-4 h-4" />
                Set Up Auto-Apply
              </button>
            </div>
          )}
        </>
      )}

      <StatsCards />

      {/* 3BOX Status Strip */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Link href="/dashboard/resume" className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-500/20 bg-white dark:bg-gray-900 hover:border-blue-400 dark:hover:border-blue-500/40 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border-2 border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <FileEdit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400/70">Box 1</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Profile</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Resume, LinkedIn & Interview Prep</p>
        </Link>

        <Link href="/dashboard/jobs" className="p-4 rounded-xl border-2 border-green-200 dark:border-green-500/20 bg-white dark:bg-gray-900 hover:border-green-400 dark:hover:border-green-500/40 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border-2 border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-green-500 dark:text-green-400/70">Box 2</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Job Hunt</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Search, match & discover opportunities</p>
        </Link>

        <Link href="/dashboard/applications" className="p-4 rounded-xl border-2 border-purple-200 dark:border-purple-500/20 bg-white dark:bg-gray-900 hover:border-purple-400 dark:hover:border-purple-500/40 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border-2 border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-500 dark:text-purple-400/70">Box 3</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Apply</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Auto-apply & track applications</p>
        </Link>
      </div>

      {/* Chrome Extension CTA */}
      <ExtensionBanner />

      {/* Search Profiles / Pipelines section */}
      {(hasProfiles || loadingProfiles) && (
        <div className="mt-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Your 3BOX Pipelines
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {activeCount} active of {profiles.length}
              </span>
              {profiles.length > 1 && (
                <button
                  onClick={() => bulkToggle(isActive ? 'pause_all' : 'resume_all')}
                  disabled={bulkToggling}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                >
                  {bulkToggling ? '...' : isActive ? 'Pause all' : 'Resume all'}
                </button>
              )}
            </div>
          </div>

          {loadingProfiles ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-all',
                    profile.active
                      ? 'border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60',
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      profile.active
                        ? 'bg-blue-100 dark:bg-blue-500/10'
                        : 'bg-gray-200 dark:bg-gray-700',
                    )}>
                      <Search className={cn(
                        'w-4 h-4',
                        profile.active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400',
                      )} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{profile.jobTitle}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {profile.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {profile.location}
                          </span>
                        )}
                        <span>{profile.jobsFound} found</span>
                        <span>{profile.appliedCount} applied</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleProfile(profile.id, profile.active)}
                      disabled={togglingId === profile.id}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        profile.active
                          ? 'hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-500 hover:text-amber-600'
                          : 'hover:bg-green-50 dark:hover:bg-green-500/10 text-green-500 hover:text-green-600',
                      )}
                      title={profile.active ? 'Pause pipeline' : 'Resume pipeline'}
                    >
                      {togglingId === profile.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : profile.active ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteProfile(profile.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete pipeline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <QuickActions />
          <RecentActivity />
        </div>
        <div className="space-y-6">
          <ApplicationLimitBar />
        </div>
      </div>

      {/* Search Profile Wizard Modal */}
      {showWizard && (
        <SearchProfileWizard
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false);
            fetchProfiles();
          }}
        />
      )}
    </div>
  );
}
