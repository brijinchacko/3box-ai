'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface FeatureGateState {
  /** Whether the user's features are locked (FREE plan exhausted) */
  isLocked: boolean;
  /** Whether data is still loading */
  loading: boolean;
  /** Current plan */
  plan: string;
  /** Applications used */
  used: number;
  /** Application limit */
  limit: number;
  /** Remaining applications */
  remaining: number;
  /** 'weekly' for FREE, 'daily' for PRO/MAX */
  limitType: 'weekly' | 'daily';
  /** Refresh the gate status */
  refresh: () => Promise<void>;
}

/**
 * Hook that determines whether a FREE-plan user has exhausted their
 * weekly application limit and should be locked out of all features.
 *
 * PRO/MAX users are never locked (daily resets handle their limits).
 * FREE users are locked when totalAppsUsed >= 10.
 */
export function useFeatureGate(): FeatureGateState {
  const { data: session } = useSession();
  const plan = ((session?.user as any)?.plan ?? 'FREE').toUpperCase();

  const [state, setState] = useState<Omit<FeatureGateState, 'refresh' | 'plan'>>({
    isLocked: false,
    loading: true,
    used: 0,
    limit: 10,
    remaining: 10,
    limitType: 'weekly',
  });

  const fetchCap = useCallback(async () => {
    try {
      const res = await fetch('/api/user/application-cap');
      if (!res.ok) throw new Error('Failed to fetch cap');
      const cap = await res.json();

      const used = cap.used ?? 0;
      const limit = cap.limit ?? 10;
      const remaining = cap.remaining ?? 0;
      const limitType = cap.limitType ?? 'weekly';
      const allowed = cap.allowed ?? true;

      // Only FREE-plan users get fully locked when exhausted.
      // PRO/MAX users just can't apply more today — features stay open.
      const isLocked = plan === 'FREE' && !allowed;

      setState({ isLocked, loading: false, used, limit, remaining, limitType });
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [plan]);

  useEffect(() => {
    if (session) fetchCap();
  }, [session, fetchCap]);

  // Poll every 60 seconds
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(fetchCap, 60000);
    return () => clearInterval(interval);
  }, [session, fetchCap]);

  return { ...state, plan, refresh: fetchCap };
}
