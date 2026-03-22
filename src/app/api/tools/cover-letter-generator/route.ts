import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';
import { getToolPrompt } from '@/lib/tools/toolPrompts';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-coverletter-uses',
    requiredFields: ['jobTitle', 'jobDescription'],
    systemPrompt: getToolPrompt('cover-letter-generator'),
    buildUserPrompt: (body) => {
      let prompt = `Job Title: ${body.jobTitle}`;
      if (body.company) prompt += `\nCompany: ${body.company}`;
      prompt += `\nJob Description: ${body.jobDescription}`;
      if (body.experience) prompt += `\nMy Experience: ${body.experience}`;
      if (body.tone) prompt += `\nTone: ${body.tone}`;
      return prompt;
    },
    responseFormat: 'text',
    maxFreeUses: 2,
    cta: 'Cover letter ready! Sign up free to save it and auto-apply to matching jobs.',
  });
}
