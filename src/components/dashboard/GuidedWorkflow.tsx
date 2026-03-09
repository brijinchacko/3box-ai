'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, User, Search, FileText, Send, Mic } from 'lucide-react';
import type { AgentId } from '@/lib/agents/registry';

interface JourneyData {
  onboarding: boolean;
  assessment: boolean;
  careerPlan: boolean;
  resume: boolean;
  applied: boolean;
  interview: boolean;
  offer: boolean;
}

interface GuidedWorkflowProps {
  journey: JourneyData;
}

interface WorkflowStep {
  id: string;
  agentId?: AgentId;
  icon: React.ElementType;
  label: string;
  href: string;
  checkKey: keyof JourneyData;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'profile', icon: User, label: 'Profile', href: '/dashboard', checkKey: 'onboarding' },
  { id: 'scout', agentId: 'scout', icon: Search, label: 'Scout', href: '/dashboard/jobs', checkKey: 'careerPlan' },
  { id: 'forge', agentId: 'forge', icon: FileText, label: 'Resume', href: '/dashboard/resume', checkKey: 'resume' },
  { id: 'archer', agentId: 'archer', icon: Send, label: 'Apply', href: '/dashboard/applications', checkKey: 'applied' },
  { id: 'atlas', agentId: 'atlas', icon: Mic, label: 'Interview', href: '/dashboard/interview', checkKey: 'interview' },
];

export default function GuidedWorkflow({ journey }: GuidedWorkflowProps) {
  const { currentStepIndex, completedCount, allDone } = useMemo(() => {
    let firstIncomplete = WORKFLOW_STEPS.length;
    let completed = 0;
    for (let i = 0; i < WORKFLOW_STEPS.length; i++) {
      if (journey[WORKFLOW_STEPS[i].checkKey]) {
        completed++;
      } else if (firstIncomplete === WORKFLOW_STEPS.length) {
        firstIncomplete = i;
      }
    }
    return {
      currentStepIndex: firstIncomplete,
      completedCount: completed,
      allDone: completed === WORKFLOW_STEPS.length,
    };
  }, [journey]);

  if (allDone) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]"
    >
      {/* Progress label */}
      <span className="text-[11px] font-medium text-white/40 whitespace-nowrap hidden sm:block">
        {completedCount}/{WORKFLOW_STEPS.length}
      </span>

      {/* Progress bar (thin) */}
      <div className="hidden sm:block w-12 h-1 rounded-full bg-white/[0.06] overflow-hidden flex-shrink-0">
        <div
          className="h-full rounded-full bg-neon-blue transition-all duration-500"
          style={{ width: `${(completedCount / WORKFLOW_STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step buttons */}
      <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
        {WORKFLOW_STEPS.map((step, i) => {
          const isCompleted = journey[step.checkKey];
          const isCurrent = i === currentStepIndex;
          const StepIcon = step.icon;

          return (
            <Link
              key={step.id}
              href={step.href}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                isCompleted
                  ? 'text-neon-green/70 hover:bg-neon-green/5'
                  : isCurrent
                    ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                    : 'text-white/25 hover:text-white/40 hover:bg-white/[0.03]'
              }`}
            >
              {isCompleted ? (
                <Check className="w-3 h-3" />
              ) : (
                <StepIcon className="w-3 h-3" />
              )}
              {step.label}
              {isCurrent && (
                <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
