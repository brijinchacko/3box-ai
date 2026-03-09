'use client';

import { useState, useEffect } from 'react';

/**
 * Listens for 'forge:status' custom DOM events dispatched by ForgeAutoGenerate.
 * Returns whether Forge is actively working (generating a resume).
 */
export function useForgeStatus() {
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setIsWorking(detail?.working ?? false);
    };
    window.addEventListener('forge:status', handler);
    return () => window.removeEventListener('forge:status', handler);
  }, []);

  return { isWorking };
}
