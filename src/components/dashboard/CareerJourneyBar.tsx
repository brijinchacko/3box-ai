'use client';

import Link from 'next/link';
import {
  UserCheck, Brain, Target, BookOpen, FileText,
  Send, MessageSquare, Trophy
} from 'lucide-react';

export interface JourneyProgress {
  onboarding: boolean;
  assessment: boolean;
  careerPlan: boolean;
  resume: boolean;
  applied: boolean;
  interview: boolean;
  offer: boolean;
}

const journeySteps = [
  { key: 'onboarding', label: 'Onboarding', icon: UserCheck, href: '/dashboard', color: 'neon-green' },
  { key: 'assessment', label: 'Assessment', icon: Brain, href: '/dashboard/assessment', color: 'neon-blue' },
  { key: 'careerPlan', label: 'Career Plan', icon: Target, href: '/dashboard/career-plan', color: 'neon-purple' },
  { key: 'resume', label: 'Resume', icon: FileText, href: '/dashboard/resume', color: 'neon-blue' },
  { key: 'applied', label: 'Applied', icon: Send, href: '/dashboard/jobs', color: 'neon-green' },
  { key: 'interview', label: 'Interview', icon: MessageSquare, href: '/dashboard/interview', color: 'yellow-400' },
  { key: 'offer', label: 'Job Landed', icon: Trophy, href: '/dashboard/jobs', color: 'neon-green' },
];

interface CareerJourneyBarProps {
  journey?: JourneyProgress;
  loading: boolean;
}

export default function CareerJourneyBar({ journey, loading }: CareerJourneyBarProps) {
  if (loading) {
    return (
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-sm border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          <div className="h-6 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!journey) return null;

  const completedCount = journeySteps.filter((s) => journey[s.key as keyof JourneyProgress]).length;
  const percent = Math.round((completedCount / journeySteps.length) * 100);

  // Find current step (first incomplete)
  const currentStepIdx = journeySteps.findIndex((s) => !journey[s.key as keyof JourneyProgress]);

  return (
    <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-sm border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center gap-3">
          {/* Steps */}
          <div className="flex items-center gap-0 flex-1 min-w-0">
            {journeySteps.map((step, i) => {
              const done = journey[step.key as keyof JourneyProgress];
              const isCurrent = i === currentStepIdx;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex items-center">
                  <Link
                    href={step.href}
                    title={step.label}
                    className={`relative flex items-center justify-center rounded-full transition-all ${
                      done
                        ? 'w-6 h-6 bg-gradient-to-br from-neon-green/80 to-neon-blue/80 text-white'
                        : isCurrent
                          ? 'w-6 h-6 bg-neon-blue/20 border border-neon-blue/50 text-neon-blue'
                          : 'w-5 h-5 bg-white/5 border border-white/10 text-white/20'
                    }`}
                  >
                    <StepIcon className={done ? 'w-3 h-3' : isCurrent ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
                    {isCurrent && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-neon-blue rounded-full animate-pulse" />
                    )}
                  </Link>
                  {/* Connector */}
                  {i < journeySteps.length - 1 && (
                    <div className={`h-px flex-1 min-w-[8px] max-w-[24px] ${
                      done && journey[journeySteps[i + 1].key as keyof JourneyProgress]
                        ? 'bg-gradient-to-r from-neon-green/60 to-neon-blue/60'
                        : done
                          ? 'bg-neon-green/30'
                          : 'bg-white/10'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress label */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-gradient-to-r from-neon-green to-neon-blue rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-[10px] text-white/40 whitespace-nowrap">
              {completedCount}/{journeySteps.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
