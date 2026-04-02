'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CortexLoader from '@/components/brand/CortexLoader';
import Sidebar from '@/components/dashboard/layout/Sidebar';
import MobileNav from '@/components/dashboard/layout/MobileNav';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import FeatureLockedOverlay from '@/components/dashboard/shared/FeatureLockedOverlay';
import DashboardStatusBar from '@/components/dashboard/layout/DashboardStatusBar';
import NextStepBanner from '@/components/dashboard/shared/NextStepBanner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import dynamic from 'next/dynamic';

const FloatingCoach = dynamic(() => import('@/components/ai-coach/FloatingCoach'), { ssr: false });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAgentic } = useDashboardMode();
  const { isLocked, loading: gateLoading, used, limit } = useFeatureGate();
  const [lockDismissed, setLockDismissed] = useState(false);
  const onboardingChecked = useRef(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ── Clear stale localStorage if user account changed ── */
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;
    const userId = (session.user as any).id;
    if (!userId) return;
    const storedUserId = localStorage.getItem('3box_current_user_id');
    if (storedUserId && storedUserId !== userId) {
      // Different account logged in (even if same email) — clear stale data
      const keysToClean = [
        '3box-resume-builder-data-v2', '3box-resume-builder-data',
        '3box-free-downloads', '3box_resume_data', '3box_onboarding_profile',
        '3box_target_role', '3box-search-history', '3box-search-results',
        '3box_tour_completed', '3box_nextstep_dismissed', '3box_current_user',
        '3box_portfolio_projects', '3box-fdl',
      ];
      keysToClean.forEach(key => localStorage.removeItem(key));
    }
    localStorage.setItem('3box_current_user_id', userId);
    localStorage.setItem('3box_current_user', session.user.email || '');
  }, [status, session?.user]);

  /* ── Onboarding check: use session.onboardingDone first, fallback to API ── */
  useEffect(() => {
    if (status !== 'authenticated' || onboardingChecked.current) return;
    onboardingChecked.current = true;

    const onboardingDone = (session?.user as any)?.onboardingDone;
    if (onboardingDone) return;

    fetch('/api/user/profile')
      .then(res => res.ok ? res.json() : null)
      .then(async (data) => {
        if (data && !data.onboardingDone) {
          const profileStr = localStorage.getItem('3box_onboarding_profile');
          if (profileStr) {
            try {
              const profile = JSON.parse(profileStr);
              if (profile.targetRole) {
                await fetch('/api/user/onboarding', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    targetRole: profile.targetRole,
                    interests: profile.skills?.slice(0, 5) || [],
                    profile: {
                      fullName: profile.fullName || data.name || '',
                      phone: profile.phone || '',
                      location: profile.location || '',
                      linkedin: profile.linkedin || '',
                      experienceLevel: profile.experienceLevel || '',
                      currentStatus: profile.currentStatus || '',
                      experiences: profile.experiences || [],
                      educationLevel: profile.educationLevel || '',
                      fieldOfStudy: profile.fieldOfStudy || '',
                      institution: profile.institution || '',
                      graduationYear: profile.graduationYear || '',
                      skills: profile.skills || [],
                      bio: profile.bio || '',
                    },
                  }),
                });
                window.location.reload();
                return;
              }
            } catch {}
          }
          if (pathname !== '/dashboard/onboarding') {
            router.push('/dashboard/onboarding');
          }
        }
      })
      .catch(() => {});
  }, [status, session, pathname, router]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (status === 'loading') {
    return <CortexLoader fullScreen message="Waking up your agents" size="lg" />;
  }

  // Onboarding page gets full screen (no sidebar)
  if (pathname === '/dashboard/onboarding') {
    return (
      <div className="min-h-screen overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {children}
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isAgentic ? 'bg-[#0a0a0f]' : 'bg-gray-50 dark:bg-gray-950'}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <MobileNav onOpen={() => setMobileOpen(true)} />
      <main className={`flex-1 overflow-auto pt-14 lg:pt-0 ${isAgentic ? 'text-white' : ''}`}>
        <DashboardStatusBar />
        <NextStepBanner />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Cortex AI Coach — removed per user request. Code kept in /components/ai-coach/ */}

      {/* Feature lock overlay for FREE users who exhausted their applications */}
      {isLocked && !lockDismissed && <FeatureLockedOverlay used={used} limit={limit} onDismiss={() => setLockDismissed(true)} />}
    </div>
  );
}
