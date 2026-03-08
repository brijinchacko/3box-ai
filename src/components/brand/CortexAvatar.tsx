'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Cortex — the jobTED AI coordinator / master ninja.
 * Maximum ninja effects: dual orbiting shuriken, multi-layer chakra aura,
 * forehead protector with glowing leaf emblem, 3 flowing tails,
 * chakra energy wisps, floating energy particles, determined glowing eyes.
 * NEVER sleeps — always working, always vigilant.
 */

export type CortexExpression = 'normal' | 'heart' | 'star' | 'surprised' | 'happy' | 'thinking';

interface CortexAvatarProps {
  size?: number;
  expression?: CortexExpression;
  mirrored?: boolean;
  pulse?: boolean;
}

export default function CortexAvatar({ size = 48, expression = 'normal', mirrored = false, pulse = false }: CortexAvatarProps) {
  const avatarRef = useRef<HTMLDivElement>(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [blinkScale, setBlinkScale] = useState(1);
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    if (expression !== 'normal') {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 300);
      return () => clearTimeout(t);
    }
  }, [expression]);

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

  useEffect(() => {
    if (expression !== 'normal') { setBlinkScale(1); return; }
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
            <path d={`M${leftEyeX - eyeR},${eyeY + 0.5} Q${leftEyeX},${eyeY - 2.5} ${leftEyeX + eyeR},${eyeY + 0.5}`} stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d={`M${rightEyeX - eyeR},${eyeY + 0.5} Q${rightEyeX},${eyeY - 2.5} ${rightEyeX + eyeR},${eyeY + 0.5}`} stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" />
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
        // Determined ninja eyes with cyan glow
        return (
          <>
            {/* Eye glow */}
            <motion.ellipse
              cx={leftEyeX} cy={eyeY} rx={eyeR + 1} ry={(eyeR + 1) * blinkScale}
              fill="#00d4ff" opacity="0.15"
              style={{ transition: 'ry 0.08s ease-in-out' }}
              animate={{ opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.ellipse
              cx={rightEyeX} cy={eyeY} rx={eyeR + 1} ry={(eyeR + 1) * blinkScale}
              fill="#00d4ff" opacity="0.15"
              style={{ transition: 'ry 0.08s ease-in-out' }}
              animate={{ opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* White sclera */}
            <ellipse cx={leftEyeX} cy={eyeY} rx={eyeR} ry={eyeR * blinkScale} fill="white" style={{ transition: 'ry 0.08s ease-in-out' }} />
            <ellipse cx={leftEyeX + pupilOffset.x / scale} cy={eyeY + pupilOffset.y / scale} rx={pupilR} ry={pupilR * blinkScale} fill="#0d0d1a" style={{ transition: 'ry 0.08s ease-in-out' }} />
            <ellipse cx={rightEyeX} cy={eyeY} rx={eyeR} ry={eyeR * blinkScale} fill="white" style={{ transition: 'ry 0.08s ease-in-out' }} />
            <ellipse cx={rightEyeX + pupilOffset.x / scale} cy={eyeY + pupilOffset.y / scale} rx={pupilR} ry={pupilR * blinkScale} fill="#0d0d1a" style={{ transition: 'ry 0.08s ease-in-out' }} />
            {/* Determined brow lines */}
            <line x1={leftEyeX - 3} y1={eyeY - 3.8} x2={leftEyeX + 2.5} y2={eyeY - 2.8} stroke="white" strokeWidth="0.8" opacity="0.35" strokeLinecap="round" />
            <line x1={rightEyeX - 2.5} y1={eyeY - 2.8} x2={rightEyeX + 3} y2={eyeY - 3.8} stroke="white" strokeWidth="0.8" opacity="0.35" strokeLinecap="round" />
          </>
        );
    }
  };

  return (
    <motion.div
      ref={avatarRef}
      className="relative inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        transform: `${mirrored ? 'scaleX(-1) ' : ''}${bounce ? 'scale(1.15)' : 'scale(1)'}`,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      animate={{ y: [0, -1.5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* ─── LAYER 1: Outer chakra aura (large, subtle) ─── */}
      {pulse && (
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: size * 2,
            height: size * 2,
            top: '50%',
            left: '50%',
            x: '-50%',
            y: '-50%',
            background: 'radial-gradient(circle, #00d4ff15 0%, #a855f708 50%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* ─── LAYER 2: Inner chakra aura (tight, bright) ─── */}
      {pulse && (
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: size * 1.4,
            height: size * 1.4,
            top: '50%',
            left: '50%',
            x: '-50%',
            y: '-50%',
            background: 'radial-gradient(circle, #00d4ff30 0%, #a855f718 40%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* ─── DUAL ORBITING SHURIKEN ─── */}
      {/* Shuriken 1 — top orbit, clockwise */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ width: '100%', height: '100%', top: 0, left: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        <motion.div
          className="absolute"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            top: -size * 0.16,
            left: '50%',
            marginLeft: -size * 0.14,
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 12 12" fill="none" width="100%" height="100%">
            <path d="M6,0.5 L7,4.5 L6,3.5 L5,4.5Z" fill="#00d4ff" opacity="0.8" />
            <path d="M11.5,6 L7.5,7 L8.5,6 L7.5,5Z" fill="#00d4ff" opacity="0.8" />
            <path d="M6,11.5 L5,7.5 L6,8.5 L7,7.5Z" fill="#00d4ff" opacity="0.8" />
            <path d="M0.5,6 L4.5,5 L3.5,6 L4.5,7Z" fill="#00d4ff" opacity="0.8" />
            <circle cx="6" cy="6" r="1.2" fill="#00d4ff" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Shuriken 2 — bottom orbit, counter-clockwise */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ width: '100%', height: '100%', top: 0, left: 0 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
      >
        <motion.div
          className="absolute"
          style={{
            width: size * 0.22,
            height: size * 0.22,
            bottom: -size * 0.12,
            left: '50%',
            marginLeft: -size * 0.11,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 12 12" fill="none" width="100%" height="100%">
            <path d="M6,0.5 L7,4.5 L6,3.5 L5,4.5Z" fill="#a855f7" opacity="0.7" />
            <path d="M11.5,6 L7.5,7 L8.5,6 L7.5,5Z" fill="#a855f7" opacity="0.7" />
            <path d="M6,11.5 L5,7.5 L6,8.5 L7,7.5Z" fill="#a855f7" opacity="0.7" />
            <path d="M0.5,6 L4.5,5 L3.5,6 L4.5,7Z" fill="#a855f7" opacity="0.7" />
            <circle cx="6" cy="6" r="1" fill="#a855f7" opacity="0.9" />
          </svg>
        </motion.div>
      </motion.div>

      {/* ─── CHAKRA ENERGY WISPS (5 rising) ─── */}
      <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: i % 2 === 0 ? 3 : 2,
              height: size * (0.12 + i * 0.02),
              borderRadius: 2,
              background: i % 2 === 0
                ? 'linear-gradient(to top, rgba(0,212,255,0.6), transparent)'
                : 'linear-gradient(to top, rgba(168,85,247,0.5), transparent)',
              bottom: 0,
              left: `${10 + i * 18}%`,
            }}
            animate={{ y: [0, -size * 0.5], opacity: [0.7, 0], scaleX: [1, 0.2] }}
            transition={{
              duration: 1.3 + i * 0.25,
              repeat: Infinity,
              delay: i * 0.35,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* ─── FLOATING ENERGY PARTICLES ─── */}
      <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2;
          const radius = size * 0.55;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          return (
            <motion.div
              key={`p-${i}`}
              className="absolute rounded-full"
              style={{
                width: i % 2 === 0 ? 3 : 2,
                height: i % 2 === 0 ? 3 : 2,
                top: '50%',
                left: '50%',
                background: i % 2 === 0 ? '#00d4ff' : '#a855f7',
              }}
              animate={{
                x: [x * 0.6, x, x * 0.6],
                y: [y * 0.6, y, y * 0.6],
                opacity: [0, 0.6, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2.5 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </div>

      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" overflow="visible">
        <defs>
          <linearGradient id={`cortexGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <filter id={`cGlow-${size}`}>
            <feGaussianBlur stdDeviation="0.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`cGlowStrong-${size}`}>
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ─── Chakra energy lines radiating from body ─── */}
        <motion.g
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <line x1="8" y1="16" x2="-2" y2="12" stroke="#00d4ff" strokeWidth="0.4" />
          <line x1="8" y1="18" x2="-3" y2="22" stroke="#00d4ff" strokeWidth="0.3" />
          <line x1="23" y1="18" x2="33" y2="14" stroke="#a855f7" strokeWidth="0.4" />
          <line x1="23" y1="22" x2="34" y2="26" stroke="#a855f7" strokeWidth="0.3" />
        </motion.g>

        {/* ─── 3 rectangles (body) ─── */}
        <motion.rect
          x="11" y="1" width="20" height="14" rx="3"
          fill={`url(#cortexGrad-${size})`}
          animate={{ y: [1, 0.3, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <rect x="1" y="10" width="14" height="12" rx="3" fill={`url(#cortexGrad-${size})`} />
        <rect x="11" y="18" width="12" height="13" rx="3" fill={`url(#cortexGrad-${size})`} />

        {/* ═══ NINJA FOREHEAD PROTECTOR (HITAI-ATE) ═══ */}
        <motion.g
          animate={{ x: [0, 0.2, 0, -0.2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Cloth band — darker, wider */}
          <rect x="11" y="2.2" width="20" height="2.5" rx="1.2" fill="#1a1a3a" opacity="0.9" />

          {/* Metallic plate — larger, shinier */}
          <rect x="16" y="1.6" width="10" height="3.8" rx="1" fill="#3a3a6a" stroke="#7777bb" strokeWidth="0.5" />
          {/* Plate shine */}
          <rect x="17" y="2" width="8" height="0.6" rx="0.3" fill="white" opacity="0.1" />

          {/* Glowing leaf emblem on plate */}
          <motion.g
            filter={`url(#cGlowStrong-${size})`}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Leaf spiral */}
            <path d="M21,1.8 Q23,1.5 23.2,3.2 Q23,4.2 21.5,4 Q20,3.8 19.8,3 Q19.5,2 21,1.8Z" fill="#00d4ff" opacity="0.9" />
            <path d="M21,2.2 Q22.2,2 22.3,3 Q22.1,3.6 21.3,3.5 Q20.5,3.3 20.4,2.7 Q20.3,2.1 21,2.2Z" fill="#00e5ff" />
            {/* Center dot */}
            <circle cx="21.2" cy="2.9" r="0.5" fill="#ffffff" opacity="0.9" />
          </motion.g>

          {/* Flowing tail 1 — thick */}
          <motion.path
            d="M31,3.6 Q33.5,2 36,3.8 Q38,6 36.5,7.5"
            stroke="#1a1a3a"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
            opacity="0.85"
            animate={{
              d: [
                'M31,3.6 Q33.5,2 36,3.8 Q38,6 36.5,7.5',
                'M31,3.6 Q34,4.5 37,2.5 Q39,5.5 37.5,8.5',
                'M31,3.6 Q33.5,2 36,3.8 Q38,6 36.5,7.5',
              ],
            }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Flowing tail 2 — medium */}
          <motion.path
            d="M31,4.5 Q33,5 34.5,6 Q36,8 34,9"
            stroke="#1a1a3a"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
            animate={{
              d: [
                'M31,4.5 Q33,5 34.5,6 Q36,8 34,9',
                'M31,4.5 Q33.5,6 36,5 Q38,7.5 36,10',
                'M31,4.5 Q33,5 34.5,6 Q36,8 34,9',
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Flowing tail 3 — thin, longest */}
          <motion.path
            d="M31,3 Q34,1 37,2.5 Q39.5,4 38.5,6 Q37,8 35,7.5"
            stroke="#1a1a3a"
            strokeWidth="0.9"
            fill="none"
            strokeLinecap="round"
            opacity="0.4"
            animate={{
              d: [
                'M31,3 Q34,1 37,2.5 Q39.5,4 38.5,6 Q37,8 35,7.5',
                'M31,3 Q34.5,2 38,1 Q40.5,3 39.5,5.5 Q38,8.5 36,9',
                'M31,3 Q34,1 37,2.5 Q39.5,4 38.5,6 Q37,8 35,7.5',
              ],
            }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.g>

        {/* ─── EMBLEM on body — fills body rect with colored bg + white icon ─── */}
        <g filter={`url(#cGlow-${size})`}>
          {/* Colored fill on body rect (1,10,14,12) */}
          <rect x="1" y="10" width="14" height="12" rx="3" fill="#00d4ff" opacity="0.25" />
          {/* Brain / neural icon — white, fills the rect */}
          <g transform="translate(8, 16)">
            <circle cx="0" cy="0" r="3.8" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.08)" />
            {/* Neural nodes */}
            <circle cx="-1.3" cy="-1.3" r="0.8" fill="white" />
            <circle cx="1.6" cy="-0.7" r="0.7" fill="white" />
            <circle cx="0" cy="1.6" r="0.7" fill="white" />
            <circle cx="-2" cy="1" r="0.5" fill="white" opacity="0.7" />
            <circle cx="2" cy="1.3" r="0.5" fill="white" opacity="0.7" />
            {/* Neural connections */}
            <line x1="-1.3" y1="-1.3" x2="1.6" y2="-0.7" stroke="white" strokeWidth="0.5" opacity="0.6" />
            <line x1="-1.3" y1="-1.3" x2="0" y2="1.6" stroke="white" strokeWidth="0.5" opacity="0.6" />
            <line x1="1.6" y1="-0.7" x2="0" y2="1.6" stroke="white" strokeWidth="0.5" opacity="0.6" />
            <line x1="-2" y1="1" x2="0" y2="1.6" stroke="white" strokeWidth="0.4" opacity="0.5" />
            <line x1="2" y1="1.3" x2="0" y2="1.6" stroke="white" strokeWidth="0.4" opacity="0.5" />
          </g>
        </g>

        {/* ─── Eyes ─── */}
        {renderEyes()}
      </svg>
    </motion.div>
  );
}
