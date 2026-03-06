export type AgentId = 'scout' | 'archer' | 'forge' | 'atlas' | 'sage' | 'sentinel';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  shortDescription: string; // one-liner for cards
  icon: string; // lucide-react icon name
  color: string; // tailwind color class
  gradient: string; // gradient classes for cards
  minPlan: 'STARTER' | 'PRO' | 'ULTRA';
  capabilities: string[];
  actions: string[]; // action types this agent can perform
}

export const AGENTS: Record<AgentId, AgentDefinition> = {
  scout: {
    id: 'scout',
    name: 'Scout',
    role: 'Job Hunter',
    description: 'Discovers jobs matching your profile from 6+ sources across the web. Scans Naukri, LinkedIn, Indeed, Google Jobs, and more. Scores each opportunity against your skills and preferences.',
    shortDescription: 'Finds jobs matching your profile',
    icon: 'Search',
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    minPlan: 'STARTER',
    capabilities: ['Multi-source job scanning', 'Match scoring', 'Smart filtering', 'Exclusion rules'],
    actions: ['discovered_jobs', 'scored_matches', 'filtered_results'],
  },
  forge: {
    id: 'forge',
    name: 'Forge',
    role: 'Resume Optimizer',
    description: 'Analyzes your resume against target jobs and creates optimized variants. Enhances keywords for ATS systems, improves bullet points, and ensures maximum compatibility.',
    shortDescription: 'Optimizes your resume per job',
    icon: 'Hammer',
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-amber-500/20',
    minPlan: 'STARTER',
    capabilities: ['ATS keyword optimization', 'Job-specific variants', 'Score analysis', 'Section enhancement'],
    actions: ['optimized_resume', 'ats_analysis', 'keyword_enhancement'],
  },
  archer: {
    id: 'archer',
    name: 'Archer',
    role: 'Application Agent',
    description: 'Generates tailored cover letters and sends job applications on your behalf. Applies via job portals and sends professional cold emails to HR departments with your resume.',
    shortDescription: 'Sends applications & cover letters',
    icon: 'Target',
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-500/20',
    minPlan: 'PRO',
    capabilities: ['AI cover letters', 'Portal applications', 'Cold email outreach', 'Application tracking'],
    actions: ['generated_cover_letter', 'sent_application', 'sent_email', 'queued_portal'],
  },
  atlas: {
    id: 'atlas',
    name: 'Atlas',
    role: 'Interview Coach',
    description: 'Prepares you for interviews with company-specific questions and practice scenarios. Analyzes job descriptions to predict likely interview topics and provides detailed feedback.',
    shortDescription: 'Preps company-specific interviews',
    icon: 'Compass',
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-violet-500/20',
    minPlan: 'PRO',
    capabilities: ['Company-specific questions', 'Practice scenarios', 'JD analysis', 'Feedback loops'],
    actions: ['generated_questions', 'created_scenario', 'analyzed_jd'],
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    role: 'Skill Trainer',
    description: 'Identifies skill gaps from job requirements and market trends. Creates personalized learning paths, recommends courses and projects, and tracks your skill growth over time.',
    shortDescription: 'Identifies gaps & recommends learning',
    icon: 'BookOpen',
    color: 'text-teal-400',
    gradient: 'from-teal-500/20 to-cyan-500/20',
    minPlan: 'ULTRA',
    capabilities: ['Skill gap analysis', 'Learning recommendations', 'Growth tracking', 'Market trend analysis'],
    actions: ['identified_gaps', 'recommended_learning', 'tracked_growth'],
  },
  sentinel: {
    id: 'sentinel',
    name: 'Sentinel',
    role: 'Quality Reviewer',
    description: 'Reviews every application before submission for accuracy and quality. Catches fabricated details, ensures cover letter relevance, and prevents spam-like mass applications.',
    shortDescription: 'Reviews apps before sending',
    icon: 'Shield',
    color: 'text-rose-400',
    gradient: 'from-rose-500/20 to-pink-500/20',
    minPlan: 'ULTRA',
    capabilities: ['Quality scoring', 'Fabrication detection', 'Relevance check', 'Spam prevention'],
    actions: ['reviewed_application', 'approved_application', 'rejected_application'],
  },
};

export const AGENT_LIST: AgentDefinition[] = Object.values(AGENTS);
export const AGENT_IDS: AgentId[] = Object.keys(AGENTS) as AgentId[];

export const COORDINATOR = {
  name: 'Cortex',
  role: 'AI Coordinator',
  description: 'Your central AI brain that coordinates all agents and manages your career automation.',
};
