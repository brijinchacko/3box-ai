'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ArrowRight, User, Search, FileText, Send, Mic } from 'lucide-react';
import { AgentAvatarMini } from '@/components/brand/AgentAvatar';
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
  title: string;
  description: string;
  href: string;
  checkKey: keyof JourneyData;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'profile',
    icon: User,
    title: 'Complete Profile',
    description: 'Set up your career preferences',
    href: '/dashboard',
    checkKey: 'onboarding',
  },
  {
    id: 'scout',
    agentId: 'scout',
    icon: Search,
    title: 'Deploy Scout',
    description: 'Find jobs matching your profile',
    href: '/dashboard/jobs',
    checkKey: 'careerPlan',
  },
  {
    id: 'forge',
    agentId: 'forge',
    icon: FileText,
    title: 'Optimize with Forge',
    description: 'Build an ATS-ready resume',
    href: '/dashboard/resume',
    checkKey: 'resume',
  },
  {
    id: 'archer',
    agentId: 'archer',
    icon: Send,
    title: 'Apply with Archer',
    description: 'Auto-apply to matched jobs',
    href: '/dashboard/applications',
    checkKey: 'applied',
  },
  {
    id: 'atlas',
    agentId: 'atlas',
    icon: Mic,
    title: 'Prep with Atlas',
    description: 'Practice for interviews',
    href: '/dashboard/interview',
    checkKey: 'interview',
  },
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

  // Hide if all steps are done
  if (allDone) return null;

  const currentStep = WORKFLOW_STEPS[currentStepIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Your Career Journey</h3>
          <p className="text-[11px] text-white/30">{completedCount} of {WORKFLOW_STEPS.length} steps completed</p>
        </div>
        {currentStep && (
          <Link
            href={currentStep.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-xs font-medium text-neon-blue hover:bg-neon-blue/20 transition-colors"
          >
            Next: {currentStep.title}
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Steps Row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {WORKFLOW_STEPS.map((step, i) => {
          const isCompleted = journey[step.checkKey];
          const isCurrent = i === currentStepIndex;
          const isLocked = i > currentStepIndex;
          const StepIcon = step.icon;

          return (
            <Link
              key={step.id}
              href={step.href}
              className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all min-w-[180px] ${
                isCompleted
                  ? 'bg-neon-green/5 border-neon-green/15 hover:bg-neon-green/10'
                  : isCurrent
                    ? 'bg-neon-blue/5 border-neon-blue/20 hover:bg-neon-blue/10'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] opacity-50'
              }`}
            >
              {/* Step indicator */}
              <div className={`relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                isCompleted
                  ? 'bg-neon-green/15'
                  : isCurrent
                    ? 'bg-neon-blue/15'
                    : 'bg-white/5'
              }`}>
                {isCompleted ? (
                  <Check className="w-4 h-4 text-neon-green" />
                ) : step.agentId ? (
                  <AgentAvatarMini agentId={step.agentId} size={20} />
                ) : (
                  <StepIcon className={`w-4 h-4 ${isCurrent ? 'text-neon-blue' : 'text-white/30'}`} />
                )}
                {isCurrent && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-neon-blue animate-pulse" />
                )}
              </div>

              {/* Text */}
              <div className="min-w-0">
                <div className={`text-xs font-semibold truncate ${
                  isCompleted ? 'text-neon-green/80' : isCurrent ? 'text-white' : 'text-white/40'
                }`}>
                  {step.title}
                </div>
                <div className="text-[10px] text-white/25 truncate">{step.description}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
