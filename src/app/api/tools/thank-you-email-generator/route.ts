import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';
import { getToolPrompt } from '@/lib/tools/toolPrompts';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-thankyou-uses',
    requiredFields: ['interviewerName', 'company', 'position'],
    systemPrompt: getToolPrompt('thank-you-email-generator'),
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
