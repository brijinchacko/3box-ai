'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Brain, Target, BookOpen, FileText, Briefcase, TrendingUp,
  ArrowRight, BarChart3, Zap, Award, Clock, CheckCircle2,
  AlertCircle, Star, Sparkles, Lightbulb, Rocket, RefreshCw,
  Mic, UserCheck, Send, MessageSquare, Trophy, Bot
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

interface InsightItem {
  type: string;
  title: string;
  description: string;
  action?: string;
  priority: string;
  // Legacy fields from POST-based format
  message?: string;
  impact?: string;
}

interface AIInsightsData {
  insights: InsightItem[];
  careerScore: number;
  weeklyTip: string | { title: string; description: string; category: string };
  marketReadiness?: number;
  trendingSkills?: string[];
}

interface JourneyProgress {
  onboarding: boolean;
  assessment: boolean;
  careerPlan: boolean;
  resume: boolean;
  applied: boolean;
  interview: boolean;
  offer: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  targetRole: string;
  plan: string;
  credits: number;
  onboardingDone: boolean;
  journey?: JourneyProgress;
  careerTwin?: {
    marketReadiness?: number;
    hireProbability?: number;
    topSkills?: { name: string; score: number; color: string }[];
  };
}

const quickActions = [
  { icon: Brain, label: 'Take Assessment', href: '/dashboard/assessment', color: 'from-blue-500 to-cyan-400' },
  { icon: Target, label: 'View Career Plan', href: '/dashboard/career-plan', color: 'from-purple-500 to-pink-400' },
  { icon: FileText, label: 'Build Resume', href: '/dashboard/resume', color: 'from-green-500 to-emerald-400' },
  { icon: Briefcase, label: 'Find Jobs', href: '/dashboard/jobs', color: 'from-orange-500 to-yellow-400' },
  { icon: Mic, label: 'Interview Prep', href: '/dashboard/interview', color: 'from-rose-500 to-red-400' },
  { icon: Bot, label: 'AI Agents', href: '/dashboard/agents', color: 'from-indigo-500 to-purple-400' },
];

const insightTypeIcons: Record<string, typeof Brain> = {
  strength: Star,
  improvement: TrendingUp,
  opportunity: Rocket,
  action: Zap,
  resume: FileText,
  jobs: Briefcase,
  skills: Brain,
};

const insightTypeColors: Record<string, string> = {
  strength: 'text-neon-green bg-neon-green/10',
  improvement: 'text-yellow-400 bg-yellow-400/10',
  opportunity: 'text-neon-blue bg-neon-blue/10',
  action: 'text-neon-purple bg-neon-purple/10',
  high: 'text-red-400 bg-red-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  low: 'text-neon-green bg-neon-green/10',
};

// --- Loading skeleton components ---
function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card animate-pulse ${className}`}>
      <div className="h-4 bg-white/5 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-2/3" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    </div>
  );
}

function SkeletonCircle() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-white/5 rounded w-1/2 mx-auto mb-4" />
      <div className="w-32 h-32 rounded-full bg-white/5 mx-auto mb-4" />
      <div className="h-3 bg-white/5 rounded w-1/3 mx-auto" />
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className="card text-center animate-pulse">
      <div className="h-8 bg-white/5 rounded w-12 mx-auto mb-2" />
      <div className="h-3 bg-white/5 rounded w-16 mx-auto" />
    </div>
  );
}

// --- Career Journey Steps ---
const journeySteps = [
  { key: 'onboarding', label: 'Onboarding', icon: UserCheck, href: '/dashboard/onboarding', color: 'from-blue-500 to-cyan-400' },
  { key: 'assessment', label: 'Assessment', icon: Brain, href: '/dashboard/assessment', color: 'from-purple-500 to-pink-400' },
  { key: 'careerPlan', label: 'Career Plan', icon: Target, href: '/dashboard/career-plan', color: 'from-indigo-500 to-blue-400' },
  { key: 'resume', label: 'Resume', icon: FileText, href: '/dashboard/resume', color: 'from-green-500 to-emerald-400' },
  { key: 'applied', label: 'Applied', icon: Send, href: '/dashboard/jobs', color: 'from-orange-500 to-yellow-400' },
  { key: 'interview', label: 'Interview', icon: MessageSquare, href: '/dashboard/interview', color: 'from-rose-500 to-red-400' },
  { key: 'offer', label: 'Job Landed', icon: Trophy, href: '/dashboard/jobs', color: 'from-yellow-400 to-amber-500' },
];

function CareerJourney({ journey, loading }: { journey?: JourneyProgress; loading: boolean }) {
  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-white/5 rounded w-40 mb-4" />
        <div className="flex items-center gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0" />
              {i < 6 && <div className="flex-1 h-0.5 bg-white/5" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const completedSteps = journey
    ? journeySteps.filter((s) => journey[s.key as keyof JourneyProgress]).length
    : 0;
  const progressPercent = Math.round((completedSteps / journeySteps.length) * 100);

  // Find the current (first incomplete) step
  const currentStepIndex = journey
    ? journeySteps.findIndex((s) => !journey[s.key as keyof JourneyProgress])
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="card border border-white/5 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-neon-blue" />
          <h3 className="text-sm font-semibold text-white/60">Your Career Journey</h3>
        </div>
        <span className="text-xs text-white/30">
          {completedSteps}/{journeySteps.length} steps &middot; {progressPercent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="skill-bar h-1 mb-5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          className="skill-bar-fill bg-gradient-to-r from-neon-blue to-neon-purple"
        />
      </div>

      {/* Steps */}
      <div className="flex items-start">
        {journeySteps.map((step, i) => {
          const done = journey?.[step.key as keyof JourneyProgress] ?? false;
          const isCurrent = i === currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              {/* Step dot + label */}
              <Link
                href={step.href}
                className={`flex flex-col items-center gap-1.5 group flex-shrink-0 ${
                  done ? 'cursor-pointer' : isCurrent ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    done
                      ? `bg-gradient-to-br ${step.color} shadow-lg shadow-neon-blue/10`
                      : isCurrent
                        ? 'bg-white/10 border-2 border-neon-blue ring-2 ring-neon-blue/20'
                        : 'bg-white/5 border border-white/10'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isCurrent ? 'text-neon-blue' : 'text-white/20'}`} />
                  )}
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-blue rounded-full animate-pulse" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium text-center leading-tight ${
                    done ? 'text-white/70' : isCurrent ? 'text-neon-blue' : 'text-white/20'
                  }`}
                >
                  {step.label}
                </span>
              </Link>

              {/* Connector line */}
              {i < journeySteps.length - 1 && (
                <div className="flex-1 mx-1 mt-[-12px]">
                  <div
                    className={`h-0.5 rounded-full ${
                      done && journey?.[journeySteps[i + 1].key as keyof JourneyProgress]
                        ? 'bg-gradient-to-r from-neon-blue to-neon-purple'
                        : done
                          ? 'bg-gradient-to-r from-neon-blue/40 to-white/10'
                          : 'bg-white/5'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsightsData | null>(null);
  const [recentActivity, setRecentActivity] = useState<{ icon: typeof CheckCircle2; text: string; time: string; color: string }[]>([]);
  const [assessmentDone, setAssessmentDone] = useState(true);

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        setAssessmentDone(!!data.careerTwin);
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
    return null;
  }, []);

  // Fetch AI insights (GET endpoint)
  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch('/api/ai/dashboard-insights');
      if (res.ok) {
        const data = await res.json();
        setAiInsights(data);
      } else {
        // Set fallback insights if API fails
        setAiInsights(getFallbackInsights());
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
      setAiInsights(getFallbackInsights());
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  // Build recent activity from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('nxted_recent_activity');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentActivity(parsed.map((a: any) => ({
          ...a,
          icon: a.iconName === 'Star' ? Star : a.iconName === 'TrendingUp' ? TrendingUp : a.iconName === 'FileText' ? FileText : CheckCircle2,
        })));
      } catch { /* ignore parse errors */ }
    }
    if (!stored) {
      setRecentActivity([
        { icon: CheckCircle2, text: 'Started your career journey with NXTED AI', time: 'Just now', color: 'text-neon-green' },
        { icon: Star, text: 'Complete your first assessment to unlock insights', time: 'Tip', color: 'text-yellow-400' },
      ]);
    }
  }, []);

  // Load all data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchInsights()]);
      setLoading(false);
    }
    loadData();
  }, [fetchProfile, fetchInsights]);

  const userName = userProfile?.name || 'there';
  const targetRole = userProfile?.targetRole || 'your dream role';
  const journey = userProfile?.journey;
  const careerTwin = userProfile?.careerTwin;
  const marketReadiness = careerTwin?.marketReadiness ?? aiInsights?.marketReadiness ?? 0;
  const hireProbability = careerTwin?.hireProbability ?? (marketReadiness * 0.9) / 100;
  const careerScore = aiInsights?.careerScore ?? 0;
  const skillsAssessed = careerTwin?.topSkills?.length ?? 0;
  const aiCredits = userProfile?.credits ?? 0;

  const topSkills = careerTwin?.topSkills || [];

  // Milestones from localStorage or defaults
  const [milestones] = useState(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('nxted_milestones');
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return [
      { title: 'Complete Skill Assessment', progress: 0, status: 'in-progress' },
      { title: 'Build Your Resume', progress: 0, status: 'upcoming' },
      { title: 'Create Portfolio Project', progress: 0, status: 'upcoming' },
      { title: 'Practice Interviews', progress: 0, status: 'upcoming' },
    ];
  });

  // Parse weekly tip - handle both string and object formats
  const weeklyTip = (() => {
    if (!aiInsights?.weeklyTip) return null;
    if (typeof aiInsights.weeklyTip === 'string') {
      return { title: 'Weekly AI Tip', description: aiInsights.weeklyTip, category: 'general' };
    }
    return aiInsights.weeklyTip;
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">
          Welcome back,{' '}
          {loading
            ? <span className="inline-block w-24 h-7 bg-white/5 rounded animate-pulse align-middle" />
            : userName}
        </h1>
        <p className="text-white/40">
          Your career journey to{' '}
          <span className="text-neon-blue font-medium">{loading ? '...' : targetRole}</span>{' '}
          — here&apos;s where you stand.
        </p>
      </motion.div>

      {/* Career Journey Tracker */}
      <CareerJourney journey={journey} loading={loading} />

      {/* Assessment CTA - Show if user hasn't completed assessment */}
      <AnimatePresence>
        {!loading && !assessmentDone && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
          >
            <Link href="/dashboard/assessment" className="block">
              <div className="card border border-neon-blue/30 bg-gradient-to-r from-neon-blue/5 to-neon-purple/5 hover:from-neon-blue/10 hover:to-neon-purple/10 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Start Your Career Assessment</h3>
                    <p className="text-sm text-white/50">
                      Take a 10-minute AI-powered assessment to get personalized insights, skill scores,
                      and a tailored career plan for your target role.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neon-blue flex-shrink-0" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Career Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <MetricSkeleton key={i} />)}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="card text-center">
            <div className="text-2xl font-bold text-neon-blue">{careerScore}</div>
            <div className="text-xs text-white/40 mt-1">Career Score</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-neon-purple">{skillsAssessed}</div>
            <div className="text-xs text-white/40 mt-1">Skills Assessed</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-neon-green">{Math.round(marketReadiness)}%</div>
            <div className="text-xs text-white/40 mt-1">Market Readiness</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-yellow-400">{aiCredits}</div>
            <div className="text-xs text-white/40 mt-1">AI Credits</div>
          </div>
        </motion.div>
      )}

      {/* Career Twin Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Market Readiness */}
        {loading ? (
          <SkeletonCircle />
        ) : (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="card col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/60">Market Readiness</h3>
              <BarChart3 className="w-4 h-4 text-neon-blue" />
            </div>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#grad)" strokeWidth="10"
                  strokeDasharray={`${marketReadiness * 3.14} ${314 - marketReadiness * 3.14}`}
                  strokeLinecap="round" />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{Math.round(marketReadiness)}%</span>
                <span className="text-[10px] text-white/40">READY</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-white/40">Hire Probability</div>
              <div className="text-lg font-bold text-neon-green">{Math.round(hireProbability * 100)}%</div>
            </div>
          </motion.div>
        )}

        {/* Skill Snapshot */}
        {loading ? (
          <SkeletonCard className="col-span-1 lg:col-span-2" />
        ) : (
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="card col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-white/60">Skill Snapshot — Career Twin</h3>
              <Link href="/dashboard/assessment" className="text-xs text-neon-blue hover:underline flex items-center gap-1">
                {assessmentDone ? 'Reassess' : 'Take Assessment'} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {assessmentDone && topSkills.length > 0 ? (
              <div className="space-y-4">
                {topSkills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{skill.name}</span>
                      <span className="text-sm text-white/40">{skill.score}%</span>
                    </div>
                    <div className="skill-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.score}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`skill-bar-fill ${skill.color || 'bg-neon-blue'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Brain className="w-12 h-12 text-white/10 mb-3" />
                <p className="text-sm text-white/40 mb-3">No skills assessed yet</p>
                <Link href="/dashboard/assessment" className="btn-primary text-sm">
                  Take Assessment
                </Link>
              </div>
            )}

            {/* Trending Skills */}
            {aiInsights?.trendingSkills && aiInsights.trendingSkills.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/5">
                <div className="text-xs text-white/40 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Trending in your field
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiInsights.trendingSkills.map((skill) => (
                    <span key={skill} className="text-xs px-2.5 py-1 rounded-full bg-neon-blue/10 text-neon-blue border border-neon-blue/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* AI Insights Card */}
      {insightsLoading ? (
        <SkeletonCard />
      ) : aiInsights && aiInsights.insights.length > 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neon-purple" /> AI Insights
            </h3>
            <button
              onClick={() => fetchInsights()}
              className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiInsights.insights.slice(0, 6).map((insight, i) => {
              const Icon = insightTypeIcons[insight.type] || Sparkles;
              const colorKey = insight.priority || insight.impact || 'medium';
              const typeColorKey = insight.type;
              const color = insightTypeColors[typeColorKey] || insightTypeColors[colorKey] || insightTypeColors.medium;
              const displayText = insight.description || insight.message || '';
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {insight.title && (
                      <span className="text-xs font-medium text-white/70 truncate">{insight.title}</span>
                    )}
                  </div>
                  <p className="text-sm text-white/50 mb-2">{displayText}</p>
                  {insight.action && insight.action.startsWith('/') && (
                    <Link href={insight.action} className="text-xs text-neon-blue hover:underline flex items-center gap-1">
                      Take action <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Weekly AI Tip */}
      {insightsLoading ? (
        <SkeletonCard />
      ) : weeklyTip && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <div className="card border border-neon-purple/20 bg-gradient-to-r from-neon-purple/5 to-neon-blue/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold">Weekly AI Tip</h3>
                  {weeklyTip.category && weeklyTip.category !== 'general' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                      {weeklyTip.category}
                    </span>
                  )}
                </div>
                {weeklyTip.title !== 'Weekly AI Tip' && (
                  <h4 className="font-medium text-white/90 mb-1">{weeklyTip.title}</h4>
                )}
                <p className="text-sm text-white/50">{weeklyTip.description}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {quickActions.map((action, i) => (
          <motion.div key={action.label} custom={i + 4} variants={fadeUp} initial="hidden" animate="visible">
            <Link href={action.href} className="card-interactive flex flex-col items-center text-center py-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ── Agent Report Card ── */}
      <motion.div custom={3.5} variants={fadeUp} initial="hidden" animate="visible">
        <div className="card border border-neon-purple/20 bg-gradient-to-r from-neon-purple/5 to-neon-blue/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center flex-shrink-0">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">Cortex Agent Team</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green font-medium">Active</span>
              </div>
              <p className="text-sm text-white/40 mb-3">
                Your AI agents are ready to hunt for jobs, optimize resumes, and send applications automatically.
              </p>
              <Link
                href="/dashboard/agents"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-purple/20 text-neon-purple text-sm font-medium hover:bg-neon-purple/30 transition-colors"
              >
                <Rocket className="w-4 h-4" /> Go to Agent Dashboard
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Milestones */}
        {loading ? (
          <SkeletonCard />
        ) : (
          <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible" className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-white/60">Current Milestones</h3>
              <Link href="/dashboard/career-plan" className="text-xs text-neon-blue hover:underline">View all</Link>
            </div>
            <div className="space-y-4">
              {milestones.map((m: any) => (
                <div key={m.title} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    m.status === 'completed' ? 'bg-neon-green/10' : m.status === 'in-progress' ? 'bg-neon-blue/10' : 'bg-white/5'
                  }`}>
                    {m.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-neon-green" />
                    ) : m.status === 'in-progress' ? (
                      <Clock className="w-4 h-4 text-neon-blue" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-white/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.title}</div>
                    <div className="mt-1.5 skill-bar h-1.5">
                      <div
                        className={`skill-bar-fill ${m.status === 'completed' ? 'bg-neon-green' : 'bg-neon-blue'}`}
                        style={{ width: `${m.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-white/30 flex-shrink-0">{m.progress}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Activity */}
        {loading ? (
          <SkeletonCard />
        ) : (
          <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible" className="card">
            <h3 className="text-sm font-semibold text-white/60 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <activity.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${activity.color}`} />
                    <div>
                      <div className="text-sm">{activity.text}</div>
                      <div className="text-xs text-white/30 mt-0.5">{activity.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-white/30">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No recent activity yet</p>
                  <p className="text-xs mt-1">Start by taking an assessment</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function getFallbackInsights(): AIInsightsData {
  return {
    insights: [
      { type: 'action', title: 'Complete Your Skills Assessment', description: 'Take a quick assessment to discover your strengths and identify skill gaps for your target role.', action: '/dashboard/assessment', priority: 'high' },
      { type: 'opportunity', title: 'Upload Your Resume', description: 'Upload or build your resume to get ATS optimization tips and tailored job matches.', action: '/dashboard/resume', priority: 'medium' },
      { type: 'improvement', title: 'Explore Learning Paths', description: 'Browse curated learning paths designed to help you skill up for in-demand roles.', action: '/dashboard/learning', priority: 'low' },
    ],
    careerScore: 0,
    weeklyTip: 'Start by completing a skills assessment to unlock personalized career insights and recommendations.',
  };
}
