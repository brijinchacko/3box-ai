'use client';

// =============================================================================
// 3BOX AI - Region Selector
// =============================================================================
// A glass-morphism dropdown that shows the current region flag + currency
// and allows users to manually switch regions.
// =============================================================================

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useRegion } from '@/lib/geo';
import type { Region } from '@/lib/geo';

// ---------------------------------------------------------------------------
// Region display data
// ---------------------------------------------------------------------------

interface RegionOption {
  region: Region;
  flag: string;
  label: string;
  currency: string;
}

const REGION_OPTIONS: RegionOption[] = [
  { region: 'IN', flag: '\u{1F1EE}\u{1F1F3}', label: 'India', currency: 'INR' },
  { region: 'US', flag: '\u{1F1FA}\u{1F1F8}', label: 'United States', currency: 'USD' },
  { region: 'UK', flag: '\u{1F1EC}\u{1F1E7}', label: 'United Kingdom', currency: 'GBP' },
  { region: 'CA', flag: '\u{1F1E8}\u{1F1E6}', label: 'Canada', currency: 'CAD' },
  { region: 'AE', flag: '\u{1F1E6}\u{1F1EA}', label: 'UAE', currency: 'AED' },
  { region: 'SG', flag: '\u{1F1F8}\u{1F1EC}', label: 'Singapore', currency: 'SGD' },
  { region: 'AU', flag: '\u{1F1E6}\u{1F1FA}', label: 'Australia', currency: 'AUD' },
  { region: 'NL', flag: '\u{1F1EA}\u{1F1FA}', label: 'Europe', currency: 'EUR' },
  { region: 'PH', flag: '\u{1F1F5}\u{1F1ED}', label: 'Southeast Asia', currency: 'USD' },
  { region: 'AF', flag: '\u{1F30D}', label: 'Africa', currency: 'USD' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RegionSelector() {
  const { region, currencySymbol, currency, setRegion, isLoading } = useRegion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const current = REGION_OPTIONS.find((r) => r.region === region) ?? REGION_OPTIONS[1]; // default US

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 animate-pulse">
        <div className="w-4 h-4 rounded-full bg-white/10" />
        <div className="w-12 h-3 rounded bg-white/10" />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative inline-block">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm text-white/60 hover:text-white/80"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span>{currencySymbol} {currency}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full mt-2 right-0 z-50 min-w-[220px] rounded-xl bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 py-1 overflow-hidden"
          role="listbox"
          aria-label="Select region"
        >
          {REGION_OPTIONS.map((option) => {
            const isActive = option.region === region;
            return (
              <button
                key={option.region}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setRegion(option.region);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                <span className="text-base leading-none">{option.flag}</span>
                <span className="flex-1 text-left">{option.label}</span>
                <span className="text-xs text-white/30">{option.currency}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
