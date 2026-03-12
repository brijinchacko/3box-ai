'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Search,
  Columns3,
  ListFilter,
  FileText,
  FileEdit,
  Mic,
  Globe,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Zap,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import UserMenu from '../UserMenu';
import { normalizePlan, PLAN_PRICING } from '@/lib/tokens/pricing';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import AgentAvatar from '@/components/brand/AgentAvatar';
import CortexAvatar from '@/components/brand/CortexAvatar';
import Logo from '@/components/brand/Logo';
import type { AgentId } from '@/lib/agents/registry';

/* ── Autopilot: standalone top item ──────────────────── */
const AUTOPILOT_TOP = { label: 'Overview', href: '/dashboard', icon: LayoutDashboard };

/* ── Autopilot nav items (grouped into 3 boxes) ─────── */
const AUTOPILOT_NAV_GROUPS = [
  {
    category: 'BOX 1 — PROFILE',
    color: 'blue',
    activeBg: 'bg-blue-50 dark:bg-blue-500/10',
    activeText: 'text-blue-700 dark:text-blue-400',
    activeIcon: 'text-blue-600 dark:text-blue-400',
    headerText: 'text-blue-500 dark:text-blue-400/70',
    iconColor: 'text-blue-500 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconBorder: 'border-blue-200 dark:border-blue-500/20',
    items: [
      { label: 'Resume', href: '/dashboard/resume', icon: FileEdit },
      { label: 'Interview Prep', href: '/dashboard/interview', icon: Mic },
    ],
  },
  {
    category: 'BOX 2 — JOB HUNT',
    color: 'green',
    activeBg: 'bg-green-50 dark:bg-green-500/10',
    activeText: 'text-green-700 dark:text-green-400',
    activeIcon: 'text-green-600 dark:text-green-400',
    headerText: 'text-green-500 dark:text-green-400/70',
    iconColor: 'text-green-500 dark:text-green-400',
    iconBg: 'bg-green-50 dark:bg-green-500/10',
    iconBorder: 'border-green-200 dark:border-green-500/20',
    items: [
      { label: 'Job Search', href: '/dashboard/jobs', icon: Search },
      { label: 'Board', href: '/dashboard/board', icon: Columns3 },
      { label: 'All Matches', href: '/dashboard/matches', icon: ListFilter },
    ],
  },
  {
    category: 'BOX 3 — APPLY',
    color: 'purple',
    activeBg: 'bg-purple-50 dark:bg-purple-500/10',
    activeText: 'text-purple-700 dark:text-purple-400',
    activeIcon: 'text-purple-600 dark:text-purple-400',
    headerText: 'text-purple-500 dark:text-purple-400/70',
    iconColor: 'text-purple-500 dark:text-purple-400',
    iconBg: 'bg-purple-50 dark:bg-purple-500/10',
    iconBorder: 'border-purple-200 dark:border-purple-500/20',
    items: [
      { label: 'My Applications', href: '/dashboard/applications', icon: FileText },
    ],
  },
];

/* ── Agent entries for Agentic sidebar ────────────────── */
const SIDEBAR_AGENTS: { id: AgentId; name: string; role: string; colorHex: string; href: string }[] = [
  { id: 'scout',    name: 'Scout',    role: 'Job Hunter',          colorHex: '#3b82f6', href: '/dashboard/jobs' },
  { id: 'forge',    name: 'Forge',    role: 'Resume Optimizer',    colorHex: '#f97316', href: '/dashboard/resume' },
  { id: 'archer',   name: 'Archer',   role: 'Application Agent',   colorHex: '#22c55e', href: '/dashboard/agents' },
  { id: 'atlas',    name: 'Atlas',    role: 'Interview Coach',     colorHex: '#a855f7', href: '/dashboard/interview' },
  { id: 'sage',     name: 'Sage',     role: 'Skill Trainer',       colorHex: '#14b8a6', href: '/dashboard/learning' },
  { id: 'sentinel', name: 'Sentinel', role: 'Quality Reviewer',    colorHex: '#f43f5e', href: '/dashboard/quality' },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ collapsed = false, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { setMode, isAgentic } = useDashboardMode();

  const plan = normalizePlan((session?.user as any)?.plan || 'FREE');
  const planInfo = PLAN_PRICING[plan];
  const isFree = plan === 'FREE';
  const [showBetaWarning, setShowBetaWarning] = useState(false);

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  /* ── Mode switch with navigation ── */
  function switchToAutopilot() {
    if (!isAgentic) return;
    setMode('autopilot');
    router.push('/dashboard');
  }

  function switchToAgentic() {
    if (isAgentic) return;
    setShowBetaWarning(true);
  }

  function confirmAgentic() {
    setShowBetaWarning(false);
    setMode('agentic');
    router.push('/dashboard/chat');
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-200',
          isAgentic
            ? 'bg-[#0a0a0f] border-r border-white/[0.06]'
            : 'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
          collapsed ? 'w-16' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo / Brand */}
        <div className={cn(
          'flex items-center h-14 px-4',
          isAgentic ? 'border-b border-white/[0.06]' : 'border-b border-gray-100 dark:border-gray-800',
          collapsed ? 'justify-center' : 'justify-between',
        )}>
          <Link href="/dashboard" className="flex items-center">
            {collapsed ? (
              <Logo size="sm" showText={false} />
            ) : isAgentic ? (
              <Logo size="sm" variant="light" />
            ) : (
              <>
                <span className="block dark:hidden"><Logo size="sm" variant="dark" /></span>
                <span className="hidden dark:block"><Logo size="sm" variant="light" /></span>
              </>
            )}
          </Link>

          {/* Mobile close button */}
          <button onClick={onMobileClose} className={cn(
            'lg:hidden p-1 rounded',
            isAgentic ? 'hover:bg-white/[0.06] text-white/40' : 'hover:bg-gray-100 dark:hover:bg-gray-800',
          )}>
            <X className={cn('w-4 h-4', isAgentic ? 'text-white/40' : 'text-gray-500 dark:text-gray-400')} />
          </button>

          {/* Desktop collapse button */}
          <button
            onClick={() => onCollapse?.(!collapsed)}
            className={cn(
              'hidden lg:flex p-1 rounded',
              isAgentic ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100 dark:hover:bg-gray-800',
            )}
          >
            {collapsed ? (
              <ChevronRight className={cn('w-4 h-4', isAgentic ? 'text-white/30' : 'text-gray-400')} />
            ) : (
              <ChevronLeft className={cn('w-4 h-4', isAgentic ? 'text-white/30' : 'text-gray-400')} />
            )}
          </button>
        </div>

        {/* Mode toggle */}
        {!collapsed && (
          <div className={cn(
            'px-3 py-2.5',
            isAgentic ? 'border-b border-white/[0.06]' : 'border-b border-gray-100 dark:border-gray-800',
          )}>
            <div className={cn(
              'flex items-center rounded-lg p-0.5',
              isAgentic ? 'bg-white/[0.04]' : 'bg-gray-100 dark:bg-gray-800',
            )}>
              <button
                onClick={switchToAutopilot}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                  !isAgentic
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-white/40 hover:text-white/60',
                )}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Autopilot</span>
              </button>
              <button
                onClick={switchToAgentic}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                  isAgentic
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                )}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Agentic</span>
              </button>
            </div>
          </div>
        )}
        {collapsed && (
          <div className={cn(
            'px-2 py-2.5 flex justify-center',
            isAgentic ? 'border-b border-white/[0.06]' : 'border-b border-gray-100 dark:border-gray-800',
          )}>
            <button
              onClick={isAgentic ? switchToAutopilot : switchToAgentic}
              title={isAgentic ? 'Switch to Autopilot' : 'Switch to Agentic'}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isAgentic
                  ? 'bg-purple-500/10 text-purple-400'
                  : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
              )}
            >
              {isAgentic ? <Bot className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* ── AGENTIC MODE: Agent list ─────────────────────── */}
        {isAgentic ? (
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {/* Cortex Chat — top entry (uses CortexAvatar) */}
            <Link
              href="/dashboard/chat"
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1',
                isActive('/dashboard/chat')
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? 'Cortex Chat' : undefined}
            >
              <div className="relative shrink-0">
                <CortexAvatar size={collapsed ? 28 : 34} />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0a0a0f]" />
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-white/90">Cortex</span>
                  <span className="block text-[10px] text-white/30">AI Coordinator</span>
                </div>
              )}
            </Link>

            {/* Divider */}
            {!collapsed && (
              <div className="px-3 py-2">
                <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Your Team</span>
              </div>
            )}
            {collapsed && <div className="border-t border-white/[0.06] my-1" />}

            {/* Agent entries */}
            <div className="space-y-0.5">
              {SIDEBAR_AGENTS.map((agent) => {
                const active = isActive(agent.href);
                return (
                  <Link
                    key={agent.id}
                    href={agent.href}
                    onClick={onMobileClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                      active
                        ? 'bg-white/[0.06]'
                        : 'hover:bg-white/[0.03]',
                      collapsed && 'justify-center px-2',
                    )}
                    style={active ? { borderLeft: `2px solid ${agent.colorHex}` } : undefined}
                    title={collapsed ? agent.name : undefined}
                  >
                    <div className="relative shrink-0">
                      <AgentAvatar agentId={agent.id} size={collapsed ? 28 : 34} />
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0f]"
                        style={{ backgroundColor: `${agent.colorHex}80` }}
                      />
                    </div>
                    {!collapsed && (
                      <div className="min-w-0 flex-1">
                        <span className={cn(
                          'block text-xs font-semibold',
                          active ? 'text-white' : 'text-white/70',
                        )}>
                          {agent.name}
                        </span>
                        <span className="block text-[10px] text-white/25 truncate">{agent.role}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        ) : (
          /* ── AUTOPILOT MODE: Overview + 3 Box groups ────── */
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {/* Standalone Overview */}
            {(() => {
              const active = isActive(AUTOPILOT_TOP.href);
              return (
                <Link
                  href={AUTOPILOT_TOP.href}
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-3',
                    active
                      ? 'bg-gray-100 dark:bg-white/[0.06] text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                    collapsed && 'justify-center px-2',
                  )}
                  title={collapsed ? AUTOPILOT_TOP.label : undefined}
                >
                  <AUTOPILOT_TOP.icon className={cn('w-[18px] h-[18px] shrink-0', active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500')} />
                  {!collapsed && <span>{AUTOPILOT_TOP.label}</span>}
                </Link>
              );
            })()}

            {/* 3 Box groups */}
            {AUTOPILOT_NAV_GROUPS.map((group, idx) => (
              <div key={group.category} className="mb-2">
                {/* Separator line between groups */}
                {!collapsed && idx > 0 && (
                  <div className="mx-3 mb-2 border-t border-gray-100 dark:border-gray-800" />
                )}
                {!collapsed && (
                  <div className={cn('px-3 py-1 text-[8px] font-bold uppercase tracking-widest opacity-70', group.headerText)}>
                    {group.category}
                  </div>
                )}
                {collapsed && (
                  <div className="mx-auto my-1 w-6 border-t border-gray-200 dark:border-gray-700" />
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onMobileClose}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          active
                            ? `${group.activeBg} ${group.activeText}`
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                          collapsed && 'justify-center px-2',
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <div className={cn(
                          'w-7 h-7 rounded-md border flex items-center justify-center shrink-0',
                          active ? `${group.iconBg} ${group.iconBorder}` : `${group.iconBg} ${group.iconBorder} opacity-60`,
                        )}>
                          <item.icon className={cn('w-3.5 h-3.5', active ? group.activeIcon : group.iconColor)} />
                        </div>
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        )}

        {/* Bottom section */}
        <div className={cn(
          'py-2 px-2 space-y-0.5',
          isAgentic ? 'border-t border-white/[0.06]' : 'border-t border-gray-100 dark:border-gray-800',
        )}>
          {/* Upgrade CTA (FREE plan only) */}
          {isFree && !collapsed && (
            <Link
              href="/pricing"
              className="flex items-center gap-2 mx-1 mt-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              <span>Upgrade to Pro</span>
            </Link>
          )}

          {/* User section */}
          <div className={cn('mt-2 px-1', collapsed && 'flex justify-center')}>
            <UserMenu
              userName={session?.user?.name || 'User'}
              userEmail={session?.user?.email}
              userImage={session?.user?.image}
              initials={getInitials(session?.user?.name || 'U')}
              planBadge={{
                label: planInfo.name,
                color: isFree
                  ? isAgentic
                    ? 'text-white/40 bg-white/[0.06]'
                    : 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'
                  : plan === 'PRO'
                    ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/20'
                    : 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/20',
              }}
              collapsed={collapsed}
            />
          </div>
        </div>
      </aside>

      {/* Agentic Beta Warning Modal */}
      {showBetaWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Agentic Mode (Beta)</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Agentic mode is currently in <span className="font-semibold text-amber-600 dark:text-amber-400">beta</span> and may produce errors or unexpected results.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              We recommend using <span className="font-semibold text-blue-600 dark:text-blue-400">Autopilot mode</span> for the best experience.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBetaWarning(false)}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Stay on Autopilot
              </button>
              <button
                onClick={confirmAgentic}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
