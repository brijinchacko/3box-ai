'use client';

import { Moon } from 'lucide-react';

type AgentStatus = 'working' | 'idle' | 'sleeping';

interface AgentStatusBadgeProps {
  status: AgentStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const statusConfig: Record<AgentStatus, { label: string; dotClass: string; textClass: string }> = {
  working: {
    label: 'Working',
    dotClass: 'bg-neon-green animate-pulse',
    textClass: 'text-neon-green',
  },
  idle: {
    label: 'Idle',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-400/70',
  },
  sleeping: {
    label: 'Sleeping',
    dotClass: '',
    textClass: 'text-white/25',
  },
};

export default function AgentStatusBadge({ status, size = 'sm', showLabel = true }: AgentStatusBadgeProps) {
  const config = statusConfig[status];
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]';

  return (
    <div className="inline-flex items-center gap-1">
      {status === 'sleeping' ? (
        <Moon className={`${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-white/20`} />
      ) : (
        <span className={`${dotSize} rounded-full ${config.dotClass} flex-shrink-0`} />
      )}
      {showLabel && (
        <span className={`${textSize} font-medium ${config.textClass} leading-none`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

export type { AgentStatus };
