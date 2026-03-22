'use client';

import { Lock, Zap, ArrowRight, Rocket, Shield, Star } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface FeatureLockedOverlayProps {
  used: number;
  limit: number;
}

/**
 * Full-screen overlay shown when a FREE-plan user has exhausted all
 * their weekly applications. Blocks all dashboard features with
 * a clear upgrade CTA.
 */
export default function FeatureLockedOverlay({ used, limit }: FeatureLockedOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]/95 backdrop-blur-sm"
    >
      <div className="max-w-lg w-full mx-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
          className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] p-8 text-center"
        >
          {/* Lock icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-red-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">!</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">
            Free Plan Limit Reached
          </h2>
          <p className="text-gray-400 mb-6">
            You&apos;ve used all {limit} free applications ({used}/{limit}).
            Upgrade to unlock unlimited daily applications and continue using all features.
          </p>

          {/* Usage bar */}
          <div className="mb-6 px-4">
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full w-full" />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-gray-500">
              <span>{used} used</span>
              <span>{limit} limit</span>
            </div>
          </div>

          {/* Benefits preview */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Unlock with Pro</span>
            </div>
            <ul className="space-y-2">
              {[
                '20 job applications per day',
                'Auto-apply automation',
                'ATS-optimized resumes per job',
                'All 6 AI agents, unlimited AI usage',
                'Priority processing & email support',
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-xs text-gray-400">
                  <Star className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Link href="/pricing" className="block">
              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl py-3.5 hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20">
                <Zap className="w-4 h-4" />
                Upgrade Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              7-day money-back guarantee
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
