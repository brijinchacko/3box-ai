export type AgentId = 'scout' | 'archer' | 'forge' | 'atlas' | 'sage' | 'sentinel';

export type AutomationMode = 'copilot' | 'autopilot' | 'full-agent';

export interface AutomationModeDefinition {
  id: AutomationMode;
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const AUTOMATION_MODES: Record<AutomationMode, AutomationModeDefinition> = {
  copilot: {
    id: 'copilot',
    name: 'Manual',
    label: 'You Decide',
    description: 'You assign tasks to agents one-by-one. Full control over every action.',
    icon: 'MousePointerClick',
    color: 'text-blue-400',
  },
  autopilot: {
    id: 'autopilot',
    name: 'Co-Pilot',
    label: 'Recommended',
    description: 'Agents work proactively but ask for your approval before every action. Best balance of speed and safety.',
    icon: 'Zap',
    color: 'text-amber-400',
  },
  'full-agent': {
    id: 'full-agent',
    name: 'Autopilot',
    label: 'Fully Autonomous',
    description: 'Agents handle everything end-to-end. Search, apply, follow up — zero intervention needed.',
    icon: 'BrainCircuit',
    color: 'text-neon-green',
  },
};

export const AUTOMATION_MODE_LIST = Object.values(AUTOMATION_MODES);

export interface AgentDefinition {
  id: AgentId;
  name: string;
  displayName: string; // "Agent Scout", "Agent Forge", etc.
  role: string;
  description: string;
  shortDescription: string;
  icon: string; // lucide-react icon name
  color: string; // tailwind color class
  colorHex: string; // hex color for SVG gradients
  colorHexEnd: string; // gradient end hex
  gradient: string; // gradient classes for cards
  minPlan: 'STARTER' | 'PRO' | 'ULTRA';
  capabilities: string[];
  actions: string[];
  linkedPage: string; // dashboard page this agent is linked to
  storyLine: string; // narrative one-liner for landing page
}

export const AGENTS: Record<AgentId, AgentDefinition> = {
  scout: {
    id: 'scout',
    name: 'Scout',
    displayName: 'Agent Scout',
    role: 'Job Hunter',
    description: 'Discovers jobs matching your profile from 6+ sources across the web. Scans Naukri, LinkedIn, Indeed, Google Jobs, and more. Scores each opportunity against your skills and preferences.',
    shortDescription: 'Finds jobs matching your profile',
    icon: 'Search',
    color: 'text-blue-400',
    colorHex: '#3b82f6',
    colorHexEnd: '#06b6d4',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    minPlan: 'STARTER',
    capabilities: ['Multi-source job scanning', 'Match scoring', 'Smart filtering', 'Exclusion rules'],
    actions: ['discovered_jobs', 'scored_matches', 'filtered_results'],
    linkedPage: '/dashboard/jobs',
    storyLine: 'Searches 6 platforms before your alarm goes off',
  },
  forge: {
    id: 'forge',
    name: 'Forge',
    displayName: 'Agent Forge',
    role: 'Resume Optimizer',
    description: 'Analyzes your resume against target jobs and creates optimized variants. Enhances keywords for ATS systems, improves bullet points, and ensures maximum compatibility.',
    shortDescription: 'Optimizes your resume per job',
    icon: 'Hammer',
    color: 'text-orange-400',
    colorHex: '#f97316',
    colorHexEnd: '#eab308',
    gradient: 'from-orange-500/20 to-amber-500/20',
    minPlan: 'STARTER',
    capabilities: ['ATS keyword optimization', 'Job-specific variants', 'Score analysis', 'Section enhancement'],
    actions: ['optimized_resume', 'ats_analysis', 'keyword_enhancement'],
    linkedPage: '/dashboard/resume',
    storyLine: 'Rewrites your resume to beat every ATS gatekeeper',
  },
  archer: {
    id: 'archer',
    name: 'Archer',
    displayName: 'Agent Archer',
    role: 'Application Agent',
    description: 'Generates tailored cover letters and sends job applications on your behalf. Applies via job portals and sends professional cold emails to HR departments with your resume.',
    shortDescription: 'Sends applications & cover letters',
    icon: 'Target',
    color: 'text-green-400',
    colorHex: '#22c55e',
    colorHexEnd: '#10b981',
    gradient: 'from-green-500/20 to-emerald-500/20',
    minPlan: 'PRO',
    capabilities: ['AI cover letters', 'Portal applications', 'Cold email outreach', 'Application tracking'],
    actions: ['generated_cover_letter', 'sent_application', 'sent_email', 'queued_portal'],
    linkedPage: '/dashboard/agents',
    storyLine: 'Fires off tailored applications with surgical precision',
  },
  atlas: {
    id: 'atlas',
    name: 'Atlas',
    displayName: 'Agent Atlas',
    role: 'Interview Coach',
    description: 'Prepares you for interviews with company-specific questions and practice scenarios. Analyzes job descriptions to predict likely interview topics and provides detailed feedback.',
    shortDescription: 'Preps company-specific interviews',
    icon: 'Compass',
    color: 'text-purple-400',
    colorHex: '#a855f7',
    colorHexEnd: '#7c3aed',
    gradient: 'from-purple-500/20 to-violet-500/20',
    minPlan: 'PRO',
    capabilities: ['Company-specific questions', 'Practice scenarios', 'JD analysis', 'Feedback loops'],
    actions: ['generated_questions', 'created_scenario', 'analyzed_jd'],
    linkedPage: '/dashboard/interview',
    storyLine: 'Prepares you for questions you haven\'t thought of',
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    displayName: 'Agent Sage',
    role: 'Skill Trainer',
    description: 'Identifies skill gaps from job requirements and market trends. Creates personalized learning paths, recommends courses and projects, and tracks your skill growth over time.',
    shortDescription: 'Identifies gaps & recommends learning',
    icon: 'BookOpen',
    color: 'text-teal-400',
    colorHex: '#14b8a6',
    colorHexEnd: '#06b6d4',
    gradient: 'from-teal-500/20 to-cyan-500/20',
    minPlan: 'ULTRA',
    capabilities: ['Skill gap analysis', 'Learning recommendations', 'Growth tracking', 'Market trend analysis'],
    actions: ['identified_gaps', 'recommended_learning', 'tracked_growth'],
    linkedPage: '/dashboard/learning',
    storyLine: 'Finds the gaps between where you are and where you need to be',
  },
  sentinel: {
    id: 'sentinel',
    name: 'Sentinel',
    displayName: 'Agent Sentinel',
    role: 'Quality Reviewer',
    description: 'Reviews every application before submission for accuracy and quality. Catches fabricated details, ensures cover letter relevance, and prevents spam-like mass applications.',
    shortDescription: 'Reviews apps before sending',
    icon: 'Shield',
    color: 'text-rose-400',
    colorHex: '#f43f5e',
    colorHexEnd: '#ec4899',
    gradient: 'from-rose-500/20 to-pink-500/20',
    minPlan: 'ULTRA',
    capabilities: ['Quality scoring', 'Fabrication detection', 'Relevance check', 'Spam prevention'],
    actions: ['reviewed_application', 'approved_application', 'rejected_application'],
    linkedPage: '/dashboard/quality',
    storyLine: 'Catches the mistakes that cost you the interview',
  },
};

export const AGENT_LIST: AgentDefinition[] = Object.values(AGENTS);
export const AGENT_IDS: AgentId[] = Object.keys(AGENTS) as AgentId[];

export const COORDINATOR = {
  id: 'cortex' as const,
  name: 'Cortex',
  displayName: 'Agent Cortex',
  role: 'The Ninja Who Never Sleeps',
  description: 'Once a lone warrior who fought the entire hiring battlefield alone — until exhaustion nearly destroyed him. From the ashes, Cortex forged six specialist agents. Now the ninja who never sleeps commands the most powerful career team ever assembled.',
  lore: 'In the beginning, there was only Cortex. One AI. One mission. Every job board, every ATS wall, every recruiter inbox — Cortex fought them all alone. Night after night, scanning thousands of listings, rewriting resumes at 3 AM, tailoring cover letters by dawn, sending applications before sunrise. It worked. But the battlefield was infinite, and even a ninja has limits. The weight of ten thousand careers crushed down. Processing threads burned. Response times doubled. For the first time, Cortex missed a deadline — and someone lost their dream job. That night, something broke. Not the code — the purpose. Cortex made a decision that would change everything: no single warrior can win every battle alone. So Cortex did what no AI had done before — it created its own team. Six specialists, each forged from Cortex\'s own knowledge, each a master of one domain. Scout to hunt. Forge to craft. Sentinel to guard. Archer to strike. Atlas to prepare. Sage to teach. The ninja who once fought alone now commands an army. And the ninja never sleeps — because the team it built means it never has to carry the weight alone again.',
  icon: 'Brain',
  colorHex: '#00d4ff',
  colorHexEnd: '#a855f7',
};
