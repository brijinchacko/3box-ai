'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import AgenticWorkspace from '@/components/dashboard/shared/AgenticWorkspace';
import { Plus, Search, MapPin, Pause, Play, Trash2, Loader2 } from 'lucide-react';
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {firstName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here&apos;s what&apos;s happening with your job search.
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Search Profile
        </button>
      </div>

      <StatsCards />

      {/* Search Profiles section */}
      {(profiles.length > 0 || loadingProfiles) && (
        <div className="mt-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Active Search Profiles
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
