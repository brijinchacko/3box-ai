'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard, Brain, Target, BookOpen, FileText,
  Briefcase, Mic, FolderOpen, Settings, Menu, X, ChevronLeft,
  Crown, Zap, Star, Gift, AlertTriangle
} from 'lucide-react';
import FloatingCoach from '@/components/ai-coach/FloatingCoach';
import Logo from '@/components/brand/Logo';
import { getInitials, getCreditUsagePercent } from '@/lib/utils';

const sidebarLinks = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/assessment', icon: Brain, label: 'Assessment' },
  { href: '/dashboard/career-plan', icon: Target, label: 'Career Plan' },
  { href: '/dashboard/learning', icon: BookOpen, label: 'Learning Path' },
  { href: '/dashboard/resume', icon: FileText, label: 'Resume Builder' },
  { href: '/dashboard/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/dashboard/interview', icon: Mic, label: 'Interview Prep' },
  { href: '/dashboard/portfolio', icon: FolderOpen, label: 'Portfolio' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  { href: '/dashboard/settings?tab=referral', icon: Gift, label: 'Refer & Earn' },
];

const planBadges: Record<string, { label: string; color: string; icon: typeof Star }> = {
  BASIC: { label: 'Basic', color: 'text-white/40 bg-white/5', icon: Star },
  STARTER: { label: 'Starter', color: 'text-neon-green bg-neon-green/10', icon: Star },
  PRO: { label: 'Pro', color: 'text-neon-blue bg-neon-blue/10', icon: Zap },
  ULTRA: { label: 'Ultra', color: 'text-neon-purple bg-neon-purple/10', icon: Crown },
};

interface UserData {
  name: string | null;
  email: string | null;
  plan: string;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  onboardingDone: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showUpgradeNudge, setShowUpgradeNudge] = useState(true);

  // Fetch user data and auto-save onboarding from localStorage if available
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/profile')
        .then(res => res.ok ? res.json() : null)
        .then(async (data) => {
          if (data) {
            setUserData(data);

            // If onboarding not done but localStorage has data, auto-save it
            if (!data.onboardingDone) {
              const profileStr = localStorage.getItem('nxted_onboarding_profile');
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
                    // Refresh to show updated data
                    window.location.reload();
                    return;
                  }
                } catch {}
              }
              // No localStorage data — redirect to onboarding
              if (pathname !== '/dashboard/onboarding') {
                router.push('/dashboard/onboarding');
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [status, pathname, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const userPlan = userData?.plan || (session?.user as any)?.plan || 'BASIC';
  const userName = userData?.name || session?.user?.name || 'User';
  const userEmail = userData?.email || session?.user?.email || '';
  const creditsUsed = userData?.aiCreditsUsed || 0;
  const creditsLimit = userData?.aiCreditsLimit || 10;
  const creditPercent = getCreditUsagePercent(creditsUsed, creditsLimit);
  const initials = getInitials(userName);

  const badge = planBadges[userPlan] || planBadges.BASIC;

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Logo size="lg" />
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 border-r border-white/5 bg-surface-50 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2">
            {sidebarOpen ? (
              <Logo size="sm" />
            ) : (
              <Logo size="sm" showText={false} />
            )}
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40">
            <ChevronLeft className={`w-4 h-4 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href.split('?')[0]) && link.href !== '/dashboard/settings?tab=referral');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 text-white border border-white/10'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <link.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-neon-blue' : ''}`} />
                {sidebarOpen && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Credit Usage + User */}
        <div className="p-3 border-t border-white/5">
          {/* Credit Usage */}
          {sidebarOpen && creditsLimit !== -1 && (
            <div className="mb-3 px-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/40">AI Credits</span>
                <span className={creditPercent > 80 ? 'text-red-400' : 'text-white/60'}>
                  {creditsUsed}/{creditsLimit}
                </span>
              </div>
              <div className="skill-bar h-1.5">
                <div
                  className={`skill-bar-fill ${creditPercent > 80 ? 'bg-red-400' : creditPercent > 50 ? 'bg-yellow-400' : 'bg-neon-green'}`}
                  style={{ width: `${creditPercent}%` }}
                />
              </div>
              {creditPercent > 80 && (
                <a href="/pricing#credits" className="text-[10px] text-red-400 hover:text-red-300 mt-1 block">
                  Buy more credits
                </a>
              )}
            </div>
          )}

          {sidebarOpen && (
            <div className="mb-3 px-3">
              <span className={`badge text-xs ${badge.color}`}>
                <badge.icon className="w-3 h-3 mr-1" /> {badge.label} Plan
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{userName}</div>
                <div className="text-xs text-white/30 truncate">{userEmail}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-white/5 bg-surface/90 backdrop-blur-xl flex items-center justify-between px-4">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/5">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard">
          <Logo size="sm" />
        </Link>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-surface-50 border-r border-white/5"
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
                <Logo size="sm" />
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
              </div>
              <nav className="py-4 px-3 space-y-1">
                {sidebarLinks.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
                      <link.icon className={`w-5 h-5 ${active ? 'text-neon-blue' : ''}`} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} pt-14 lg:pt-0`}>
        {/* Upgrade nudge for Basic users */}
        {userPlan === 'BASIC' && showUpgradeNudge && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-3 rounded-xl bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 border border-neon-blue/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-neon-blue flex-shrink-0" />
              <p className="text-sm text-white/70">
                You&apos;re on the free plan with limited features.{' '}
                <Link href="/pricing" className="text-neon-blue hover:underline font-medium">Upgrade now</Link>
                {' '}to unlock your full career potential.
              </p>
            </div>
            <button onClick={() => setShowUpgradeNudge(false)} className="text-white/30 hover:text-white/60 flex-shrink-0 ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Floating AI Coach */}
      <FloatingCoach />
    </div>
  );
}
