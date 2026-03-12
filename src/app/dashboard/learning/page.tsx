'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen, Play, CheckCircle2, Clock, ExternalLink, Filter,
  Code, FileText, Lightbulb, TrendingUp, Star, ArrowRight, Zap,
  Sparkles, Brain, RefreshCw, Search, AlertCircle, Loader2, Target, Trophy
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import AgentPageHeader from '@/components/dashboard/AgentPageHeader';
import AgentLockedPage from '@/components/dashboard/AgentLockedPage';
import AgentLoader from '@/components/brand/AgentLoader';
import { isAgentAvailable, type PlanTier } from '@/lib/agents/permissions';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import AgenticWorkspace from '@/components/dashboard/shared/AgenticWorkspace';
import { notifyAgentCompleted } from '@/lib/notifications/toast';

// ─── Application Gap Types ─────────────────────
interface ApplicationGapReport {
  jobCategory: string;
  totalApplied: number;
  currentMatchRate: number;
  projectedMatchRate: number;
  missingSkills: { skill: string; frequency: number; total: number }[];
  summary: string;
}

// ─── Types ──────────────────────────────────────
interface LearningModule {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'project' | 'reading' | 'practice';
  provider: string;
  url?: string;
  duration: string;
  skills: string[];
  isAdaptive: boolean;
  progress: number;
}

interface LearningPathData {
  id?: string;
  targetRole: string;
  modules: LearningModule[];
  estimatedCompletion?: string;
}

// ─── Config ─────────────────────────────────────
const typeConfig = {
  course: { icon: Play, color: 'text-teal-400', bg: 'bg-teal-400/10' },
  project: { icon: Code, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  reading: { icon: FileText, color: 'text-teal-400', bg: 'bg-teal-400/10' },
  practice: { icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
};

const STORAGE_KEY = '3box_learning_path';
const PROGRESS_KEY = '3box_learning_progress';
const ROLE_STORAGE_KEY = '3box_target_role';
const SKILL_SCORES_KEY = '3box_skill_scores';

const popularRoles = [
  'AI Engineer', 'Data Scientist', 'Full Stack Developer', 'ML Engineer',
  'DevOps Engineer', 'Product Manager', 'UX Designer', 'Cloud Architect',
  'Cybersecurity Analyst', 'PLC Programmer', 'Mobile Developer', 'Blockchain Developer',
];

// ─── Loading Skeleton ───────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="card"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-white/5 rounded-lg w-2/3 animate-pulse" />
              <div className="h-3 bg-white/5 rounded-lg w-full animate-pulse" />
              <div className="flex gap-2">
                <div className="h-4 bg-white/5 rounded-full w-16 animate-pulse" />
                <div className="h-4 bg-white/5 rounded-full w-20 animate-pulse" />
              </div>
              <div className="h-2 bg-white/5 rounded-full w-full animate-pulse" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── AI Generating Animation ────────────────────
function GeneratingAnimation({ targetRole }: { targetRole: string }) {
  return (
    <div className="card border-teal-500/20 py-8">
      <AgentLoader agentId="sage" message={`Agent Sage is curating your ${targetRole} learning path`} size="lg" />
    </div>
  );
}

// ─── Application Insights Section ───────────────
function ApplicationInsights({ reports }: { reports: ApplicationGapReport[] }) {
  if (reports.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-teal-400" />
        <h2 className="text-lg font-bold">Application Insights</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-400/10 text-teal-400 font-medium">
          Based on your applications
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((report) => (
          <div
            key={report.jobCategory}
            className="card border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm capitalize">{report.jobCategory}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                {report.totalApplied} jobs applied
              </span>
            </div>

            {/* Match Rate Comparison */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                  <span>Current</span>
                  <span className="text-white/60">{report.currentMatchRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${report.currentMatchRate}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-yellow-500"
                  />
                </div>
              </div>
              <ArrowRight className="w-3 h-3 text-white/20 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                  <span>With skills</span>
                  <span className="text-teal-400">{report.projectedMatchRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${report.projectedMatchRate}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Missing Skills */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-white/30 uppercase tracking-wider">You lack:</p>
              {report.missingSkills.slice(0, 4).map((ms) => (
                <div key={ms.skill} className="flex items-center justify-between text-xs">
                  <span className="text-white/60">{ms.skill}</span>
                  <span className="text-white/30">
                    Required in{' '}
                    <span className="text-teal-400 font-medium">{ms.frequency}/{ms.total}</span>
                    {' '}jobs
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Empty State CTA ────────────────────────────
function EmptyState({
  onGenerate,
  isGenerating,
}: {
  onGenerate: (role: string, gaps: any[]) => void;
  isGenerating: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Try to load saved target role
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ROLE_STORAGE_KEY);
      if (saved) setSelectedRole(saved);
    } catch {}
  }, []);

  const filteredRoles = popularRoles.filter((r) =>
    r.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = (role: string) => {
    if (!role.trim()) return;
    // Try to load gaps from localStorage (from assessment results)
    let gaps: any[] = [];
    try {
      const saved = localStorage.getItem(SKILL_SCORES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          gaps = parsed
            .filter((s: any) => s.score < 70)
            .map((s: any) => ({
              skill: s.skill,
              current: s.score,
              required: 80,
              priority: s.score < 50 ? 'high' : 'medium',
            }));
        }
      }
    } catch {}

    // If no gaps found, use a generic one
    if (gaps.length === 0) {
      gaps = [{ skill: 'Core Skills', current: 40, required: 80, priority: 'high' }];
    }

    localStorage.setItem(ROLE_STORAGE_KEY, role);
    onGenerate(role, gaps);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-teal-400" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Create Your AI Learning Path</h2>
        <p className="text-white/40 max-w-md mx-auto">
          Our AI will analyze your skill gaps and curate a personalized learning path with courses,
          projects, readings, and practice exercises from top providers.
        </p>
      </div>

      {/* Quick generate if role already known */}
      {selectedRole && (
        <div className="max-w-md mx-auto mb-8">
          <div className="card border-teal-500/10 bg-teal-500/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 mb-1">Target role detected</p>
                <p className="font-semibold text-teal-400">{selectedRole}</p>
              </div>
              <button
                onClick={() => handleGenerate(selectedRole)}
                disabled={isGenerating}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Generate Path
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Search */}
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
            placeholder="Search roles or type your own..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-8">
        {filteredRoles.map((role) => (
          <button
            key={role}
            onClick={() => handleGenerate(role)}
            disabled={isGenerating}
            className="card-interactive text-center py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm font-medium">{role}</span>
          </button>
        ))}
      </div>

      {searchQuery && !filteredRoles.length && (
        <div className="text-center">
          <button
            onClick={() => handleGenerate(searchQuery)}
            disabled={isGenerating}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate path for &ldquo;{searchQuery}&rdquo;
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-8 card border-teal-500/10 bg-teal-500/[0.03] max-w-2xl mx-auto">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-teal-400 mb-1">Adaptive Learning</h4>
            <p className="text-xs text-white/40">
              For the most personalized path, first complete your{' '}
              <Link href="/dashboard/assessment" className="text-teal-400 hover:underline">
                skill assessment
              </Link>{' '}
              and{' '}
              <Link href="/dashboard/career-plan" className="text-teal-400 hover:underline">
                career plan
              </Link>
              . The AI uses your skill gaps to curate the most relevant resources.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────
export default function LearningPathPage() {
  const { data: session } = useSession();
  const { isAgentic } = useDashboardMode();
  const userPlan = ((session?.user as any)?.plan ?? 'BASIC').toUpperCase() as PlanTier;
  const sageLocked = !isAgentAvailable('sage', userPlan);

  // In Agentic mode, render Cortex-style agent workspace for Sage
  if (isAgentic) return <AgenticWorkspace agentId="sage" />;
  const [filter, setFilter] = useState<string>('all');
  const [learningPath, setLearningPath] = useState<LearningPathData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});
  const [gapReports, setGapReports] = useState<ApplicationGapReport[]>([]);

  // Load saved learning path, progress, and application gap reports on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setLearningPath(JSON.parse(saved));
      }

      const savedProgress = localStorage.getItem(PROGRESS_KEY);
      if (savedProgress) {
        setModuleProgress(JSON.parse(savedProgress));
      }
    } catch (e) {
      console.error('Failed to load saved learning path:', e);
    }

    // Fetch application-based gap analysis
    fetch('/api/agents/skill-gaps')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.reports && Array.isArray(data.reports)) {
          setGapReports(data.reports);
        }
      })
      .catch(() => {});

    setIsLoading(false);
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(moduleProgress).length > 0) {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(moduleProgress));
    }
  }, [moduleProgress]);

  const generatePath = useCallback(async (targetRole: string, gaps: any[]) => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, gaps }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to generate learning path (${res.status})`);
      }

      const data = await res.json();

      // Normalize modules
      const modules: LearningModule[] = (data.modules || []).map((m: any, i: number) => ({
        id: m.id || String(i + 1),
        title: m.title || `Module ${i + 1}`,
        description: m.description || '',
        type: (['course', 'project', 'reading', 'practice'].includes(m.type) ? m.type : 'course') as LearningModule['type'],
        provider: m.provider || '3BOX AI',
        url: m.url || undefined,
        duration: m.duration || 'TBD',
        skills: m.skills || [],
        isAdaptive: m.isAdaptive ?? false,
        progress: 0,
      }));

      const path: LearningPathData = {
        id: data.id,
        targetRole: data.targetRole || targetRole,
        modules,
        estimatedCompletion: data.estimatedCompletion || data.estimatedTimeline || '',
      };

      setLearningPath(path);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(path));
      localStorage.setItem(ROLE_STORAGE_KEY, targetRole);
      notifyAgentCompleted('sage', `Sage built your learning path with ${modules.length} modules`, '/dashboard/learning');

      // Reset progress for new generation
      setModuleProgress({});
      localStorage.removeItem(PROGRESS_KEY);
    } catch (err: any) {
      console.error('[Learning Path]', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const updateModuleProgress = (moduleId: string, delta: number) => {
    setModuleProgress((prev) => {
      const current = prev[moduleId] || 0;
      const next = Math.max(0, Math.min(100, current + delta));
      return { ...prev, [moduleId]: next };
    });
  };

  const getModuleProgress = (mod: LearningModule): number => {
    return moduleProgress[mod.id] ?? mod.progress ?? 0;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <AgentLoader agentId="sage" message="Agent Sage is preparing your learning path" />
      </div>
    );
  }

  // Show generating animation
  if (isGenerating) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-teal-400" /> Adaptive Learning Path
          </h1>
          <p className="text-white/40">Curating your personalized modules...</p>
        </motion.div>
        <GeneratingAnimation targetRole={learningPath?.targetRole || 'your target role'} />
      </div>
    );
  }

  // Show empty state
  if (!learningPath) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-teal-400" /> Adaptive Learning Path
          </h1>
          <p className="text-white/40">Get an AI-curated learning path tailored to your goals.</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border-red-500/20 bg-red-500/5 mb-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-400 mb-1">Generation Failed</h4>
                <p className="text-xs text-white/40">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs text-red-400 hover:underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <EmptyState onGenerate={generatePath} isGenerating={isGenerating} />
      </div>
    );
  }

  // ─── Render Learning Path ─────────────────────
  const modules = learningPath.modules;
  const filtered = filter === 'all' ? modules : modules.filter(m => m.type === filter);
  const totalProgress = modules.length > 0
    ? Math.round(modules.reduce((s, m) => s + getModuleProgress(m), 0) / modules.length)
    : 0;
  const completedCount = modules.filter(m => getModuleProgress(m) === 100).length;
  const adaptiveCount = modules.filter(m => m.isAdaptive).length;
  const allCompleted = modules.length > 0 && modules.every(m => getModuleProgress(m) === 100);

  if (sageLocked) return <AgentLockedPage agentId="sage" />;

  return (
    <div className="max-w-4xl mx-auto">
      <AgentPageHeader agentId="sage" />
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-teal-400" /> Adaptive Learning Path
        </h1>
        <p className="text-white/40">
          Personalized modules for your journey to{' '}
          <span className="text-teal-400">{learningPath.targetRole}</span>.
        </p>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-red-500/20 bg-red-500/5 mb-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-400 mb-1">Error</h4>
              <p className="text-xs text-white/40">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 mb-6 text-xs text-white/30"
      >
        <Sparkles className="w-3.5 h-3.5 text-teal-400" />
        <span>AI-Curated Path</span>
        {learningPath.estimatedCompletion && (
          <>
            <span className="text-white/10">|</span>
            <Clock className="w-3 h-3" />
            <span>Est. {learningPath.estimatedCompletion}</span>
          </>
        )}
        <span className="text-white/10">|</span>
        <span>{modules.length} modules</span>
      </motion.div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold gradient-text">{totalProgress}%</div>
          <div className="text-xs text-white/40">Overall Progress</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-teal-400">{completedCount}/{modules.length}</div>
          <div className="text-xs text-white/40">Modules Complete</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-cyan-400">{adaptiveCount}</div>
          <div className="text-xs text-white/40">AI-Adaptive Modules</div>
        </div>
      </div>

      {/* Application Insights */}
      <ApplicationInsights reports={gapReports} />

      {/* Completion Banner */}
      {allCompleted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-cyan-400/10 border border-teal-500/20"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-7 h-7 text-teal-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-teal-400 mb-1">🎉 Learning Path Complete!</h3>
              <p className="text-sm text-white/50 mb-4">
                Congratulations! You've completed all {modules.length} modules. Time to prove your skills with an assessment.
                Score at least 85% to unlock job applications.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href="/dashboard/assessment"
                  className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" /> Take Assessment
                </Link>
                <span className="text-xs text-white/30">Score 85%+ to unlock job applications</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-white/30" />
          {['all', 'course', 'project', 'reading', 'practice'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            const role = learningPath.targetRole;
            let gaps: any[] = [];
            try {
              const saved = localStorage.getItem(SKILL_SCORES_KEY);
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                  gaps = parsed
                    .filter((s: any) => s.score < 70)
                    .map((s: any) => ({
                      skill: s.skill,
                      current: s.score,
                      required: 80,
                      priority: s.score < 50 ? 'high' : 'medium',
                    }));
                }
              }
            } catch {}
            if (gaps.length === 0) {
              gaps = [{ skill: 'Core Skills', current: 40, required: 80, priority: 'high' }];
            }
            generatePath(role, gaps);
          }}
          disabled={isGenerating}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Regenerate
        </button>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        {filtered.map((mod, i) => {
          const config = typeConfig[mod.type] || typeConfig.course;
          const progress = getModuleProgress(mod);
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card ${progress > 0 && progress < 100 ? 'border-teal-500/20' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <config.icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm">{mod.title}</h3>
                      <p className="text-xs text-white/40 mt-1">{mod.description}</p>
                    </div>
                    {mod.isAdaptive && (
                      <span className="badge-neon text-[10px] flex-shrink-0">
                        <Zap className="w-2.5 h-2.5 mr-0.5" /> Adaptive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    <span className="text-xs text-white/30">{mod.provider}</span>
                    <span className="text-xs text-white/30 flex items-center gap-1"><Clock className="w-3 h-3" /> {mod.duration}</span>
                    <div className="flex gap-1">
                      {mod.skills.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">{s}</span>
                      ))}
                    </div>
                  </div>
                  {/* Progress */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 skill-bar h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className={`skill-bar-fill ${progress === 100 ? 'bg-teal-400' : 'bg-gradient-to-r from-teal-500 to-cyan-500'}`}
                      />
                    </div>
                    <span className="text-xs text-white/40 w-10 text-right">{progress}%</span>
                    {/* Progress Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateModuleProgress(mod.id, -25)}
                        className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-white/40 transition-colors"
                        title="Decrease progress"
                      >
                        -
                      </button>
                      <button
                        onClick={() => updateModuleProgress(mod.id, 25)}
                        className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-white/40 transition-colors"
                        title="Increase progress"
                      >
                        +
                      </button>
                      {progress < 100 && (
                        <button
                          onClick={() => setModuleProgress(prev => ({ ...prev, [mod.id]: 100 }))}
                          className="ml-1"
                          title="Mark as complete"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white/20 hover:text-teal-400 transition-colors" />
                        </button>
                      )}
                    </div>
                    {mod.url && (
                      <a href={mod.url} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card text-center py-12">
          <Filter className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No modules match the selected filter.</p>
          <button
            onClick={() => setFilter('all')}
            className="text-teal-400 text-xs hover:underline mt-2"
          >
            Show all modules
          </button>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-6 text-center text-xs text-white/20 flex items-center justify-center gap-2">
        <Brain className="w-3 h-3" />
        <span>Learning path curated by 3BOX AI Engine</span>
      </div>
    </div>
  );
}
