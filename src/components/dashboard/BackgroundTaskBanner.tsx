'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import { useScoutStatus } from '@/hooks/useScoutStatus';

export default function BackgroundTaskBanner() {
  const { isRunning } = useScoutStatus(true);

  return (
    <AnimatePresence>
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="mx-4 sm:mx-6 lg:mx-8 mb-2 px-4 py-2.5 rounded-xl border border-neon-green/20 bg-neon-green/5 flex items-center gap-3">
            <AgentAvatar agentId="scout" size={24} />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Loader2 className="w-3.5 h-3.5 text-neon-green animate-spin flex-shrink-0" />
              <span className="text-sm text-white/70 truncate">
                Scout is searching for jobs in the background...
              </span>
            </div>
            <Link
              href="/dashboard/jobs?tab=scout-report"
              className="text-xs font-medium text-neon-green hover:text-neon-green/80 transition-colors flex-shrink-0"
            >
              View
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
