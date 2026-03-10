'use client';

import { useState } from 'react';
import { ClipboardCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export type SentinelTab = 'queue' | 'approved' | 'flagged' | 'rejected';

interface SentinelToolbarProps {
  counts?: Partial<Record<SentinelTab, number>>;
  qualityScore?: number;
  onTabChange?: (tab: SentinelTab) => void;
  activeTab?: SentinelTab;
}

const TABS: { id: SentinelTab; label: string; icon: typeof ClipboardCheck }[] = [
  { id: 'queue', label: 'Review Queue', icon: ClipboardCheck },
  { id: 'approved', label: 'Approved', icon: CheckCircle2 },
  { id: 'flagged', label: 'Flagged', icon: AlertTriangle },
  { id: 'rejected', label: 'Rejected', icon: XCircle },
];

export default function SentinelToolbar({ counts = {}, qualityScore, onTabChange, activeTab }: SentinelToolbarProps) {
  const [localActive, setLocalActive] = useState<SentinelTab>('queue');
  const active = activeTab ?? localActive;

  const handleTabClick = (tab: SentinelTab) => {
    setLocalActive(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-white/5 bg-white/[0.01]">
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
        {TABS.map(t => {
          const Icon = t.icon;
          const sel = active === t.id;
          const count = counts[t.id];
          return (
            <button
              key={t.id}
              onClick={() => handleTabClick(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-all ${
                sel ? 'bg-white/[0.07] text-white/70' : 'text-white/30 hover:text-white/50'
              }`}
            >
              <Icon className="w-3 h-3" />
              {t.label}
              {count !== undefined && count > 0 && (
                <span className={`text-[9px] px-1 rounded ${
                  sel ? 'bg-white/10 text-white/50' : 'text-white/20'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {qualityScore !== undefined && (
        <span className={`text-[10px] whitespace-nowrap flex-shrink-0 px-1.5 py-0.5 rounded ${
          qualityScore >= 80 ? 'text-green-400/60 bg-green-500/5' :
          qualityScore >= 60 ? 'text-yellow-400/60 bg-yellow-500/5' :
          'text-red-400/60 bg-red-500/5'
        }`}>
          Q-Score {qualityScore}
        </span>
      )}
    </div>
  );
}
