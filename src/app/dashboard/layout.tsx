'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Menu, X, Lock } from 'lucide-react';
import UserMenu from '@/components/dashboard/UserMenu';
import CortexLoader from '@/components/brand/CortexLoader';
import Logo from '@/components/brand/Logo';
import AgentAvatar from '@/components/brand/AgentAvatar';
import CortexAvatar from '@/components/brand/CortexAvatar';
import { type AgentId } from '@/lib/agents/registry';
import { getAgentsWithStatus, type PlanTier } from '@/lib/agents/permissions';
import { getInitials } from '@/lib/utils';

/* ── Sidebar agent links ── */
const sidebarAgents: { agentId: AgentId | 'cortex'; href: string; label: string; sublabel: string }[] = [
  { agentId: 'cortex',   href: '/dashboard',              label: 'Cortex',   sublabel: 'Command Center' },
  { agentId: 'scout',    href: '/dashboard/jobs',         label: 'Scout',    sublabel: 'Job Hunter' },
  { agentId: 'forge',    href: '/dashboard/resume',       label: 'Forge',    sublabel: 'Resume Builder' },
  { agentId: 'archer',   href: '/dashboard/applications', label: 'Archer',   sublabel: 'Applications' },
  { agentId: 'atlas',    href: '/dashboard/interview',    label: 'Atlas',    sublabel: 'Interview Prep' },
  { agentId: 'sage',     href: '/dashboard/learning',     label: 'Sage',     sublabel: 'Skill Trainer' },
  { agentId: 'sentinel', href: '/dashboard/quality',      label: 'Sentinel', sublabel: 'Quality Check' },
];

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
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const agentStatus = useMemo(() => {
    const statusMap = new Map<string, boolean>();
    const agents = getAgentsWithStatus(userPlan);
    agents.forEach(a => statusMap.set(a.id, a.locked));
    return statusMap;
  }, [userPlan]);

  const isAgentLocked = (agentId: AgentId | 'cortex') => {
    if (agentId === 'cortex') return false;
    return agentStatus.get(agentId) ?? true;
  };

  if (status === 'loading') {
    return <CortexLoader fullScreen message="Waking up your agents" size="lg" />;
  }

  const renderAgentLink = (item: typeof sidebarAgents[0], onClick?: () => void) => {
    const active = item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(item.href);
    const locked = isAgentLocked(item.agentId);
    const isCortex = item.agentId === 'cortex';

    return (
      <Link
        key={item.href}
        href={locked ? '/pricing' : item.href}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? 'bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 text-white border border-white/10'
            : locked
              ? 'text-white/25 hover:text-white/40 hover:bg-white/[0.02]'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
        }`}
      >
        {isCortex ? (
          <CortexAvatar size={28} />
        ) : (
          <AgentAvatar agentId={item.agentId as AgentId} size={28} sleeping={locked} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate">{item.label}</span>
            {locked && <Lock className="w-3 h-3 text-white/20 flex-shrink-0" />}
          </div>
          <div className="text-[10px] text-white/25 truncate">{item.sublabel}</div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 w-64 border-r border-white/5 bg-surface-50">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
        </div>

        {/* Agent Nav — flat list */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          {sidebarAgents.map(item => renderAgentLink(item))}
        </nav>

        {/* Bottom: User Menu */}
        <div className="p-3 border-t border-white/5">
          <UserMenu
            userName={userName}
            userEmail={userData?.email}
            userImage={userData?.image}
            initials={initials}
            planBadge={badge}
            collapsed={false}
          />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-white/5 bg-surface/90 backdrop-blur-xl flex items-center justify-between px-4">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/5">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard"><Logo size="sm" /></Link>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
      </div>

      {/* Mobile Sidebar */}
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
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="py-4 px-3 space-y-1">
                {sidebarAgents.map(item => renderAgentLink(item, () => setMobileOpen(false)))}
              </nav>
              <div className="mt-auto p-3 border-t border-white/5">
                <UserMenu
                  userName={userName}
                  userEmail={userData?.email}
                  userImage={userData?.image}
                  initials={initials}
                  planBadge={badge}
                  collapsed={false}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-h-screen lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
