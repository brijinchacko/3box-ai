'use client';

import { motion } from 'framer-motion';
import { Search, Send, Mic, TrendingUp } from 'lucide-react';

interface MetricsBarProps {
  metrics: {
    jobsFound: number;
    appsSent: number;
    interviews: number;
    responseRate: number;
  };
  loading: boolean;
}

const cells: { key: keyof MetricsBarProps['metrics']; label: string; icon: any; color: string; suffix?: string }[] = [
  { key: 'jobsFound', label: 'Jobs Found', icon: Search, color: 'text-neon-blue' },
  { key: 'appsSent', label: 'Apps Sent', icon: Send, color: 'text-neon-green' },
  { key: 'interviews', label: 'Interviews', icon: Mic, color: 'text-neon-purple' },
  { key: 'responseRate', label: 'Response Rate', icon: TrendingUp, color: 'text-amber-400', suffix: '%' },
];

export default function MetricsBar({ metrics, loading }: MetricsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {cells.map((cell, i) => {
        const Icon = cell.icon;
        const value = metrics[cell.key as keyof typeof metrics];

        return (
          <motion.div
            key={cell.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i }}
            className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 flex items-center gap-3"
          >
            <Icon className={`w-4 h-4 ${cell.color} flex-shrink-0`} />
            <div className="min-w-0">
              {loading ? (
                <div className="h-5 w-10 bg-white/5 rounded animate-pulse" />
              ) : (
                <p className={`text-lg font-bold ${cell.color}`}>
                  {value}{cell.suffix || ''}
                </p>
              )}
              <p className="text-[10px] text-white/25 truncate">{cell.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
