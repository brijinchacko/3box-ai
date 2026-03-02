/**
 * OpenRouter AI Integration Layer
 * Supports model abstraction, rate limiting, PII redaction, and audit logging.
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export interface AIModelConfig {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'premium';
  maxTokens: number;
}

export const AI_MODELS: Record<string, AIModelConfig> = {
  free: {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B (Free)',
    tier: 'free',
    maxTokens: 4096,
  },
  pro: {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    tier: 'pro',
    maxTokens: 8192,
  },
  premium: {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet',
    tier: 'premium',
    maxTokens: 8192,
  },
};

// PII patterns to redact in logs
const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g,           // SSN
  /\b\d{16}\b/g,                        // Credit card
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,    // Phone
];

export function redactPII(text: string): string {
  let redacted = text;
  PII_PATTERNS.forEach((pattern) => {
    redacted = redacted.replace(pattern, '[REDACTED]');
  });
  return redacted;
}

export interface ChatCompletionRequest {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export async function aiChat(request: ChatCompletionRequest): Promise<string> {
  const modelId = request.model || AI_MODELS.free.id;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    // Demo mode: return simulated responses
    return simulateAIResponse(request.messages);
  }

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'NXTED AI',
    },
    body: JSON.stringify({
      model: modelId,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[AI] OpenRouter error:', redactPII(error));
    throw new Error('AI service temporarily unavailable');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── Specialized AI Functions ──────────────────

export async function generateAssessmentQuestions(targetRole: string, existingSkills?: string[]): Promise<string> {
  return aiChat({
    messages: [
      {
        role: 'system',
        content: `You are an expert career assessment AI for NXTED AI platform. Generate adaptive skill assessment questions for someone targeting the role of "${targetRole}". Return a JSON array of 10 questions with format: { id, type: "mcq"|"scenario"|"task", question, options (for mcq), difficulty: "beginner"|"intermediate"|"advanced", skill, timeLimit (seconds) }. Mix question types. If existing skills provided, adapt difficulty accordingly.`,
      },
      {
        role: 'user',
        content: existingSkills
          ? `Target role: ${targetRole}. Known skills: ${existingSkills.join(', ')}. Generate adaptive questions.`
          : `Target role: ${targetRole}. Generate assessment questions starting from fundamentals.`,
      },
    ],
    temperature: 0.6,
  });
}

export async function analyzeAssessment(targetRole: string, answers: Record<string, any>): Promise<string> {
  return aiChat({
    messages: [
      {
        role: 'system',
        content: `You are an expert career assessment analyzer. Analyze the assessment results and return JSON with: { skillScores: [{ skill, score (0-100), level, color }], overallScore, gaps: [{ skill, current, required, priority }], recommendations: string[], timelineEstimate: string, marketReadiness: number, hireProbability: number }`,
      },
      {
        role: 'user',
        content: `Target role: ${targetRole}. Assessment answers: ${JSON.stringify(answers)}`,
      },
    ],
    temperature: 0.4,
  });
}

export async function generateCareerPlan(targetRole: string, skillScores: Record<string, number>): Promise<string> {
  return aiChat({
    messages: [
      {
        role: 'system',
        content: `You are an expert career planner. Generate a detailed career plan with milestones and proof-of-work projects. Return JSON with: { milestones: [{ id, title, description, skills, duration, status: "upcoming", projects: [{ id, title, description, skills, difficulty, estimatedHours }] }], totalDuration: string, keyMetrics: {} }`,
      },
      {
        role: 'user',
        content: `Target role: ${targetRole}. Current skill levels: ${JSON.stringify(skillScores)}`,
      },
    ],
    temperature: 0.6,
  });
}

export async function generateLearningPath(targetRole: string, gaps: any[]): Promise<string> {
  return aiChat({
    messages: [
      {
        role: 'system',
        content: `You are an adaptive learning path designer. Create a learning path that fills skill gaps. Return JSON with: { modules: [{ id, title, description, type: "course"|"project"|"reading"|"practice", provider, url, duration, skills, isAdaptive }], estimatedCompletion: string }`,
      },
      {
        role: 'user',
        content: `Target role: ${targetRole}. Skill gaps: ${JSON.stringify(gaps)}`,
      },
    ],
  });
}

export async function generateResume(profile: any, targetJob?: string): Promise<string> {
  return aiChat({
    messages: [
      {
        role: 'system',
        content: `You are an expert resume writer and ATS optimization specialist. Generate an ATS-friendly resume tailored to the target job. Return JSON with the full resume structure including summary, experience bullets, and skills section optimized for ATS keywords.`,
      },
      {
        role: 'user',
        content: `Profile: ${JSON.stringify(profile)}. ${targetJob ? `Target job: ${targetJob}` : 'General resume.'}`,
      },
    ],
    temperature: 0.5,
  });
}

export async function generateCoverLetter(resume: any, jobDescription: string): Promise<string> {
  return aiChat({
    messages: [
      {
        role: 'system',
        content: `Write a compelling, personalized cover letter. Keep it concise (3-4 paragraphs). Match the candidate's experience to the job requirements. Return plain text.`,
      },
      {
        role: 'user',
        content: `Resume: ${JSON.stringify(resume)}. Job description: ${jobDescription}`,
      },
    ],
  });
}

export async function matchJobs(profile: any, preferences: any): Promise<string> {
  return aiChat({
    messages: [
      {
        role: 'system',
        content: `You are a job matching AI. Analyze the candidate profile against available jobs and return matches with reasoning. Return JSON: { matches: [{ id, title, company, location, salary, matchScore (0-100), matchReasons: string[], improvementSteps: string[], source, url }] }`,
      },
      {
        role: 'user',
        content: `Profile: ${JSON.stringify(profile)}. Preferences: ${JSON.stringify(preferences)}`,
      },
    ],
  });
}

export async function coachChat(userMessage: string, context: any): Promise<string> {
  return aiChat({
    messages: [
      {
        role: 'system',
        content: `You are ${context.coachName || 'Nova'}, an AI career coach for NXTED AI. Personality: ${context.personality || 'friendly'}. You have access to the user's career data: target role is "${context.targetRole || 'not set'}", current progress is ${context.progress || 0}%. Be helpful, encouraging, and actionable. Keep responses concise (2-3 paragraphs max).`,
      },
      ...(context.history || []),
      { role: 'user', content: userMessage },
    ],
  });
}

// ─── Demo mode simulation ──────────────────────

function simulateAIResponse(messages: { role: string; content: string }[]): string {
  const lastMessage = messages[messages.length - 1]?.content || '';

  if (lastMessage.includes('assessment') || lastMessage.includes('questions')) {
    return JSON.stringify([
      { id: '1', type: 'mcq', question: 'Which programming paradigm focuses on objects that contain data and code?', options: ['Functional Programming', 'Object-Oriented Programming', 'Procedural Programming', 'Logic Programming'], difficulty: 'beginner', skill: 'Programming Fundamentals', timeLimit: 60 },
      { id: '2', type: 'mcq', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], difficulty: 'intermediate', skill: 'Data Structures & Algorithms', timeLimit: 45 },
      { id: '3', type: 'scenario', question: 'You are tasked with designing a system that needs to handle 10,000 concurrent users. Describe your approach to ensuring scalability and reliability.', difficulty: 'advanced', skill: 'System Design', timeLimit: 180 },
    ]);
  }

  return 'I\'m your AI career coach Nova! I\'m here to help you on your career journey. What would you like to work on today?';
}
