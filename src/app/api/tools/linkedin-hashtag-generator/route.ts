import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';
import { getToolPrompt } from '@/lib/tools/toolPrompts';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-lihashtag-uses',
    requiredFields: ['topic'],
    systemPrompt: getToolPrompt('linkedin-hashtag-generator'),
    buildUserPrompt: (body) => {
      const count = body.count || '15';
      return `Generate ${count} relevant LinkedIn hashtags for the topic: ${body.topic}. Group them into Broad, Niche, and Trending categories.`;
    },
    responseFormat: 'json',
    maxFreeUses: 2,
    cta: 'Get unlimited AI tools and auto-apply to jobs. Sign up free at 3box.ai',
  });
}
