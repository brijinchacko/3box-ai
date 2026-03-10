'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { type AgentId, AGENTS, COORDINATOR } from '@/lib/agents/registry';

/**
 * AgentAvatar — Each agent has a unique silhouette, unique eye style,
 * unique accessory (hat, eyebrows, glasses, etc.), highly visible white emblem,
 * mouse tracking, blinking, per-agent idle animations, auto-sleep with full
 * body squeeze, hover-to-wake.
 */

/* ═══════════════ TYPES ═══════════════ */

interface AgentAvatarProps {
  agentId: AgentId | 'cortex';
  size?: number;
  className?: string;
  pulse?: boolean;
  sleeping?: boolean; // deprecated — kept for backward compat, no longer used
  autoSleep?: boolean; // deprecated — kept for backward compat, no longer used
}

interface BodyShape {
  body: { x: number; y: number; w: number; h: number };
  legs: { x: number; y: number; w: number; h: number };
}

/* ═══════════════ CONSTANTS ═══════════════ */

const EYE_Y = 6;
const EYE_SPACING = 4.5;
const EYE_R = 2.8;
const PUPIL_R = 1.5;
const LEFT_EYE_X = 21 - EYE_SPACING;
const RIGHT_EYE_X = 21 + EYE_SPACING;

/* ═══════════════ COLOR HELPERS ═══════════════ */

function getAgentColors(agentId: AgentId | 'cortex'): { start: string; end: string } {
  if (agentId === 'cortex') return { start: COORDINATOR.colorHex, end: COORDINATOR.colorHexEnd };
  const agent = AGENTS[agentId];
  return { start: agent.colorHex, end: agent.colorHexEnd };
}

/* ═══════════════ PER-AGENT BODY SHAPE ═══════════════ */

function getBodyShape(_agentId: AgentId | 'cortex'): BodyShape {
  // Standard 3BOX logo shape — same for all agents
  return { body: { x: 1, y: 10, w: 14, h: 12 }, legs: { x: 11, y: 18, w: 12, h: 13 } };
}

/* ═══════════════ IDLE ANIMATIONS ═══════════════ */

function getIdleAnimation(agentId: AgentId | 'cortex') {
  switch (agentId) {
    case 'scout':
      return { animate: { x: [0, 2, 0, -2, 0] }, transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const } };
    case 'forge':
      return { animate: { scale: [1, 1.04, 0.98, 1.04, 1] }, transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const } };
    case 'archer':
      return { animate: { rotate: [0, -1, 2, 0], x: [0, -0.5, 1, 0] }, transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const } };
    case 'atlas':
      return { animate: { rotate: [0, 3, 0, -3, 0] }, transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' as const } };
    case 'sage':
      return { animate: { y: [0, -2, 0, 0.5, 0], rotate: [0, 0, -1, 1, 0] }, transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const } };
    case 'sentinel':
      return { animate: { x: [0, 2.5, 0, -2.5, 0], y: [0, -0.5, 0, -0.5, 0] }, transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const } };
    default:
      return { animate: { y: [0, -1.5, 0] }, transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const } };
  }
}

/* ═══════════════ PER-AGENT HAIR / ACCESSORIES ═══════════════ */

function AgentHair({ agentId, colors }: { agentId: AgentId | 'cortex'; colors: { start: string; end: string } }) {
  const c = colors.start;
  switch (agentId) {
    case 'scout':
      // Baseball cap with brim
      return (
        <g>
          {/* Cap dome */}
          <path d="M14,2 Q21,-1 28,2 L28,3.5 L14,3.5Z" fill={c} opacity="0.55" />
          {/* Brim sticking out */}
          <path d="M12,3.5 L31,3.5 L32,5 L11,5Z" fill={c} opacity="0.45" />
          {/* Cap button on top */}
          <circle cx="21" cy="0.5" r="0.7" fill={c} opacity="0.6" />
        </g>
      );
    case 'forge':
      // Safety goggles pushed up + thick eyebrows
      return (
        <g>
          {/* Goggles */}
          <circle cx="17.5" cy="2" r="2.2" stroke={c} strokeWidth="0.7" fill={`${c}25`} />
          <circle cx="24.5" cy="2" r="2.2" stroke={c} strokeWidth="0.7" fill={`${c}25`} />
          <rect x="19.7" y="1.5" width="2.6" height="1" rx="0.5" fill={c} opacity="0.5" />
          {/* Strap */}
          <line x1="12" y1="2.3" x2="15.3" y2="2.3" stroke={c} strokeWidth="0.6" opacity="0.4" />
          <line x1="26.7" y1="2.3" x2="30" y2="2.3" stroke={c} strokeWidth="0.6" opacity="0.4" />
          {/* Thick eyebrows */}
          <rect x={LEFT_EYE_X - 2.8} y={EYE_Y - 4.5} width="5.6" height="1.4" rx="0.7" fill="white" opacity="0.25" />
          <rect x={RIGHT_EYE_X - 2.8} y={EYE_Y - 4.5} width="5.6" height="1.4" rx="0.7" fill="white" opacity="0.25" />
        </g>
      );
    case 'archer':
      // Pointed hood with center line
      return (
        <g>
          <path d="M13,4 L21,-1 L29,4" stroke={c} strokeWidth="1" fill={`${c}20`} strokeLinejoin="round" />
          <line x1="21" y1="-1" x2="21" y2="2.5" stroke={c} strokeWidth="0.5" opacity="0.5" />
          {/* One raised brow */}
          <line x1={LEFT_EYE_X - 2} y1={EYE_Y - 2.8} x2={LEFT_EYE_X + 2.5} y2={EYE_Y - 3.5} stroke="white" strokeWidth="0.7" opacity="0.3" strokeLinecap="round" />
          <line x1={RIGHT_EYE_X - 2.5} y1={EYE_Y - 3} x2={RIGHT_EYE_X + 2} y2={EYE_Y - 2.5} stroke="white" strokeWidth="0.7" opacity="0.3" strokeLinecap="round" />
        </g>
      );
    case 'atlas':
      // Small crown with 3 peaks
      return (
        <g>
          <path d="M15,3 L17,-0.5 L19,2 L21,-1 L23,2 L25,-0.5 L27,3Z" fill={c} opacity="0.5" />
          {/* Gems */}
          <circle cx="17" cy="0" r="0.55" fill="white" opacity="0.7" />
          <circle cx="21" cy="-0.5" r="0.7" fill="white" opacity="0.8" />
          <circle cx="25" cy="0" r="0.55" fill="white" opacity="0.7" />
          {/* Wise curved brows */}
          <path d={`M${LEFT_EYE_X - 2.5},${EYE_Y - 3} Q${LEFT_EYE_X},${EYE_Y - 4.2} ${LEFT_EYE_X + 2.5},${EYE_Y - 3}`} stroke="white" strokeWidth="0.6" fill="none" opacity="0.25" strokeLinecap="round" />
          <path d={`M${RIGHT_EYE_X - 2.5},${EYE_Y - 3} Q${RIGHT_EYE_X},${EYE_Y - 4.2} ${RIGHT_EYE_X + 2.5},${EYE_Y - 3}`} stroke="white" strokeWidth="0.6" fill="none" opacity="0.25" strokeLinecap="round" />
        </g>
      );
    case 'sage':
      // Round glasses + thin gentle brows
      return (
        <g>
          <circle cx={LEFT_EYE_X} cy={EYE_Y} r={EYE_R + 1} stroke="white" strokeWidth="0.6" fill="none" opacity="0.35" />
          <circle cx={RIGHT_EYE_X} cy={EYE_Y} r={EYE_R + 1} stroke="white" strokeWidth="0.6" fill="none" opacity="0.35" />
          <line x1={LEFT_EYE_X + EYE_R + 1} y1={EYE_Y} x2={RIGHT_EYE_X - EYE_R - 1} y2={EYE_Y} stroke="white" strokeWidth="0.5" opacity="0.35" />
          <line x1={LEFT_EYE_X - EYE_R - 1} y1={EYE_Y} x2="12" y2={EYE_Y - 1.5} stroke="white" strokeWidth="0.4" opacity="0.25" />
          <line x1={RIGHT_EYE_X + EYE_R + 1} y1={EYE_Y} x2="30" y2={EYE_Y - 1.5} stroke="white" strokeWidth="0.4" opacity="0.25" />
          {/* Thin gentle arched brows */}
          <path d={`M${LEFT_EYE_X - 2.5},${EYE_Y - 4.5} Q${LEFT_EYE_X},${EYE_Y - 5.5} ${LEFT_EYE_X + 2.5},${EYE_Y - 4.5}`} stroke="white" strokeWidth="0.4" fill="none" opacity="0.2" strokeLinecap="round" />
          <path d={`M${RIGHT_EYE_X - 2.5},${EYE_Y - 4.5} Q${RIGHT_EYE_X},${EYE_Y - 5.5} ${RIGHT_EYE_X + 2.5},${EYE_Y - 4.5}`} stroke="white" strokeWidth="0.4" fill="none" opacity="0.2" strokeLinecap="round" />
        </g>
      );
    case 'sentinel':
      // Military beret / helmet
      return (
        <g>
          {/* Beret dome */}
          <ellipse cx="21" cy="1.5" rx="9" ry="3" fill={c} opacity="0.4" />
          {/* Band */}
          <rect x="12" y="2.5" width="18" height="1.8" rx="0.9" fill={c} opacity="0.3" />
          {/* Badge on beret */}
          <circle cx="17" cy="1.2" r="1" fill="white" opacity="0.4" />
          {/* Flat stern brows */}
          <rect x={LEFT_EYE_X - 2.5} y={EYE_Y - 3.8} width="5" height="0.9" rx="0.4" fill="white" opacity="0.25" />
          <rect x={RIGHT_EYE_X - 2.5} y={EYE_Y - 3.8} width="5" height="0.9" rx="0.4" fill="white" opacity="0.25" />
        </g>
      );
    default:
      return null;
  }
}

/* ═══════════════ PER-AGENT EYES ═══════════════ */

function AgentEyes({ agentId, blinkScale, pupilOffset, scale }: {
  agentId: AgentId | 'cortex';
  blinkScale: number;
  pupilOffset: { x: number; y: number };
  scale: number;
}) {
  const bs = blinkScale;
  const px = pupilOffset.x / scale;
  const py = pupilOffset.y / scale;
  const trans: React.CSSProperties = { transition: 'ry 0.08s ease-in-out' };

  switch (agentId) {
    case 'scout':
      // Narrow squinted eyes with angled V-brows
      return (
        <>
          <ellipse cx={LEFT_EYE_X} cy={EYE_Y} rx={EYE_R} ry={EYE_R * 0.6 * bs} fill="white" style={trans} />
          <ellipse cx={LEFT_EYE_X + px} cy={EYE_Y + py} rx={PUPIL_R} ry={PUPIL_R * 0.6 * bs} fill="#0d0d1a" style={trans} />
          <ellipse cx={RIGHT_EYE_X} cy={EYE_Y} rx={EYE_R} ry={EYE_R * 0.6 * bs} fill="white" style={trans} />
          <ellipse cx={RIGHT_EYE_X + px} cy={EYE_Y + py} rx={PUPIL_R} ry={PUPIL_R * 0.6 * bs} fill="#0d0d1a" style={trans} />
          {/* Determined V-brows */}
          <line x1={LEFT_EYE_X - 3} y1={EYE_Y - 3.5} x2={LEFT_EYE_X + 2} y2={EYE_Y - 2.3} stroke="white" strokeWidth="0.8" opacity="0.4" strokeLinecap="round" />
          <line x1={RIGHT_EYE_X - 2} y1={EYE_Y - 2.3} x2={RIGHT_EYE_X + 3} y2={EYE_Y - 3.5} stroke="white" strokeWidth="0.8" opacity="0.4" strokeLinecap="round" />
        </>
      );
    case 'forge':
      // Wide determined eyes (brows in AgentHair)
      return (
        <>
          <ellipse cx={LEFT_EYE_X} cy={EYE_Y} rx={EYE_R * 1.15} ry={EYE_R * bs} fill="white" style={trans} />
          <ellipse cx={LEFT_EYE_X + px} cy={EYE_Y + py} rx={PUPIL_R * 1.1} ry={PUPIL_R * bs} fill="#0d0d1a" style={trans} />
          <ellipse cx={RIGHT_EYE_X} cy={EYE_Y} rx={EYE_R * 1.15} ry={EYE_R * bs} fill="white" style={trans} />
          <ellipse cx={RIGHT_EYE_X + px} cy={EYE_Y + py} rx={PUPIL_R * 1.1} ry={PUPIL_R * bs} fill="#0d0d1a" style={trans} />
        </>
      );
    case 'archer':
      // Asymmetric aiming eyes (brows in AgentHair)
      return (
        <>
          <ellipse cx={LEFT_EYE_X} cy={EYE_Y} rx={EYE_R * 0.85} ry={EYE_R * 0.5 * bs} fill="white" style={trans} />
          <ellipse cx={LEFT_EYE_X + px} cy={EYE_Y + py} rx={PUPIL_R * 0.85} ry={PUPIL_R * 0.5 * bs} fill="#0d0d1a" style={trans} />
          <ellipse cx={RIGHT_EYE_X} cy={EYE_Y} rx={EYE_R * 1.05} ry={EYE_R * bs} fill="white" style={trans} />
          <ellipse cx={RIGHT_EYE_X + px} cy={EYE_Y + py} rx={PUPIL_R} ry={PUPIL_R * bs} fill="#0d0d1a" style={trans} />
          {/* Targeting glint */}
          <circle cx={RIGHT_EYE_X - 0.6} cy={EYE_Y - 0.8} r="0.6" fill="#22c55e" opacity="0.6" />
        </>
      );
    case 'atlas':
      // Large wise round eyes (brows in AgentHair)
      return (
        <>
          <ellipse cx={LEFT_EYE_X} cy={EYE_Y} rx={EYE_R * 1.2} ry={EYE_R * 1.15 * bs} fill="white" style={trans} />
          <ellipse cx={LEFT_EYE_X + px} cy={EYE_Y + py} rx={PUPIL_R * 1.1} ry={PUPIL_R * 1.1 * bs} fill="#0d0d1a" style={trans} />
          <ellipse cx={RIGHT_EYE_X} cy={EYE_Y} rx={EYE_R * 1.2} ry={EYE_R * 1.15 * bs} fill="white" style={trans} />
          <ellipse cx={RIGHT_EYE_X + px} cy={EYE_Y + py} rx={PUPIL_R * 1.1} ry={PUPIL_R * 1.1 * bs} fill="#0d0d1a" style={trans} />
          {/* Wisdom sparkle */}
          <circle cx={LEFT_EYE_X - 1} cy={EYE_Y - 1.2} r="0.7" fill="white" opacity="0.4" />
          <circle cx={RIGHT_EYE_X - 1} cy={EYE_Y - 1.2} r="0.7" fill="white" opacity="0.4" />
        </>
      );
    case 'sage':
      // Gentle soft eyes (glasses in AgentHair, brows in AgentHair)
      return (
        <>
          <ellipse cx={LEFT_EYE_X} cy={EYE_Y} rx={EYE_R * 0.9} ry={EYE_R * 0.9 * bs} fill="white" style={trans} />
          <ellipse cx={LEFT_EYE_X + px * 0.5} cy={EYE_Y + py * 0.5} rx={PUPIL_R * 0.9} ry={PUPIL_R * 0.9 * bs} fill="#0d0d1a" style={trans} />
          <ellipse cx={RIGHT_EYE_X} cy={EYE_Y} rx={EYE_R * 0.9} ry={EYE_R * 0.9 * bs} fill="white" style={trans} />
          <ellipse cx={RIGHT_EYE_X + px * 0.5} cy={EYE_Y + py * 0.5} rx={PUPIL_R * 0.9} ry={PUPIL_R * 0.9 * bs} fill="#0d0d1a" style={trans} />
        </>
      );
    case 'sentinel':
      // Wide alert eyes (brows in AgentHair)
      return (
        <>
          <ellipse cx={LEFT_EYE_X} cy={EYE_Y} rx={EYE_R * 1.1} ry={EYE_R * 1.1 * bs} fill="white" style={trans} />
          <ellipse cx={LEFT_EYE_X + px} cy={EYE_Y + py} rx={PUPIL_R} ry={PUPIL_R * bs} fill="#0d0d1a" style={trans} />
          <ellipse cx={RIGHT_EYE_X} cy={EYE_Y} rx={EYE_R * 1.1} ry={EYE_R * 1.1 * bs} fill="white" style={trans} />
          <ellipse cx={RIGHT_EYE_X + px} cy={EYE_Y + py} rx={PUPIL_R} ry={PUPIL_R * bs} fill="#0d0d1a" style={trans} />
          {/* Alert highlights */}
          <circle cx={LEFT_EYE_X - 0.7} cy={EYE_Y - 1} r="0.6" fill="white" opacity="0.55" />
          <circle cx={RIGHT_EYE_X - 0.7} cy={EYE_Y - 1} r="0.6" fill="white" opacity="0.55" />
        </>
      );
    default:
      return (
        <>
          <ellipse cx={LEFT_EYE_X} cy={EYE_Y} rx={EYE_R} ry={EYE_R * bs} fill="white" style={trans} />
          <ellipse cx={LEFT_EYE_X + px} cy={EYE_Y + py} rx={PUPIL_R} ry={PUPIL_R * bs} fill="#0d0d1a" style={trans} />
          <ellipse cx={RIGHT_EYE_X} cy={EYE_Y} rx={EYE_R} ry={EYE_R * bs} fill="white" style={trans} />
          <ellipse cx={RIGHT_EYE_X + px} cy={EYE_Y + py} rx={PUPIL_R} ry={PUPIL_R * bs} fill="#0d0d1a" style={trans} />
        </>
      );
  }
}

/* ═══════════════ PER-AGENT EMBLEM — FILLS body rect ═══════════════ */
/* Colored background fills entire body rectangle + large white icon.
   Consistent style across all agents, matching Cortex. */

function AgentEmblem({ agentId, bodyShape, filterId, colors }: {
  agentId: AgentId | 'cortex';
  bodyShape: BodyShape;
  filterId: string;
  colors: { start: string; end: string };
}) {
  // Body rectangle dimensions
  const { x: bx, y: by, w: bw, h: bh } = bodyShape.body;
  const cx = bx + bw / 2;   // 8
  const cy = by + bh / 2;   // 16

  // Dark shade behind white emblem for contrast
  const backdrop = (
    <rect
      x={bx} y={by} width={bw} height={bh} rx="3"
      fill="#0a0a1a" opacity="0.45"
    />
  );

  switch (agentId) {
    case 'scout':
      // Magnifying glass — centered in body rect
      return (
        <g filter={`url(#${filterId})`}>
          {backdrop}
          <g transform={`translate(${cx}, ${cy})`}>
            <circle cx="0" cy="0" r="3.2" stroke="white" strokeWidth="1.3" fill="rgba(255,255,255,0.08)" />
            <line x1="2.2" y1="2.2" x2="4.5" y2="4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="-1" cy="-1" r="0.7" fill="white" opacity="0.6" />
          </g>
        </g>
      );
    case 'forge':
      // Hammer — centered in body rect
      return (
        <g filter={`url(#${filterId})`}>
          {backdrop}
          <g transform={`translate(${cx}, ${cy})`}>
            <rect x="-3" y="-3.5" width="6" height="2.8" rx="0.7" fill="white" />
            <line x1="0" y1="-0.7" x2="0" y2="4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </g>
      );
    case 'archer':
      // Crosshair — fills body rect
      return (
        <g filter={`url(#${filterId})`}>
          {backdrop}
          <g transform={`translate(${cx}, ${cy})`}>
            <circle cx="0" cy="0" r="3.8" stroke="white" strokeWidth="1" fill="none" />
            <circle cx="0" cy="0" r="2" stroke="white" strokeWidth="0.7" fill="none" />
            <circle cx="0" cy="0" r="0.8" fill="white" />
            <line x1="0" y1="-4.8" x2="0" y2="-2.8" stroke="white" strokeWidth="0.9" />
            <line x1="0" y1="2.8" x2="0" y2="4.8" stroke="white" strokeWidth="0.9" />
            <line x1="-4.8" y1="0" x2="-2.8" y2="0" stroke="white" strokeWidth="0.9" />
            <line x1="2.8" y1="0" x2="4.8" y2="0" stroke="white" strokeWidth="0.9" />
          </g>
        </g>
      );
    case 'atlas':
      // Compass — fills body rect
      return (
        <g filter={`url(#${filterId})`}>
          {backdrop}
          <g transform={`translate(${cx}, ${cy})`}>
            <circle cx="0" cy="0" r="3.8" stroke="white" strokeWidth="1" fill="none" />
            <polygon points="0,-3.2 1,0 0,0.5 -1,0" fill="white" />
            <polygon points="0,3.2 1,0 0,-0.5 -1,0" fill="white" opacity="0.5" />
            <circle cx="0" cy="0" r="0.7" fill="white" />
          </g>
        </g>
      );
    case 'sage':
      // Open book — centered in body rect
      return (
        <g filter={`url(#${filterId})`}>
          {backdrop}
          <g transform={`translate(${cx}, ${cy - 0.5})`}>
            <path d="M-4.8,0 L0,-2.3 L4.8,0 L4.8,3.5 L0,1.5 L-4.8,3.5Z" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.08)" />
            <line x1="0" y1="-2.3" x2="0" y2="1.5" stroke="white" strokeWidth="0.8" />
            <line x1="-3.8" y1="1" x2="-0.5" y2="-0.5" stroke="white" strokeWidth="0.5" />
            <line x1="-3.8" y1="2" x2="-0.5" y2="0.5" stroke="white" strokeWidth="0.5" />
            <line x1="0.5" y1="-0.5" x2="3.8" y2="1" stroke="white" strokeWidth="0.5" />
            <line x1="0.5" y1="0.5" x2="3.8" y2="2" stroke="white" strokeWidth="0.5" />
          </g>
        </g>
      );
    case 'sentinel':
      // Shield — centered in body rect
      return (
        <g filter={`url(#${filterId})`}>
          {backdrop}
          <g transform={`translate(${cx}, ${cy + 0.3})`}>
            <path d="M0,-4.5 L4,-1.9 L4,0.7 C4,3 0,4.5 0,4.5 C0,4.5 -4,3 -4,0.7 L-4,-1.9Z" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.08)" />
            <line x1="0" y1="-2.2" x2="0" y2="2.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
            <line x1="-2" y1="0" x2="2" y2="0" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
          </g>
        </g>
      );
    default:
      return null;
  }
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */

export default function AgentAvatar({
  agentId, size = 48, className = '', pulse = false,
}: AgentAvatarProps) {
  const avatarRef = useRef<HTMLDivElement>(null);
  const [blinkScale, setBlinkScale] = useState(1);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  const colors = getAgentColors(agentId);
  const uid = `av-${agentId}-${size}`;
  const scale = size / 32;
  const bodyShape = useMemo(() => getBodyShape(agentId), [agentId]);
  const idle = useMemo(() => getIdleAnimation(agentId), [agentId]);

  /* ── Periodic blink ── */
  useEffect(() => {
    setBlinkScale(1);
    let tid: ReturnType<typeof setTimeout>;
    let oid: ReturnType<typeof setTimeout>;
    const blink = () => { setBlinkScale(0.1); oid = setTimeout(() => setBlinkScale(1), 120); };
    const loop = () => { tid = setTimeout(() => { blink(); loop(); }, 2500 + Math.random() * 3000); };
    tid = setTimeout(() => { blink(); loop(); }, 1500 + Math.random() * 2000);
    const onClick = () => blink();
    window.addEventListener('click', onClick);
    return () => { clearTimeout(tid); clearTimeout(oid); window.removeEventListener('click', onClick); };
  }, []);

  /* ── Mouse tracking ── */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!avatarRef.current) return;
      const r = avatarRef.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxM = size * 0.04;
      const f = Math.min(dist / 250, 1);
      const a = Math.atan2(dy, dx);
      setPupilOffset({ x: Math.cos(a) * maxM * f, y: Math.sin(a) * maxM * f });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [size]);

  const { body, legs } = bodyShape;

  return (
    <motion.div
      ref={avatarRef}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      animate={idle.animate}
      transition={idle.transition}
    >
      {/* Pulse glow */}
      {pulse && (
        <div
          className="absolute -inset-1 rounded-xl opacity-40 animate-pulse"
          style={{ background: `radial-gradient(circle, ${colors.start}40 0%, transparent 70%)` }}
        />
      )}

      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" overflow="visible">
        <defs>
          <linearGradient id={`${uid}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
          {/* Drop shadow for emblem visibility */}
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0.5" stdDeviation="1.2" floodColor="black" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* ═══ HEAD ═══ */}
        <rect x={11} y={1} width={20} height={14} rx="3" fill={`url(#${uid}-grad)`} />

        {/* ═══ BODY ═══ */}
        <rect x={body.x} y={body.y} width={body.w} height={body.h} rx="3" fill={`url(#${uid}-grad)`} />

        {/* ═══ LEGS ═══ */}
        <rect x={legs.x} y={legs.y} width={legs.w} height={legs.h} rx="3" fill={`url(#${uid}-grad)`} />

        {/* ═══ AGENT HAIR / ACCESSORY ═══ */}
        <AgentHair agentId={agentId} colors={colors} />

        {/* ═══ AGENT EMBLEM — fills body rect with colored bg + white icon ═══ */}
        <AgentEmblem agentId={agentId} bodyShape={bodyShape} filterId={`${uid}-glow`} colors={colors} />

        {/* ═══ EYES ═══ */}
        <AgentEyes agentId={agentId} blinkScale={blinkScale} pupilOffset={pupilOffset} scale={scale} />
      </svg>
    </motion.div>
  );
}

/**
 * Mini agent avatar for inline use (badges, lists, etc.)
 */
export function AgentAvatarMini({ agentId, size = 24 }: { agentId: AgentId | 'cortex'; size?: number }) {
  return <AgentAvatar agentId={agentId} size={size} />;
}
