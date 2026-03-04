'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Zap, Crown, ArrowUpRight } from 'lucide-react';

interface UpgradeNudgeProps {
  plan: string;
  feature?: string;
  creditsUsed?: number;
  creditsLimit?: number;
}

export default function UpgradeNudge({ plan, feature, creditsUsed, creditsLimit }: UpgradeNudgeProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isCreditsLow =
    creditsUsed !== undefined &&
    creditsLimit !== undefined &&
    creditsLimit > 0 &&
    (creditsUsed / creditsLimit) > 0.8;

  const creditsPercent =
    creditsUsed !== undefined && creditsLimit !== undefined && creditsLimit > 0
      ? Math.round((creditsUsed / creditsLimit) * 100)
      : 0;

  // Determine which plan to recommend upgrading to
  const recommendedPlan = plan === 'BASIC' ? 'Starter' : plan === 'STARTER' ? 'Pro' : 'Ultra';

  // Credits low variant
  if (isCreditsLow) {
    const barColor = creditsPercent > 90 ? 'bg-red-500' : 'bg-yellow-500';

    return (
      <div className="relative glass border border-yellow-500/20 rounded-xl p-4 mb-6">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-yellow-400">
              You&apos;ve used {creditsPercent}% of your AI credits
            </p>
            <div className="skill-bar h-1.5 mt-2 mb-3">
              <div
                className={`skill-bar-fill ${barColor}`}
                style={{ width: `${creditsPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/pricing#credits"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs font-medium hover:bg-yellow-500/20 transition-colors"
              >
                <Zap className="w-3 h-3" />
                Buy Credits
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs font-medium hover:bg-white/10 transition-colors"
              >
                <Crown className="w-3 h-3" />
                Upgrade
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Feature gate variant
  if (feature) {
    return (
      <div className="relative rounded-xl p-4 mb-6"
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid transparent',
          borderImage: 'linear-gradient(135deg, #00d4ff, #a855f7) 1',
        }}
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center flex-shrink-0">
            <Crown className="w-4 h-4 text-neon-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              Upgrade to <span className="text-neon-purple">{recommendedPlan}</span> to unlock{' '}
              <span className="text-white">{feature}</span>
            </p>
          </div>
          <Link
            href="/pricing"
            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-neon-blue to-neon-purple text-white text-xs font-semibold hover:shadow-lg hover:shadow-neon-blue/25 transition-all"
          >
            Upgrade <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  // Default: basic plan upgrade CTA
  if (plan === 'BASIC') {
    return (
      <div className="relative glass rounded-xl p-4 mb-6"
        style={{
          border: '1px solid transparent',
          borderImage: 'linear-gradient(135deg, #00d4ff, #a855f7) 1',
        }}
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center flex-shrink-0">
            <Crown className="w-4 h-4 text-neon-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              Unlock AI-powered features &mdash; upgrade your plan today
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              Get unlimited AI credits, priority support, and more
            </p>
          </div>
          <Link
            href="/pricing"
            className="flex-shrink-0 inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-gradient-to-r from-neon-blue to-neon-purple text-white text-xs font-semibold hover:shadow-lg hover:shadow-neon-blue/25 transition-all"
          >
            Upgrade <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
