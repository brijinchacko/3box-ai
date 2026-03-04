'use client';

import { useRef, useState, useEffect } from 'react';

/**
 * Horace — the NXTED AI career coach avatar.
 * nxtED icon shape with interactive eyes that track the mouse, blink on click,
 * and react to context with expressive eye animations.
 */

export type HoraceExpression = 'normal' | 'heart' | 'star' | 'surprised' | 'happy' | 'thinking';

interface HoraceAvatarProps {
  size?: number;
  expression?: HoraceExpression;
  mirrored?: boolean;
}

export default function HoraceAvatar({ size = 48, expression = 'normal', mirrored = false }: HoraceAvatarProps) {
  const avatarRef = useRef<HTMLDivElement>(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [blinkScale, setBlinkScale] = useState(1);
  const [bounce, setBounce] = useState(false);

  // Bounce animation when expression changes
  useEffect(() => {
    if (expression !== 'normal') {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 300);
      return () => clearTimeout(t);
    }
  }, [expression]);

  // Mouse tracking (only for normal expression)
  useEffect(() => {
    if (expression !== 'normal') return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!avatarRef.current) return;
      const rect = avatarRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxMove = size * 0.04;
      const factor = Math.min(dist / 250, 1);
      const angle = Math.atan2(dy, dx);
      setPupilOffset({
        x: Math.cos(angle) * maxMove * factor,
        y: Math.sin(angle) * maxMove * factor,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [size, expression]);

  // Periodic blink + click-triggered blink (only for normal)
  useEffect(() => {
    if (expression !== 'normal') {
      setBlinkScale(1);
      return;
    }
    let timerId: ReturnType<typeof setTimeout>;
    let openId: ReturnType<typeof setTimeout>;
    const doBlink = () => {
      setBlinkScale(0.1);
      openId = setTimeout(() => setBlinkScale(1), 120);
    };
    const scheduleNextBlink = () => {
      timerId = setTimeout(() => { doBlink(); scheduleNextBlink(); }, 2500 + Math.random() * 3000);
    };
    timerId = setTimeout(() => { doBlink(); scheduleNextBlink(); }, 1500 + Math.random() * 2000);

    const handleClick = () => doBlink();
    window.addEventListener('click', handleClick);
    return () => { clearTimeout(timerId); clearTimeout(openId); window.removeEventListener('click', handleClick); };
  }, [expression]);

  const scale = size / 32;
  const eyeY = 6;
  const eyeSpacing = 4.5;
  const eyeR = 2.8;
  const pupilR = 1.5;
  const leftEyeX = 21 - eyeSpacing;
  const rightEyeX = 21 + eyeSpacing;

  const renderEyes = () => {
    switch (expression) {
      case 'heart':
        return (
          <>
            <g transform={`translate(${leftEyeX}, ${eyeY})`}>
              <path d="M0,1.5 C0,0.5 -2.2,-0.2 -2.2,-1.5 C-2.2,-2.6 -1.2,-3 0,-2 C1.2,-3 2.2,-2.6 2.2,-1.5 C2.2,-0.2 0,0.5 0,1.5Z" fill="#ff4d6a" />
            </g>
            <g transform={`translate(${rightEyeX}, ${eyeY})`}>
              <path d="M0,1.5 C0,0.5 -2.2,-0.2 -2.2,-1.5 C-2.2,-2.6 -1.2,-3 0,-2 C1.2,-3 2.2,-2.6 2.2,-1.5 C2.2,-0.2 0,0.5 0,1.5Z" fill="#ff4d6a" />
            </g>
          </>
        );
      case 'star':
        return (
          <>
            <g transform={`translate(${leftEyeX}, ${eyeY})`}>
              <polygon points="0,-2.8 0.8,-1 2.6,-1 1.2,0.2 1.7,2 0,1 -1.7,2 -1.2,0.2 -2.6,-1 -0.8,-1" fill="#fbbf24" />
            </g>
            <g transform={`translate(${rightEyeX}, ${eyeY})`}>
              <polygon points="0,-2.8 0.8,-1 2.6,-1 1.2,0.2 1.7,2 0,1 -1.7,2 -1.2,0.2 -2.6,-1 -0.8,-1" fill="#fbbf24" />
            </g>
          </>
        );
      case 'surprised':
        return (
          <>
            <ellipse cx={leftEyeX} cy={eyeY} rx={eyeR * 1.15} ry={eyeR * 1.3} fill="white" />
            <ellipse cx={leftEyeX} cy={eyeY + 0.3} rx={pupilR * 0.7} ry={pupilR * 0.7} fill="#0d0d1a" />
            <ellipse cx={rightEyeX} cy={eyeY} rx={eyeR * 1.15} ry={eyeR * 1.3} fill="white" />
            <ellipse cx={rightEyeX} cy={eyeY + 0.3} rx={pupilR * 0.7} ry={pupilR * 0.7} fill="#0d0d1a" />
          </>
        );
      case 'happy':
        return (
          <>
            <path
              d={`M${leftEyeX - eyeR},${eyeY + 0.5} Q${leftEyeX},${eyeY - 2.5} ${leftEyeX + eyeR},${eyeY + 0.5}`}
              stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round"
            />
            <path
              d={`M${rightEyeX - eyeR},${eyeY + 0.5} Q${rightEyeX},${eyeY - 2.5} ${rightEyeX + eyeR},${eyeY + 0.5}`}
              stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round"
            />
          </>
        );
      case 'thinking':
        return (
          <>
            <ellipse cx={leftEyeX} cy={eyeY} rx={eyeR} ry={eyeR} fill="white" />
            <ellipse cx={leftEyeX + 1} cy={eyeY - 1} rx={pupilR} ry={pupilR} fill="#0d0d1a" />
            <ellipse cx={rightEyeX} cy={eyeY} rx={eyeR} ry={eyeR} fill="white" />
            <ellipse cx={rightEyeX + 1} cy={eyeY - 1} rx={pupilR} ry={pupilR} fill="#0d0d1a" />
          </>
        );
      default:
        return (
          <>
            {/* Left eye */}
            <ellipse cx={leftEyeX} cy={eyeY} rx={eyeR} ry={eyeR * blinkScale} fill="white" style={{ transition: 'ry 0.08s ease-in-out' }} />
            <ellipse cx={leftEyeX + pupilOffset.x / scale} cy={eyeY + pupilOffset.y / scale} rx={pupilR} ry={pupilR * blinkScale} fill="#0d0d1a" style={{ transition: 'ry 0.08s ease-in-out' }} />
            {/* Right eye */}
            <ellipse cx={rightEyeX} cy={eyeY} rx={eyeR} ry={eyeR * blinkScale} fill="white" style={{ transition: 'ry 0.08s ease-in-out' }} />
            <ellipse cx={rightEyeX + pupilOffset.x / scale} cy={eyeY + pupilOffset.y / scale} rx={pupilR} ry={pupilR * blinkScale} fill="#0d0d1a" style={{ transition: 'ry 0.08s ease-in-out' }} />
          </>
        );
    }
  };

  return (
    <div
      ref={avatarRef}
      className="relative inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        transform: `${mirrored ? 'scaleX(-1) ' : ''}${bounce ? 'scale(1.15)' : 'scale(1)'}`,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id={`horaceGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <rect x="11" y="1" width="20" height="14" rx="3" fill={`url(#horaceGrad-${size})`} />
        <rect x="1" y="10" width="14" height="12" rx="3" fill={`url(#horaceGrad-${size})`} />
        <rect x="11" y="18" width="12" height="13" rx="3" fill={`url(#horaceGrad-${size})`} />
        {renderEyes()}
      </svg>
    </div>
  );
}
