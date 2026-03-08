import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: 'jobted-resumescore-uses',
    requiredFields: ['resumeText'],
    systemPrompt:
      'You are an expert resume reviewer and ATS specialist. Score the resume on a scale of 0-100 and provide detailed feedback. Return JSON: { "overallScore": number, "categories": [{ "name": string, "score": number, "feedback": string }], "strengths": string[], "improvements": string[], "keywords": { "found": string[], "missing": string[] } }. Categories should include: Content Quality, ATS Compatibility, Formatting, Impact & Metrics, Keywords.',
    buildUserPrompt: (body) => {
      let prompt = `Score and review the following resume:\n\n${body.resumeText}`;
      if (body.targetRole) prompt += `\n\nTarget role: ${body.targetRole}`;
      return prompt;
    },
    responseFormat: 'json',
    maxTokens: 3000,
    maxFreeUses: 2,
  });
}
