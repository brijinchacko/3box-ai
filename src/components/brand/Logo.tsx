'use client';

import { useEffect } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  // Load Orbitron (sharp-edge geometric font) — TEST ONLY
  useEffect(() => {
    if (document.querySelector('link[data-logo-font]')) return;
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&display=swap';
    link.rel = 'stylesheet';
    link.setAttribute('data-logo-font', 'true');
    document.head.appendChild(link);
  }, []);

  const fontStack = "'Orbitron', 'Consolas', 'Courier New', monospace";

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
        {/* Sharp-corner 3 boxes */}
        <rect x="11" y="1" width="20" height="14" rx="1" fill="url(#logoIconGrad)" />
        <rect x="1" y="10" width="14" height="12" rx="1" fill="url(#logoIconGrad)" />
        <rect x="11" y="18" width="12" height="13" rx="1" fill="url(#logoIconGrad)" />
      </svg>
    );
  }

  // ── 3BOX AI — sharp edge geometric logo ──
  if (size === 'lg') {
    return (
      <svg width={220} height={48} viewBox="0 0 220 48" fill="none" className={className}>
        <defs>
          <linearGradient id="logoFullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        {/* 3 sharp boxes icon */}
        <rect x="14" y="2" width="26" height="20" rx="1" fill="url(#logoFullGrad)" />
        <rect x="1" y="13" width="20" height="17" rx="1" fill="url(#logoFullGrad)" />
        <rect x="14" y="27" width="17" height="19" rx="1" fill="url(#logoFullGrad)" />
        {/* 3BOX — Orbitron sharp edge */}
        <text x="50" y="35" fontFamily={fontStack} fontSize="28" fontWeight="800" letterSpacing="3" fill="white">3BOX</text>
        {/* AI — gradient */}
        <text x="170" y="35" fontFamily={fontStack} fontSize="28" fontWeight="800" letterSpacing="3" fill="url(#logoFullGrad)">AI</text>
      </svg>
    );
  }

  if (size === 'md') {
    return (
      <svg width={172} height={36} viewBox="0 0 172 36" fill="none" className={className}>
        <defs>
          <linearGradient id="logoFullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <rect x="11" y="2" width="20" height="15" rx="1" fill="url(#logoFullGrad)" />
        <rect x="1" y="10" width="15" height="13" rx="1" fill="url(#logoFullGrad)" />
        <rect x="11" y="20" width="13" height="15" rx="1" fill="url(#logoFullGrad)" />
        <text x="38" y="27" fontFamily={fontStack} fontSize="22" fontWeight="800" letterSpacing="2.5" fill="white">3BOX</text>
        <text x="134" y="27" fontFamily={fontStack} fontSize="22" fontWeight="800" letterSpacing="2.5" fill="url(#logoFullGrad)">AI</text>
      </svg>
    );
  }

  // sm
  return (
    <svg width={128} height={28} viewBox="0 0 128 28" fill="none" className={className}>
      <defs>
        <linearGradient id="logoFullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect x="7" y="1" width="14" height="11" rx="1" fill="url(#logoFullGrad)" />
      <rect x="1" y="7" width="11" height="10" rx="1" fill="url(#logoFullGrad)" />
      <rect x="7" y="14" width="10" height="13" rx="1" fill="url(#logoFullGrad)" />
      <text x="26" y="21" fontFamily={fontStack} fontSize="16" fontWeight="800" letterSpacing="2" fill="white">3BOX</text>
      <text x="100" y="21" fontFamily={fontStack} fontSize="16" fontWeight="800" letterSpacing="2" fill="url(#logoFullGrad)">AI</text>
    </svg>
  );
}
