'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserMenu from '@/components/dashboard/UserMenu';
import CortexLoader from '@/components/brand/CortexLoader';
import Logo from '@/components/brand/Logo';
import { type PlanTier } from '@/lib/agents/permissions';
import { getInitials } from '@/lib/utils';

const planBadges: Record<string, { label: string; color: string }> = {
  BASIC:   { label: 'Free',    color: 'text-white/40 bg-white/5' },
  STARTER: { label: 'Starter', color: 'text-neon-green bg-neon-green/10' },
  PRO:     { label: 'Pro',     color: 'text-neon-blue bg-neon-blue/10' },
  ULTRA:   { label: 'Ultra',   color: 'text-neon-purple bg-neon-purple/10' },
};

interface UserData {
  name: string | null;
  email: string | null;
  plan: string;
  onboardingDone: boolean;
  image?: string | null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/profile')
        .then(res => res.ok ? res.json() : null)
        .then(async (data) => {
          if (data) {
            setUserData(data);
            if (!data.onboardingDone) {
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
          }
        })
        .catch(() => {});
    }
  }, [status, pathname, router]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const userPlan = (userData?.plan || (session?.user as any)?.plan || 'BASIC') as PlanTier;
  const userName = userData?.name || session?.user?.name || 'User';
  const initials = getInitials(userName);
  const badge = planBadges[userPlan] || planBadges.BASIC;

  if (status === 'loading') {
    return <CortexLoader fullScreen message="Waking up your agents" size="lg" />;
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-white/5 bg-surface/90 backdrop-blur-xl">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/dashboard">
            <Logo size="sm" />
          </Link>
          <UserMenu
            userName={userName}
            userEmail={userData?.email}
            userImage={userData?.image}
            initials={initials}
            planBadge={badge}
            collapsed={false}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
