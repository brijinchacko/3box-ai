'use client';

import { useEffect, useState } from 'react';
import { Search, FileEdit, Target, Shield, BookOpen, Compass, Brain, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  agent: string;
  action: string;
  summary: string;
  createdAt: string;
}

const agentIcons: Record<string, { icon: React.ElementType; color: string }> = {
  scout: { icon: Search, color: 'text-blue-500' },
  forge: { icon: FileEdit, color: 'text-orange-500' },
  archer: { icon: Target, color: 'text-green-500' },
  atlas: { icon: Compass, color: 'text-purple-500' },
  sage: { icon: BookOpen, color: 'text-teal-500' },
  sentinel: { icon: Shield, color: 'text-rose-500' },
  cortex: { icon: Brain, color: 'text-blue-400' },
};

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetch('/api/user/recent-activity?limit=5')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.activities) setActivities(data.activities);
      })
      .catch(() => {});
  }, []);

  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Activity</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
          No activity yet. Start by searching for jobs!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((item) => {
          const agent = agentIcons[item.agent] || agentIcons.cortex;
          const Icon = agent.icon;
          return (
            <div key={item.id} className="flex items-start gap-3">
              <div className={cn('w-7 h-7 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5')}>
                <Icon className={cn('w-3.5 h-3.5', agent.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">{item.summary}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(item.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}
