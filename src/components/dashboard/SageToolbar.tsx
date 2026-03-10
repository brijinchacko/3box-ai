'use client';

import { useState } from 'react';
import { Route, BarChart3, GraduationCap, TrendingUp } from 'lucide-react';

export type SageTab = 'path' | 'gaps' | 'courses' | 'trends';

interface SageToolbarProps {
  progress?: number;
  moduleCount?: number;
  onTabChange?: (tab: SageTab) => void;
  activeTab?: SageTab;
}

const TABS: { id: SageTab; label: string; icon: typeof Route }[] = [
  { id: 'path', label: 'Learning Path', icon: Route },
  { id: 'gaps', label: 'Skill Gaps', icon: BarChart3 },
  { id: 'courses', label: 'Courses', icon: GraduationCap },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
];

export default function SageToolbar({ progress, moduleCount, onTabChange, activeTab }: SageToolbarProps) {
  const [localActive, setLocalActive] = useState<SageTab>('path');
  const active = activeTab ?? localActive;

  const handleTabClick = (tab: SageTab) => {
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
              {t.id === 'courses' && moduleCount !== undefined && moduleCount > 0 && (
                <span className="text-[9px] bg-white/10 text-white/40 px-1 rounded">{moduleCount}</span>
              )}
            </button>
          );
        })}
      </div>
      {progress !== undefined && progress > 0 && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400/40 transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-white/20">{progress}%</span>
        </div>
      )}
    </div>
  );
}
