/**
 * Central tool registry — single source of truth for all AI career tools.
 * Used by ToolsPageClient for listing and individual tool pages for metadata.
 */

import {
  FileSearch, FileText, DollarSign, Hash, Megaphone, Type,
  Award, BarChart, AlignLeft, Mail, Heart, Mic, Search,
  GitCompareArrows, Send, MessageSquare,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FreeService } from '@/lib/usage/freeUsageTracker';

export type ToolCategory = 'resume' | 'linkedin' | 'job-search' | 'interview';

export interface ToolDefinition {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  cta: string;
  gradient: string;
  iconColor: string;
  borderHover: string;
  category: ToolCategory;
  freeServiceKey: FreeService;
  isNew?: boolean;
}

export const TOOL_CATEGORIES: { key: ToolCategory; label: string; description: string }[] = [
  { key: 'resume', label: 'Resume Tools', description: 'Build, optimize, and score your resume' },
  { key: 'linkedin', label: 'LinkedIn Tools', description: 'Grow your LinkedIn presence and network' },
  { key: 'job-search', label: 'Job Search Tools', description: 'Find jobs and craft winning applications' },
  { key: 'interview', label: 'Interview Tools', description: 'Prepare for interviews and follow up' },
];

export const ALL_TOOLS: ToolDefinition[] = [
  // ── Resume Tools ──
  {
    slug: 'ats-checker',
    title: 'ATS Resume Checker',
    description: 'Paste your resume and get instant ATS compatibility score with improvement suggestions.',
    icon: FileSearch,
    href: '/tools/ats-checker',
    cta: 'Check My Resume',
    gradient: 'from-neon-blue/20 to-neon-purple/20',
    iconColor: 'text-neon-blue',
    borderHover: 'hover:border-neon-blue/30',
    category: 'resume',
    freeServiceKey: 'ats_checker',
  },
  {
    slug: 'resume-builder',
    title: 'Free Resume Builder',
    description: 'Build a clean, professional resume with live preview and PDF download. No signup required.',
    icon: FileText,
    href: '/tools/resume-builder',
    cta: 'Build My Resume',
    gradient: 'from-neon-green/20 to-neon-blue/20',
    iconColor: 'text-neon-green',
    borderHover: 'hover:border-neon-green/30',
    category: 'resume',
    freeServiceKey: 'resume_builder',
  },
  {
    slug: 'resume-generator',
    title: 'AI Resume Generator',
    description: 'Generate a tailored, ATS-optimized resume from your job title, experience, and target role.',
    icon: FileText,
    href: '/tools/resume-generator',
    cta: 'Generate Resume',
    gradient: 'from-neon-green/20 to-neon-purple/20',
    iconColor: 'text-neon-green',
    borderHover: 'hover:border-neon-green/30',
    category: 'resume',
    freeServiceKey: 'resume_generator',
    isNew: true,
  },
  {
    slug: 'resume-score',
    title: 'AI Resume Score',
    description: 'Get a quick, comprehensive score for your resume with actionable improvement tips.',
    icon: BarChart,
    href: '/tools/resume-score',
    cta: 'Score My Resume',
    gradient: 'from-neon-blue/20 to-neon-green/20',
    iconColor: 'text-neon-blue',
    borderHover: 'hover:border-neon-blue/30',
    category: 'resume',
    freeServiceKey: 'resume_score',
    isNew: true,
  },
  {
    slug: 'resume-summary-generator',
    title: 'AI Resume Summary',
    description: 'Generate a compelling professional summary for the top of your resume in seconds.',
    icon: AlignLeft,
    href: '/tools/resume-summary-generator',
    cta: 'Generate Summary',
    gradient: 'from-neon-green/20 to-neon-purple/20',
    iconColor: 'text-neon-green',
    borderHover: 'hover:border-neon-green/30',
    category: 'resume',
    freeServiceKey: 'resume_summary',
    isNew: true,
  },

  // ── LinkedIn Tools ──
  {
    slug: 'linkedin-post-generator',
    title: 'AI LinkedIn Post Generator',
    description: 'Create engaging LinkedIn posts that drive comments, shares, and connections.',
    icon: Megaphone,
    href: '/tools/linkedin-post-generator',
    cta: 'Generate Post',
    gradient: 'from-neon-purple/20 to-neon-pink/20',
    iconColor: 'text-neon-purple',
    borderHover: 'hover:border-neon-purple/30',
    category: 'linkedin',
    freeServiceKey: 'linkedin_post',
    isNew: true,
  },
  {
    slug: 'linkedin-headline-generator',
    title: 'AI LinkedIn Headline',
    description: 'Craft a powerful LinkedIn headline that makes recruiters stop scrolling.',
    icon: Type,
    href: '/tools/linkedin-headline-generator',
    cta: 'Generate Headline',
    gradient: 'from-neon-orange/20 to-neon-green/20',
    iconColor: 'text-neon-orange',
    borderHover: 'hover:border-neon-orange/30',
    category: 'linkedin',
    freeServiceKey: 'linkedin_headline',
    isNew: true,
  },
  {
    slug: 'linkedin-hashtag-generator',
    title: 'AI Hashtag Generator',
    description: 'Generate trending, relevant LinkedIn hashtags to maximize your post visibility.',
    icon: Hash,
    href: '/tools/linkedin-hashtag-generator',
    cta: 'Generate Hashtags',
    gradient: 'from-neon-blue/20 to-neon-purple/20',
    iconColor: 'text-neon-blue',
    borderHover: 'hover:border-neon-blue/30',
    category: 'linkedin',
    freeServiceKey: 'linkedin_hashtags',
    isNew: true,
  },
  {
    slug: 'linkedin-recommendation-generator',
    title: 'AI Recommendation Writer',
    description: 'Generate professional LinkedIn recommendations to give or request.',
    icon: Award,
    href: '/tools/linkedin-recommendation-generator',
    cta: 'Write Recommendation',
    gradient: 'from-neon-pink/20 to-neon-purple/20',
    iconColor: 'text-neon-pink',
    borderHover: 'hover:border-neon-pink/30',
    category: 'linkedin',
    freeServiceKey: 'linkedin_recommendation',
    isNew: true,
  },

  // ── Job Search Tools ──
  {
    slug: 'salary-estimator',
    title: 'Salary Estimator',
    description: 'Get AI-powered salary estimates based on role, location, and experience.',
    icon: DollarSign,
    href: '/tools/salary-estimator',
    cta: 'Estimate Salary',
    gradient: 'from-neon-orange/20 to-neon-pink/20',
    iconColor: 'text-neon-orange',
    borderHover: 'hover:border-neon-orange/30',
    category: 'job-search',
    freeServiceKey: 'salary_estimator',
  },
  {
    slug: 'cover-letter-generator',
    title: 'AI Cover Letter Generator',
    description: 'Generate a personalized cover letter for any job description in seconds.',
    icon: Mail,
    href: '/tools/cover-letter-generator',
    cta: 'Generate Cover Letter',
    gradient: 'from-neon-blue/20 to-neon-orange/20',
    iconColor: 'text-neon-blue',
    borderHover: 'hover:border-neon-blue/30',
    category: 'job-search',
    freeServiceKey: 'cover_letter',
    isNew: true,
  },
  {
    slug: 'job-description-analyzer',
    title: 'AI Job Description Analyzer',
    description: 'Extract key requirements, hidden expectations, and keywords from any job posting.',
    icon: Search,
    href: '/tools/job-description-analyzer',
    cta: 'Analyze Job',
    gradient: 'from-neon-green/20 to-neon-orange/20',
    iconColor: 'text-neon-green',
    borderHover: 'hover:border-neon-green/30',
    category: 'job-search',
    freeServiceKey: 'jd_analyzer',
    isNew: true,
  },
  {
    slug: 'skills-gap-finder',
    title: 'AI Skills Gap Finder',
    description: 'Compare your resume against a job description and discover the skills you need.',
    icon: GitCompareArrows,
    href: '/tools/skills-gap-finder',
    cta: 'Find My Gaps',
    gradient: 'from-neon-purple/20 to-neon-blue/20',
    iconColor: 'text-neon-purple',
    borderHover: 'hover:border-neon-purple/30',
    category: 'job-search',
    freeServiceKey: 'skills_gap',
    isNew: true,
  },
  {
    slug: 'cold-email-generator',
    title: 'AI Cold Email Generator',
    description: 'Write compelling outreach emails to hiring managers that actually get responses.',
    icon: Send,
    href: '/tools/cold-email-generator',
    cta: 'Generate Email',
    gradient: 'from-neon-blue/20 to-neon-pink/20',
    iconColor: 'text-neon-blue',
    borderHover: 'hover:border-neon-blue/30',
    category: 'job-search',
    freeServiceKey: 'cold_email',
    isNew: true,
  },

  // ── Interview Tools ──
  {
    slug: 'interview-question-prep',
    title: 'AI Interview Question Prep',
    description: 'Get likely interview questions for any role with expert answer tips.',
    icon: MessageSquare,
    href: '/tools/interview-question-prep',
    cta: 'Prep Questions',
    gradient: 'from-neon-green/20 to-neon-blue/20',
    iconColor: 'text-neon-green',
    borderHover: 'hover:border-neon-green/30',
    category: 'interview',
    freeServiceKey: 'interview_prep',
    isNew: true,
  },
  {
    slug: 'thank-you-email-generator',
    title: 'AI Thank You Email',
    description: 'Send the perfect post-interview thank you email and increase your chances.',
    icon: Heart,
    href: '/tools/thank-you-email-generator',
    cta: 'Generate Email',
    gradient: 'from-neon-pink/20 to-neon-orange/20',
    iconColor: 'text-neon-pink',
    borderHover: 'hover:border-neon-pink/30',
    category: 'interview',
    freeServiceKey: 'thank_you_email',
    isNew: true,
  },
  {
    slug: 'elevator-pitch-generator',
    title: 'AI Elevator Pitch',
    description: 'Create a compelling 30-second pitch for networking, career fairs, and interviews.',
    icon: Mic,
    href: '/tools/elevator-pitch-generator',
    cta: 'Generate Pitch',
    gradient: 'from-neon-orange/20 to-neon-purple/20',
    iconColor: 'text-neon-orange',
    borderHover: 'hover:border-neon-orange/30',
    category: 'interview',
    freeServiceKey: 'elevator_pitch',
    isNew: true,
  },
];

/** Get tools by category */
export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return ALL_TOOLS.filter((t) => t.category === category);
}

/** Get a single tool by slug */
export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return ALL_TOOLS.find((t) => t.slug === slug);
}
