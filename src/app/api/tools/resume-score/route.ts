import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';
import { getToolPrompt } from '@/lib/tools/toolPrompts';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-resumescore-uses',
    requiredFields: ['resumeText'],
    systemPrompt: getToolPrompt('resume-score'),
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
