'use client';

import Link from 'next/link';
import { Search, FileEdit, Target, MessageSquare, Mic, Columns3, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const AUTOPILOT_ACTIONS: QuickAction[] = [
  {
    label: 'Build Profile (Box 1)',
    description: 'Create or optimize your resume',
    href: '/dashboard/resume',
    icon: FileEdit,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/20',
  },
  {
    label: 'Job Hunt (Box 2)',
    description: 'Find new job opportunities',
    href: '/dashboard/jobs',
    icon: Search,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20',
  },
  {
    label: 'Applications (Box 3)',
    description: 'View all your applications',
    href: '/dashboard/applications',
    icon: FileText,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20',
  },
  {
    label: 'View Board',
    description: 'Track your pipeline',
    href: '/dashboard/board',
    icon: Columns3,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/20',
  },
];

const AGENTIC_ACTIONS: QuickAction[] = [
  {
    label: 'Search Jobs',
    description: 'Run Scout to find new matches',
    href: '/dashboard/jobs',
    icon: Search,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20',
  },
  {
    label: 'Build Resume',
    description: 'Create or optimize your resume',
    href: '/dashboard/resume',
    icon: FileEdit,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/20',
  },
  {
    label: 'Auto Apply',
    description: 'Let Archer send applications',
    href: '/dashboard/board',
    icon: Target,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/20',
  },
  {
    label: 'Ask Cortex',
    description: 'Chat with your AI career team',
    href: '/dashboard/chat',
    icon: MessageSquare,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20',
  },
];

export default function QuickActions() {
  const { isAgentic } = useDashboardMode();
  const actions = isAgentic ? AGENTIC_ACTIONS : AUTOPILOT_ACTIONS;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={cn(
              'flex flex-col items-center text-center p-4 rounded-xl transition-colors',
              action.bg,
            )}
          >
            <action.icon className={cn('w-6 h-6 mb-2', action.color)} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">{action.label}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{action.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
