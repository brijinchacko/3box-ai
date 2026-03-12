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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAgentic } = useDashboardMode();
  const { isLocked, loading: gateLoading, used, limit } = useFeatureGate();
  const onboardingChecked = useRef(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
      <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
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
        {children}
      </main>

      {/* Feature lock overlay for FREE users who exhausted their applications */}
      {isLocked && <FeatureLockedOverlay used={used} limit={limit} />}
    </div>
  );
}
