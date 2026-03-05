/**
 * Unified AI Context Injection System
 * Builds a rich user context document from all DB models and serializes it
 * for injection into every AI system prompt across the platform.
 *
 * Every AI feature (resume writing, career coaching, interview prep, etc.)
 * gets access to the user's full profile, skills, goals, and progress.
 */

import type { PlanTier } from './openrouter';

const getPrisma = () => require('@/lib/db/prisma').prisma;

// ─── Types ──────────────────────────────────────

export interface UserContextDocument {
  user: {
    name: string;
    plan: string;
    memberSince: string;
    onboardingDone: boolean;
  };

  careerProfile: {
    targetRoles: { title: string; experienceLevel?: string; currentStatus?: string }[];
    interests: string[];
    marketReadiness: number;
    hireProbability: number;
    location: string;
    linkedin: string;
    bio: string;
    educationLevel: string;
    fieldOfStudy: string;
    institution: string;
    graduationYear: string;
    experiences: { title: string; company: string; duration: string; bullets: string[] }[];
  } | null;

  skills: {
    snapshot: Record<string, string>;
    latestAssessmentScores: { skill: string; score: number; level: string }[];
    overallScore: number | null;
    gaps: { skill: string; current: number; required: number; priority: string }[];
  };

  assessments: {
    totalCompleted: number;
    latest: {
      targetRole: string;
      completedAt: string;
    } | null;
  };

  careerPlan: {
    hasActivePlan: boolean;
    targetRole: string | null;
    totalMilestones: number;
    completedMilestones: number;
    currentMilestone: string | null;
    totalProjects: number;
  } | null;

  learning: {
    hasPath: boolean;
    targetRole: string | null;
    totalModules: number;
    completedModules: number;
    progressPercentage: number;
  } | null;

  resume: {
    hasResume: boolean;
    count: number;
    latestAtsScore: number | null;
    latestTargetJob: string | null;
    latestSummary: string | null;
    latestSkills: string[];
  };

  jobSearch: {
    totalApplications: number;
    applied: number;
    interview: number;
    offer: number;
    rejected: number;
    recentApplications: { jobTitle: string; company: string; status: string }[];
  };

  portfolio: {
    hasPortfolio: boolean;
    projectCount: number;
    isPublic: boolean;
    skills: string[];
  } | null;

  coachSettings: {
    name: string;
    personality: string;
  };
}

// ─── In-memory cache (5 min TTL) ─────────────────

const contextCache = new Map<string, { data: UserContextDocument; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function invalidateUserContext(userId: string) {
  contextCache.delete(userId);
}

// ─── Build User Context ──────────────────────────

export async function buildUserContext(userId: string): Promise<UserContextDocument> {
  // Check cache
  const cached = contextCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const prisma = getPrisma();

  // Parallel fetch all user data
  const [user, careerTwin, assessments, careerPlan, learningPath, resumes, jobApplications, portfolio, coachSettings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, plan: true, createdAt: true, onboardingDone: true },
    }),
    prisma.careerTwin.findFirst({
      where: { userId },
      select: { skillSnapshot: true, interests: true, targetRoles: true, marketReadiness: true, hireProb: true },
    }),
    prisma.assessment.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { targetRole: true, skillScores: true, aiAnalysis: true, createdAt: true },
    }),
    prisma.careerPlan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { targetRole: true, milestones: true, projects: true, status: true },
    }),
    prisma.learningPath.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { targetRole: true, modules: true, progress: true },
    }),
    prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      select: { content: true, targetJob: true, atsScore: true },
    }),
    prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { jobTitle: true, company: true, status: true },
    }),
    prisma.portfolio.findFirst({
      where: { userId },
      select: { projects: true, skills: true, isPublic: true },
    }),
    prisma.coachSettings.findFirst({
      where: { userId },
      select: { name: true, personality: true },
    }),
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  // ─── Parse CareerTwin profile ────────────
  let careerProfile: UserContextDocument['careerProfile'] = null;
  if (careerTwin) {
    const snapshot = (careerTwin.skillSnapshot || {}) as Record<string, any>;
    const profile = snapshot._profile || {};
    const targetRoles = (careerTwin.targetRoles || []) as any[];
    const interests = (careerTwin.interests || []) as string[];

    careerProfile = {
      targetRoles: targetRoles.map((r: any) => ({
        title: r.title || r,
        experienceLevel: r.experienceLevel,
        currentStatus: r.currentStatus,
      })),
      interests,
      marketReadiness: careerTwin.marketReadiness || 0,
      hireProbability: careerTwin.hireProb || 0,
      location: profile.location || '',
      linkedin: profile.linkedin || '',
      bio: profile.bio || '',
      educationLevel: profile.educationLevel || '',
      fieldOfStudy: profile.fieldOfStudy || '',
      institution: profile.institution || '',
      graduationYear: profile.graduationYear || '',
      experiences: (profile.experiences || []).map((e: any) => ({
        title: e.title || e.jobTitle || '',
        company: e.company || '',
        duration: e.duration || '',
        bullets: e.bullets || e.description ? [e.description] : [],
      })),
    };
  }

  // ─── Parse skills from CareerTwin + Assessments ────────
  const snapshot = (careerTwin?.skillSnapshot || {}) as Record<string, any>;
  const skillEntries: Record<string, string> = {};
  Object.entries(snapshot).forEach(([key, val]) => {
    if (key.startsWith('_')) return; // skip _profile and other meta
    if (typeof val === 'object' && val !== null && 'level' in val) {
      skillEntries[key] = (val as any).level;
    } else if (typeof val === 'number') {
      skillEntries[key] = val >= 80 ? 'advanced' : val >= 50 ? 'intermediate' : 'beginner';
    } else if (typeof val === 'string') {
      skillEntries[key] = val;
    }
  });

  const latestAssessment = assessments[0] || null;
  const latestScores = latestAssessment?.skillScores as any[] | null;
  const latestAnalysis = latestAssessment?.aiAnalysis as any | null;

  const skills: UserContextDocument['skills'] = {
    snapshot: skillEntries,
    latestAssessmentScores: Array.isArray(latestScores)
      ? latestScores.map((s: any) => ({ skill: s.skill, score: s.score, level: s.level }))
      : [],
    overallScore: latestAnalysis?.overallScore || null,
    gaps: Array.isArray(latestAnalysis?.gaps)
      ? latestAnalysis.gaps.map((g: any) => ({
          skill: g.skill,
          current: g.current,
          required: g.required,
          priority: g.priority,
        }))
      : [],
  };

  // ─── Parse Career Plan ────────────
  let careerPlanDoc: UserContextDocument['careerPlan'] = null;
  if (careerPlan) {
    const milestones = (careerPlan.milestones || []) as any[];
    const completedMilestones = milestones.filter((m: any) => m.status === 'completed' || m.status === 'done').length;
    const currentMs = milestones.find((m: any) => m.status === 'in-progress' || m.status === 'current');
    const projects = (careerPlan.projects || []) as any[];

    careerPlanDoc = {
      hasActivePlan: true,
      targetRole: careerPlan.targetRole,
      totalMilestones: milestones.length,
      completedMilestones,
      currentMilestone: currentMs?.title || null,
      totalProjects: projects.length || milestones.reduce((acc: number, m: any) => acc + (m.projects?.length || 0), 0),
    };
  }

  // ─── Parse Learning Path ────────────
  let learningDoc: UserContextDocument['learning'] = null;
  if (learningPath) {
    const modules = (learningPath.modules || []) as any[];
    const progress = (learningPath.progress || {}) as Record<string, any>;
    const completedModules = Object.values(progress).filter((p: any) => p === true || p === 'completed' || (typeof p === 'object' && p?.completed)).length;

    learningDoc = {
      hasPath: true,
      targetRole: learningPath.targetRole,
      totalModules: modules.length,
      completedModules,
      progressPercentage: modules.length > 0 ? Math.round((completedModules / modules.length) * 100) : 0,
    };
  }

  // ─── Parse Resumes ────────────
  const latestResume = resumes[0] || null;
  const resumeContent = latestResume?.content as any;

  const resumeDoc: UserContextDocument['resume'] = {
    hasResume: resumes.length > 0,
    count: resumes.length,
    latestAtsScore: latestResume?.atsScore || null,
    latestTargetJob: latestResume?.targetJob || null,
    latestSummary: resumeContent?.summary || resumeContent?.personalInfo?.summary || null,
    latestSkills: Array.isArray(resumeContent?.skills)
      ? resumeContent.skills.map((s: any) => (typeof s === 'string' ? s : s.name || s.skill || '')).filter(Boolean).slice(0, 15)
      : [],
  };

  // ─── Parse Job Applications ────────────
  const statusCounts = { applied: 0, interview: 0, offer: 0, rejected: 0 };
  jobApplications.forEach((app: any) => {
    const s = app.status?.toLowerCase();
    if (s === 'applied' || s === 'viewed') statusCounts.applied++;
    else if (s === 'interview') statusCounts.interview++;
    else if (s === 'offer') statusCounts.offer++;
    else if (s === 'rejected' || s === 'withdrawn') statusCounts.rejected++;
  });

  const jobSearchDoc: UserContextDocument['jobSearch'] = {
    totalApplications: jobApplications.length,
    ...statusCounts,
    recentApplications: jobApplications.slice(0, 5).map((a: any) => ({
      jobTitle: a.jobTitle,
      company: a.company,
      status: a.status,
    })),
  };

  // ─── Parse Portfolio ────────────
  let portfolioDoc: UserContextDocument['portfolio'] = null;
  if (portfolio) {
    const projects = (portfolio.projects || []) as any[];
    const portfolioSkills = (portfolio.skills || []) as string[];

    portfolioDoc = {
      hasPortfolio: true,
      projectCount: projects.length,
      isPublic: portfolio.isPublic || false,
      skills: portfolioSkills.slice(0, 10),
    };
  }

  // ─── Build final document ────────────
  const doc: UserContextDocument = {
    user: {
      name: user.name || 'User',
      plan: user.plan || 'BASIC',
      memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
      onboardingDone: user.onboardingDone || false,
    },
    careerProfile,
    skills,
    assessments: {
      totalCompleted: assessments.length,
      latest: latestAssessment ? {
        targetRole: latestAssessment.targetRole,
        completedAt: new Date(latestAssessment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      } : null,
    },
    careerPlan: careerPlanDoc,
    learning: learningDoc,
    resume: resumeDoc,
    jobSearch: jobSearchDoc,
    portfolio: portfolioDoc,
    coachSettings: {
      name: coachSettings?.name || 'Nova',
      personality: coachSettings?.personality || 'friendly',
    },
  };

  // Cache result
  contextCache.set(userId, { data: doc, timestamp: Date.now() });

  return doc;
}

// ─── Serialize for System Prompt Injection ───────

export function serializeUserContext(ctx: UserContextDocument): string {
  const lines: string[] = [];
  lines.push('=== USER CONTEXT (Use this to personalize your response) ===');

  // Identity
  lines.push(`Name: ${ctx.user.name} | Plan: ${ctx.user.plan} | Member since: ${ctx.user.memberSince}`);

  // Career profile
  if (ctx.careerProfile) {
    const p = ctx.careerProfile;
    if (p.targetRoles.length > 0) {
      const roles = p.targetRoles.map(r => {
        let s = r.title;
        if (r.experienceLevel) s += ` (${r.experienceLevel})`;
        return s;
      }).join(', ');
      lines.push(`Target Role(s): ${roles}`);
    }
    if (p.targetRoles[0]?.currentStatus) {
      lines.push(`Current Status: ${p.targetRoles[0].currentStatus}`);
    }
    if (p.location) lines.push(`Location: ${p.location}`);
    if (p.educationLevel || p.institution) {
      const edu = [p.educationLevel, p.fieldOfStudy, p.institution, p.graduationYear].filter(Boolean).join(', ');
      lines.push(`Education: ${edu}`);
    }
    if (p.bio) lines.push(`Bio: ${p.bio}`);
    if (p.experiences.length > 0) {
      lines.push(`Work Experience: ${p.experiences.length} position(s)`);
      p.experiences.slice(0, 3).forEach(e => {
        lines.push(`  - ${e.title}${e.company ? ` at ${e.company}` : ''}${e.duration ? ` (${e.duration})` : ''}`);
      });
    }
    if (p.interests.length > 0) {
      lines.push(`Interests: ${p.interests.join(', ')}`);
    }
    lines.push(`Market Readiness: ${Math.round(p.marketReadiness)}% | Hire Probability: ${Math.round(p.hireProbability)}%`);
  }

  // Skills
  const skillKeys = Object.keys(ctx.skills.snapshot);
  if (skillKeys.length > 0) {
    const skillStr = skillKeys.slice(0, 12).map(k => `${k} (${ctx.skills.snapshot[k]})`).join(', ');
    lines.push(`Skills: ${skillStr}`);
  }
  if (ctx.skills.overallScore !== null) {
    lines.push(`Assessment Score: ${ctx.skills.overallScore}/100`);
  }
  if (ctx.skills.gaps.length > 0) {
    const gapStr = ctx.skills.gaps.slice(0, 5).map(g => `${g.skill} (${g.current}/${g.required}, ${g.priority})`).join(', ');
    lines.push(`Skill Gaps: ${gapStr}`);
  }

  // Career Plan
  if (ctx.careerPlan?.hasActivePlan) {
    const cp = ctx.careerPlan;
    lines.push(`Career Plan: Active for ${cp.targetRole} | ${cp.completedMilestones}/${cp.totalMilestones} milestones${cp.currentMilestone ? ` | Current: "${cp.currentMilestone}"` : ''}`);
  }

  // Learning
  if (ctx.learning?.hasPath) {
    const lp = ctx.learning;
    lines.push(`Learning: ${lp.completedModules}/${lp.totalModules} modules (${lp.progressPercentage}%) for ${lp.targetRole}`);
  }

  // Resume
  if (ctx.resume.hasResume) {
    const r = ctx.resume;
    let resumeLine = `Resume: ${r.count} saved`;
    if (r.latestAtsScore) resumeLine += ` | ATS Score: ${r.latestAtsScore}`;
    if (r.latestTargetJob) resumeLine += ` | Targeting: ${r.latestTargetJob}`;
    lines.push(resumeLine);
    if (r.latestSkills.length > 0) {
      lines.push(`Resume Skills: ${r.latestSkills.join(', ')}`);
    }
    if (r.latestSummary) {
      lines.push(`Resume Summary: ${r.latestSummary.slice(0, 200)}`);
    }
  }

  // Job Search
  if (ctx.jobSearch.totalApplications > 0) {
    const j = ctx.jobSearch;
    lines.push(`Job Applications: ${j.totalApplications} total (${j.applied} applied, ${j.interview} interviewing, ${j.offer} offers, ${j.rejected} rejected)`);
  }

  // Portfolio
  if (ctx.portfolio?.hasPortfolio) {
    lines.push(`Portfolio: ${ctx.portfolio.projectCount} projects | ${ctx.portfolio.isPublic ? 'Public' : 'Private'}`);
  }

  lines.push('=== END USER CONTEXT ===');

  return lines.join('\n');
}

// ─── Convenience: Build + Serialize in one call ──

export async function getUserContextString(userId: string): Promise<string> {
  try {
    const ctx = await buildUserContext(userId);
    return serializeUserContext(ctx);
  } catch (err) {
    console.warn('[AI Context] Failed to build user context:', err);
    return ''; // Graceful fallback — AI still works, just without personalization
  }
}
