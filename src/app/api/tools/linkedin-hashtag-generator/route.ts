import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: 'jobted-lihashtag-uses',
    requiredFields: ['topic'],
    systemPrompt:
      'You are a LinkedIn growth expert. Generate trending, relevant LinkedIn hashtags for the given topic. Mix popular broad hashtags with niche specific ones. Return JSON: { "hashtags": ["#hashtag1", "#hashtag2", ...], "categories": [{ "name": "Broad", "tags": ["#..."] }, { "name": "Niche", "tags": ["#..."] }, { "name": "Trending", "tags": ["#..."] }] }',
    buildUserPrompt: (body) => {
      const count = body.count || '15';
      return `Generate ${count} relevant LinkedIn hashtags for the topic: ${body.topic}. Group them into Broad, Niche, and Trending categories.`;
    },
    responseFormat: 'json',
    maxFreeUses: 2,
  });
}
