'use client';

import { useState, useEffect, useCallback } from 'react';
import { canAfford as checkAfford, tokensRemaining, tokenUsagePercent } from '@/lib/tokens/pricing';

interface DailyCapData {
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  resetsAt: string; // ISO string
}

interface TokenData {
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  loading: boolean;
  error: string | null;
  // Daily application cap
  dailyCap: DailyCapData;
}

const DEFAULT_DAILY_CAP: DailyCapData = {
  used: 0,
  limit: 30,
  remaining: 30,
  isUnlimited: false,
  resetsAt: '',
};

export function useTokens(pollInterval = 30000) {
  const [data, setData] = useState<TokenData>({
    used: 0,
    limit: 0,
    remaining: 0,
    percentUsed: 0,
    loading: true,
    error: null,
    dailyCap: DEFAULT_DAILY_CAP,
  });

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) throw new Error('Failed to fetch token data');
      const profile = await res.json();

      const used = profile.aiCreditsUsed ?? 0;
      const limit = profile.aiCreditsLimit ?? 0;

      // Parse daily cap from profile response
      const dc = profile.dailyCap;
      const dailyCap: DailyCapData = dc
        ? {
            used: dc.used ?? 0,
            limit: dc.limit ?? 30,
            remaining: dc.isUnlimited ? Infinity : (dc.remaining ?? 30),
            isUnlimited: dc.isUnlimited ?? false,
            resetsAt: dc.resetsAt ?? '',
          }
        : DEFAULT_DAILY_CAP;

      setData({
        used,
        limit,
        remaining: tokensRemaining(used, limit),
        percentUsed: tokenUsagePercent(used, limit),
        loading: false,
        error: null,
        dailyCap,
      });
    } catch (err: any) {
      setData(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, pollInterval);
    return () => clearInterval(interval);
  }, [fetchTokens, pollInterval]);

  const canAfford = useCallback(
    (cost: number) => checkAfford(data.used, data.limit, cost),
    [data.used, data.limit]
  );

  return {
    ...data,
    refresh: fetchTokens,
    canAfford,
  };
}
