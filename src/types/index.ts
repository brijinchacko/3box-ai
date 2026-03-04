// ─── Plan types ────────────────────────────────
export type PlanTier = 'BASIC' | 'STARTER' | 'PRO' | 'ULTRA';

export interface PlanFeatures {
  aiCredits: number;
  assessments: number;
  resumes: number;
  exports: number;
}

// ─── Subscription types ───────────────────────
export interface SubscriptionData {
  id: string;
  plan: PlanTier;
  status: string;
  interval: 'monthly' | 'yearly';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// ─── Referral types ───────────────────────────
export interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  rewardedReferrals: number;
  referralLink: string;
}

// ─── Credit Pack types ────────────────────────
export interface CreditPack {
  id: string;
  credits: number;
  price: number;
}

// ─── Blog types ───────────────────────────────
export interface BlogPostData {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  category: string;
  tags: string[];
  readTime: number;
  publishedAt: string;
}

// ─── ATS types ────────────────────────────────
export interface ATSResult {
  score: number;
  issues: { type: string; message: string }[];
  keywords: { found: string[]; missing: string[]; suggested: string[] };
  formatting: { score: number; issues: string[] };
  sections: { present: string[]; missing: string[] };
}

// ─── Salary types ─────────────────────────────
export interface SalaryEstimate {
  low: number;
  median: number;
  high: number;
  currency: string;
  factors: string[];
  marketTrend: string;
  demandLevel: string;
}

// ─── Onboarding types ─────────────────────────
export interface OnboardingData {
  targetRole: string;
  interests: string[];
}

// ─── User types ────────────────────────────────
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  plan: PlanTier;
  isOforoInternal: boolean;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  onboardingDone: boolean;
  referralCode: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
}

// ─── Assessment types ──────────────────────────
export interface AssessmentQuestion {
  id: string;
  type: 'mcq' | 'scenario' | 'task';
  question: string;
  options?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skill: string;
  timeLimit?: number;
}

export interface SkillScore {
  skill: string;
  score: number;
  level: string;
  color: string;
}

export interface AssessmentResult {
  targetRole: string;
  skillScores: SkillScore[];
  overallScore: number;
  gaps: SkillGap[];
  recommendations: string[];
  timelineEstimate: string;
}

export interface SkillGap {
  skill: string;
  current: number;
  required: number;
  priority: 'high' | 'medium' | 'low';
}

// ─── Career Plan types ─────────────────────────
export interface Milestone {
  id: string;
  title: string;
  description: string;
  skills: string[];
  duration: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  projects: ProofProject[];
}

export interface ProofProject {
  id: string;
  title: string;
  description: string;
  skills: string[];
  difficulty: string;
  estimatedHours: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'verified';
  evidenceUrl?: string;
  score?: number;
}

// ─── Learning Path types ───────────────────────
export interface LearningModule {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'project' | 'reading' | 'practice';
  provider?: string;
  url?: string;
  duration: string;
  skills: string[];
  progress: number;
  isAdaptive: boolean;
}

// ─── Resume types ──────────────────────────────
export interface ResumeData {
  id: string;
  title: string;
  template: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
  projects: ResumeProject[];
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
  verified: boolean;
}

export interface ResumeProject {
  id: string;
  name: string;
  description: string;
  url?: string;
  technologies: string[];
}

// ─── Job types ─────────────────────────────────
export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  matchReasons: string[];
  improvementSteps: string[];
  postedDate: string;
  source: string;
  url?: string;
}

export interface JobApplicationData {
  id: string;
  jobTitle: string;
  company: string;
  status: 'queued' | 'applied' | 'viewed' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  appliedAt?: string;
  matchScore: number;
  source: 'manual' | 'auto';
}

// ─── AI Coach types ────────────────────────────
export interface CoachConfig {
  name: string;
  personality: 'friendly' | 'professional' | 'motivational' | 'technical';
  avatarUrl?: string;
  enabled: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Career Twin ───────────────────────────────
export interface CareerTwinData {
  skillSnapshot: Record<string, number>;
  interests: string[];
  targetRoles: { title: string; probability: number }[];
  marketReadiness: number;
  hireProb: number;
}
