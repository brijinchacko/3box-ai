'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Menu, X, ChevronLeft, Crown, Zap, Star, Lock } from 'lucide-react';
import UserMenu from '@/components/dashboard/UserMenu';
import AgentStatusBadge from '@/components/dashboard/AgentStatusBadge';
import AutomationModeSelector from '@/components/dashboard/AutomationModeSelector';
import TokenCounter from '@/components/dashboard/TokenCounter';
import NotificationCenter from '@/components/dashboard/NotificationCenter';
import BackgroundTaskBanner from '@/components/dashboard/BackgroundTaskBanner';
import CareerJourneyBar, { type JourneyProgress } from '@/components/dashboard/CareerJourneyBar';
import CortexLoader from '@/components/brand/CortexLoader';
import Logo from '@/components/brand/Logo';
import AgentAvatar from '@/components/brand/AgentAvatar';
import CortexAvatar from '@/components/brand/CortexAvatar';
import { AGENTS, AGENT_LIST, type AgentId } from '@/lib/agents/registry';
import { getAgentsWithStatus, type PlanTier } from '@/lib/agents/permissions';
import { useLiveAgentStatus } from '@/hooks/useLiveAgentStatus';
import { getInitials } from '@/lib/utils';

/* ── Agent-based sidebar links ── */
const sidebarAgents: { agentId: AgentId | 'cortex'; href: string; label: string; sublabel: string }[] = [
  { agentId: 'cortex',   href: '/dashboard',           label: 'Cortex',   sublabel: 'Command Center' },
  { agentId: 'scout',    href: '/dashboard/jobs',      label: 'Scout',    sublabel: 'Job Hunter' },
  { agentId: 'forge',    href: '/dashboard/resume',    label: 'Forge',    sublabel: 'Resume Builder' },
  { agentId: 'archer',   href: '/dashboard/jobs?tab=applications', label: 'Archer',   sublabel: 'Applications' },
  { agentId: 'atlas',    href: '/dashboard/interview', label: 'Atlas',    sublabel: 'Interview Prep' },
  { agentId: 'sage',     href: '/dashboard/learning',  label: 'Sage',     sublabel: 'Skill Trainer' },
  { agentId: 'sentinel', href: '/dashboard/quality',   label: 'Sentinel', sublabel: 'Quality Check' },
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
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  onboardingDone: boolean;
  targetRole?: string;
  location?: string;
  image?: string | null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [journey, setJourney] = useState<JourneyProgress | null>(null);
  const [activeMode, setActiveMode] = useState<string>('copilot');

  // Listen for automation mode changes from the selector
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('3box_automation_mode') : null;
    if (saved) setActiveMode(saved);

    const handler = (e: Event) => {
      const mode = (e as CustomEvent).detail;
      if (mode) setActiveMode(mode);
    };
    window.addEventListener('automation-mode-change', handler);
    return () => window.removeEventListener('automation-mode-change', handler);
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/profile')
        .then(res => res.ok ? res.json() : null)
        .then(async (data) => {
          if (data) {
            setUserData(data);
            if (data.journey) setJourney(data.journey);
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

  // Determine which agents are locked
  const agentStatus = useMemo(() => {
    const statusMap = new Map<string, boolean>();
    const agents = getAgentsWithStatus(userPlan);
    agents.forEach(a => statusMap.set(a.id, a.locked));
    return statusMap;
  }, [userPlan]);

  const isAgentLocked = (agentId: AgentId | 'cortex') => {
    if (agentId === 'cortex') return false; // Cortex is always free
    return agentStatus.get(agentId) ?? true;
  };

  // Agent operational status (working / idle / sleeping)
  const agentOpStatus = useLiveAgentStatus(userPlan);

  if (status === 'loading') {
    return <CortexLoader fullScreen message="Waking up your agents" size="lg" />;
  }

  const renderAgentLink = (item: typeof sidebarAgents[0], onClick?: () => void) => {
    const [hrefPath, hrefQuery] = item.href.split('?');
    const active = hrefPath === '/dashboard'
      ? pathname === '/dashboard'
      : hrefQuery
        ? pathname.startsWith(hrefPath) && searchParams.get('tab') === new URLSearchParams(hrefQuery).get('tab')
        : pathname.startsWith(hrefPath) && !searchParams.get('tab');
    const locked = isAgentLocked(item.agentId);
    const isCortex = item.agentId === 'cortex';

    return (
      <Link
        key={item.href}
        href={item.href}
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
          <CortexAvatar size={sidebarOpen ? 28 : 32} />
        ) : (
          <AgentAvatar agentId={item.agentId as AgentId} size={sidebarOpen ? 28 : 32} sleeping={locked} />
        )}
        {sidebarOpen && (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate">{item.label}</span>
              {!isCortex && (
                <AgentStatusBadge
                  status={agentOpStatus[item.agentId as AgentId] || 'sleeping'}
                  size="sm"
                  showLabel={false}
                />
              )}
            </div>
            <div className="text-[10px] text-white/25 truncate">{item.sublabel}</div>
          </div>
        )}
      </Link>
    );
  };

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
            {sidebarOpen ? <Logo size="sm" /> : <Logo size="sm" showText={false} />}
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40">
            <ChevronLeft className={`w-4 h-4 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Agent Nav — grouped by active / available */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {/* Cortex is always first */}
          {renderAgentLink(sidebarAgents[0])}

          {/* Active Agents */}
          {(() => {
            const active = sidebarAgents.filter(i => i.agentId !== 'cortex' && !isAgentLocked(i.agentId));
            if (!active.length) return null;
            return (
              <div className="mt-4">
                {sidebarOpen && (
                  <div className="text-[10px] uppercase tracking-wider text-white/20 px-3 mb-2 font-semibold">Active Agents</div>
                )}
                <div className="space-y-1">
                  {active.map(item => renderAgentLink(item))}
                </div>
              </div>
            );
          })()}

        </nav>

        {/* Sleeping / Not-yet-hired Agents — pinned above profile */}
        {(() => {
          const locked = sidebarAgents.filter(i => i.agentId !== 'cortex' && isAgentLocked(i.agentId));
          if (!locked.length) return null;
          return (
            <div className="px-3 py-2 border-t border-white/5">
              {sidebarOpen && (
                <div className="text-[10px] uppercase tracking-wider text-white/15 px-3 mb-2 font-semibold">Available to Hire</div>
              )}
              <div className="space-y-1 opacity-50">
                {locked.map(item => renderAgentLink(item))}
              </div>
            </div>
          );
        })()}

        {/* Bottom: User Menu */}
        <div className="p-3 border-t border-white/5">
          <UserMenu
            userName={userName}
            userEmail={userData?.email}
            userImage={userData?.image}
            initials={initials}
            planBadge={badge}
            collapsed={!sidebarOpen}
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
              <nav className="py-4 px-3">
                {renderAgentLink(sidebarAgents[0], () => setMobileOpen(false))}
                {(() => {
                  const active = sidebarAgents.filter(i => i.agentId !== 'cortex' && !isAgentLocked(i.agentId));
                  if (!active.length) return null;
                  return (
                    <div className="mt-4">
                      <div className="text-[10px] uppercase tracking-wider text-white/20 px-3 mb-2 font-semibold">Active Agents</div>
                      <div className="space-y-1">
                        {active.map(item => renderAgentLink(item, () => setMobileOpen(false)))}
                      </div>
                    </div>
                  );
                })()}
              </nav>
              {/* Sleeping agents — pinned above profile */}
              {(() => {
                const locked = sidebarAgents.filter(i => i.agentId !== 'cortex' && isAgentLocked(i.agentId));
                if (!locked.length) return null;
                return (
                  <div className="px-3 py-2 border-t border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-white/15 px-3 mb-2 font-semibold">Available to Hire</div>
                    <div className="space-y-1 opacity-50">
                      {locked.map(item => renderAgentLink(item, () => setMobileOpen(false)))}
                    </div>
                  </div>
                );
              })()}
              {/* Mobile User Menu */}
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
      <main className={`flex-1 min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} pt-14 lg:pt-0`}>
        {/* Top Bar — Mode Selector */}
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 lg:px-8 pt-3 pb-1">
          <TokenCounter />
          <AutomationModeSelector />
          <NotificationCenter />
        </div>

        {/* Mode accent line — subtle color strip that reflects the active automation mode */}
        <div className={`h-[2px] mx-4 sm:mx-6 lg:mx-8 rounded-full transition-all duration-500 ${
          activeMode === 'copilot'
            ? 'bg-gradient-to-r from-blue-500/40 via-blue-400/20 to-transparent'
            : activeMode === 'autopilot'
              ? 'bg-gradient-to-r from-amber-500/40 via-amber-400/20 to-transparent'
              : 'bg-gradient-to-r from-neon-green/40 via-neon-green/20 to-transparent'
        }`} />

        <BackgroundTaskBanner />

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
