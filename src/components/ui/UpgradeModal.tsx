'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  serviceName,
}: UpgradeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Card */}
          <motion.div
            className="relative z-10 w-full max-w-md mx-4 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f23] border border-white/10 rounded-2xl p-8"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Lock Icon */}
            <div className="flex justify-center mb-5">
              <Lock className="w-12 h-12 text-white/40" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-white text-center">
              You&apos;ve used your free {serviceName}
            </h2>

            {/* Subtitle */}
            <p className="text-white/50 text-sm text-center mt-2">
              Upgrade to continue using this tool
            </p>

            {/* Divider */}
            <div className="h-px bg-white/10 my-6" />

            {/* Primary CTA - Create Free Account */}
            <div className="space-y-2">
              <Link href="/signup" className="block">
                <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-black font-semibold rounded-xl py-3 hover:opacity-90 transition-opacity">
                  <Sparkles className="w-4 h-4" />
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <p className="text-xs text-white/30 text-center">
                Get started with a free account
              </p>
            </div>

            {/* Secondary CTA - View Plans */}
            <Link href="/pricing" className="block mt-3">
              <button className="w-full bg-white/[0.05] border border-white/10 text-white rounded-xl py-3 hover:bg-white/[0.08] transition-colors font-medium">
                View Plans
              </button>
            </Link>

            {/* Sign In Link */}
            <p className="text-sm text-white/40 text-center mt-4">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-[#00d4ff] underline hover:text-[#00d4ff]/80 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
