import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';
import { getToolPrompt } from '@/lib/tools/toolPrompts';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-liheadline-uses',
    requiredFields: ['currentRole'],
    systemPrompt: getToolPrompt('linkedin-headline-generator'),
    buildUserPrompt: (body) => {
      let prompt = `Generate 5 LinkedIn headlines for someone whose current role is: ${body.currentRole}.`;
      if (body.skills) prompt += ` Key skills: ${body.skills}.`;
      if (body.goal) prompt += ` Goal: ${body.goal}.`;
      return prompt;
    },
    responseFormat: 'json',
    maxFreeUses: 2,
  });
}
