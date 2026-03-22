'use client';

import { useEffect, useState } from 'react';
import { Zap, Clock, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApplicationLimitData {
  used: number;
  limit: number;
  remaining: number;
  limitType: 'weekly' | 'daily';
  allowed: boolean;
  resetsAt: string | null;
}

interface ApplicationLimitBarProps {
  className?: string;
  compact?: boolean;
}

export default function ApplicationLimitBar({ className, compact = false }: ApplicationLimitBarProps) {
  const [data, setData] = useState<ApplicationLimitData | null>(null);

  useEffect(() => {
    fetch('/api/user/application-cap')
      .then(res => res.ok ? res.json() : null)
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const percent = data.limit > 0 ? Math.min(100, Math.round((data.used / data.limit) * 100)) : 0;
  const isNearLimit = percent >= 80;
  const isAtLimit = !data.allowed;

  const barColor = isAtLimit
    ? 'bg-red-500'
    : isNearLimit
    ? 'bg-amber-500'
    : 'bg-blue-500';

  const resetLabel = data.limitType === 'daily' && data.resetsAt
    ? `Resets ${formatResetTime(data.resetsAt)}`
    : data.limitType === 'weekly'
    ? 'Resets every Monday'
    : '';

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 text-xs', className)}>
        <Zap className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${percent}%` }} />
        </div>
        <span className={cn('font-medium tabular-nums', isAtLimit ? 'text-red-600' : 'text-gray-500 dark:text-gray-400')}>
          {data.used}/{data.limit}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Applications</span>
        </div>
        <span className={cn(
          'text-sm font-semibold tabular-nums',
          isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-gray-700 dark:text-gray-300',
        )}>
          {data.used} / {data.limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{data.remaining} remaining</span>
        {resetLabel && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {resetLabel}
          </span>
        )}
      </div>

      {/* Limit reached warning */}
      {isAtLimit && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
          <p className="text-xs text-red-700 dark:text-red-400 font-medium">
            {data.limitType === 'weekly'
              ? 'You\'ve used all your free applications this week. Upgrade to Pro for 20/day.'
              : 'Daily limit reached. Resets at midnight UTC.'}
          </p>
        </div>
      )}
    </div>
  );
}

function formatResetTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);

    if (hours > 0) return `in ${hours}h ${mins}m`;
    if (mins > 0) return `in ${mins}m`;
    return 'soon';
  } catch {
    return 'at midnight UTC';
  }
}
