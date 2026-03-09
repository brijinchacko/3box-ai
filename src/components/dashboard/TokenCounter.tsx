'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, ExternalLink, Clock, Infinity as InfinityIcon } from 'lucide-react';
import { useTokens } from '@/hooks/useTokens';
import { TOKEN_COST_LABELS } from '@/lib/tokens/pricing';

/** Format a future ISO timestamp as "Resets in Xh Ym" */
function formatTimeUntilReset(resetsAt: string): string {
  if (!resetsAt) return '';
  const diff = new Date(resetsAt).getTime() - Date.now();
  if (diff <= 0) return 'Resets soon';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `Resets in ${hours}h ${mins}m`;
  return `Resets in ${mins}m`;
}

export default function TokenCounter() {
  const { used, limit, remaining, percentUsed, loading, dailyCap } = useTokens();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Daily cap display values
  const dailyPct = useMemo(() => {
    if (dailyCap.isUnlimited) return 0;
    if (dailyCap.limit === 0) return 100;
    return Math.min(100, Math.round((dailyCap.used / dailyCap.limit) * 100));
  }, [dailyCap]);

  const dailyRemainPct = 100 - dailyPct;
  const dailyColor = dailyCap.isUnlimited
    ? 'text-neon-green'
    : dailyRemainPct > 50
      ? 'text-neon-green'
      : dailyRemainPct > 25
        ? 'text-amber-400'
        : 'text-red-400';
  const dailyBarColor = dailyCap.isUnlimited
    ? 'bg-neon-green'
    : dailyRemainPct > 50
      ? 'bg-neon-green'
      : dailyRemainPct > 25
        ? 'bg-amber-400'
        : 'bg-red-400';

  if (loading) {
    return (
      <div className="h-8 w-28 rounded-full bg-white/5 animate-pulse" />
    );
  }

  // Color based on remaining percentage (monthly tokens)
  const remainPct = 100 - percentUsed;
  const color =
    remainPct > 50
      ? 'text-neon-green'
      : remainPct > 25
        ? 'text-amber-400'
        : 'text-red-400';

  const barColor =
    remainPct > 50
      ? 'bg-neon-green'
      : remainPct > 25
        ? 'bg-amber-400'
        : 'bg-red-400';

  return (
    <div ref={ref} className="relative">
      {/* Pill button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium ${color}`}
      >
        <Zap className="w-3.5 h-3.5" />
        <span>{remaining === Infinity ? 'Unlimited' : remaining}</span>
        <span className="text-white/30 text-xs">tokens</span>
        <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/10 bg-surface-50 shadow-2xl shadow-black/40 z-50 overflow-hidden"
          >
            {/* Monthly Token Usage */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">Monthly Tokens</span>
                <span className={`text-xs font-mono ${color}`}>
                  {remaining === Infinity ? 'Unlimited' : `${remaining} remaining`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.min(100, percentUsed)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-white/30">
                <span>{used} used</span>
                <span>{limit < 0 ? 'Unlimited' : `${limit} total`}</span>
              </div>
            </div>

            {/* Daily Application Cap */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">Daily Applications</span>
                <span className={`text-xs font-mono ${dailyColor}`}>
                  {dailyCap.isUnlimited ? (
                    <span className="flex items-center gap-1"><InfinityIcon className="w-3 h-3" /> Unlimited</span>
                  ) : (
                    `${dailyCap.remaining} / ${dailyCap.limit}`
                  )}
                </span>
              </div>
              {!dailyCap.isUnlimited && (
                <>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${dailyBarColor}`}
                      style={{ width: `${dailyPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] text-white/30">
                    <span>{dailyCap.used} applied today</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimeUntilReset(dailyCap.resetsAt)}
                    </span>
                  </div>
                </>
              )}
              {!dailyCap.isUnlimited && (
                <a
                  href="/pricing#unlimited"
                  className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[11px] font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  Unlock Unlimited
                </a>
              )}
            </div>

            {/* Cost Reference */}
            <div className="p-4 max-h-44 overflow-y-auto">
              <div className="text-[10px] uppercase tracking-wider text-white/20 font-semibold mb-2">Token Costs</div>
              <div className="space-y-1.5">
                {TOKEN_COST_LABELS.map((item) => (
                  <div key={item.operation} className="flex items-center justify-between text-xs">
                    <span className="text-white/50">{item.operation}</span>
                    <span className="text-white/70 font-mono">{item.cost}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Buy More */}
            <div className="p-3 border-t border-white/5">
              <a
                href="/pricing"
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-white/10 text-sm font-medium text-white hover:from-neon-blue/30 hover:to-neon-purple/30 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                Buy More Tokens
                <ExternalLink className="w-3 h-3 text-white/30" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
