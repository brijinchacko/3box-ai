'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CortexLoader from '@/components/brand/CortexLoader';

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
  const [, setUserData] = useState<UserData | null>(null);

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

  if (status === 'loading') {
    return <CortexLoader fullScreen message="Waking up your agents" size="lg" />;
  }

  return (
    <div className="min-h-screen bg-surface">
      {children}
    </div>
  );
}
