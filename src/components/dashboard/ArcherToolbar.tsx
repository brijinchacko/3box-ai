'use client';

import { useState } from 'react';

export type ArcherFilter = 'all' | 'applied' | 'emailed' | 'interview' | 'offer' | 'queued' | 'rejected';

interface ArcherToolbarProps {
  counts?: Record<ArcherFilter, number>;
  onTabChange?: (tab: ArcherFilter) => void;
  activeTab?: ArcherFilter;
}

const DEFAULT_COUNTS: Record<ArcherFilter, number> = {
  all: 0, applied: 0, emailed: 0, interview: 0, offer: 0, queued: 0, rejected: 0,
};

const FILTERS: { id: ArcherFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'applied', label: 'Applied' },
  { id: 'emailed', label: 'Emailed' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
  { id: 'queued', label: 'Queued' },
  { id: 'rejected', label: 'Rejected' },
];

export default function ArcherToolbar({ counts = DEFAULT_COUNTS, onTabChange, activeTab }: ArcherToolbarProps) {
  const [localActive, setLocalActive] = useState<ArcherFilter>('all');
  const active = activeTab ?? localActive;

  const handleTabClick = (tab: ArcherFilter) => {
    setLocalActive(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-white/5 bg-white/[0.01] overflow-x-auto scrollbar-none">
      {FILTERS.map(f => {
        const sel = active === f.id;
        const count = counts[f.id] ?? 0;
        return (
          <button
            key={f.id}
            onClick={() => handleTabClick(f.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] whitespace-nowrap transition-all ${
              sel ? 'bg-white/[0.07] text-white/70' : 'text-white/30 hover:text-white/50'
            }`}
          >
            {f.label}
            <span className={`text-[9px] px-1 rounded ${
              sel ? 'bg-white/10 text-white/50' : 'text-white/20'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
