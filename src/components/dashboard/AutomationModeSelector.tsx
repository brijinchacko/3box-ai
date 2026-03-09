'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointerClick, Zap, BrainCircuit, ChevronDown, Check, AlertTriangle, Star } from 'lucide-react';
import { AUTOMATION_MODES, AUTOMATION_MODE_LIST, type AutomationMode } from '@/lib/agents/registry';

const MODE_ICONS: Record<AutomationMode, typeof MousePointerClick> = {
  copilot: MousePointerClick,
  autopilot: Zap,
  'full-agent': BrainCircuit,
};

const MODE_STORAGE_KEY = '3box_automation_mode';

/** Emits mode change so layout can pick up the theme color. */
function emitModeChange(m: AutomationMode) {
  window.dispatchEvent(new CustomEvent('automation-mode-change', { detail: m }));
}

export default function AutomationModeSelector() {
  const [mode, setMode] = useState<AutomationMode>('copilot');
  const [open, setOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingMode, setPendingMode] = useState<AutomationMode | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(MODE_STORAGE_KEY) as AutomationMode | null;
    if (saved && AUTOMATION_MODES[saved]) {
      setMode(saved);
      emitModeChange(saved);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyMode = (m: AutomationMode) => {
    setMode(m);
    localStorage.setItem(MODE_STORAGE_KEY, m);
    emitModeChange(m);
    setOpen(false);
  };

  const handleSelect = (m: AutomationMode) => {
    // Show warning for full-agent mode
    if (m === 'full-agent') {
      setPendingMode(m);
      setShowWarning(true);
      return;
    }
    applyMode(m);
  };

  const confirmFullAgent = () => {
    if (pendingMode) applyMode(pendingMode);
    setShowWarning(false);
    setPendingMode(null);
  };

  const cancelFullAgent = () => {
    setShowWarning(false);
    setPendingMode(null);
    // Switch to recommended Co-Pilot instead
    applyMode('autopilot');
  };

  const current = AUTOMATION_MODES[mode];
  const CurrentIcon = MODE_ICONS[mode];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
          mode === 'copilot'
            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            : mode === 'autopilot'
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-neon-green/10 border-neon-green/20 text-neon-green'
        }`}
      >
        <CurrentIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/10 bg-surface-50 shadow-2xl shadow-black/40 overflow-hidden z-50"
          >
            <div className="px-3 pt-3 pb-1.5">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Automation Mode</p>
            </div>
            <div className="p-2 space-y-1">
              {AUTOMATION_MODE_LIST.map(m => {
                const Icon = MODE_ICONS[m.id];
                const isActive = mode === m.id;
                const isRecommended = m.id === 'autopilot';
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(m.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                      isActive
                        ? m.id === 'copilot'
                          ? 'bg-blue-500/5 border border-blue-500/20'
                          : m.id === 'autopilot'
                            ? 'bg-amber-500/5 border border-amber-500/20'
                            : 'bg-neon-green/5 border border-neon-green/20'
                        : 'hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg ${
                      m.id === 'copilot' ? 'bg-blue-500/10 text-blue-400' :
                      m.id === 'autopilot' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-neon-green/10 text-neon-green'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{m.name}</span>
                        {isRecommended && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" /> Recommended
                          </span>
                        )}
                        {!isRecommended && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            m.id === 'copilot' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-neon-green/10 text-neon-green'
                          }`}>
                            {m.label}
                          </span>
                        )}
                        {isActive && <Check className="w-3.5 h-3.5 text-neon-green ml-auto flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">{m.description}</p>
                      {m.id === 'full-agent' && (
                        <p className="text-[10px] text-amber-500/60 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> AI may make mistakes. Use with caution.
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full-Agent Warning Modal ──────── */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={cancelFullAgent}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass border border-amber-500/20 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Enable Full Autopilot?</h3>
                  <p className="text-xs text-white/40">Fully autonomous mode</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-sm text-amber-300/90 font-medium mb-1">AI can make mistakes</p>
                  <p className="text-xs text-white/40 leading-relaxed">
                    In Autopilot mode, agents will apply to jobs, send emails, and take actions without asking for your approval. While safeguards are in place, AI is not perfect and may occasionally make errors.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-xs text-white/50 leading-relaxed">
                    <span className="text-amber-400 font-semibold">We recommend Co-Pilot mode</span> — agents still work proactively, but you verify before any action is taken. It gives you the best balance of speed and control.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelFullAgent}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" /> Use Co-Pilot Instead
                </button>
                <button
                  onClick={confirmFullAgent}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all"
                >
                  Continue Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
