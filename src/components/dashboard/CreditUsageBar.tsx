'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';

interface CreditUsageBarProps {
  used: number;
  limit: number;
  showBuyButton?: boolean;
}

export default function CreditUsageBar({ used, limit, showBuyButton = true }: CreditUsageBarProps) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min(Math.round((used / limit) * 100), 100);

  const barColor =
    isUnlimited
      ? 'bg-neon-green'
      : percentage > 80
        ? 'bg-red-500'
        : percentage > 50
          ? 'bg-yellow-500'
          : 'bg-neon-green';

  const textColor =
    isUnlimited
      ? 'text-neon-green'
      : percentage > 80
        ? 'text-red-400'
        : percentage > 50
          ? 'text-yellow-400'
          : 'text-neon-green';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <Zap className="w-3 h-3" />
          <span>AI Credits</span>
        </div>
        <span className={`text-xs font-medium ${textColor}`}>
          {isUnlimited ? 'Unlimited' : `${used} / ${limit}`}
        </span>
      </div>

      {!isUnlimited && (
        <div className="skill-bar h-1.5">
          <div
            className={`skill-bar-fill ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {isUnlimited && (
        <div className="skill-bar h-1.5">
          <div className="skill-bar-fill bg-neon-green w-full opacity-30" />
        </div>
      )}

      {!isUnlimited && percentage > 80 && showBuyButton && (
        <a
          href="/pricing#credits"
          className="inline-flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors"
        >
          <Zap className="w-2.5 h-2.5" />
          Buy More Credits
        </a>
      )}
    </div>
  );
}
