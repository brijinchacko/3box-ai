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

const cells: { key: keyof MetricsBarProps['metrics']; label: string; icon: any; color: string; bgColor: string; suffix?: string }[] = [
  { key: 'jobsFound', label: 'Jobs Found', icon: Search, color: 'text-neon-blue', bgColor: 'bg-neon-blue/10' },
  { key: 'appsSent', label: 'Apps Sent', icon: Send, color: 'text-neon-green', bgColor: 'bg-neon-green/10' },
  { key: 'interviews', label: 'Interviews', icon: Mic, color: 'text-neon-purple', bgColor: 'bg-neon-purple/10' },
  { key: 'responseRate', label: 'Response Rate', icon: TrendingUp, color: 'text-amber-400', bgColor: 'bg-amber-400/10', suffix: '%' },
];

export default function MetricsBar({ metrics, loading }: MetricsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {cells.map((cell, i) => {
        const Icon = cell.icon;
        const value = metrics[cell.key as keyof typeof metrics];

        return (
          <motion.div
            key={cell.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i }}
            className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 flex items-center gap-2.5"
          >
            <div className={`w-8 h-8 rounded-lg ${cell.bgColor} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${cell.color}`} />
            </div>
            <div className="min-w-0">
              {loading ? (
                <div className="h-5 w-10 bg-white/5 rounded animate-pulse" />
              ) : (
                <p className={`text-base font-bold leading-tight ${cell.color}`}>
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
