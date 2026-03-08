import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: 'jobted-interviewprep-uses',
    requiredFields: ['role', 'type'],
    systemPrompt: `You are an expert interview coach. Generate likely interview questions for the specified role and type. For each question, provide expert answer tips. Return JSON: { "questions": [{ "id": 1, "type": "string", "question": "string", "tips": "string", "sampleAnswer": "string", "difficulty": "easy" | "medium" | "hard" }] }. Generate 8-10 questions. Ensure a good mix of difficulty levels. Make tips actionable and specific. Sample answers should use the STAR method where appropriate.`,
    buildUserPrompt: (body) => {
      let prompt = `Target Role: ${body.role}`;
      if (body.company) prompt += `\nCompany: ${body.company}`;
      prompt += `\nInterview Type: ${body.type}`;
      if (body.level) prompt += `\nExperience Level: ${body.level}`;
      return prompt;
    },
    responseFormat: 'json',
    maxTokens: 4096,
    temperature: 0.7,
    maxFreeUses: 2,
  });
}
