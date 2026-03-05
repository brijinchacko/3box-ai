'use client';

// =============================================================================
// NXTED AI — Region Context Provider
// =============================================================================
// Provides region, currency, pricing, and formatting utilities to all client
// components via React Context. Auto-detects geo on mount; allows manual
// overrides for testing or user preference.
// =============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  type Region,
  type RegionConfig,
  type RegionPricing,
  getRegionByCountryCode,
  getRegionConfig,
  formatPrice as formatPriceUtil,
  applyStudentDiscount,
} from './regions';
import { detectCountryFromTimezone } from './detect';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RegionContextValue {
  /** Current region config */
  region: Region;
  countryCode: string;
  country: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  pricing: RegionPricing;
  tagline: string;
  studentDiscount: number;

  /** Whether the geo detection is still loading */
  isLoading: boolean;

  /** Format a price for the current region */
  formatPrice: (amount: number) => string;

  /** Apply student discount to an amount */
  getStudentPrice: (amount: number) => number;

  /** Manually switch region (e.g. user preference or testing) */
  setRegion: (region: Region) => void;

  /** Manually set by country code */
  setCountryCode: (code: string) => void;

  /** Full config object for advanced use */
  config: RegionConfig;
}

// ---------------------------------------------------------------------------
// Storage Key
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'nxted-region';
const COUNTRY_STORAGE_KEY = 'nxted-country-code';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const RegionContext = createContext<RegionContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface RegionProviderProps {
  children: ReactNode;
  /** Optional: pre-detected country code from middleware cookie */
  initialCountryCode?: string;
}

export function RegionProvider({ children, initialCountryCode }: RegionProviderProps) {
  const [config, setConfig] = useState<RegionConfig>(() => {
    // If we have a server-side hint, use it immediately to avoid flash
    if (initialCountryCode) {
      return getRegionByCountryCode(initialCountryCode);
    }
    // Start with US defaults; will update on mount
    return getRegionByCountryCode('US');
  });

  const [isLoading, setIsLoading] = useState(!initialCountryCode);

  // -------------------------------------------------------------------
  // Set region from a Region key
  // -------------------------------------------------------------------
  const setRegion = useCallback((region: Region) => {
    const newConfig = getRegionConfig(region);
    setConfig(newConfig);
    setIsLoading(false);

    // Persist preference
    try {
      localStorage.setItem(STORAGE_KEY, region);
      localStorage.setItem(COUNTRY_STORAGE_KEY, newConfig.countryCode);
    } catch {
      // localStorage may be unavailable (SSR, private browsing, etc.)
    }
  }, []);

  // -------------------------------------------------------------------
  // Set region from a country code
  // -------------------------------------------------------------------
  const setCountryCode = useCallback((code: string) => {
    const newConfig = getRegionByCountryCode(code);
    setConfig(newConfig);
    setIsLoading(false);

    try {
      localStorage.setItem(STORAGE_KEY, newConfig.region);
      localStorage.setItem(COUNTRY_STORAGE_KEY, code);
    } catch {
      // Silently ignore
    }
  }, []);

  // -------------------------------------------------------------------
  // Auto-detect on mount
  // -------------------------------------------------------------------
  useEffect(() => {
    // If we already have a server-side initial value, skip detection
    if (initialCountryCode) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function detect() {
      // 1. Check localStorage for a saved preference
      try {
        const savedRegion = localStorage.getItem(STORAGE_KEY) as Region | null;
        if (savedRegion) {
          const saved = getRegionConfig(savedRegion);
          if (saved && !cancelled) {
            setConfig(saved);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // localStorage unavailable
      }

      // 2. Check cookie set by middleware
      try {
        const cookieMatch = document.cookie
          .split(';')
          .find((c) => c.trim().startsWith('nxted-region='));
        if (cookieMatch) {
          const code = cookieMatch.split('=')[1]?.trim();
          if (code && !cancelled) {
            const regionConfig = getRegionByCountryCode(code);
            setConfig(regionConfig);
            setIsLoading(false);

            // Save to localStorage for future
            try {
              localStorage.setItem(STORAGE_KEY, regionConfig.region);
              localStorage.setItem(COUNTRY_STORAGE_KEY, code);
            } catch {
              // Ignore
            }
            return;
          }
        }
      } catch {
        // Cookie parsing failed
      }

      // 3. Call the /api/geo endpoint
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch('/api/geo', {
          signal: controller.signal,
          cache: 'default',
        });

        clearTimeout(timeout);

        if (res.ok && !cancelled) {
          const data = await res.json();
          if (data.countryCode) {
            const regionConfig = getRegionByCountryCode(data.countryCode);
            setConfig(regionConfig);
            setIsLoading(false);

            try {
              localStorage.setItem(STORAGE_KEY, regionConfig.region);
              localStorage.setItem(COUNTRY_STORAGE_KEY, data.countryCode);
            } catch {
              // Ignore
            }
            return;
          }
        }
      } catch {
        // API call failed — fall through to timezone detection
      }

      // 4. Timezone-based fallback (entirely client-side, no network)
      if (!cancelled) {
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const countryCode = detectCountryFromTimezone(tz);
          const regionConfig = getRegionByCountryCode(countryCode);
          setConfig(regionConfig);

          try {
            localStorage.setItem(STORAGE_KEY, regionConfig.region);
            localStorage.setItem(COUNTRY_STORAGE_KEY, countryCode);
          } catch {
            // Ignore
          }
        } catch {
          // Even timezone detection failed — stay with US defaults
        }

        setIsLoading(false);
      }
    }

    detect();

    return () => {
      cancelled = true;
    };
  }, [initialCountryCode]);

  // -------------------------------------------------------------------
  // Memoized formatting helpers
  // -------------------------------------------------------------------
  const formatPrice = useCallback(
    (amount: number) => formatPriceUtil(amount, config.currency, config.locale),
    [config.currency, config.locale]
  );

  const getStudentPrice = useCallback(
    (amount: number) => applyStudentDiscount(amount, config.studentDiscount),
    [config.studentDiscount]
  );

  // -------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------
  const value = useMemo<RegionContextValue>(
    () => ({
      region: config.region,
      countryCode: config.countryCode,
      country: config.country,
      currency: config.currency,
      currencySymbol: config.currencySymbol,
      locale: config.locale,
      pricing: config.pricing,
      tagline: config.tagline,
      studentDiscount: config.studentDiscount,
      isLoading,
      formatPrice,
      getStudentPrice,
      setRegion,
      setCountryCode,
      config,
    }),
    [config, isLoading, formatPrice, getStudentPrice, setRegion, setCountryCode]
  );

  return (
    <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the current region context.
 * Must be used within a <RegionProvider>.
 */
export function useRegion(): RegionContextValue {
  const context = useContext(RegionContext);

  if (!context) {
    throw new Error(
      'useRegion() must be used within a <RegionProvider>. ' +
        'Wrap your app (or layout) with <RegionProvider>.'
    );
  }

  return context;
}
