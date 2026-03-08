import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: 'jobted-jdanalyzer-uses',
    requiredFields: ['jobDescription'],
    systemPrompt:
      'You are an expert job market analyst and career advisor. Analyze the job description thoroughly and extract key information. Return JSON: { "title": string, "company": string, "level": string, "requirements": { "mustHave": string[], "niceToHave": string[] }, "skills": { "technical": string[], "soft": string[] }, "keywords": string[], "redFlags": string[], "hiddenExpectations": string[], "salaryHints": string, "cultureFit": string[], "tips": string[] }',
    buildUserPrompt: (body) => {
      return `Analyze the following job description thoroughly:\n\n${body.jobDescription}`;
    },
    responseFormat: 'json',
    maxTokens: 3000,
    maxFreeUses: 2,
  });
}
