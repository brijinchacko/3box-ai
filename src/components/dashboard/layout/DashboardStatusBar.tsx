'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Mail,
  AlertTriangle,
  Zap,
  Sparkles,
  Target,
  RefreshCw,
  Pause,
  FileText,
  Upload,
  X,
  ChevronDown,
  Settings,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface PipelineStatus {
  loaded: boolean;
  profileCount: number;
  activeCount: number;
  hasConnectedEmail: boolean;
  emailProvider: string | null;
  lastRunAt: string | null;
  nextRunIn: string | null;
  totalApplied: number;
  totalFound: number;
  hasResume: boolean;
  resumeVerified: boolean;
  hasTargetRole: boolean;
  autoSearchOn: boolean;
  dailyLimitReached: boolean;
  warnings: string[];
}

/* ═══════════════════════════════════════════════════════
   NOTIFICATION DROPDOWN
   ═══════════════════════════════════════════════════════ */
function NotificationDropdown({
  notifications,
  onClose,
  isAgentic,
  onClearAll,
  onDismiss,
}: {
  notifications: Notification[];
  onClose: () => void;
  isAgentic: boolean;
  onClearAll: () => void;
  onDismiss: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const typeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case 'error': return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      default: return <Zap className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div
      ref={ref}
      className={cn(
        'absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border shadow-2xl z-50 overflow-hidden',
        isAgentic
          ? 'bg-[#12121a] border-white/10 shadow-black/60'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-black/10',
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-3 border-b',
        isAgentic ? 'border-white/[0.06]' : 'border-gray-100 dark:border-gray-800',
      )}>
        <span className={cn('text-sm font-semibold', isAgentic ? 'text-white' : 'text-gray-900 dark:text-white')}>
          Notifications
        </span>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className={cn('text-[10px] font-medium px-2 py-0.5 rounded', isAgentic ? 'text-white/40 hover:text-white/60 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800')}
            >
              Clear all
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className={cn('text-sm', isAgentic ? 'text-white/40' : 'text-gray-400')}>No notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'group flex items-start gap-3 px-4 py-3 border-b last:border-0 transition-colors',
                isAgentic
                  ? 'border-white/[0.04] hover:bg-white/[0.03]'
                  : 'border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50',
              )}
            >
              <div className="mt-0.5 flex-shrink-0">{typeIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium', isAgentic ? 'text-white/80' : 'text-gray-900 dark:text-white')}>
                  {n.title}
                </p>
                <p className={cn('text-[11px] mt-0.5 leading-snug', isAgentic ? 'text-white/40' : 'text-gray-500 dark:text-gray-400')}>
                  {n.message}
                </p>
                <p className={cn('text-[10px] mt-1', isAgentic ? 'text-white/20' : 'text-gray-300 dark:text-gray-600')}>
                  {relativeTime(n.time)}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
                className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Dismiss"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className={cn(
          'px-4 py-2.5 border-t text-center',
          isAgentic ? 'border-white/[0.06]' : 'border-gray-100 dark:border-gray-800',
        )}>
          <Link
            href="/dashboard/board"
            onClick={onClose}
            className={cn('text-xs font-medium', isAgentic ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700')}
          >
            View All Activity
          </Link>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SETUP WARNINGS DROPDOWN
   ═══════════════════════════════════════════════════════ */
function SetupWarnings({
  status,
  isAgentic,
}: {
  status: PipelineStatus;
  isAgentic: boolean;
}) {
  const warnings: { icon: React.ReactNode; text: string; action?: { label: string; href: string } }[] = [];

  if (!status.hasResume) {
    warnings.push({
      icon: <Upload className="w-3.5 h-3.5 text-amber-500" />,
      text: 'Upload your resume to start applying',
      action: { label: 'Upload', href: '/dashboard/resume' },
    });
  } else if (!status.resumeVerified) {
    warnings.push({
      icon: <FileText className="w-3.5 h-3.5 text-amber-500" />,
      text: 'Verify your resume before applying to jobs',
      action: { label: 'Verify', href: '/dashboard/resume' },
    });
  }

  if (!status.hasTargetRole) {
    warnings.push({
      icon: <Target className="w-3.5 h-3.5 text-amber-500" />,
      text: 'Set a target role so agents know what to search for',
      action: { label: 'Settings', href: '/dashboard/settings' },
    });
  }

  if (!status.hasConnectedEmail) {
    warnings.push({
      icon: <Mail className="w-3.5 h-3.5 text-amber-500" />,
      text: 'Connect your email. Applications will be sent from a generic address without it',
      action: { label: 'Connect', href: '/dashboard/settings' },
    });
  }

  if (status.profileCount === 0) {
    warnings.push({
      icon: <Zap className="w-3.5 h-3.5 text-blue-500" />,
      text: 'Create a search pipeline to start finding jobs automatically',
      action: { label: 'Set Up', href: '/dashboard/jobs' },
    });
  }

  if (status.activeCount === 0 && status.profileCount > 0) {
    warnings.push({
      icon: <Pause className="w-3.5 h-3.5 text-gray-400" />,
      text: 'All search pipelines are paused. Resume one to find new jobs',
    });
  }

  if (!status.autoSearchOn && status.activeCount > 0) {
    warnings.push({
      icon: <RefreshCw className="w-3.5 h-3.5 text-amber-500" />,
      text: 'Auto-search is off. Jobs won\'t be discovered automatically',
      action: { label: 'Settings', href: '/dashboard/settings' },
    });
  }

  if (status.dailyLimitReached) {
    warnings.push({
      icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
      text: 'Daily application limit reached. Will resume tomorrow',
    });
  }

  if (warnings.length === 0) return null;

  return (
    <div className={cn(
      'mt-2 space-y-1.5 px-1',
    )}>
      {warnings.map((w, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-2 text-[11px] rounded-lg px-2.5 py-1.5',
            isAgentic ? 'bg-white/[0.03] text-white/50' : 'bg-amber-50/50 dark:bg-amber-500/5 text-gray-600 dark:text-gray-400',
          )}
        >
          <div className="flex-shrink-0">{w.icon}</div>
          <span className="flex-1">{w.text}</span>
          {w.action && (
            <Link
              href={w.action.href}
              className={cn(
                'flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded',
                isAgentic
                  ? 'text-blue-400 hover:text-blue-300 bg-blue-500/10'
                  : 'text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400',
              )}
            >
              {w.action.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN STATUS BAR — Unified header for all dashboard tabs
   ═══════════════════════════════════════════════════════ */
export default function DashboardStatusBar() {
  const { data: session } = useSession();
  const { isAgentic } = useDashboardMode();
  const { isLocked, plan, used, limit, limitType } = useFeatureGate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('3box_dismissed_notifs');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const dismissNotification = (id: string) => {
    const updated = new Set(dismissedIds);
    updated.add(id);
    setDismissedIds(updated);
    try { localStorage.setItem('3box_dismissed_notifs', JSON.stringify([...updated])); } catch {}
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    const allIds = new Set([...dismissedIds, ...notifications.map(n => n.id)]);
    setDismissedIds(allIds);
    try { localStorage.setItem('3box_dismissed_notifs', JSON.stringify([...allIds])); } catch {}
    setNotifications([]);
    setUnreadCount(0);
  };
  const [status, setStatus] = useState<PipelineStatus>({
    loaded: false,
    profileCount: 0,
    activeCount: 0,
    hasConnectedEmail: false,
    emailProvider: null,
    lastRunAt: null,
    nextRunIn: null,
    totalApplied: 0,
    totalFound: 0,
    hasResume: false,
    resumeVerified: false,
    hasTargetRole: false,
    autoSearchOn: false,
    dailyLimitReached: false,
    warnings: [],
  });

  // Fetch pipeline status + notifications
  const fetchStatus = useCallback(async () => {
    try {
      const [loopsRes, gmailRes, outlookRes, configRes, notifRes, profileRes, resumeRes] = await Promise.all([
        fetch('/api/user/loops').then(r => r.ok ? r.json() : { profiles: [] }).catch(() => ({ profiles: [] })),
        fetch('/api/auth/gmail/status').then(r => r.ok ? r.json() : { connected: false }).catch(() => ({ connected: false })),
        fetch('/api/auth/outlook/status').then(r => r.ok ? r.json() : { connected: false }).catch(() => ({ connected: false })),
        fetch('/api/agents/config').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/notifications').then(r => r.ok ? r.json() : { notifications: [], unreadCount: 0 }).catch(() => ({ notifications: [], unreadCount: 0 })),
        fetch('/api/user/profile').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/user/resume').then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      const profiles = loopsRes.profiles || [];
      const activeProfiles = profiles.filter((p: any) => p.active);
      const hasEmail = gmailRes.connected || outlookRes.connected;
      const emailProvider = gmailRes.connected ? 'Gmail' : outlookRes.connected ? 'Outlook' : null;

      let nextRunIn: string | null = null;
      const lastRunAt = configRes?.scoutLastRunAt || null;
      if (configRes?.scoutAutoMode && configRes?.scoutInterval && lastRunAt) {
        const last = new Date(lastRunAt).getTime();
        const intervalMs = (configRes.scoutInterval || 24) * 60 * 60 * 1000;
        const nextRun = last + intervalMs;
        const diff = nextRun - Date.now();
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          nextRunIn = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        } else {
          nextRunIn = 'Due now';
        }
      }

      // Also check SMTP connection
      let smtpConnected = false;
      try {
        const smtpRes = await fetch('/api/user/smtp-config').then(r => r.ok ? r.json() : { configured: false });
        smtpConnected = smtpRes.configured;
      } catch {}

      const totalFound = activeProfiles.reduce((sum: number, p: any) => sum + (p.jobsFound || 0), 0);
      const totalApplied = activeProfiles.reduce((sum: number, p: any) => sum + (p.appliedCount || 0), 0);

      setStatus({
        loaded: true,
        profileCount: profiles.length,
        activeCount: activeProfiles.length,
        hasConnectedEmail: hasEmail || smtpConnected,
        emailProvider: emailProvider || (smtpConnected ? 'SMTP' : null),
        lastRunAt,
        nextRunIn,
        totalApplied,
        totalFound,
        hasResume: !!resumeRes?.resumeId || !!resumeRes?.resume?.contact?.name,
        resumeVerified: !!resumeRes?.isFinalized,
        hasTargetRole: !!profileRes?.targetRole,
        autoSearchOn: !!configRes?.scoutAutoMode,
        dailyLimitReached: configRes?.scoutDailyCount >= configRes?.scoutDailyCap && activeProfiles.length > 0,
        warnings: [],
      });

      const filteredNotifs = (notifRes.notifications || []).filter((n: Notification) => !dismissedIds.has(n.id));
      setNotifications(filteredNotifs);
      setUnreadCount(filteredNotifs.length);
    } catch (err) {
      console.error('[StatusBar] Fetch error:', err);
      setStatus(prev => ({ ...prev, loaded: true }));
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Refresh every 2 minutes
    const interval = setInterval(fetchStatus, 120000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (!status.loaded) return null;

  // Count setup issues
  // Critical issues = things that actually prevent auto-apply from working
  const criticalIssues = [
    !status.hasResume,
    status.hasResume && !status.resumeVerified,
    status.profileCount === 0,
    status.dailyLimitReached,
  ].filter(Boolean).length;

  // Auto-apply can only be truly active if resume is verified
  const isReady = status.resumeVerified && status.activeCount > 0;

  // Warnings = nice-to-have improvements (don't block status from showing "Active")
  const setupIssues = [
    !status.hasResume,
    status.hasResume && !status.resumeVerified,
    !status.hasTargetRole,
    !status.hasConnectedEmail,
    status.profileCount === 0,
    status.activeCount === 0 && status.profileCount > 0,
    !status.autoSearchOn && status.activeCount > 0,
    status.dailyLimitReached,
  ].filter(Boolean).length;

  // Usage bar
  const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const barColor = isLocked ? 'bg-red-500' : percent >= 90 ? 'bg-red-500' : percent >= 60 ? 'bg-amber-500' : 'bg-blue-500';
  const periodLabel = limitType === 'weekly' ? 'this week' : 'today';

  // Status — show honest pipeline state (NOT "Active" since auto-apply isn't built yet)
  const statusDot = status.dailyLimitReached
    ? 'bg-red-500'
    : isReady
      ? 'bg-blue-500'
      : criticalIssues > 0
        ? 'bg-amber-500'
        : status.activeCount > 0
          ? 'bg-amber-500'
          : 'bg-gray-400';

  // Plain language status — show SPECIFIC next action, not cryptic count
  const statusLabel = status.dailyLimitReached
    ? 'Limit Reached'
    : isReady
      ? 'Ready'
      : !status.hasResume
        ? 'Upload resume'
        : !status.resumeVerified
          ? 'Resume needs review'
          : status.profileCount === 0
            ? 'Set up job search'
            : status.activeCount === 0
              ? 'Paused'
              : 'Ready';

  // Format lastRunAt
  let lastRunText = '';
  if (status.lastRunAt) {
    const diff = Date.now() - new Date(status.lastRunAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) lastRunText = 'Just now';
    else if (mins < 60) lastRunText = `${mins}m ago`;
    else if (mins < 1440) lastRunText = `${Math.floor(mins / 60)}h ago`;
    else lastRunText = `${Math.floor(mins / 1440)}d ago`;
  }

  return (
    <div className={cn(
      'sticky top-0 z-20 border-b',
      isAgentic
        ? 'bg-[#0a0a0f]/95 backdrop-blur-xl border-white/[0.06]'
        : 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200 dark:border-gray-800',
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main row */}
        <div className="flex items-center justify-between h-11 gap-3">
          {/* Left: Auto-apply status */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Status dot + label */}
            <button
              onClick={() => { setShowWarnings(!showWarnings); setShowNotifications(false); }}
              className={cn(
                'flex items-center gap-2 px-2.5 py-1 rounded-lg transition-colors text-xs font-medium',
                isAgentic
                  ? 'hover:bg-white/[0.06] text-white/70'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
              )}
            >
              <div className={cn('w-2 h-2 rounded-full flex-shrink-0', statusDot)} />
              <span>{statusLabel}</span>
              {false && setupIssues > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  isAgentic ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                )}>
                  {setupIssues}
                </span>
              )}
              <ChevronDown className={cn('w-3 h-3 transition-transform', showWarnings && 'rotate-180')} />
            </button>

            {/* Quick stats (desktop) */}
            <div className="hidden lg:flex items-center gap-3 text-[11px]">
              {status.activeCount > 0 && (
                <>
                  <span className={cn(isAgentic ? 'text-white/30' : 'text-gray-300 dark:text-gray-600')}>|</span>
                  <span className={cn(isAgentic ? 'text-white/40' : 'text-gray-500 dark:text-gray-400')}>
                    <strong className={cn(isAgentic ? 'text-white/60' : 'text-gray-700 dark:text-gray-300')}>{status.totalFound}</strong> found
                  </span>
                  <span className={cn(isAgentic ? 'text-white/40' : 'text-gray-500 dark:text-gray-400')}>
                    <strong className={cn(isAgentic ? 'text-white/60' : 'text-gray-700 dark:text-gray-300')}>{status.totalApplied}</strong> applied
                  </span>
                </>
              )}
              {lastRunText && (
                <span className={cn(isAgentic ? 'text-white/30' : 'text-gray-400 dark:text-gray-500')}>
                  Last: {lastRunText}
                </span>
              )}
              {status.nextRunIn && status.activeCount > 0 && (
                <span className={cn(isAgentic ? 'text-white/30' : 'text-gray-400 dark:text-gray-500')}>
                  Next: {status.nextRunIn}
                </span>
              )}
              {status.hasConnectedEmail && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400" title={`Email connected: ${status.emailProvider}`}>
                  <Mail className="w-3 h-3" />
                  <span className="sr-only">{status.emailProvider}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: Usage + Notification bell */}
          <div className="flex items-center gap-3">
            {/* Usage badge */}
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded',
                plan === 'FREE'
                  ? isAgentic ? 'bg-white/[0.06] text-white/40' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  : plan === 'PRO'
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
              )}>
                {plan}
              </span>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className={cn('text-[10px]', isAgentic ? 'text-white/30' : 'text-gray-400')}>
                  {used}/{limit} {periodLabel}
                </span>
                <div className={cn('w-16 h-1.5 rounded-full', isAgentic ? 'bg-white/[0.06]' : 'bg-gray-100 dark:bg-gray-800')}>
                  <div className={cn('h-1.5 rounded-full transition-all duration-500', barColor)} style={{ width: `${Math.min(100, percent)}%` }} />
                </div>
              </div>
              {plan === 'FREE' && (
                <Link
                  href="/pricing"
                  className={cn(
                    'text-[10px] font-semibold hidden sm:inline-flex items-center gap-0.5',
                    isAgentic ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700',
                  )}
                >
                  Upgrade <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowWarnings(false); }}
                className={cn(
                  'relative p-2 rounded-lg transition-colors',
                  isAgentic
                    ? 'hover:bg-white/[0.06] text-white/50 hover:text-white/80'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400',
                )}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationDropdown
                  notifications={notifications}
                  onClose={() => setShowNotifications(false)}
                  isAgentic={isAgentic}
                  onClearAll={clearAllNotifications}
                  onDismiss={dismissNotification}
                />
              )}
            </div>
          </div>
        </div>

        {/* Expandable warnings section */}
        {showWarnings && setupIssues > 0 && (
          <SetupWarnings status={status} isAgentic={isAgentic} />
        )}

        {/* Locked state banner */}
        {isLocked && (
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 mb-1 rounded-lg text-xs',
            isAgentic ? 'bg-red-500/10 text-red-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
          )}>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-medium">Quota exhausted.</span>
            <Link href="/pricing" className="underline font-semibold">Upgrade to continue</Link>
          </div>
        )}
      </div>

      {/* Bottom padding for warnings */}
      {(showWarnings && setupIssues > 0) || isLocked ? <div className="h-2" /> : null}
    </div>
  );
}
