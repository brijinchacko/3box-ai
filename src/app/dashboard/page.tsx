'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import AgenticWorkspace from '@/components/dashboard/shared/AgenticWorkspace';
import { Plus, Search, MapPin, Pause, Play, Trash2, Loader2, FileEdit, Mic, Target, CheckCircle2, Sparkles, ArrowRight, Clock, Chrome, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* ── Autopilot imports ── */
import StatsCards from '@/components/dashboard/overview/StatsCards';
import QuickActions from '@/components/dashboard/overview/QuickActions';
import RecentActivity from '@/components/dashboard/overview/RecentActivity';
import ApplicationLimitBar from '@/components/dashboard/shared/ApplicationLimitBar';
import SearchProfileWizard from '@/components/dashboard/jobs/SearchProfileWizard';
import { useFeatureGate } from '@/hooks/useFeatureGate';

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
   USAGE BANNER — Compact inline quota strip
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

function UsageBanner() {
  const { isLocked, loading, plan, used, limit, remaining, limitType } = useFeatureGate();

  if (loading) return null;

  const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const barColor = isLocked ? 'bg-red-500' : percent >= 90 ? 'bg-red-500' : percent >= 60 ? 'bg-amber-500' : 'bg-blue-500';
  const periodLabel = limitType === 'lifetime' ? 'total' : 'today';

  if (isLocked) {
    return (
      <div className="mb-4 flex items-center gap-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
        <span className="text-xs font-semibold text-red-600 dark:text-red-400">Quota exhausted</span>
        <div className="flex-1 bg-red-200 dark:bg-red-500/20 rounded-full h-1.5">
          <div className="h-1.5 rounded-full bg-red-500 w-full" />
        </div>
        <Link href="/pricing" className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline whitespace-nowrap flex items-center gap-1">
          Upgrade <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <span className={cn(
        'text-[10px] font-bold px-1.5 py-0.5 rounded',
        plan === 'FREE' ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          : plan === 'PRO' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
            : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
      )}>
        {plan}
      </span>
      <span className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">{used}/{limit} {periodLabel}</span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
        <div className={cn('h-1.5 rounded-full transition-all duration-500', barColor)} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
      {plan === 'FREE' && (
        <Link href="/pricing" className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap flex items-center gap-1">
          Upgrade <ArrowRight className="w-3 h-3" />
        </Link>
      )}
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

  const deleteProfile = async (id: string) => {
    try {
      await fetch(`/api/user/loops/${id}`, { method: 'DELETE' });
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <UsageBanner />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {firstName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here&apos;s what your 3BOX is doing for you.
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Your 3BOX
        </button>
      </div>

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

      {/* Search Profiles section */}
      {(profiles.length > 0 || loadingProfiles) && (
        <div className="mt-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Your 3BOX Pipelines
            </h3>
            <span className="text-xs text-gray-400">
              {profiles.filter(p => p.active).length} active
            </span>
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
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title={profile.active ? 'Pause' : 'Resume'}
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
                      title="Delete"
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
