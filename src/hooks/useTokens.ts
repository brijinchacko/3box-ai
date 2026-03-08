'use client';

import { useState, useEffect, useCallback } from 'react';
import { canAfford as checkAfford, tokensRemaining, tokenUsagePercent } from '@/lib/tokens/pricing';

interface TokenData {
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  loading: boolean;
  error: string | null;
}

export function useTokens(pollInterval = 30000) {
  const [data, setData] = useState<TokenData>({
    used: 0,
    limit: 0,
    remaining: 0,
    percentUsed: 0,
    loading: true,
    error: null,
  });

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) throw new Error('Failed to fetch token data');
      const profile = await res.json();

      const used = profile.aiCreditsUsed ?? 0;
      const limit = profile.aiCreditsLimit ?? 0;

      setData({
        used,
        limit,
        remaining: tokensRemaining(used, limit),
        percentUsed: tokenUsagePercent(used, limit),
        loading: false,
        error: null,
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
