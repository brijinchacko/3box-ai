'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import AgenticWorkspace from '@/components/dashboard/shared/AgenticWorkspace';
import {
  Loader2,
  CheckCircle2,
  ArrowRight,
  Upload,
  Search,
  Send,
  BarChart3,
  FileText,
  Target,
  TrendingUp,
  Mic,
  ChevronDown,
  Clock,
  Briefcase,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import OvernightActivity from '@/components/dashboard/OvernightActivity';

/* ── Agent icons for activity feed ── */
import { Shield, BookOpen, Compass, Brain, FileEdit } from 'lucide-react';

const agentIcons: Record<string, { icon: React.ElementType; color: string }> = {
  scout: { icon: Search, color: 'text-blue-500' },
  forge: { icon: FileEdit, color: 'text-orange-500' },
  archer: { icon: Target, color: 'text-green-500' },
  atlas: { icon: Compass, color: 'text-purple-500' },
  sage: { icon: BookOpen, color: 'text-teal-500' },
  sentinel: { icon: Shield, color: 'text-rose-500' },
  cortex: { icon: Brain, color: 'text-blue-400' },
};

/* ═══════════════════════════════════════════════════════
   PIPELINE STEP DEFINITIONS
   ═══════════════════════════════════════════════════════ */
interface PipelineStep {
  key: string;
  label: string;
  href: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  { key: 'profile', label: 'Profile', href: '/dashboard/onboarding' },
  { key: 'resume', label: 'Resume', href: '/dashboard/resume' },
  { key: 'findJobs', label: 'Find Jobs', href: '/dashboard/jobs' },
  { key: 'apply', label: 'Apply', href: '/dashboard/board' },
  { key: 'interview', label: 'Interview', href: '/dashboard/interview' },
  { key: 'offer', label: 'Offer!', href: '/dashboard/applications' },
];

/* ═══════════════════════════════════════════════════════
   PIPELINE STATUS TYPES
   ═══════════════════════════════════════════════════════ */
type StepStatus = 'completed' | 'current' | 'future';

interface PipelineData {
  profileDone: boolean;
  resumeDone: boolean;
  jobsFound: boolean;
  hasApplications: boolean;
  jobsCount: number;
  appsCount: number;
}

interface ActivityItem {
  id: string;
  agent: string;
  action: string;
  summary: string;
  createdAt: string;
}

interface Stats {
  jobsFound: number;
  appsSent: number;
  interviews: number;
  responseRate: number;
}

/* ═══════════════════════════════════════════════════════
   ROOT PAGE
   ═══════════════════════════════════════════════════════ */
export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const { isAutopilot } = useDashboardMode();
  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  if (isAutopilot) {
    return <PipelineDashboard firstName={firstName} />;
  }

  return <AgenticWorkspace agentId="cortex" />;
}

/* ═══════════════════════════════════════════════════════
   PIPELINE DASHBOARD
   ═══════════════════════════════════════════════════════ */
function PipelineDashboard({ firstName }: { firstName: string }) {
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityOpen, setActivityOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  /* Fetch all pipeline data in parallel */
  useEffect(() => {
    async function fetchPipeline() {
      try {
        const [profileRes, resumeRes, jobsRes, appsRes] = await Promise.allSettled([
          fetch('/api/user/profile').then(r => r.ok ? r.json() : null),
          fetch('/api/user/resume').then(r => r.ok ? r.json() : null),
          fetch('/api/user/board-jobs').then(r => r.ok ? r.json() : null),
          fetch('/api/applications?limit=1').then(r => r.ok ? r.json() : null),
        ]);

        const profile = profileRes.status === 'fulfilled' ? profileRes.value : null;
        const resume = resumeRes.status === 'fulfilled' ? resumeRes.value : null;
        const jobs = jobsRes.status === 'fulfilled' ? jobsRes.value : null;
        const apps = appsRes.status === 'fulfilled' ? appsRes.value : null;

        const jobsCount = jobs?.jobs?.length ?? jobs?.count ?? 0;
        const appsCount = apps?.applications?.length ?? apps?.count ?? apps?.total ?? 0;

        setPipeline({
          profileDone: !!(profile?.name && profile?.email && profile?.targetRole),
          resumeDone: !!(resume?.isFinalized || resume?.approvalStatus === 'ready' || resume?.approvalStatus === 'approved' || resume?.hasResume || resume?.resumeId || resume?.resume?.contact?.name),
          jobsFound: jobsCount > 0,
          hasApplications: appsCount > 0,
          jobsCount,
          appsCount,
        });
      } catch {
        setPipeline({
          profileDone: false,
          resumeDone: false,
          jobsFound: false,
          hasApplications: false,
          jobsCount: 0,
          appsCount: 0,
        });
      }
      setLoading(false);
    }

    fetchPipeline();
  }, []);

  /* Fetch stats (only matters if user has apps) */
  useEffect(() => {
    fetch('/api/user/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {});
  }, []);

  /* Fetch recent activity */
  useEffect(() => {
    fetch('/api/agents/activity?limit=5')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.activities) setActivities(data.activities);
      })
      .catch(() => {});
  }, []);

  /* Determine step statuses */
  const getStepStatuses = useCallback((): StepStatus[] => {
    if (!pipeline) return PIPELINE_STEPS.map(() => 'future');

    const { profileDone, resumeDone, jobsFound, hasApplications } = pipeline;

    // Determine current index
    let currentIndex = 0;
    if (profileDone) currentIndex = 1;
    if (profileDone && resumeDone) currentIndex = 2;
    if (profileDone && resumeDone && jobsFound) currentIndex = 3;
    if (profileDone && resumeDone && jobsFound && hasApplications) currentIndex = 4;
    // index 5 (Offer) stays as future until we have interview tracking

    return PIPELINE_STEPS.map((_, i) => {
      if (i < currentIndex) return 'completed';
      if (i === currentIndex) return 'current';
      return 'future';
    });
  }, [pipeline]);

  const statuses = getStepStatuses();
  const currentStepIndex = statuses.indexOf('current');

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {firstName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Here&apos;s your job search pipeline at a glance.
        </p>
      </div>

      {/* ═══ Overnight Activity Card ═══ */}
      <OvernightActivity />

      {/* ═══ SECTION 1: Pipeline Visualization ═══ */}
      <PipelineVisualization statuses={statuses} />

      {/* ═══ SECTION 2: Action Card ═══ */}
      <ActionCard pipeline={pipeline} currentStepIndex={currentStepIndex} />

      {/* ═══ SECTION 2.5: How do you want to apply? (Plain English mode selector) ═══ */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">How do you want to apply?</h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 cursor-pointer">
            <input type="radio" name="applyMode" defaultChecked className="mt-1 accent-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">I&apos;ll review and apply myself</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Scout finds jobs, you decide which to apply to</p>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <input type="radio" name="applyMode" className="mt-1 accent-blue-600" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Apply automatically to great matches</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">PRO</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">AI applies to 80%+ match jobs. You review the rest.</p>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <input type="radio" name="applyMode" className="mt-1 accent-blue-600" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Full autopilot — apply to everything</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">MAX</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">AI handles the entire process end-to-end</p>
            </div>
          </label>
        </div>
      </div>

      {/* ═══ SECTION 3: Quick Stats (only if 1+ applications) ═══ */}
      {pipeline?.hasApplications && stats && (
        <QuickStatsGrid stats={stats} />
      )}

      {/* ═══ SECTION 4: Meet Your Agents (for users without applications) ═══ */}
      {!pipeline?.hasApplications && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Meet Your AI Agents</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { name: 'Scout', desc: 'Finds matching jobs across 11+ sources', icon: Search, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
              { name: 'Forge', desc: 'Tailors your resume for each job', icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
              { name: 'Archer', desc: 'Sends applications on your behalf', icon: Target, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
              { name: 'Atlas', desc: 'Prepares you for interviews', icon: Mic, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
              { name: 'Sage', desc: 'Identifies skill gaps & learning paths', icon: Trophy, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10' },
              { name: 'Sentinel', desc: 'Quality-checks everything before sending', icon: CheckCircle2, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
            ].map((agent) => (
              <div key={agent.name} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', agent.bg)}>
                  <agent.icon className={cn('w-4 h-4', agent.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{agent.name}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{agent.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SECTION 5: Quick Tip ═══ */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-xl border border-blue-100 dark:border-blue-500/10 p-4 flex items-start gap-3">
        <Briefcase className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Quick Tip</p>
          <p className="text-xs text-blue-600/70 dark:text-blue-300/50 mt-0.5">
            Applying Tuesday through Thursday gets up to 30% more responses. Set up your search profile and let Scout find the best matches for you.
          </p>
        </div>
      </div>

      {/* ═══ SECTION 6: Recent Activity (collapsed by default) ═══ */}
      {activities.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActivityOpen(prev => !prev)}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform duration-200',
                activityOpen && 'rotate-180',
              )}
            />
          </button>
          {activityOpen && (
            <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
              {activities.map((item) => {
                const agent = agentIcons[item.agent] || agentIcons.cortex;
                const Icon = agent.icon;
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className={cn('w-3.5 h-3.5', agent.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                        {item.summary}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(item.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PIPELINE VISUALIZATION
   ═══════════════════════════════════════════════════════ */
function PipelineVisualization({ statuses }: { statuses: StepStatus[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      {/* Desktop: horizontal layout */}
      <div className="hidden sm:flex items-center justify-between">
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1 last:flex-initial">
            {/* Step node */}
            <Link
              href={step.href}
              className="flex flex-col items-center gap-2 group relative"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                  statuses[i] === 'completed' &&
                    'bg-green-500 border-green-500 text-white',
                  statuses[i] === 'current' &&
                    'bg-blue-500 border-blue-500 text-white animate-pulse shadow-lg shadow-blue-500/30',
                  statuses[i] === 'future' &&
                    'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 group-hover:border-gray-400 dark:group-hover:border-gray-500',
                )}
              >
                {statuses[i] === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : statuses[i] === 'current' ? (
                  <span className="w-3 h-3 rounded-full bg-white" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  statuses[i] === 'completed' && 'text-green-600 dark:text-green-400',
                  statuses[i] === 'current' && 'text-blue-600 dark:text-blue-400 font-semibold',
                  statuses[i] === 'future' && 'text-gray-400 dark:text-gray-500',
                )}
              >
                {step.label}
              </span>
            </Link>

            {/* Connector line */}
            {i < PIPELINE_STEPS.length - 1 && (
              <div className="flex-1 mx-2 relative">
                <div
                  className={cn(
                    'h-0.5 w-full rounded-full transition-colors duration-300',
                    statuses[i] === 'completed'
                      ? 'bg-green-400 dark:bg-green-500'
                      : 'bg-gray-200 dark:bg-gray-700',
                  )}
                />
                {statuses[i] === 'completed' && (
                  <ArrowRight
                    className="w-3 h-3 text-green-400 dark:text-green-500 absolute -right-1.5 top-1/2 -translate-y-1/2"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: vertical compact layout */}
      <div className="sm:hidden space-y-3">
        {PIPELINE_STEPS.map((step, i) => (
          <Link
            key={step.key}
            href={step.href}
            className="flex items-center gap-3"
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0',
                statuses[i] === 'completed' &&
                  'bg-green-500 border-green-500 text-white',
                statuses[i] === 'current' &&
                  'bg-blue-500 border-blue-500 text-white animate-pulse',
                statuses[i] === 'future' &&
                  'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400',
              )}
            >
              {statuses[i] === 'completed' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
            <span
              className={cn(
                'text-sm font-medium',
                statuses[i] === 'completed' && 'text-green-600 dark:text-green-400',
                statuses[i] === 'current' && 'text-blue-600 dark:text-blue-400 font-semibold',
                statuses[i] === 'future' && 'text-gray-400 dark:text-gray-500',
              )}
            >
              {step.label}
            </span>
            {statuses[i] === 'current' && (
              <span className="ml-auto text-xs text-blue-500 dark:text-blue-400 font-medium">
                You are here
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ACTION CARD — one primary CTA
   ═══════════════════════════════════════════════════════ */
function ActionCard({
  pipeline,
  currentStepIndex,
}: {
  pipeline: PipelineData | null;
  currentStepIndex: number;
}) {
  if (!pipeline) return null;

  const { resumeDone, jobsFound, hasApplications, jobsCount, appsCount } = pipeline;

  let icon: React.ElementType = Upload;
  let title = 'Upload your resume to get started';
  let description = 'Your resume is the foundation. Upload it and our AI will parse, enhance, and optimize it for your target roles.';
  let buttonLabel = 'Upload Resume';
  let href = '/dashboard/resume';
  let gradient = 'from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5';
  let borderColor = 'border-blue-200 dark:border-blue-500/20';
  let btnColor = 'bg-blue-600 hover:bg-blue-700';
  let iconColor = 'text-blue-600 dark:text-blue-400';

  if (resumeDone && !jobsFound) {
    icon = Search;
    title = 'Run Scout to find matching jobs';
    description = 'Your resume is ready. Let our AI Scout agent search across job boards to find roles that match your profile.';
    buttonLabel = 'Find Jobs';
    href = '/dashboard/jobs';
    gradient = 'from-green-500/10 to-emerald-500/10 dark:from-green-500/5 dark:to-emerald-500/5';
    borderColor = 'border-green-200 dark:border-green-500/20';
    btnColor = 'bg-green-600 hover:bg-green-700';
    iconColor = 'text-green-600 dark:text-green-400';
  } else if (resumeDone && jobsFound && !hasApplications) {
    icon = Briefcase;
    title = `${jobsCount} matching job${jobsCount !== 1 ? 's' : ''} ready to apply`;
    description = 'We found great matches for you. Review them on your board and start applying with one click.';
    buttonLabel = 'View Job Board';
    href = '/dashboard/board';
    gradient = 'from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5';
    borderColor = 'border-purple-200 dark:border-purple-500/20';
    btnColor = 'bg-purple-600 hover:bg-purple-700';
    iconColor = 'text-purple-600 dark:text-purple-400';
  } else if (hasApplications) {
    icon = BarChart3;
    title = `Track your ${appsCount} application${appsCount !== 1 ? 's' : ''}`;
    description = 'Stay on top of your applications. See responses, follow up, and prepare for interviews all in one place.';
    buttonLabel = 'View Applications';
    href = '/dashboard/applications';
    gradient = 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5';
    borderColor = 'border-amber-200 dark:border-amber-500/20';
    btnColor = 'bg-amber-600 hover:bg-amber-700';
    iconColor = 'text-amber-600 dark:text-amber-400';
  }

  const Icon = icon;

  return (
    <div
      className={cn(
        'relative rounded-xl border p-6 sm:p-8 bg-gradient-to-br overflow-hidden',
        gradient,
        borderColor,
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className={cn('w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm shrink-0')}>
          <Icon className={cn('w-7 h-7', iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-lg">
            {description}
          </p>
        </div>
        <Link
          href={href}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md shrink-0',
            btnColor,
          )}
        >
          {buttonLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   QUICK STATS GRID
   ═══════════════════════════════════════════════════════ */
function QuickStatsGrid({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: 'Applications This Week',
      value: stats.appsSent,
      icon: Send,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      label: 'Match Score',
      value: `${stats.responseRate}%`,
      icon: Target,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-500/10',
    },
    {
      label: 'Jobs Found',
      value: stats.jobsFound,
      icon: Search,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-500/10',
    },
    {
      label: 'Response Rate',
      value: `${stats.responseRate}%`,
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', card.bg)}>
              <card.icon className={cn('w-4 h-4', card.color)} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
            {card.value}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {card.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}
