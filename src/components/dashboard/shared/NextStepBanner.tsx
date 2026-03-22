'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import {
  ArrowRight,
  Upload,
  FileCheck,
  Search,
  Briefcase,
  ClipboardList,
  CalendarCheck,
  Sparkles,
  X,
} from 'lucide-react';

/* ── Types ── */

interface StepInfo {
  text: string;
  href: string;
  cta: string;
  icon: React.ReactNode;
}

interface PipelineState {
  hasResume: boolean;
  resumeFinalized: boolean;
  scoutRanOnce: boolean;
  matchingJobCount: number;
  hasApplications: boolean;
  interviewCompany: string | null;
}

const DISMISS_KEY = '3box_nextstep_dismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/* ── Determine current step ── */

function resolveStep(state: PipelineState): StepInfo {
  if (!state.hasResume) {
    return {
      text: 'Upload your resume to get started',
      href: '/dashboard/resume',
      cta: 'Upload Resume',
      icon: <Upload className="w-4 h-4" />,
    };
  }

  if (!state.resumeFinalized) {
    return {
      text: 'Finalize your resume to start applying',
      href: '/dashboard/resume',
      cta: 'Finalize Resume',
      icon: <FileCheck className="w-4 h-4" />,
    };
  }

  if (!state.scoutRanOnce) {
    return {
      text: 'Find matching jobs — Search Now',
      href: '/dashboard/jobs',
      cta: 'Search Now',
      icon: <Search className="w-4 h-4" />,
    };
  }

  if (state.matchingJobCount > 0 && !state.hasApplications) {
    return {
      text: `You have ${state.matchingJobCount} matching job${state.matchingJobCount === 1 ? '' : 's'} — Start applying`,
      href: '/dashboard/board',
      cta: 'Start Applying',
      icon: <Briefcase className="w-4 h-4" />,
    };
  }

  if (state.hasApplications && !state.interviewCompany) {
    return {
      text: 'Track your applications',
      href: '/dashboard/applications',
      cta: 'View Applications',
      icon: <ClipboardList className="w-4 h-4" />,
    };
  }

  if (state.interviewCompany) {
    return {
      text: `Prepare for your interview at ${state.interviewCompany}`,
      href: '/dashboard/interview',
      cta: 'Prepare Now',
      icon: <CalendarCheck className="w-4 h-4" />,
    };
  }

  // Default
  return {
    text: 'Keep applying — Scout finds new jobs daily',
    href: '/dashboard/jobs',
    cta: 'Find Jobs',
    icon: <Sparkles className="w-4 h-4" />,
  };
}

/* ── Component ── */

export default function NextStepBanner() {
  const { isAgentic } = useDashboardMode();
  const [step, setStep] = useState<StepInfo | null>(null);
  const [dismissed, setDismissed] = useState(true); // start hidden, flip after check
  const [loaded, setLoaded] = useState(false);

  // Check localStorage dismiss
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const ts = parseInt(raw, 10);
        if (Date.now() - ts < DISMISS_DURATION) {
          setDismissed(true);
          setLoaded(true);
          return;
        }
        localStorage.removeItem(DISMISS_KEY);
      }
      setDismissed(false);
    } catch {
      setDismissed(false);
    }
    setLoaded(true);
  }, []);

  // Fetch pipeline state
  const fetchState = useCallback(async () => {
    try {
      const [profileRes, resumeRes, loopsRes, boardRes, appsRes] = await Promise.all([
        fetch('/api/user/profile').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/user/resume').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/user/loops').then(r => r.ok ? r.json() : { profiles: [] }).catch(() => ({ profiles: [] })),
        fetch('/api/user/board-jobs').then(r => r.ok ? r.json() : { jobs: [] }).catch(() => ({ jobs: [] })),
        fetch('/api/user/recent-activity').then(r => r.ok ? r.json() : { activities: [] }).catch(() => ({ activities: [] })),
      ]);

      const hasResume = !!(resumeRes?.resumeId || resumeRes?.resume?.contact?.name);
      const resumeFinalized = !!resumeRes?.isFinalized;

      // Scout has run if any loop profile has found jobs
      const profiles = loopsRes?.profiles || [];
      const totalFound = profiles.reduce((sum: number, p: any) => sum + (p.jobsFound || 0), 0);
      const scoutRanOnce = totalFound > 0;

      // Board jobs count (active matches)
      const boardJobs = boardRes?.jobs || [];
      const matchingJobCount = boardJobs.length;

      // Applications & interviews from journey
      const journey = profileRes?.journey || {};
      const hasApplications = !!journey.applied;

      // Interview company — check board jobs for interview status
      let interviewCompany: string | null = null;
      if (journey.interview) {
        const interviewJob = boardJobs.find((j: any) =>
          j.status === 'INTERVIEW' || j.status === 'interview'
        );
        interviewCompany = interviewJob?.company || interviewJob?.companyName || 'upcoming company';
      }

      const pipelineState: PipelineState = {
        hasResume,
        resumeFinalized,
        scoutRanOnce,
        matchingJobCount,
        hasApplications,
        interviewCompany,
      };

      setStep(resolveStep(pipelineState));
    } catch (err) {
      console.error('[NextStepBanner] Fetch error:', err);
    }
  }, []);

  useEffect(() => {
    if (!loaded || dismissed) return;
    fetchState();
  }, [loaded, dismissed, fetchState]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  if (!loaded || dismissed || !step) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4">
      <div
        className={cn(
          'relative rounded-xl p-[1px] overflow-hidden',
          // Gradient border via wrapper
          'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500',
        )}
      >
        {/* Inner card */}
        <div
          className={cn(
            'relative flex items-center gap-3 sm:gap-4 rounded-[11px] px-4 py-3',
            isAgentic
              ? 'bg-[#0c0c14]'
              : 'bg-white dark:bg-gray-950',
          )}
        >
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg',
              isAgentic
                ? 'bg-blue-500/10 text-blue-400'
                : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
            )}
          >
            {step.icon}
          </div>

          {/* Text */}
          <p
            className={cn(
              'flex-1 text-sm font-medium min-w-0',
              isAgentic
                ? 'text-white/80'
                : 'text-gray-800 dark:text-gray-200',
            )}
          >
            {step.text}
          </p>

          {/* CTA Button */}
          <Link
            href={step.href}
            className={cn(
              'flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              isAgentic
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400',
            )}
          >
            {step.cta}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Dismiss X */}
          <button
            onClick={handleDismiss}
            className={cn(
              'flex-shrink-0 p-1 rounded-md transition-colors',
              isAgentic
                ? 'text-white/30 hover:text-white/60 hover:bg-white/[0.06]'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800',
            )}
            title="Dismiss for 24 hours"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
