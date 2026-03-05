'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  { key: 'onboarding', label: 'Onboarding', description: 'Complete your profile and career preferences', icon: UserCheck, href: '/dashboard' },
  { key: 'assessment', label: 'Assessment', description: 'Take an AI skill assessment to find your strengths', icon: Brain, href: '/dashboard/assessment' },
  { key: 'careerPlan', label: 'Career Plan', description: 'Get a personalized career roadmap with milestones', icon: Target, href: '/dashboard/career-plan' },
  { key: 'resume', label: 'Resume', description: 'Build an ATS-optimized resume for your target role', icon: FileText, href: '/dashboard/resume' },
  { key: 'applied', label: 'Applied', description: 'Apply to jobs matching your skills and experience', icon: Send, href: '/dashboard/jobs' },
  { key: 'interview', label: 'Interview', description: 'Prepare with AI-powered mock interviews', icon: MessageSquare, href: '/dashboard/interview' },
  { key: 'offer', label: 'Job Landed', description: 'Congratulations! You landed your dream job', icon: Trophy, href: '/dashboard/jobs' },
];

interface CareerJourneyBarProps {
  journey?: JourneyProgress;
  loading: boolean;
}

export default function CareerJourneyBar({ journey, loading }: CareerJourneyBarProps) {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-sm border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="h-8 bg-white/5 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!journey) return null;

  const completedCount = journeySteps.filter((s) => journey[s.key as keyof JourneyProgress]).length;
  const percent = Math.round((completedCount / journeySteps.length) * 100);
  const currentStepIdx = journeySteps.findIndex((s) => !journey[s.key as keyof JourneyProgress]);

  return (
    <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-sm border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center gap-4">
          {/* Steps */}
          <div className="flex items-center gap-0 flex-1 min-w-0">
            {journeySteps.map((step, i) => {
              const done = journey[step.key as keyof JourneyProgress];
              const isCurrent = i === currentStepIdx;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex items-center">
                  {/* Step box + tooltip wrapper */}
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredStep(step.key)}
                    onMouseLeave={() => setHoveredStep(null)}
                  >
                    <Link
                      href={step.href}
                      className={`relative flex items-center justify-center rounded-lg transition-all duration-300 w-8 h-8 ${
                        done
                          ? 'bg-gradient-to-br from-neon-green/80 to-neon-blue/80 text-white shadow-md shadow-neon-green/15'
                          : isCurrent
                            ? 'bg-neon-blue/15 border-2 border-neon-blue/50 text-neon-blue shadow-md shadow-neon-blue/15'
                            : 'bg-white/[0.04] border border-white/10 text-white/25 hover:text-white/40 hover:border-white/20'
                      }`}
                    >
                      <StepIcon className="w-3.5 h-3.5" />
                      {isCurrent && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-blue rounded-full animate-pulse border-2 border-[#0a0a0f]" />
                      )}
                    </Link>

                    {/* Hover Tooltip */}
                    <AnimatePresence>
                      {hoveredStep === step.key && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.96 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 z-50 w-52 pointer-events-none"
                        >
                          <div className="relative bg-[#141420] border border-white/10 rounded-xl p-3 shadow-xl shadow-black/50">
                            {/* Arrow */}
                            <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#141420] border-l border-t border-white/10 rotate-45" />
                            <div className="text-xs font-semibold text-white mb-1">{step.label}</div>
                            <div className="text-[10px] text-white/45 leading-relaxed">{step.description}</div>
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                done ? 'bg-neon-green' : isCurrent ? 'bg-neon-blue animate-pulse' : 'bg-white/20'
                              }`} />
                              <span className={`text-[9px] font-medium ${
                                done ? 'text-neon-green' : isCurrent ? 'text-neon-blue' : 'text-white/30'
                              }`}>
                                {done ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Connector */}
                  {i < journeySteps.length - 1 && (
                    <div className={`h-0.5 flex-1 min-w-[10px] max-w-[28px] rounded-full mx-0.5 ${
                      done && journey[journeySteps[i + 1].key as keyof JourneyProgress]
                        ? 'bg-gradient-to-r from-neon-green/60 to-neon-blue/60'
                        : done
                          ? 'bg-neon-green/30'
                          : 'bg-white/[0.06]'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-20 h-2 bg-white/[0.06] rounded-full overflow-hidden hidden sm:block">
              <motion.div
                className="h-full bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-medium text-white/45 whitespace-nowrap tabular-nums">
              {completedCount}/{journeySteps.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
