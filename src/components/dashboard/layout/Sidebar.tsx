'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Search,
  FileText,
  FileEdit,
  Mic,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  GraduationCap,
  Briefcase,
  Settings,
  Columns3,
  Home,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import UserMenu from '../UserMenu';
import { normalizePlan, PLAN_PRICING } from '@/lib/tokens/pricing';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import AgentAvatar from '@/components/brand/AgentAvatar';
import CortexAvatar from '@/components/brand/CortexAvatar';
import Logo from '@/components/brand/Logo';
import type { AgentId } from '@/lib/agents/registry';

/* ── Copilot: standalone top item ───────────────────── */
const COPILOT_TOP = { label: 'Home', href: '/dashboard', icon: LayoutDashboard };

/* ── Copilot nav items (consolidated into 3 groups) ──── */
const COPILOT_NAV_GROUPS = [
  {
    category: 'DISCOVER & APPLY',
    color: 'green',
    activeBg: 'bg-green-50 dark:bg-green-500/10',
    activeText: 'text-green-700 dark:text-green-400',
    activeIcon: 'text-green-600 dark:text-green-400',
    headerText: 'text-green-500 dark:text-green-400/70',
    iconColor: 'text-green-500 dark:text-green-400',
    iconBg: 'bg-green-50 dark:bg-green-500/10',
    iconBorder: 'border-green-200 dark:border-green-500/20',
    items: [
      { label: 'Find Jobs', href: '/dashboard/jobs', icon: Search, dataSidebar: 'find-jobs', agentId: 'scout' as AgentId, agentRole: 'Job Hunter' },
      { label: 'Applications', href: '/dashboard/board', icon: Columns3, dataSidebar: 'applications', agentId: 'archer' as AgentId, agentRole: 'Application Agent' },
      { label: 'My Resume', href: '/dashboard/resume', icon: FileEdit, dataSidebar: 'my-resume', agentId: 'forge' as AgentId, agentRole: 'Resume Optimizer' },
    ],
  },
  {
    category: 'PREPARE & GROW',
    color: 'blue',
    activeBg: 'bg-blue-50 dark:bg-blue-500/10',
    activeText: 'text-blue-700 dark:text-blue-400',
    activeIcon: 'text-blue-600 dark:text-blue-400',
    headerText: 'text-blue-500 dark:text-blue-400/70',
    iconColor: 'text-blue-500 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconBorder: 'border-blue-200 dark:border-blue-500/20',
    items: [
      { label: 'Interview Prep', href: '/dashboard/interview', icon: Mic, dataSidebar: 'interview-prep', agentId: 'atlas' as AgentId, agentRole: 'Interview Coach' },
      { label: 'Skill Growth', href: '/dashboard/learning', icon: GraduationCap, dataSidebar: 'skill-growth', agentId: 'sage' as AgentId, agentRole: 'Skill Trainer' },
      { label: 'Portfolio', href: '/dashboard/portfolio', icon: Briefcase, dataSidebar: 'portfolio' },
    ],
  },
  {
    category: 'SETTINGS',
    color: 'gray',
    activeBg: 'bg-gray-100 dark:bg-white/[0.06]',
    activeText: 'text-gray-900 dark:text-gray-200',
    activeIcon: 'text-gray-700 dark:text-gray-300',
    headerText: 'text-gray-400 dark:text-gray-500',
    iconColor: 'text-gray-400 dark:text-gray-500',
    iconBg: 'bg-gray-50 dark:bg-gray-800',
    iconBorder: 'border-gray-200 dark:border-gray-700',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: Settings, dataSidebar: 'settings' },
      { label: 'Back to Home', href: '/', icon: Home, dataSidebar: 'back-to-home' },
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
  const { data: session } = useSession();
  const { isAgentic } = useDashboardMode();

  const plan = normalizePlan((session?.user as any)?.plan || 'FREE');
  const planInfo = PLAN_PRICING[plan];
  const isFree = plan === 'FREE';
  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
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
          /* ── COPILOT MODE: Home + consolidated groups ──── */
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {/* Standalone Home */}
            {(() => {
              const active = isActive(COPILOT_TOP.href);
              return (
                <Link
                  href={COPILOT_TOP.href}
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-3',
                    active
                      ? 'bg-gray-100 dark:bg-white/[0.06] text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                    collapsed && 'justify-center px-2',
                  )}
                  title={collapsed ? COPILOT_TOP.label : undefined}
                >
                  <COPILOT_TOP.icon className={cn('w-[18px] h-[18px] shrink-0', active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500')} />
                  {!collapsed && <span>{COPILOT_TOP.label}</span>}
                </Link>
              );
            })()}

            {/* Consolidated nav groups */}
            {COPILOT_NAV_GROUPS.map((group, idx) => (
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
                    const hasAgent = 'agentId' in item && item.agentId;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onMobileClose}
                        data-sidebar={item.dataSidebar}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          active
                            ? `${group.activeBg} ${group.activeText}`
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                          collapsed && 'justify-center px-2',
                        )}
                        title={collapsed ? `${item.label}${hasAgent ? ` • ${(item as any).agentRole}` : ''}` : undefined}
                      >
                        {hasAgent ? (
                          <div className="w-7 h-7 shrink-0 relative">
                            <AgentAvatar agentId={(item as any).agentId} size={28} />
                          </div>
                        ) : (
                          <div className={cn(
                            'w-7 h-7 rounded-md border flex items-center justify-center shrink-0',
                            active ? `${group.iconBg} ${group.iconBorder}` : `${group.iconBg} ${group.iconBorder} opacity-60`,
                          )}>
                            <item.icon className={cn('w-3.5 h-3.5', active ? group.activeIcon : group.iconColor)} />
                          </div>
                        )}
                        {!collapsed && (
                          <div className="min-w-0">
                            <span className="block leading-tight">{item.label}</span>
                            {hasAgent && (
                              <span className="block text-[10px] font-normal opacity-50 leading-tight">
                                {(item as any).agentId.charAt(0).toUpperCase() + (item as any).agentId.slice(1)} • {(item as any).agentRole}
                              </span>
                            )}
                          </div>
                        )}
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

    </>
  );
}
