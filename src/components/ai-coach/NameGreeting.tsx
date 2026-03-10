'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import CortexAvatar from '@/components/brand/CortexAvatar';
import { useStore } from '@/store/useStore';

type Phase = 'hidden' | 'entering' | 'asking' | 'thanking' | 'leaving' | 'done';

const AUTO_DISMISS_MS = 12000; // auto-dismiss after 12s of no interaction

interface Props {
  onActiveChange?: (active: boolean) => void;
}

export default function NameGreeting({ onActiveChange }: Props) {
  const [phase, setPhase] = useState<Phase>('hidden');
  const [name, setName] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const visitorName = useStore((s) => s.visitorName);
  const setVisitorName = useStore((s) => s.setVisitorName);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout>>();
  const interactedRef = useRef(false);
  const autoFocusedRef = useRef(false);

  // Notify parent when active state changes
  useEffect(() => {
    const active = phase !== 'hidden' && phase !== 'done';
    onActiveChange?.(active);
  }, [phase, onActiveChange]);

  // Show after 3s if conditions met
  useEffect(() => {
    if (visitorName) return;
    const skipped = localStorage.getItem('3box_name_skipped');
    if (skipped) return;

    const timer = setTimeout(() => {
      setPhase('entering');
      setTimeout(() => {
        setPhase('asking');
        setTimeout(() => { autoFocusedRef.current = true; inputRef.current?.focus(); }, 400);
      }, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [visitorName]);

  // Auto-dismiss: start timer when asking phase begins, clear on interaction
  useEffect(() => {
    if (phase === 'asking' && !interactedRef.current) {
      autoDismissRef.current = setTimeout(() => {
        localStorage.setItem('3box_name_skipped', 'true');
        leave();
      }, AUTO_DISMISS_MS);
    }
    return () => { if (autoDismissRef.current) clearTimeout(autoDismissRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const cancelAutoDismiss = () => {
    interactedRef.current = true;
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
  };

  const leave = useCallback(() => {
    setPhase('leaving');
    setTimeout(() => setPhase('done'), 600);
  }, []);

  // Click outside the card to dismiss
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
      localStorage.setItem('3box_name_skipped', 'true');
      leave();
    }
  }, [leave]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cancelAutoDismiss();
    const trimmed = name.trim();
    if (!trimmed) return;
    setVisitorName(trimmed);
    setSubmittedName(trimmed);
    setPhase('thanking');
    setTimeout(leave, 1800);
  };

  const handleSkip = () => {
    cancelAutoDismiss();
    localStorage.setItem('3box_name_skipped', 'true');
    leave();
  };

  const expression = phase === 'thanking' ? 'star' : 'happy';

  if (phase === 'hidden' || phase === 'done') return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'leaving' ? 0 : 1 }}
      transition={{ duration: phase === 'leaving' ? 0.5 : 0.3, ease: 'easeInOut' }}
      onClick={phase === 'asking' ? handleBackdropClick : undefined}
    >
      {/* Backdrop */}
      <AnimatePresence>
        {(phase === 'asking' || phase === 'thanking') && (
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* Cortex Avatar */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.5, y: 30 }}
        animate={
          phase === 'leaving'
            ? { opacity: 0, scale: 0.4, y: -20 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={
          phase === 'leaving'
            ? { duration: 0.4, ease: [0.4, 0, 1, 1] }
            : { type: 'spring', damping: 18, stiffness: 200, delay: 0.05 }
        }
      >
        <motion.div
          animate={phase === 'thanking' ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          <CortexAvatar size={80} expression={expression} />
        </motion.div>
      </motion.div>

      {/* Card */}
      <AnimatePresence mode="wait">
        {phase === 'asking' && (
          <motion.div
            key="ask"
            ref={cardRef}
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.92 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280, mass: 0.8 }}
            className="relative z-10 mt-5 w-[90vw] max-w-[360px]"
          >
            <div className="bg-[#12121e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-5">
              <p className="text-center text-sm text-white/70 leading-relaxed mb-4">
                Hey! I&apos;m <span className="font-semibold text-white">Cortex</span>, your AI career coordinator.
                <br />
                What should I call you?
              </p>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => { setName(e.target.value); cancelAutoDismiss(); }}
                  onFocus={() => { if (autoFocusedRef.current) { autoFocusedRef.current = false; return; } cancelAutoDismiss(); }}
                  placeholder="Your first name"
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder:text-white/20 focus:outline-none focus:border-neon-blue/30 transition-colors"
                  maxLength={30}
                  autoComplete="given-name"
                />
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-4 py-2.5 rounded-xl bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 transition-all disabled:opacity-30 flex items-center gap-1.5 text-sm font-medium"
                >
                  Go <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <button
                onClick={handleSkip}
                className="mt-3 text-[11px] text-white/25 hover:text-white/50 transition-colors w-full text-center"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'thanking' && (
          <motion.div
            key="thank"
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280, mass: 0.8 }}
            className="relative z-10 mt-5"
          >
            <div className="bg-[#12121e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 px-6 py-4">
              <p className="text-sm text-white/80 text-center">
                Nice to meet you, <span className="font-semibold text-neon-blue">{submittedName}</span>!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
