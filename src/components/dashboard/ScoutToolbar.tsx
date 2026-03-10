'use client';

import { useState } from 'react';
import { FileText, Search, Bookmark, Rocket, Loader2 } from 'lucide-react';

type ScoutTab = 'report' | 'discover' | 'saved';

interface ScoutToolbarProps {
  onDeploy: () => void;
  isWorking: boolean;
  savedCount?: number;
}

const TABS: { id: ScoutTab; label: string; icon: typeof Search }[] = [
  { id: 'report', label: 'Scout Report', icon: FileText },
  { id: 'discover', label: 'Discover Jobs', icon: Search },
  { id: 'saved', label: 'Saved Jobs', icon: Bookmark },
];

export default function ScoutToolbar({ onDeploy, isWorking, savedCount = 0 }: ScoutToolbarProps) {
  const [active, setActive] = useState<ScoutTab>('discover');

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-white/5 bg-white/[0.01]">
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
        {TABS.map(t => {
          const Icon = t.icon;
          const sel = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-all ${
                sel ? 'bg-white/[0.07] text-white/70' : 'text-white/30 hover:text-white/50'
              }`}
            >
              <Icon className="w-3 h-3" />
              {t.label}
              {t.id === 'saved' && savedCount > 0 && (
                <span className="text-[9px] bg-white/10 text-white/40 px-1 rounded">{savedCount}</span>
              )}
            </button>
          );
        })}
      </div>
      <button
        onClick={onDeploy}
        disabled={isWorking}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium
                   bg-blue-500/10 text-blue-400 hover:bg-blue-500/15 disabled:opacity-30
                   transition-all whitespace-nowrap flex-shrink-0"
      >
        {isWorking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
        Deploy Scout
      </button>
    </div>
  );
}
