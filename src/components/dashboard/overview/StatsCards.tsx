'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Mic, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stats {
  jobsFound: number;
  appsSent: number;
  interviews: number;
  responseRate: number;
}

export default function StatsCards() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ jobsFound: 0, appsSent: 0, interviews: 0, responseRate: 0 });

  useEffect(() => {
    fetch('/api/user/stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, []);

  const cards = [
    {
      label: 'Jobs Found',
      value: stats.jobsFound,
      icon: Search,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      href: '/dashboard/jobs',
    },
    {
      label: 'Apps Sent',
      value: stats.appsSent,
      icon: FileText,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-500/10',
      href: '/dashboard/applications',
    },
    {
      label: 'Interviews',
      value: stats.interviews,
      icon: Mic,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-500/10',
      href: '/dashboard/interview',
    },
    {
      label: 'Response Rate',
      value: `${stats.responseRate}%`,
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      href: '/dashboard/applications',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={() => router.push(card.href)}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', card.bg)}>
              <card.icon className={cn('w-4 h-4', card.color)} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{card.value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
        </button>
      ))}
    </div>
  );
}
