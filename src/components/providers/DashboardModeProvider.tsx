'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export type DashboardMode = 'autopilot' | 'agentic';

interface DashboardModeContextValue {
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
  toggleMode: () => void;
  isAutopilot: boolean;
  isAgentic: boolean;
}

const DashboardModeContext = createContext<DashboardModeContextValue>({
  mode: 'autopilot',
  setMode: () => {},
  toggleMode: () => {},
  isAutopilot: true,
  isAgentic: false,
});

export function useDashboardMode() {
  return useContext(DashboardModeContext);
}

const STORAGE_KEY = '3box-dashboard-mode';

export default function DashboardModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DashboardMode>('autopilot');

  // Read persisted preference on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as DashboardMode | null;
      if (stored === 'autopilot' || stored === 'agentic') {
        setModeState(stored);
      }
    } catch {}
  }, []);

  const setMode = useCallback((m: DashboardMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {}
  }, []);

  const toggleMode = useCallback(() => {
    setModeState(prev => {
      const next = prev === 'autopilot' ? 'agentic' : 'autopilot';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  const value = useMemo<DashboardModeContextValue>(() => ({
    mode,
    setMode,
    toggleMode,
    isAutopilot: mode === 'autopilot',
    isAgentic: mode === 'agentic',
  }), [mode, setMode, toggleMode]);

  return (
    <DashboardModeContext.Provider value={value}>
      {children}
    </DashboardModeContext.Provider>
  );
}
