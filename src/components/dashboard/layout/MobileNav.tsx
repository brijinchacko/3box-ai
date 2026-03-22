'use client';

import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';

interface MobileNavProps {
  onOpen: () => void;
}

export default function MobileNav({ onOpen }: MobileNavProps) {
  const { isAgentic } = useDashboardMode();

  return (
    <div className={cn(
      'lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center h-14 px-4 border-b',
      isAgentic
        ? 'bg-[#0a0a0f] border-white/[0.06]'
        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
    )}>
      <button
        onClick={onOpen}
        className={cn(
          'p-2 -ml-2 rounded-lg transition-colors',
          isAgentic
            ? 'hover:bg-white/[0.06]'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800',
        )}
        aria-label="Open navigation"
      >
        <Menu className={cn('w-5 h-5', isAgentic ? 'text-white/60' : 'text-gray-600 dark:text-gray-400')} />
      </button>
      <span className={cn(
        'ml-3 font-semibold text-sm',
        isAgentic ? 'text-white' : 'text-gray-900 dark:text-white',
      )}>
        3BOX AI
      </span>
    </div>
  );
}
