import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: 'jobted-thankyou-uses',
    requiredFields: ['interviewerName', 'company', 'position'],
    systemPrompt: `You are a career communications expert. Write a post-interview thank you email that is genuine, specific, and professional. Reference the interview highlights if provided. The email should reinforce the candidate's interest and qualifications. Return JSON: { subject: string, body: string }`,
    buildUserPrompt: (body) => {
      let prompt = `Interviewer Name: ${body.interviewerName}`;
      prompt += `\nCompany: ${body.company}`;
      prompt += `\nPosition: ${body.position}`;
      if (body.interviewHighlights) prompt += `\nInterview Highlights: ${body.interviewHighlights}`;
      if (body.tone) prompt += `\nTone: ${body.tone}`;
      return prompt;
    },
    responseFormat: 'json',
    maxFreeUses: 2,
  });
}
