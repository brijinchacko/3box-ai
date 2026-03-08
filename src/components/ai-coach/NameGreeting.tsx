'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import CortexAvatar from '@/components/brand/CortexAvatar';
import { useStore } from '@/store/useStore';

type Phase = 'hidden' | 'entering' | 'asking' | 'thanking' | 'leaving' | 'done';

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
      // Transition to asking after brief entrance
      setTimeout(() => {
        setPhase('asking');
        setTimeout(() => inputRef.current?.focus(), 300);
      }, 600);
    }, 3000);

    return () => clearTimeout(timer);
  }, [visitorName]);

  const leave = useCallback(() => {
    setPhase('leaving');
    setTimeout(() => setPhase('done'), 800);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setVisitorName(trimmed);
    setSubmittedName(trimmed);
    setPhase('thanking');
    setTimeout(leave, 1800);
  };

  const handleSkip = () => {
    localStorage.setItem('3box_name_skipped', 'true');
    leave();
  };

  const expression = phase === 'thanking' ? 'star' : phase === 'leaving' ? 'happy' : 'happy';

  if (phase === 'hidden' || phase === 'done') return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <AnimatePresence>
        {(phase === 'asking' || phase === 'thanking') && (
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* Cortex Avatar — animates to center, then back to corner */}
      <motion.div
        className="relative z-10"
        animate={
          phase === 'leaving'
            ? { x: 'calc(50vw - 60px)', y: 'calc(50vh - 60px)', scale: 0.6, opacity: 0 }
            : { x: 0, y: 0, scale: 1, opacity: 1 }
        }
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
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
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
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
                  onChange={(e) => setName(e.target.value)}
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
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
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
