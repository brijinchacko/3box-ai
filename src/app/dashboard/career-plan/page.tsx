'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Target, CheckCircle2, Clock, Lock, ArrowRight, ChevronDown,
  ChevronUp, Code, BookOpen, Briefcase, Award, TrendingUp,
  Calendar, Zap, BarChart3, Sparkles, Brain, RefreshCw,
  Search, AlertCircle, Loader2
} from 'lucide-react';
import AgentPageHeader from '@/components/dashboard/AgentPageHeader';
import AgentLoader from '@/components/brand/AgentLoader';

// ─── Types ──────────────────────────────────────
interface Project {
  id?: string;
  title: string;
  description?: string;
  skills?: string[];
  difficulty?: string;
  estimatedHours?: number;
  status: string;
  hours?: number;
  score?: number | null;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  skills: string[];
  duration: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  projects: Project[];
}

interface CareerPlanData {
  id?: string;
  targetRole: string;
  milestones: Milestone[];
  totalDuration?: string;
  keyMetrics?: Record<string, any>;
}

// ─── Status Config ──────────────────────────────
const statusConfig = {
  completed: { color: 'bg-neon-green', textColor: 'text-neon-green', icon: CheckCircle2, label: 'Completed' },
  'in-progress': { color: 'bg-neon-blue', textColor: 'text-neon-blue', icon: Clock, label: 'In Progress' },
  upcoming: { color: 'bg-white/20', textColor: 'text-white/40', icon: Lock, label: 'Upcoming' },
  'not-started': { color: 'bg-white/10', textColor: 'text-white/30', icon: Lock, label: 'Not Started' },
};

const popularRoles = [
  'AI Engineer', 'Data Scientist', 'Full Stack Developer', 'ML Engineer',
  'DevOps Engineer', 'Product Manager', 'UX Designer', 'Cloud Architect',
  'Cybersecurity Analyst', 'PLC Programmer', 'Mobile Developer', 'Blockchain Developer',
];

const STORAGE_KEY = '3box_career_plan';
const ROLE_STORAGE_KEY = '3box_target_role';
const SKILL_SCORES_KEY = '3box_skill_scores';

// ─── Loading Skeleton ───────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="card"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-white/5 rounded-lg w-3/4 animate-pulse" />
              <div className="h-3 bg-white/5 rounded-lg w-full animate-pulse" />
              <div className="flex gap-2">
                <div className="h-5 bg-white/5 rounded-full w-16 animate-pulse" />
                <div className="h-5 bg-white/5 rounded-full w-20 animate-pulse" />
                <div className="h-5 bg-white/5 rounded-full w-14 animate-pulse" />
              </div>
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
    <div className="card border-neon-purple/20 py-8">
      <AgentLoader agentId="cortex" message={`Cortex is building your ${targetRole} career plan`} size="lg" />
    </div>
  );
}

// ─── Empty State CTA ────────────────────────────
function EmptyState({
  onGenerate,
  isGenerating,
}: {
  onGenerate: (role: string, scores: Record<string, number>) => void;
  isGenerating: boolean;
}) {
  const [targetRole, setTargetRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const filteredRoles = popularRoles.filter((r) =>
    r.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = (role: string) => {
    if (!role.trim()) return;
    // Try to get skill scores from localStorage (saved from assessment)
    let skillScores: Record<string, number> = {};
    try {
      const saved = localStorage.getItem(SKILL_SCORES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((s: any) => { skillScores[s.skill] = s.score; });
        } else {
          skillScores = parsed;
        }
      }
    } catch {}

    // If no scores found, use reasonable defaults
    if (Object.keys(skillScores).length === 0) {
      skillScores = { 'General Knowledge': 50 };
    }

    localStorage.setItem(ROLE_STORAGE_KEY, role);
    onGenerate(role, skillScores);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center mx-auto mb-6">
          <Target className="w-10 h-10 text-neon-purple" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Create Your AI Career Plan</h2>
        <p className="text-white/40 max-w-md mx-auto">
          Our AI will analyze your skills and generate a personalized roadmap with milestones,
          projects, and timelines to reach your dream role.
        </p>
      </div>

      {/* Role Selection */}
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowCustomInput(true);
            }}
            className="input-field pl-10"
            placeholder="Search roles or type your own..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-8">
        {filteredRoles.map((role) => (
          <button
            key={role}
            onClick={() => {
              setTargetRole(role);
              handleGenerate(role);
            }}
            disabled={isGenerating}
            className={`card-interactive text-center py-4 ${
              targetRole === role ? 'border-neon-purple/50 bg-neon-purple/5' : ''
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="text-sm font-medium">{role}</span>
          </button>
        ))}
      </div>

      {searchQuery && !filteredRoles.length && showCustomInput && (
        <div className="text-center">
          <button
            onClick={() => handleGenerate(searchQuery)}
            disabled={isGenerating}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate plan for &ldquo;{searchQuery}&rdquo;
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-8 card border-neon-blue/10 bg-neon-blue/[0.03] max-w-2xl mx-auto">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-neon-blue flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-neon-blue mb-1">AI-Powered Planning</h4>
            <p className="text-xs text-white/40">
              For best results, take the{' '}
              <Link href="/dashboard/assessment" className="text-neon-blue hover:underline">
                skill assessment
              </Link>{' '}
              first. The AI uses your assessment scores to create a more accurate and personalized plan.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────
export default function CareerPlanPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [careerPlan, setCareerPlan] = useState<CareerPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [milestoneProgress, setMilestoneProgress] = useState<Record<string, Record<string, string>>>({});

  // Load saved career plan and progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCareerPlan(parsed);
        // Auto-expand the first in-progress milestone
        const inProgressMilestone = parsed.milestones?.find(
          (m: Milestone) => m.status === 'in-progress'
        );
        if (inProgressMilestone) {
          setExpanded(inProgressMilestone.id);
        }
      }

      const savedProgress = localStorage.getItem(`${STORAGE_KEY}_progress`);
      if (savedProgress) {
        setMilestoneProgress(JSON.parse(savedProgress));
      }
    } catch (e) {
      console.error('Failed to load saved career plan:', e);
    }
    setIsLoading(false);
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(milestoneProgress).length > 0) {
      localStorage.setItem(`${STORAGE_KEY}_progress`, JSON.stringify(milestoneProgress));
    }
  }, [milestoneProgress]);

  const generatePlan = useCallback(async (targetRole: string, skillScores: Record<string, number>) => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/career-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, skillScores }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to generate career plan (${res.status})`);
      }

      const data = await res.json();

      // Normalize milestones: ensure they have proper IDs and statuses
      const milestones: Milestone[] = (data.milestones || []).map((m: any, i: number) => ({
        id: m.id || String(i + 1),
        title: m.title || `Milestone ${i + 1}`,
        description: m.description || '',
        skills: m.skills || [],
        duration: m.duration || m.estimatedDuration || 'TBD',
        status: m.status || 'upcoming',
        projects: (m.projects || []).map((p: any, j: number) => ({
          id: p.id || `${i + 1}-${j + 1}`,
          title: p.title || `Project ${j + 1}`,
          description: p.description || '',
          skills: p.skills || [],
          difficulty: p.difficulty || 'intermediate',
          estimatedHours: p.estimatedHours || p.hours || 10,
          status: p.status || 'not-started',
          hours: p.estimatedHours || p.hours || 10,
          score: p.score || null,
        })),
      }));

      const plan: CareerPlanData = {
        id: data.id,
        targetRole: data.targetRole || targetRole,
        milestones,
        totalDuration: data.totalDuration || data.timeline || '',
        keyMetrics: data.keyMetrics || {},
      };

      setCareerPlan(plan);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
      localStorage.setItem(ROLE_STORAGE_KEY, targetRole);

      // Auto-expand first milestone
      if (milestones.length > 0) {
        setExpanded(milestones[0].id);
      }
    } catch (err: any) {
      console.error('[Career Plan]', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const toggleProjectStatus = (milestoneId: string, projectTitle: string) => {
    setMilestoneProgress((prev) => {
      const milestoneProj = prev[milestoneId] || {};
      const currentStatus = milestoneProj[projectTitle] || 'not-started';
      const nextStatus = currentStatus === 'not-started' ? 'in-progress' : currentStatus === 'in-progress' ? 'completed' : 'not-started';
      return {
        ...prev,
        [milestoneId]: { ...milestoneProj, [projectTitle]: nextStatus },
      };
    });
  };

  // Compute stats with progress overrides
  const getProjectStatus = (milestoneId: string, projectTitle: string, defaultStatus: string): string => {
    return milestoneProgress[milestoneId]?.[projectTitle] || defaultStatus;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <AgentLoader agentId="cortex" message="Cortex is loading your career plan" />
      </div>
    );
  }

  // Show generating animation
  if (isGenerating) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
            <Target className="w-7 h-7 text-neon-purple" /> Career Plan
          </h1>
          <p className="text-white/40">Generating your personalized roadmap...</p>
        </motion.div>
        <GeneratingAnimation targetRole={careerPlan?.targetRole || 'your target role'} />
      </div>
    );
  }

  // Show empty state
  if (!careerPlan) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
            <Target className="w-7 h-7 text-neon-purple" /> Career Plan
          </h1>
          <p className="text-white/40">Get an AI-generated roadmap to your dream career.</p>
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

        <EmptyState onGenerate={generatePlan} isGenerating={isGenerating} />
      </div>
    );
  }

  // ─── Render Plan ──────────────────────────────
  const milestones = careerPlan.milestones;

  const totalProjects = milestones.reduce((sum, m) => sum + m.projects.length, 0);
  const completedProjects = milestones.reduce(
    (sum, m) =>
      sum +
      m.projects.filter(
        (p) => getProjectStatus(m.id, p.title, p.status) === 'completed'
      ).length,
    0
  );
  const overallProgress = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <AgentPageHeader agentId="sage" />
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <Target className="w-7 h-7 text-neon-purple" /> Career Plan
        </h1>
        <p className="text-white/40">
          Your personalized roadmap to becoming an{' '}
          <span className="text-neon-blue">{careerPlan.targetRole}</span>
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
        <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
        <span>AI-Generated Plan</span>
        {careerPlan.totalDuration && (
          <>
            <span className="text-white/10">|</span>
            <Calendar className="w-3 h-3" />
            <span>Est. {careerPlan.totalDuration}</span>
          </>
        )}
        <span className="text-white/10">|</span>
        <span>{milestones.length} milestones</span>
      </motion.div>

      {/* Overview Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Overall Progress', value: `${overallProgress}%`, icon: BarChart3, color: 'text-neon-blue' },
          { label: 'Projects Done', value: `${completedProjects}/${totalProjects}`, icon: Code, color: 'text-neon-green' },
          { label: 'Est. Completion', value: careerPlan.totalDuration || `${milestones.length * 2} weeks`, icon: Calendar, color: 'text-neon-purple' },
          { label: 'Milestones', value: `${milestones.length}`, icon: Award, color: 'text-yellow-400' },
        ].map((stat) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card text-center">
            <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-xs text-white/40">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Overall Progress Bar */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Journey Progress</span>
          <span className="text-sm text-white/40">{overallProgress}% complete</span>
        </div>
        <div className="skill-bar h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1.5 }}
            className="skill-bar-fill bg-gradient-to-r from-neon-blue to-neon-purple"
          />
        </div>
      </div>

      {/* Timeline Milestones */}
      <div className="space-y-4">
        {milestones.map((milestone, i) => {
          const effectiveStatus = milestone.status;
          const config = statusConfig[effectiveStatus] || statusConfig['upcoming'];
          const isExpanded = expanded === milestone.id;

          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {/* Timeline line */}
              {i < milestones.length - 1 && (
                <div className={`absolute left-6 top-16 bottom-0 w-px ${effectiveStatus === 'completed' ? 'bg-neon-green/30' : 'bg-white/5'}`} />
              )}

              <div
                className={`card cursor-pointer ${effectiveStatus === 'in-progress' ? 'border-neon-blue/20 neon-glow' : ''}`}
                onClick={() => setExpanded(isExpanded ? null : milestone.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    effectiveStatus === 'completed' ? 'bg-neon-green/10' :
                    effectiveStatus === 'in-progress' ? 'bg-neon-blue/10' : 'bg-white/5'
                  }`}>
                    <config.icon className={`w-5 h-5 ${config.textColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{milestone.title}</h3>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                    </div>
                    <p className="text-sm text-white/40 mt-1">{milestone.description}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className={`badge text-[10px] ${config.color}/10 ${config.textColor}`}>{config.label}</span>
                      <span className="text-xs text-white/30 flex items-center gap-1"><Clock className="w-3 h-3" /> {milestone.duration}</span>
                      <div className="flex gap-1">
                        {milestone.skills.slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">{s}</span>
                        ))}
                        {milestone.skills.length > 3 && <span className="text-[10px] text-white/30">+{milestone.skills.length - 3}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded: Projects */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-6 border-t border-white/5"
                  >
                    <h4 className="text-sm font-semibold text-white/60 mb-4">Proof-of-Work Projects</h4>
                    <div className="space-y-3">
                      {milestone.projects.map((project) => {
                        const pStatus = getProjectStatus(milestone.id, project.title, project.status);
                        const pConfig = statusConfig[pStatus as keyof typeof statusConfig] || statusConfig['not-started'];
                        return (
                          <div key={project.title} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProjectStatus(milestone.id, project.title);
                                }}
                                className="hover:scale-110 transition-transform"
                                title="Click to toggle status"
                              >
                                <pConfig.icon className={`w-4 h-4 ${pConfig.textColor}`} />
                              </button>
                              <div>
                                <div className="text-sm font-medium">{project.title}</div>
                                <div className="text-xs text-white/30">
                                  {project.estimatedHours || project.hours || '?'}h estimated
                                  {project.difficulty && (
                                    <span className="ml-2 text-white/20">({project.difficulty})</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {project.score ? (
                                <div className="text-sm font-bold text-neon-green">{project.score}/100</div>
                              ) : (
                                <span className={`text-xs ${pConfig.textColor}`}>{pConfig.label}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-8 flex gap-3">
        <Link href="/dashboard/learning" className="btn-primary flex-1 text-center flex items-center justify-center gap-2">
          Start Learning Path <ArrowRight className="w-4 h-4" />
        </Link>
        <button
          onClick={() => {
            const role = careerPlan.targetRole;
            let skillScores: Record<string, number> = {};
            try {
              const saved = localStorage.getItem(SKILL_SCORES_KEY);
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                  parsed.forEach((s: any) => { skillScores[s.skill] = s.score; });
                } else {
                  skillScores = parsed;
                }
              }
            } catch {}
            if (Object.keys(skillScores).length === 0) {
              skillScores = { 'General Knowledge': 50 };
            }
            generatePlan(role, skillScores);
          }}
          disabled={isGenerating}
          className="btn-secondary flex items-center justify-center gap-2 px-6 disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Regenerate
        </button>
      </div>

      {/* Footer info */}
      <div className="mt-4 text-center text-xs text-white/20 flex items-center justify-center gap-2">
        <Brain className="w-3 h-3" />
        <span>Plan generated by 3BOX AI Engine</span>
      </div>
    </div>
  );
}
