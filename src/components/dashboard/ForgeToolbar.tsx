'use client';

import { useState } from 'react';
import { FileText, Mail, Linkedin, Check, Pencil } from 'lucide-react';

type ForgeTab = 'resume' | 'cover' | 'linkedin';

interface ForgeToolbarProps {
  hasResume?: boolean;
  isFinalized?: boolean;
  onEdit?: () => void;
}

const TABS: { id: ForgeTab; label: string; icon: typeof FileText }[] = [
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'cover', label: 'Cover Letter', icon: Mail },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
];

export default function ForgeToolbar({ hasResume = false, isFinalized = false, onEdit }: ForgeToolbarProps) {
  const [active, setActive] = useState<ForgeTab>('resume');

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
              {t.id === 'resume' && isFinalized && (
                <span className="flex items-center gap-0.5 text-[9px] bg-green-500/10 text-green-400 px-1 rounded">
                  <Check className="w-2.5 h-2.5" /> Final
                </span>
              )}
            </button>
          );
        })}
      </div>
      {hasResume && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px]
                     text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-all
                     whitespace-nowrap flex-shrink-0"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
      )}
    </div>
  );
}
