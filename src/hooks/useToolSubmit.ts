'use client';

import { useState, useCallback } from 'react';
import { type FreeService, getFreeUseCount, incrementFreeUse, hasFreeTrial } from '@/lib/usage/freeUsageTracker';

interface UseToolSubmitOptions {
  /** FreeService key for usage tracking */
  serviceKey: FreeService;
  /** API endpoint path, e.g. '/api/tools/resume-summary-generator' */
  apiEndpoint: string;
  /** Max free uses (default 2) — should match server config */
  maxFreeUses?: number;
}

interface UseToolSubmitReturn<T> {
  loading: boolean;
  error: string;
  results: T | null;
  showUpgrade: boolean;
  setShowUpgrade: (v: boolean) => void;
  handleSubmit: (input: Record<string, any>) => Promise<void>;
  reset: () => void;
}

/**
 * Hook that handles tool form submission, usage tracking, and upgrade modal.
 * Encapsulates the pattern used across all AI tools.
 */
export function useToolSubmit<T = any>(options: UseToolSubmitOptions): UseToolSubmitReturn<T> {
  const { serviceKey, apiEndpoint, maxFreeUses = 2 } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<T | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleSubmit = useCallback(async (input: Record<string, any>) => {
    // Client-side free trial check
    const currentCount = getFreeUseCount(serviceKey);
    if (currentCount >= maxFreeUses) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, clientCount: currentCount }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'limit_reached') {
          setShowUpgrade(true);
          return;
        }
        throw new Error(data.error || data.message || 'Request failed');
      }

      // Track usage on success
      incrementFreeUse(serviceKey);
      setResults(data.result);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [serviceKey, apiEndpoint, maxFreeUses]);

  const reset = useCallback(() => {
    setResults(null);
    setError('');
  }, []);

  return { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit, reset };
}
