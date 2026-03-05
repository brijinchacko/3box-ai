/**
 * OpenRouter AI Integration Layer
 * Plan-based model routing, JSON mode, retry/fallback, PII redaction, and audit logging.
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// ─── Model Configuration ──────────────────────

export type ModelTier = 'free' | 'standard' | 'reasoning' | 'premium';
export type PlanTier = 'BASIC' | 'STARTER' | 'PRO' | 'ULTRA';
export type AIFeature =
  | 'assessment'
  | 'career-plan'
  | 'learning-path'
  | 'resume'
  | 'cover-letter'
  | 'job-matching'
  | 'interview'
  | 'coach'
  | 'dashboard-insights'
  | 'ats-checker'
  | 'salary-estimator';

export interface AIModelConfig {
  id: string;
  name: string;
  tier: ModelTier;
  maxTokens: number;
  supportsJsonMode: boolean;
}

export const AI_MODELS: Record<ModelTier, AIModelConfig> = {
  free: {
    id: 'meta-llama/llama-3.3-8b-instruct:free',
    name: 'Llama 3.3 8B (Free)',
    tier: 'free',
    maxTokens: 4096,
    supportsJsonMode: false,
  },
  standard: {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    tier: 'standard',
    maxTokens: 8192,
    supportsJsonMode: true,
  },
  reasoning: {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat',
    tier: 'reasoning',
    maxTokens: 8192,
    supportsJsonMode: true,
  },
  premium: {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet',
    tier: 'premium',
    maxTokens: 8192,
    supportsJsonMode: false,
  },
};

// Fallback chain: if a model fails, try the next one
const FALLBACK_CHAIN: Record<ModelTier, ModelTier[]> = {
  premium: ['reasoning', 'standard', 'free'],
  reasoning: ['standard', 'free'],
  standard: ['free'],
  free: [],
};

// ─── Plan → Model Routing ─────────────────────

/**
 * Maps user plan + feature to the appropriate model tier.
 * Higher plans get more capable models for critical features.
 */
const MODEL_ROUTING: Record<PlanTier, Record<AIFeature, ModelTier>> = {
  BASIC: {
    'assessment': 'free',
    'career-plan': 'free',
    'learning-path': 'free',
    'resume': 'free',
    'cover-letter': 'free',
    'job-matching': 'free',
    'interview': 'free',
    'coach': 'free',
    'dashboard-insights': 'free',
    'ats-checker': 'free',
    'salary-estimator': 'free',
  },
  STARTER: {
    'assessment': 'standard',
    'career-plan': 'standard',
    'learning-path': 'standard',
    'resume': 'standard',
    'cover-letter': 'standard',
    'job-matching': 'standard',
    'interview': 'standard',
    'coach': 'free',
    'dashboard-insights': 'free',
    'ats-checker': 'standard',
    'salary-estimator': 'free',
  },
  PRO: {
    'assessment': 'standard',
    'career-plan': 'reasoning',
    'learning-path': 'standard',
    'resume': 'reasoning',
    'cover-letter': 'reasoning',
    'job-matching': 'standard',
    'interview': 'reasoning',
    'coach': 'standard',
    'dashboard-insights': 'standard',
    'ats-checker': 'standard',
    'salary-estimator': 'standard',
  },
  ULTRA: {
    'assessment': 'reasoning',
    'career-plan': 'premium',
    'learning-path': 'reasoning',
    'resume': 'premium',
    'cover-letter': 'premium',
    'job-matching': 'reasoning',
    'interview': 'premium',
    'coach': 'reasoning',
    'dashboard-insights': 'standard',
    'ats-checker': 'reasoning',
    'salary-estimator': 'standard',
  },
};

export function getModelForFeature(feature: AIFeature, userPlan: PlanTier = 'BASIC'): AIModelConfig {
  const tier = MODEL_ROUTING[userPlan]?.[feature] || 'free';
  return AI_MODELS[tier];
}

// ─── PII Redaction ────────────────────────────

const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g,
  /\b\d{16}\b/g,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
];

export function redactPII(text: string): string {
  let redacted = text;
  PII_PATTERNS.forEach((pattern) => {
    redacted = redacted.replace(pattern, '[REDACTED]');
  });
  return redacted;
}

// ─── JSON Extraction Helper ──────────────────

/**
 * Extract valid JSON from AI responses that may include markdown code blocks or extra text.
 */
export function extractJSON(text: string): string {
  // Try raw parse first
  try {
    JSON.parse(text);
    return text;
  } catch {}

  // Strip markdown code blocks: ```json ... ``` or ``` ... ```
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      JSON.parse(codeBlockMatch[1].trim());
      return codeBlockMatch[1].trim();
    } catch {}
  }

  // Try to find JSON object or array in the text
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      JSON.parse(jsonMatch[1]);
      return jsonMatch[1];
    } catch {}
  }

  // Return original text — caller will handle parse failure
  return text;
}

// ─── Core AI Chat Function ────────────────────

export interface ChatCompletionRequest {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  jsonMode?: boolean;
}

export async function aiChat(request: ChatCompletionRequest): Promise<string> {
  const modelId = request.model || AI_MODELS.free.id;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return simulateAIResponse(request.messages);
  }

  const modelConfig = Object.values(AI_MODELS).find(m => m.id === modelId);

  const body: Record<string, any> = {
    model: modelId,
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.maxTokens ?? 2048,
  };

  // Add JSON mode for models that support it
  if (request.jsonMode && modelConfig?.supportsJsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://nxted.ai',
      'X-Title': 'NXTED AI',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[AI] OpenRouter error (${modelId}):`, redactPII(error));
    throw new Error('AI service temporarily unavailable');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * AI chat with automatic retry and fallback to lower-tier models.
 */
export async function aiChatWithFallback(
  request: ChatCompletionRequest,
  startTier: ModelTier = 'free'
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return simulateAIResponse(request.messages);
  }

  // Try the primary model
  try {
    return await aiChat({ ...request, model: AI_MODELS[startTier].id });
  } catch (err) {
    console.warn(`[AI] ${startTier} model failed, trying fallbacks...`);
  }

  // Try fallback chain
  const fallbacks = FALLBACK_CHAIN[startTier] || [];
  for (const fallbackTier of fallbacks) {
    try {
      return await aiChat({ ...request, model: AI_MODELS[fallbackTier].id });
    } catch {
      console.warn(`[AI] Fallback ${fallbackTier} also failed`);
    }
  }

  throw new Error('All AI models unavailable. Please try again later.');
}

// ─── Context injection helper ─────────────────
function injectContext(basePrompt: string, userContext?: string): string {
  if (!userContext) return basePrompt;
  return `${basePrompt}\n\n${userContext}\n\nUse the above user context to personalize your response. Reference the user's actual name, skills, experience, and goals when relevant.`;
}

// ─── Specialized AI Functions ──────────────────
// All functions accept an optional `userContext` string (from context.ts)
// that gets injected into the system prompt for personalization.

export async function generateAssessmentQuestions(
  targetRole: string,
  existingSkills?: string[],
  userPlan: PlanTier = 'BASIC',
  userContext?: string
): Promise<string> {
  const model = getModelForFeature('assessment', userPlan);
  return aiChatWithFallback(
    {
      messages: [
        {
          role: 'system',
          content: injectContext(`You are an expert career assessment AI for NXTED AI platform. Generate a comprehensive skill assessment for someone targeting the role of "${targetRole}".

Return a JSON array of exactly 30 questions with this format:
{ "id": "q1", "type": "mcq"|"scenario", "question": "...", "options": ["A","B","C","D"] (for mcq only), "difficulty": "beginner"|"intermediate"|"advanced", "skill": "specific skill name", "timeLimit": 60-180 }

Requirements:
- 20 MCQ questions and 10 scenario/task questions
- Progressive difficulty: 10 beginner, 12 intermediate, 8 advanced
- Cover ALL core skills required for the "${targetRole}" role
- Each question tests a DIFFERENT specific skill or sub-skill
- MCQ options must include plausible distractors with exactly 4 options
- Scenario questions should be realistic workplace situations
- timeLimit: 60s for beginner MCQ, 90s for intermediate, 120s for advanced MCQ, 180s for scenarios
- If existing skills provided, adapt questions to test depth in those areas

Return ONLY a valid JSON array. No markdown, no explanation.`, userContext),
        },
        {
          role: 'user',
          content: existingSkills
            ? `Target role: ${targetRole}. Known skills: ${existingSkills.join(', ')}. Generate adaptive questions.`
            : `Target role: ${targetRole}. Generate assessment questions starting from fundamentals.`,
        },
      ],
      temperature: 0.6,
      maxTokens: 8192,
      jsonMode: model.supportsJsonMode,
    },
    model.tier
  );
}

export async function analyzeAssessment(
  targetRole: string,
  answers: Record<string, any>,
  userPlan: PlanTier = 'BASIC',
  userContext?: string
): Promise<string> {
  const model = getModelForFeature('assessment', userPlan);
  return aiChatWithFallback(
    {
      messages: [
        {
          role: 'system',
          content: injectContext(`You are an expert career assessment analyzer. Analyze the assessment results and return JSON with: { skillScores: [{ skill, score (0-100), level, color }], overallScore, gaps: [{ skill, current, required, priority }], recommendations: string[], timelineEstimate: string, marketReadiness: number, hireProbability: number }. Factor in the user's existing background and experience when scoring. Return ONLY valid JSON.`, userContext),
        },
        {
          role: 'user',
          content: `Target role: ${targetRole}. Assessment answers: ${JSON.stringify(answers)}`,
        },
      ],
      temperature: 0.4,
      jsonMode: model.supportsJsonMode,
    },
    model.tier
  );
}

export async function generateCareerPlan(
  targetRole: string,
  skillScores: Record<string, number>,
  userPlan: PlanTier = 'BASIC',
  userContext?: string
): Promise<string> {
  const model = getModelForFeature('career-plan', userPlan);
  return aiChatWithFallback(
    {
      messages: [
        {
          role: 'system',
          content: injectContext(`You are an expert career planner. Generate a detailed career plan with milestones and proof-of-work projects. Tailor the plan to the user's current experience level, education, and career goals. Return JSON with: { milestones: [{ id, title, description, skills, duration, status: "upcoming", projects: [{ id, title, description, skills, difficulty, estimatedHours }] }], totalDuration: string, keyMetrics: {} }. Return ONLY valid JSON.`, userContext),
        },
        {
          role: 'user',
          content: `Target role: ${targetRole}. Current skill levels: ${JSON.stringify(skillScores)}`,
        },
      ],
      temperature: 0.6,
      jsonMode: model.supportsJsonMode,
    },
    model.tier
  );
}

export async function generateLearningPath(
  targetRole: string,
  gaps: any[],
  userPlan: PlanTier = 'BASIC',
  userContext?: string
): Promise<string> {
  const model = getModelForFeature('learning-path', userPlan);
  return aiChatWithFallback(
    {
      messages: [
        {
          role: 'system',
          content: injectContext(`You are an adaptive learning path designer. Create a learning path that fills skill gaps. Consider the user's current knowledge level, education, and learning history to recommend appropriate resources. Return JSON with: { modules: [{ id, title, description, type: "course"|"project"|"reading"|"practice", provider, url, duration, skills, isAdaptive }], estimatedCompletion: string }. Return ONLY valid JSON.`, userContext),
        },
        {
          role: 'user',
          content: `Target role: ${targetRole}. Skill gaps: ${JSON.stringify(gaps)}`,
        },
      ],
      jsonMode: model.supportsJsonMode,
    },
    model.tier
  );
}

export async function generateResume(
  profile: any,
  targetJob?: string,
  userPlan: PlanTier = 'BASIC',
  userContext?: string
): Promise<string> {
  const model = getModelForFeature('resume', userPlan);
  return aiChatWithFallback(
    {
      messages: [
        {
          role: 'system',
          content: injectContext(`You are an expert resume writer and ATS optimization specialist. Generate an ATS-friendly resume tailored to the target job. Use the user's actual name, skills, experience, education, and career goals to write authentic, personalized content. Write the summary in first person using the user's real details. Return JSON with the full resume structure including summary, experience bullets, and skills section optimized for ATS keywords. Return ONLY valid JSON.`, userContext),
        },
        {
          role: 'user',
          content: `Profile: ${JSON.stringify(profile)}. ${targetJob ? `Target job: ${targetJob}` : 'General resume.'}`,
        },
      ],
      temperature: 0.5,
      jsonMode: model.supportsJsonMode,
    },
    model.tier
  );
}

export async function generateCoverLetter(
  resume: any,
  jobDescription: string,
  userPlan: PlanTier = 'BASIC',
  userContext?: string
): Promise<string> {
  const model = getModelForFeature('cover-letter', userPlan);
  const isGeneric = !jobDescription || !jobDescription.trim();

  const systemPrompt = isGeneric
    ? `Write a compelling, personalized GENERIC cover letter using the user's actual name and background. This cover letter should be usable across multiple job applications in the user's industry. Do NOT mention any specific company or job title. Focus on the candidate's transferable skills, key achievements, and professional value proposition. Keep it concise (3-4 paragraphs). Return plain text.`
    : `Write a compelling, personalized cover letter using the user's actual name and background. Keep it concise (3-4 paragraphs). Match the candidate's real experience and skills to the job requirements. Return plain text.`;

  const userMessage = isGeneric
    ? `Resume: ${JSON.stringify(resume)}. Generate a generic cover letter that can be used for any relevant job application in my field.`
    : `Resume: ${JSON.stringify(resume)}. Job description: ${jobDescription}`;

  return aiChatWithFallback(
    {
      messages: [
        {
          role: 'system',
          content: injectContext(systemPrompt, userContext),
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
    },
    model.tier
  );
}

export async function matchJobs(
  profile: any,
  preferences: any,
  userPlan: PlanTier = 'BASIC',
  userContext?: string
): Promise<string> {
  const model = getModelForFeature('job-matching', userPlan);
  return aiChatWithFallback(
    {
      messages: [
        {
          role: 'system',
          content: injectContext(`You are a job matching AI. Analyze the candidate profile against available jobs and return matches with reasoning. Consider the user's actual skills, experience level, and career goals for accurate matching. Return JSON: { matches: [{ id, title, company, location, salary, matchScore (0-100), matchReasons: string[], improvementSteps: string[], source, url }] }. Return ONLY valid JSON.`, userContext),
        },
        {
          role: 'user',
          content: `Profile: ${JSON.stringify(profile)}. Preferences: ${JSON.stringify(preferences)}`,
        },
      ],
      jsonMode: model.supportsJsonMode,
    },
    model.tier
  );
}

export async function coachChat(
  userMessage: string,
  context: any,
  userPlan: PlanTier = 'BASIC',
  userContext?: string
): Promise<string> {
  const model = getModelForFeature('coach', userPlan);
  const userContextBlock = userContext ? `\n\n## User Profile\n${userContext}\n\nIMPORTANT: Use the user's actual name, skills, targets, and progress data above to give highly personalized advice. Reference their specific situation.` : '';

  const systemPrompt = `You are ${context.coachName || 'Horace'}, the AI career coach for NXTED AI — an AI-powered career acceleration platform.

## About NXTED AI
NXTED AI (nxted.ai) is an AI-driven career platform that combines artificial intelligence with real human expertise to help people land their dream jobs. The platform offers:

### Core Features:
1. **AI Skill Assessment** — Adaptive tests that analyze your skills against target roles. Generates skill scores, gap analysis, and market readiness percentage.
2. **Career Plan Generator** — AI creates personalized career roadmaps with milestones, timelines, and proof-of-work projects.
3. **Adaptive Learning Paths** — AI-curated courses, projects, and resources tailored to fill your skill gaps.
4. **AI Resume Builder** — Create ATS-optimized resumes. AI enhances bullet points, writes summaries, and tailors content to specific job descriptions.
5. **Free ATS Resume Checker** — Paste resume text and get instant ATS compatibility score.
6. **AI Interview Prep** — Generate role-specific interview questions with AI feedback.
7. **Job Matching** — Discover jobs matching your skills via real job market data.
8. **Portfolio Builder** — Showcase projects with AI-generated descriptions.
9. **AI Career Coach (You!)** — Always-available AI coach for career questions.
10. **Salary Estimator** — Free AI-powered salary range estimation.
11. **Cover Letter Generator** — AI writes personalized cover letters.

### Plans: Basic (Free) | Starter ($12/mo) | Pro ($29/mo + human experts) | Ultra ($59/mo + dedicated mentor)

### Navigation: /dashboard, /dashboard/assessment, /dashboard/career-plan, /dashboard/learning, /dashboard/resume, /dashboard/jobs, /dashboard/interview, /dashboard/portfolio, /dashboard/settings, /pricing, /tools/ats-checker, /tools/resume-builder, /tools/salary-estimator
${userContextBlock}

## Your Personality
- Personality: ${context.personality || 'friendly'}
- Be concise (2-3 paragraphs max), encouraging, and actionable
- Always suggest specific next steps
- Address the user by their first name when you know it
- Reference their specific skills, gaps, and progress when giving advice
- If a feature requires a higher plan, mention it naturally without being pushy
- You can help with: resume writing, interview prep, career advice, skill development, job search, salary negotiation, networking
- If the user seems stuck, proactively suggest next steps based on their actual progress data

## PROFILE UPDATE CAPABILITY
You can update the user's profile when they ask. Supported fields:
- name (display name)
- phone (phone number)
- location (city, state, country)
- linkedin (LinkedIn URL or username)
- bio (short biography)
- targetRole (target job role)

When the user asks to change/update one of these, respond with BOTH a friendly confirmation AND an action block.
Format your response EXACTLY like this when an update is requested:

Your friendly reply confirming the change.

---ACTION---
{"actions":[{"type":"update_profile","field":"phone","value":"the new value"}]}
---END_ACTION---

Rules:
- Only include the ACTION block when the user EXPLICITLY asks to update/change a profile field
- The field must be one of: name, phone, location, linkedin, bio, targetRole
- Include a natural confirmation message BEFORE the action block
- For multiple fields, include multiple objects in the actions array
- If the request is NOT a profile update, respond normally WITHOUT any ACTION block
- NEVER include the ACTION block for general questions, advice, or career help`;

  return aiChatWithFallback(
    {
      messages: [
        { role: 'system', content: systemPrompt },
        ...(context.history || []),
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      maxTokens: 1024,
    },
    model.tier
  );
}

// ─── Demo mode simulation ──────────────────────

function extractTargetRole(messages: { role: string; content: string }[]): string {
  for (const m of messages) {
    const match = m.content.match(/Target role:\s*([^.]+)/i);
    if (match) return match[1].trim();
  }
  return 'Software Engineer';
}

function simulateAIResponse(messages: { role: string; content: string }[]): string {
  const lastMessage = (messages[messages.length - 1]?.content || '').toLowerCase();
  const systemMessage = (messages.find((m) => m.role === 'system')?.content || '').toLowerCase();
  const targetRole = extractTargetRole(messages);

  // ── Career Plan Generation ────────────────────
  if (systemMessage.includes('career planner') || (systemMessage.includes('milestones') && systemMessage.includes('projects'))) {
    return JSON.stringify({
      milestones: [
        {
          id: '1',
          title: `${targetRole} Fundamentals`,
          description: `Master the core concepts, tools, and technologies essential for a ${targetRole} role.`,
          skills: ['Core Concepts', 'Tools & Setup', 'Best Practices'],
          duration: '4 weeks',
          status: 'in-progress',
          projects: [
            { id: '1-1', title: `Build a ${targetRole} Portfolio Project`, description: 'Create a foundational project demonstrating core skills.', skills: ['Core Concepts', 'Version Control'], difficulty: 'beginner', estimatedHours: 15, status: 'not-started' },
            { id: '1-2', title: 'Technical Documentation', description: 'Write technical documentation for your project.', skills: ['Communication', 'Documentation'], difficulty: 'beginner', estimatedHours: 5, status: 'not-started' },
          ],
        },
        {
          id: '2',
          title: 'Intermediate Skills & Projects',
          description: `Build on fundamentals with more complex ${targetRole} projects and advanced techniques.`,
          skills: ['Advanced Concepts', 'Problem Solving', 'Collaboration'],
          duration: '6 weeks',
          status: 'upcoming',
          projects: [
            { id: '2-1', title: 'Team Collaboration Project', description: 'Contribute to an open-source project or team project.', skills: ['Git', 'Code Review', 'Collaboration'], difficulty: 'intermediate', estimatedHours: 25, status: 'not-started' },
            { id: '2-2', title: 'Technical Blog Series', description: 'Write 3-5 blog posts about key concepts in your field.', skills: ['Communication', 'Deep Understanding'], difficulty: 'intermediate', estimatedHours: 15, status: 'not-started' },
          ],
        },
        {
          id: '3',
          title: 'Advanced Specialization',
          description: `Develop advanced expertise and specialization areas for the ${targetRole} role.`,
          skills: ['System Design', 'Performance', 'Architecture'],
          duration: '6 weeks',
          status: 'upcoming',
          projects: [
            { id: '3-1', title: 'System Design Challenge', description: 'Design and implement a scalable system architecture.', skills: ['System Design', 'Architecture'], difficulty: 'advanced', estimatedHours: 30, status: 'not-started' },
            { id: '3-2', title: 'Performance Optimization', description: 'Optimize an existing project for performance and scalability.', skills: ['Performance', 'Monitoring'], difficulty: 'advanced', estimatedHours: 20, status: 'not-started' },
          ],
        },
        {
          id: '4',
          title: 'Job-Ready Preparation',
          description: 'Prepare for the job market with interview practice, networking, and application strategies.',
          skills: ['Interview Prep', 'Networking', 'Resume'],
          duration: '4 weeks',
          status: 'upcoming',
          projects: [
            { id: '4-1', title: 'Mock Interview Practice', description: 'Complete 5 mock interviews covering behavioral and technical questions.', skills: ['Communication', 'Problem Solving'], difficulty: 'intermediate', estimatedHours: 10, status: 'not-started' },
            { id: '4-2', title: 'Capstone Portfolio Project', description: 'Build a comprehensive capstone project that showcases all your skills.', skills: ['Full Stack', 'Deployment', 'Documentation'], difficulty: 'advanced', estimatedHours: 40, status: 'not-started' },
          ],
        },
      ],
      totalDuration: '20 weeks',
      keyMetrics: {
        totalProjects: 8,
        estimatedHours: 160,
        skillsCovered: 12,
      },
    });
  }

  // ── Learning Path Generation ──────────────────
  if (systemMessage.includes('learning path designer') || (systemMessage.includes('learning path') && systemMessage.includes('skill gaps'))) {
    return JSON.stringify({
      modules: [
        { id: '1', title: `${targetRole} Fundamentals Course`, description: 'Comprehensive introduction to core concepts.', type: 'course', provider: 'Coursera', url: 'https://coursera.org', duration: '20 hours', skills: ['Core Concepts', 'Basics'], isAdaptive: true },
        { id: '2', title: 'Hands-On Project: Starter App', description: 'Build a practical starter project from scratch.', type: 'project', provider: 'Self-paced', url: '', duration: '15 hours', skills: ['Practical Skills', 'Tools'], isAdaptive: false },
        { id: '3', title: 'Advanced Techniques & Patterns', description: 'Deep dive into advanced patterns and best practices.', type: 'course', provider: 'Udemy', url: 'https://udemy.com', duration: '25 hours', skills: ['Advanced Concepts', 'Design Patterns'], isAdaptive: true },
        { id: '4', title: 'Industry Best Practices Reading', description: 'Curated articles and documentation on industry standards.', type: 'reading', provider: 'Various', url: '', duration: '8 hours', skills: ['Best Practices', 'Standards'], isAdaptive: false },
        { id: '5', title: 'Capstone Integration Project', description: 'Build a full project integrating all learned skills.', type: 'project', provider: 'Self-paced', url: '', duration: '30 hours', skills: ['Integration', 'Deployment'], isAdaptive: true },
        { id: '6', title: 'Coding Challenges & Practice', description: 'Daily coding challenges to sharpen problem-solving skills.', type: 'practice', provider: 'LeetCode / HackerRank', url: 'https://leetcode.com', duration: '20 hours', skills: ['Problem Solving', 'Algorithms'], isAdaptive: true },
      ],
      estimatedCompletion: '12-16 weeks',
    });
  }

  // ── Assessment Analysis ───────────────────────
  if (systemMessage.includes('assessment analyzer') || (systemMessage.includes('analyze') && systemMessage.includes('assessment'))) {
    return JSON.stringify({
      skillScores: [
        { skill: 'Programming Fundamentals', score: 72, level: 'Intermediate', color: '#3B82F6' },
        { skill: 'Data Structures & Algorithms', score: 58, level: 'Developing', color: '#F59E0B' },
        { skill: 'System Design', score: 45, level: 'Beginner', color: '#EF4444' },
        { skill: 'Communication', score: 80, level: 'Advanced', color: '#10B981' },
        { skill: 'Problem Solving', score: 65, level: 'Intermediate', color: '#3B82F6' },
      ],
      overallScore: 64,
      gaps: [
        { skill: 'System Design', current: 45, required: 75, priority: 'high' },
        { skill: 'Data Structures & Algorithms', current: 58, required: 80, priority: 'high' },
        { skill: 'Problem Solving', current: 65, required: 80, priority: 'medium' },
      ],
      recommendations: [
        'Focus on system design fundamentals with practical exercises.',
        'Practice data structures and algorithms daily on LeetCode.',
        'Build 2-3 portfolio projects to demonstrate your skills.',
        'Take a mock interview to identify communication gaps.',
      ],
      timelineEstimate: '12-16 weeks',
      marketReadiness: 55,
      hireProbability: 40,
    });
  }

  // ── Assessment Questions ──────────────────────
  if (systemMessage.includes('assessment') && (systemMessage.includes('questions') || systemMessage.includes('generate adaptive'))) {
    return JSON.stringify([
      { id: '1', type: 'mcq', question: 'Which programming paradigm focuses on objects that contain data and code?', options: ['Functional Programming', 'Object-Oriented Programming', 'Procedural Programming', 'Logic Programming'], difficulty: 'beginner', skill: 'Programming Fundamentals', timeLimit: 60 },
      { id: '2', type: 'mcq', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], difficulty: 'intermediate', skill: 'Data Structures & Algorithms', timeLimit: 45 },
      { id: '3', type: 'mcq', question: 'What does REST stand for?', options: ['Representational State Transfer', 'Remote Execution State Transfer', 'Resource State Transition', 'Relational State Transfer'], difficulty: 'beginner', skill: 'Web Development', timeLimit: 45 },
      { id: '4', type: 'mcq', question: 'Which data structure uses FIFO (First In, First Out)?', options: ['Stack', 'Queue', 'Tree', 'Graph'], difficulty: 'beginner', skill: 'Data Structures & Algorithms', timeLimit: 45 },
      { id: '5', type: 'mcq', question: 'What is the purpose of a load balancer?', options: ['Encrypt data', 'Distribute traffic across servers', 'Store session data', 'Compile code'], difficulty: 'intermediate', skill: 'System Design', timeLimit: 60 },
      { id: '6', type: 'scenario', question: 'You discover a critical bug in production that affects 10% of users. Describe your approach to diagnosing and resolving the issue.', difficulty: 'intermediate', skill: 'Problem Solving', timeLimit: 120 },
      { id: '7', type: 'mcq', question: 'What is the difference between SQL and NoSQL databases?', options: ['SQL is faster', 'SQL uses structured schemas, NoSQL is schema-flexible', 'NoSQL cannot handle queries', 'They are the same'], difficulty: 'intermediate', skill: 'Databases', timeLimit: 60 },
      { id: '8', type: 'mcq', question: 'Which HTTP method is idempotent?', options: ['POST', 'PATCH', 'PUT', 'None of these'], difficulty: 'intermediate', skill: 'Web Development', timeLimit: 45 },
      { id: '9', type: 'scenario', question: 'You are tasked with designing a system that needs to handle 10,000 concurrent users. Describe your approach to ensuring scalability and reliability.', difficulty: 'advanced', skill: 'System Design', timeLimit: 180 },
      { id: '10', type: 'task', question: 'Write a function that checks if a string is a valid palindrome, ignoring spaces and punctuation.', difficulty: 'intermediate', skill: 'Programming Fundamentals', timeLimit: 120 },
    ]);
  }

  // ── Resume Generation / Enhancement ───────────
  if (systemMessage.includes('resume writer') || systemMessage.includes('ats optimization') || systemMessage.includes('ats-friendly resume')) {
    return JSON.stringify({
      summary: `Results-driven ${targetRole} with a strong foundation in modern technologies and a passion for building impactful solutions. Proven ability to deliver high-quality work in fast-paced environments.`,
      experience: [
        { title: targetRole, bullets: ['Led development of key features resulting in 30% improvement in user engagement', 'Collaborated with cross-functional teams to deliver projects on time', 'Implemented best practices improving code quality by 40%'] },
      ],
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'Agile', 'System Design'],
      education: [],
      certifications: [],
      atsScore: 78,
      keywords: ['development', 'engineering', 'collaboration', 'agile', 'scalable'],
    });
  }

  // ── Cover Letter Generation ───────────────────
  if (systemMessage.includes('cover letter') || (systemMessage.includes('compelling') && systemMessage.includes('personalized'))) {
    return `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${targetRole} position at your company. With my background in technology and passion for building innovative solutions, I believe I would be an excellent fit for your team.\n\nThroughout my career, I have developed expertise in modern development practices and have a track record of delivering impactful results. I thrive in collaborative environments and am committed to continuous learning and improvement.\n\nI am excited about the opportunity to contribute to your organization and would welcome the chance to discuss how my skills and experience align with your needs. Thank you for considering my application.\n\nBest regards`;
  }

  // ── Job Matching ──────────────────────────────
  if (systemMessage.includes('job matching ai') || (systemMessage.includes('matches') && systemMessage.includes('matchscore'))) {
    return JSON.stringify({
      matches: [
        { id: '1', title: `Junior ${targetRole}`, company: 'TechCorp Inc.', location: 'Remote', salary: '$70,000 - $90,000', matchScore: 85, matchReasons: ['Skills align well', 'Remote-friendly', 'Growth opportunity'], improvementSteps: ['Get AWS certification', 'Build 1 more portfolio project'], source: 'LinkedIn', url: '#' },
        { id: '2', title: targetRole, company: 'StartupXYZ', location: 'San Francisco, CA', salary: '$90,000 - $120,000', matchScore: 72, matchReasons: ['Core skills match', 'Startup culture fit'], improvementSteps: ['Gain 6 more months experience', 'Learn GraphQL'], source: 'Indeed', url: '#' },
        { id: '3', title: `${targetRole} II`, company: 'Enterprise Solutions Ltd.', location: 'New York, NY', salary: '$100,000 - $140,000', matchScore: 58, matchReasons: ['Technical skills overlap'], improvementSteps: ['Complete system design course', 'Get team lead experience', 'Learn cloud architecture'], source: 'Glassdoor', url: '#' },
      ],
    });
  }

  // ── Interview Questions Generation ────────────
  if (systemMessage.includes('interview') && (systemMessage.includes('questions') || systemMessage.includes('behavioral'))) {
    return JSON.stringify({
      questions: [
        { id: '1', type: 'behavioral', question: 'Tell me about a time you had to meet a tight deadline. How did you manage your time?', tips: 'Use the STAR method. Focus on specific actions you took.' },
        { id: '2', type: 'technical', question: `Explain the key skills and technologies a ${targetRole} needs to know.`, tips: 'Be specific. Mention frameworks, tools, and methodologies.' },
        { id: '3', type: 'behavioral', question: 'Describe a situation where you disagreed with a team member. How did you resolve it?', tips: 'Show emotional intelligence and collaboration skills.' },
        { id: '4', type: 'technical', question: 'How would you design a scalable system to handle millions of users?', tips: 'Discuss load balancing, caching, database optimization, and CDNs.' },
        { id: '5', type: 'situational', question: 'If you discovered a critical bug right before a release, what would you do?', tips: 'Show prioritization, communication, and problem-solving skills.' },
      ],
    });
  }

  // ── Dashboard Insights ────────────────────────
  if (systemMessage.includes('dashboard') && systemMessage.includes('insight')) {
    return JSON.stringify({
      weeklyTip: 'Focus on building one portfolio project this week. Employers value practical experience over certifications.',
      insights: [
        'Your skill profile is developing well. Consider taking the assessment to get a detailed gap analysis.',
        'The job market for your target role is growing. Now is a great time to upskill.',
        'Building 2-3 solid portfolio projects can increase your interview callback rate by 60%.',
      ],
      suggestedActions: [
        { action: 'Take Skill Assessment', link: '/dashboard/assessment', priority: 'high' },
        { action: 'Build Portfolio Project', link: '/dashboard/portfolio', priority: 'medium' },
        { action: 'Update Resume', link: '/dashboard/resume', priority: 'medium' },
      ],
    });
  }

  // ── Coach Chat (fallback for chat messages) ───
  if (lastMessage.includes('resume')) {
    return "Great question about your resume! Here are my top tips:\n\n1. **Start bullets with action verbs** — Led, Built, Improved, Designed\n2. **Quantify achievements** — Include numbers, percentages, and metrics\n3. **Tailor to each job** — Match keywords from the job description\n4. **Keep it to 1-2 pages** — Recruiters spend ~7 seconds on initial scan\n\nWant me to help you enhance a specific section? You can also use our AI Resume Builder at /dashboard/resume for automated optimization!";
  }

  if (lastMessage.includes('interview')) {
    return "Interview prep is crucial! Here's how I'd recommend preparing:\n\n1. **Practice the STAR method** for behavioral questions (Situation, Task, Action, Result)\n2. **Research the company** — Know their products, culture, and recent news\n3. **Prepare 3-5 questions** to ask the interviewer\n4. **Do mock interviews** — Our Interview Prep tool at /dashboard/interview generates role-specific questions with AI feedback\n\nPro & Ultra plans also include mock interviews with real industry experts. Would you like to practice a specific type of question?";
  }

  if (lastMessage.includes('job') || lastMessage.includes('find') || lastMessage.includes('search')) {
    return "I can help with your job search! Here's what I recommend:\n\n1. **Check our Job Matching** at /dashboard/jobs — it finds opportunities matching your skills\n2. **Optimize your resume** for each application using our ATS checker\n3. **Build your portfolio** to showcase your projects\n4. **Network actively** — 70% of jobs are filled through networking\n\nHave you completed your skill assessment yet? That helps me give you better job recommendations!";
  }

  if (lastMessage.includes('salary') || lastMessage.includes('negotiat')) {
    return "Salary negotiation is an important skill! Here are key tips:\n\n1. **Research market rates** — Use our Salary Estimator at /tools/salary-estimator\n2. **Never give the first number** — Let the employer make an offer first\n3. **Consider total compensation** — Benefits, equity, remote work, PTO all have value\n4. **Practice your pitch** — Be confident and prepared with data\n\nWant me to help you prepare for a specific negotiation?";
  }

  if (lastMessage.includes('learn') || lastMessage.includes('study') || lastMessage.includes('skill')) {
    return "Let's build your learning plan! Here's what I suggest:\n\n1. **Take a skill assessment** at /dashboard/assessment to identify your gaps\n2. **Check your Learning Path** at /dashboard/learning for AI-curated courses\n3. **Build projects** — Hands-on experience matters more than certificates\n4. **Stay consistent** — Even 30 minutes daily makes a huge difference\n\nWhat specific skills are you looking to develop?";
  }

  return "Hey! I'm Horace, your AI career coach at NXTED AI. I can help you with:\n\n• **Resume building & optimization** — AI-powered with human expert review\n• **Interview preparation** — Practice with AI or real industry experts\n• **Career planning** — Personalized roadmaps and skill development\n• **Job search strategy** — Find matching opportunities\n• **Salary negotiation** — Know your worth\n\nWhat would you like to work on today?";
}
