import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';
import { getToolPrompt } from '@/lib/tools/toolPrompts';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-lipost-uses',
    requiredFields: ['topic'],
    systemPrompt: getToolPrompt('linkedin-post-generator'),
    buildUserPrompt: (body) => {
      let prompt = `Write an engaging LinkedIn post about: ${body.topic}.`;
      if (body.audience) prompt += ` Target audience: ${body.audience}.`;
      if (body.tone) prompt += ` Tone: ${body.tone}.`;
      if (body.includeHashtags) prompt += ' Include 3-5 relevant hashtags at the end.';
      return prompt;
    },
    responseFormat: 'text',
    maxFreeUses: 2,
    cta: 'Get unlimited AI tools and auto-apply to jobs. Sign up free at 3box.ai',
  });
}
