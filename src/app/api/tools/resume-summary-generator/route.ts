import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';
import { getToolPrompt } from '@/lib/tools/toolPrompts';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-resumesum-uses',
    requiredFields: ['jobTitle'],
    systemPrompt: getToolPrompt('resume-summary-generator'),
    buildUserPrompt: (body) => {
      let prompt = `Write 3 professional resume summary options for a ${body.jobTitle}.`;
      if (body.experience) prompt += ` Experience: ${body.experience}.`;
      if (body.targetRole) prompt += ` Target role: ${body.targetRole}.`;
      return prompt;
    },
    responseFormat: 'json',
    maxFreeUses: 2,
    cta: 'Get unlimited AI tools and auto-apply to jobs. Sign up free at 3box.ai',
  });
}
