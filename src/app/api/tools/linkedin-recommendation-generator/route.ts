import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: 'jobted-lirec-uses',
    requiredFields: ['personName', 'relationship'],
    systemPrompt:
      'You are a professional networking expert. Write a genuine, specific LinkedIn recommendation for the person described. It should be 3-4 sentences, highlight their specific skills and achievements, and feel authentic rather than generic. Return JSON: { "recommendations": [{ "label": "Formal", "content": "..." }, { "label": "Warm", "content": "..." }, { "label": "Concise", "content": "..." }] }',
    buildUserPrompt: (body) => {
      let prompt = `Write 3 LinkedIn recommendation variations for ${body.personName}. My relationship: ${body.relationship}.`;
      if (body.skills) prompt += ` Their key skills: ${body.skills}.`;
      if (body.context) prompt += ` Notable achievements/projects: ${body.context}.`;
      return prompt;
    },
    responseFormat: 'json',
    maxFreeUses: 2,
  });
}
