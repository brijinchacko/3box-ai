import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: 'jobted-liheadline-uses',
    requiredFields: ['currentRole'],
    systemPrompt:
      'You are a LinkedIn profile expert. Generate 5 compelling LinkedIn headlines (max 120 chars each). Each should be unique in style. Return JSON: { "headlines": [{ "label": "Professional", "content": "..." }, { "label": "Creative", "content": "..." }, { "label": "Keyword-Rich", "content": "..." }, { "label": "Value-Driven", "content": "..." }, { "label": "Bold", "content": "..." }] }',
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
