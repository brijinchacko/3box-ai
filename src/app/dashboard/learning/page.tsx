'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen, Play, CheckCircle2, Clock, ExternalLink, Filter,
  Code, FileText, Lightbulb, TrendingUp, Star, ArrowRight, Zap,
  Sparkles, Brain, RefreshCw, Search, AlertCircle, Loader2, Target
} from 'lucide-react';

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
  course: { icon: Play, color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
  project: { icon: Code, color: 'text-neon-green', bg: 'bg-neon-green/10' },
  reading: { icon: FileText, color: 'text-neon-purple', bg: 'bg-neon-purple/10' },
  practice: { icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
};

const STORAGE_KEY = 'nxted_learning_path';
const PROGRESS_KEY = 'nxted_learning_progress';
const ROLE_STORAGE_KEY = 'nxted_target_role';
const SKILL_SCORES_KEY = 'nxted_skill_scores';

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
  const messages = [
    'Analyzing your skill gaps...',
    `Searching best resources for ${targetRole}...`,
    'Curating courses from top providers...',
    'Designing hands-on projects...',
    'Building adaptive learning modules...',
    'Personalizing your learning timeline...',
  ];
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card border-neon-green/20 text-center py-16"
    >
      <div className="relative w-20 h-20 mx-auto mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-green border-r-neon-blue"
        />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-neon-green/10 to-neon-blue/10 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-neon-green" />
        </div>
      </div>

      <h3 className="text-lg font-bold mb-2">AI is curating your personalized learning path</h3>
      <p className="text-white/40 text-sm mb-6">This usually takes 10-15 seconds</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={msgIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-center gap-2 text-sm text-neon-green"
        >
          <Sparkles className="w-4 h-4" />
          <span>{messages[msgIndex]}</span>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/20">
        <Zap className="w-3 h-3" />
        <span>Powered by NXTED AI Engine</span>
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
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-blue/20 flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-neon-green" />
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
          <div className="card border-neon-green/10 bg-neon-green/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 mb-1">Target role detected</p>
                <p className="font-semibold text-neon-green">{selectedRole}</p>
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
      <div className="mt-8 card border-neon-green/10 bg-neon-green/[0.03] max-w-2xl mx-auto">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-neon-green mb-1">Adaptive Learning</h4>
            <p className="text-xs text-white/40">
              For the most personalized path, first complete your{' '}
              <Link href="/dashboard/assessment" className="text-neon-green hover:underline">
                skill assessment
              </Link>{' '}
              and{' '}
              <Link href="/dashboard/career-plan" className="text-neon-green hover:underline">
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
  const [filter, setFilter] = useState<string>('all');
  const [learningPath, setLearningPath] = useState<LearningPathData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});

  // Load saved learning path and progress on mount
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
        provider: m.provider || 'NXTED AI',
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
        <div className="mb-8">
          <div className="h-8 bg-white/5 rounded-lg w-56 animate-pulse mb-2" />
          <div className="h-4 bg-white/5 rounded-lg w-80 animate-pulse" />
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  // Show generating animation
  if (isGenerating) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-neon-green" /> Adaptive Learning Path
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
            <BookOpen className="w-7 h-7 text-neon-green" /> Adaptive Learning Path
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

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-neon-green" /> Adaptive Learning Path
        </h1>
        <p className="text-white/40">
          Personalized modules for your journey to{' '}
          <span className="text-neon-green">{learningPath.targetRole}</span>.
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
        <Sparkles className="w-3.5 h-3.5 text-neon-green" />
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
          <div className="text-2xl font-bold text-neon-green">{completedCount}/{modules.length}</div>
          <div className="text-xs text-white/40">Modules Complete</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-neon-purple">{adaptiveCount}</div>
          <div className="text-xs text-white/40">AI-Adaptive Modules</div>
        </div>
      </div>

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
              className={`card ${progress > 0 && progress < 100 ? 'border-neon-blue/20' : ''}`}
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
                        className={`skill-bar-fill ${progress === 100 ? 'bg-neon-green' : 'bg-neon-blue'}`}
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
                          <CheckCircle2 className="w-4 h-4 text-white/20 hover:text-neon-green transition-colors" />
                        </button>
                      )}
                    </div>
                    {mod.url && (
                      <a href={mod.url} target="_blank" rel="noopener noreferrer" className="text-neon-blue hover:underline">
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
            className="text-neon-blue text-xs hover:underline mt-2"
          >
            Show all modules
          </button>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-6 text-center text-xs text-white/20 flex items-center justify-center gap-2">
        <Brain className="w-3 h-3" />
        <span>Learning path curated by NXTED AI Engine</span>
      </div>
    </div>
  );
}
