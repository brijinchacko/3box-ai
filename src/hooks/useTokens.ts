'use client';

import { useState, useEffect, useCallback } from 'react';

interface ApplicationCapData {
  used: number;
  limit: number;
  remaining: number;
  limitType: 'weekly' | 'daily';
  allowed: boolean;
  resetsAt: string | null;
}

interface TokenData {
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  loading: boolean;
  error: string | null;
  // Application cap (replaces old dailyCap)
  dailyCap: ApplicationCapData;
}

const DEFAULT_CAP: ApplicationCapData = {
  used: 0,
  limit: 10,
  remaining: 10,
  limitType: 'weekly',
  allowed: true,
  resetsAt: null,
};

/**
 * Hook for application limits (replaces old token system).
 * AI operations are unlimited — this only tracks application limits.
 */
export function useTokens(pollInterval = 30000) {
  const [data, setData] = useState<TokenData>({
    used: 0,
    limit: 0,
    remaining: 0,
    percentUsed: 0,
    loading: true,
    error: null,
    dailyCap: DEFAULT_CAP,
  });

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch('/api/user/application-cap');
      if (!res.ok) throw new Error('Failed to fetch application cap');
      const cap = await res.json();

      const appCap: ApplicationCapData = {
        used: cap.used ?? 0,
        limit: cap.limit ?? 10,
        remaining: cap.remaining ?? 0,
        limitType: cap.limitType ?? 'weekly',
        allowed: cap.allowed ?? true,
        resetsAt: cap.resetsAt ?? null,
      };

      const percentUsed = appCap.limit > 0
        ? Math.min(100, Math.round((appCap.used / appCap.limit) * 100))
        : 0;

      setData({
        used: appCap.used,
        limit: appCap.limit,
        remaining: appCap.remaining,
        percentUsed,
        loading: false,
        error: null,
        dailyCap: appCap,
      });
    } catch (err: any) {
      setData(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, []);

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, pollInterval);
    return () => clearInterval(interval);
  }, [fetchTokens, pollInterval]);

  // canAfford is now always true for AI operations (they're unlimited)
  // Application limits are checked separately via the cap
  const canAfford = useCallback(
    (_cost: number) => data.dailyCap.allowed,
    [data.dailyCap.allowed]
  );

  return {
    ...data,
    refresh: fetchTokens,
    canAfford,
  };
}
