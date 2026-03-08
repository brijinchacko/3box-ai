import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-skillsgap-uses',
    requiredFields: ['resumeText', 'jobDescription'],
    systemPrompt:
      'You are a career gap analysis expert. Compare the resume against the job description and identify skill gaps. Return JSON: { "matchScore": number (0-100), "matchedSkills": string[], "missingSkills": string[], "partialMatches": [{ "skill": string, "gap": string }], "recommendations": string[], "priority": [{ "skill": string, "importance": "critical" | "important" | "nice-to-have", "timeToLearn": string }] }',
    buildUserPrompt: (body) => {
      return `Compare the following resume against the job description and identify skill gaps.\n\n--- RESUME ---\n${body.resumeText}\n\n--- JOB DESCRIPTION ---\n${body.jobDescription}`;
    },
    responseFormat: 'json',
    maxTokens: 3000,
    maxFreeUses: 2,
  });
}
