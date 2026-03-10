'use client';

import { Hammer, Search, Bookmark, Target, Compass, Check } from 'lucide-react';

export interface JourneyStep {
  id: string;
  label: string;
  agentId: string;
  icon: typeof Hammer;
  done: boolean;
  detail?: string;
}

interface CortexToolbarProps {
  steps: JourneyStep[];
  onNavigate: (agentId: string) => void;
}

export const DEFAULT_STEPS: Omit<JourneyStep, 'done' | 'detail'>[] = [
  { id: 'resume',    label: 'Finalize Resume',  agentId: 'forge',  icon: Hammer },
  { id: 'scout',     label: 'Deploy Scout',     agentId: 'scout',  icon: Search },
  { id: 'save',      label: 'Save Jobs',        agentId: 'scout',  icon: Bookmark },
  { id: 'apply',     label: 'Apply',            agentId: 'archer', icon: Target },
  { id: 'interview', label: 'Prep Interviews',  agentId: 'atlas',  icon: Compass },
];

export default function CortexToolbar({ steps, onNavigate }: CortexToolbarProps) {
  const currentIdx = steps.findIndex(s => !s.done);

  return (
    <div className="px-3 py-2 border-b border-white/5 bg-white/[0.01]">
      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isCurrent = i === currentIdx;
          const isDone = step.done;
          const isPast = i < currentIdx || (currentIdx === -1); // all done

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => onNavigate(step.agentId)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] whitespace-nowrap transition-all ${
                  isDone
                    ? 'text-emerald-400/70 hover:text-emerald-400'
                    : isCurrent
                      ? 'bg-white/[0.06] text-white/70 shadow-[0_0_8px_rgba(0,212,255,0.08)]'
                      : 'text-white/20 hover:text-white/35'
                }`}
                title={step.detail || step.label}
              >
                {/* Step number or check */}
                {isDone ? (
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2 h-2 text-emerald-400" />
                  </span>
                ) : (
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold ${
                    isCurrent
                      ? 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/20'
                      : 'bg-white/5 text-white/20'
                  }`}>
                    {i + 1}
                  </span>
                )}
                <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                <span className={isCurrent ? 'font-medium' : ''}>{step.label}</span>
                {isDone && step.detail && (
                  <span className="text-[8px] text-emerald-400/50 ml-0.5">{step.detail}</span>
                )}
              </button>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className={`w-3 h-px flex-shrink-0 ${
                  isPast && isDone ? 'bg-emerald-500/20' : 'bg-white/5'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current step guidance */}
      {currentIdx >= 0 && (
        <button
          onClick={() => onNavigate(steps[currentIdx].agentId)}
          className="mt-1.5 flex items-center gap-1.5 text-[9px] text-cyan-400/50 hover:text-cyan-400/70 transition-colors"
        >
          <span className="w-1 h-1 rounded-full bg-cyan-400/40 animate-pulse" />
          Next: {steps[currentIdx].label}
          {steps[currentIdx].agentId !== 'cortex' && (
            <span className="text-white/15">→ Go to {steps[currentIdx].agentId.charAt(0).toUpperCase() + steps[currentIdx].agentId.slice(1)}</span>
          )}
        </button>
      )}

      {currentIdx === -1 && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-emerald-400/50">
          <span className="w-1 h-1 rounded-full bg-emerald-400/40" />
          All steps complete — your pipeline is running
        </div>
      )}
    </div>
  );
}
