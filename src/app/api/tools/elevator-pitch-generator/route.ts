import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';
import { getToolPrompt } from '@/lib/tools/toolPrompts';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-elevator-uses',
    requiredFields: ['currentRole'],
    systemPrompt: getToolPrompt('elevator-pitch-generator'),
    buildUserPrompt: (body) => {
      let prompt = `Create two elevator pitches (30-second and 60-second) for someone whose current role is: ${body.currentRole}.`;
      if (body.name) prompt += ` Their name is ${body.name}.`;
      if (body.targetRole) prompt += ` Target role: ${body.targetRole}.`;
      if (body.keySkills) prompt += ` Key skills: ${body.keySkills}.`;
      if (body.context) prompt += ` Context: ${body.context}.`;
      return prompt;
    },
    responseFormat: 'json',
    maxFreeUses: 2,
    cta: 'Get unlimited AI tools and auto-apply to jobs. Sign up free at 3box.ai',
  });
}
