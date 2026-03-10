'use client';

import { useState } from 'react';
import { MessageSquare, Building2, Target, Trophy } from 'lucide-react';

export type AtlasTab = 'practice' | 'mock' | 'company' | 'results';

interface AtlasToolbarProps {
  sessionCount?: number;
  avgScore?: number;
  onTabChange?: (tab: AtlasTab) => void;
  activeTab?: AtlasTab;
}

const TABS: { id: AtlasTab; label: string; icon: typeof MessageSquare }[] = [
  { id: 'practice', label: 'Practice', icon: MessageSquare },
  { id: 'mock', label: 'Mock Interview', icon: Target },
  { id: 'company', label: 'Company Prep', icon: Building2 },
  { id: 'results', label: 'Results', icon: Trophy },
];

export default function AtlasToolbar({ sessionCount = 0, avgScore, onTabChange, activeTab }: AtlasToolbarProps) {
  const [localActive, setLocalActive] = useState<AtlasTab>('practice');
  const active = activeTab ?? localActive;

  const handleTabClick = (tab: AtlasTab) => {
    setLocalActive(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-white/5 bg-white/[0.01]">
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
        {TABS.map(t => {
          const Icon = t.icon;
          const sel = active === t.id;
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
              {t.id === 'results' && avgScore !== undefined && (
                <span className="text-[9px] bg-white/10 text-white/40 px-1 rounded">{avgScore}%</span>
              )}
            </button>
          );
        })}
      </div>
      {sessionCount > 0 && (
        <span className="text-[10px] text-white/20 whitespace-nowrap flex-shrink-0">
          {sessionCount} session{sessionCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
