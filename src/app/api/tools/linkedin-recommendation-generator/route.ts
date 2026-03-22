import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';
import { getToolPrompt } from '@/lib/tools/toolPrompts';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-lirec-uses',
    requiredFields: ['personName', 'relationship'],
    systemPrompt: getToolPrompt('linkedin-recommendation-generator'),
    buildUserPrompt: (body) => {
      let prompt = `Write 3 LinkedIn recommendation variations for ${body.personName}. My relationship: ${body.relationship}.`;
      if (body.skills) prompt += ` Their key skills: ${body.skills}.`;
      if (body.context) prompt += ` Notable achievements/projects: ${body.context}.`;
      return prompt;
    },
    responseFormat: 'json',
    maxFreeUses: 2,
    cta: 'Get unlimited AI tools and auto-apply to jobs. Sign up free at 3box.ai',
  });
}
