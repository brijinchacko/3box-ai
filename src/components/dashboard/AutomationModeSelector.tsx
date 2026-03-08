'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointerClick, Zap, BrainCircuit, ChevronDown, Check } from 'lucide-react';
import { AUTOMATION_MODES, AUTOMATION_MODE_LIST, type AutomationMode } from '@/lib/agents/registry';

const MODE_ICONS: Record<AutomationMode, typeof MousePointerClick> = {
  copilot: MousePointerClick,
  autopilot: Zap,
  'full-agent': BrainCircuit,
};

const MODE_STORAGE_KEY = 'jobted_automation_mode';

export default function AutomationModeSelector() {
  const [mode, setMode] = useState<AutomationMode>('copilot');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(MODE_STORAGE_KEY) as AutomationMode | null;
    if (saved && AUTOMATION_MODES[saved]) {
      setMode(saved);
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

  const handleSelect = (m: AutomationMode) => {
    setMode(m);
    localStorage.setItem(MODE_STORAGE_KEY, m);
    setOpen(false);
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
            className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-white/10 bg-surface-50 shadow-2xl shadow-black/40 overflow-hidden z-50"
          >
            <div className="p-2 space-y-1">
              {AUTOMATION_MODE_LIST.map(m => {
                const Icon = MODE_ICONS[m.id];
                const isActive = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(m.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-white/5 border border-white/10'
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
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          m.id === 'copilot' ? 'bg-blue-500/10 text-blue-400' :
                          m.id === 'autopilot' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-neon-green/10 text-neon-green'
                        }`}>
                          {m.label}
                        </span>
                        {isActive && <Check className="w-3.5 h-3.5 text-neon-green ml-auto flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">{m.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
