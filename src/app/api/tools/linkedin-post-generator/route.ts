import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: 'jobted-lipost-uses',
    requiredFields: ['topic'],
    systemPrompt:
      'You are a LinkedIn content strategist. Write an engaging LinkedIn post about the given topic. Include a hook in the first line, tell a story or share an insight, and end with a call-to-action or question. If hashtags are requested, add 3-5 relevant ones at the end. Return ONLY the post text.',
    buildUserPrompt: (body) => {
      let prompt = `Write an engaging LinkedIn post about: ${body.topic}.`;
      if (body.audience) prompt += ` Target audience: ${body.audience}.`;
      if (body.tone) prompt += ` Tone: ${body.tone}.`;
      if (body.includeHashtags) prompt += ' Include 3-5 relevant hashtags at the end.';
      return prompt;
    },
    responseFormat: 'text',
    maxFreeUses: 2,
  });
}
