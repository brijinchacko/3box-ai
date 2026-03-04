'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  if (!showText) {
    const s = size === 'sm' ? 24 : size === 'md' ? 32 : 48;
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none" className={className}>
        <defs>
          <linearGradient id="logoIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <rect x="11" y="1" width="20" height="14" rx="3" fill="url(#logoIconGrad)" />
        <rect x="1" y="10" width="14" height="12" rx="3" fill="url(#logoIconGrad)" />
        <rect x="11" y="18" width="12" height="13" rx="3" fill="url(#logoIconGrad)" />
      </svg>
    );
  }

  // Unified "nxtED AI" — no space between nxt and ED
  if (size === 'lg') {
    return (
      <svg width={220} height={48} viewBox="0 0 220 48" fill="none" className={className}>
        <defs>
          <linearGradient id="logoFullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <rect x="16" y="1" width="28" height="21" rx="4" fill="url(#logoFullGrad)" />
        <rect x="1" y="14" width="21" height="18" rx="4" fill="url(#logoFullGrad)" />
        <rect x="16" y="27" width="18" height="20" rx="4" fill="url(#logoFullGrad)" />
        <text x="54" y="35" fontFamily="'Nunito', 'Inter', system-ui, sans-serif" fontSize="28" fontWeight="900" letterSpacing="-0.5" fill="white">nxtED</text>
        <text x="156" y="35" fontFamily="'Nunito', 'Inter', system-ui, sans-serif" fontSize="28" fontWeight="900" letterSpacing="-0.5" fill="url(#logoFullGrad)"> AI</text>
      </svg>
    );
  }

  if (size === 'md') {
    return (
      <svg width={160} height={36} viewBox="0 0 160 36" fill="none" className={className}>
        <defs>
          <linearGradient id="logoFullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <rect x="12" y="1" width="21" height="16" rx="3" fill="url(#logoFullGrad)" />
        <rect x="1" y="10" width="16" height="14" rx="3" fill="url(#logoFullGrad)" />
        <rect x="12" y="20" width="14" height="15" rx="3" fill="url(#logoFullGrad)" />
        <text x="41" y="27" fontFamily="'Nunito', 'Inter', system-ui, sans-serif" fontSize="22" fontWeight="900" letterSpacing="-0.3" fill="white">nxtED</text>
        <text x="117" y="27" fontFamily="'Nunito', 'Inter', system-ui, sans-serif" fontSize="22" fontWeight="900" letterSpacing="-0.3" fill="url(#logoFullGrad)"> AI</text>
      </svg>
    );
  }

  // sm
  return (
    <svg width={115} height={28} viewBox="0 0 115 28" fill="none" className={className}>
      <defs>
        <linearGradient id="logoFullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect x="8" y="1" width="15" height="12" rx="2.5" fill="url(#logoFullGrad)" />
      <rect x="1" y="8" width="11" height="10" rx="2.5" fill="url(#logoFullGrad)" />
      <rect x="8" y="15" width="10" height="12" rx="2.5" fill="url(#logoFullGrad)" />
      <text x="28" y="21" fontFamily="'Nunito', 'Inter', system-ui, sans-serif" fontSize="16" fontWeight="900" letterSpacing="-0.2" fill="white">nxtED</text>
      <text x="85" y="21" fontFamily="'Nunito', 'Inter', system-ui, sans-serif" fontSize="16" fontWeight="900" letterSpacing="-0.2" fill="url(#logoFullGrad)"> AI</text>
    </svg>
  );
}
