'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getLoadingTips } from '@/lib/tools/loadingTips';

interface LoadingEngagementProps {
  toolSlug: string;
  agentName?: string;
}

const PROGRESS_STEPS = [
  { label: 'Analyzing', pct: 15 },
  { label: 'Processing', pct: 45 },
  { label: 'Generating', pct: 75 },
  { label: 'Finalizing', pct: 95 },
];

export default function LoadingEngagement({ toolSlug, agentName }: LoadingEngagementProps) {
  const tips = getLoadingTips(toolSlug);
  const [tipIndex, setTipIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  // Rotate tips every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // Advance progress steps
  useEffect(() => {
    const delays = [2000, 4000, 8000]; // step 0→1 after 2s, 1→2 after 4s, 2→3 after 8s
    if (stepIndex < PROGRESS_STEPS.length - 1) {
      const timeout = setTimeout(() => {
        setStepIndex(prev => prev + 1);
      }, delays[stepIndex] || 3000);
      return () => clearTimeout(timeout);
    }
  }, [stepIndex]);

  const currentStep = PROGRESS_STEPS[stepIndex];

  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4">
      {/* Pulsing agent indicator */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-neon-green/10 flex items-center justify-center animate-pulse">
          <Loader2 className="w-6 h-6 text-neon-green animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full bg-neon-green/5 animate-ping" />
      </div>

      {/* Agent name */}
      {agentName && (
        <p className="text-sm font-medium text-white/70">
          {agentName} is working...
        </p>
      )}

      {/* Progress steps */}
      <div className="flex items-center gap-2 text-xs text-white/50">
        {PROGRESS_STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                i <= stepIndex ? 'bg-neon-green' : 'bg-white/20'
              }`}
            />
            <span className={i === stepIndex ? 'text-neon-green font-medium' : ''}>
              {step.label}
            </span>
            {i < PROGRESS_STEPS.length - 1 && (
              <div className={`w-4 h-px ${i < stepIndex ? 'bg-neon-green/50' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-neon-green/70 to-neon-green rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${currentStep.pct}%` }}
        />
      </div>

      {/* Rotating tip */}
      <p className="text-sm text-white/60 text-center min-h-[2.5rem] flex items-center transition-opacity duration-300">
        {tips[tipIndex]}
      </p>
    </div>
  );
}
