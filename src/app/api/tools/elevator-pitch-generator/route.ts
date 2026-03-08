import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: 'jobted-elevator-uses',
    requiredFields: ['currentRole'],
    systemPrompt:
      'You are a career branding expert. Generate 2 elevator pitches: one 30-second version and one 60-second version. Each should be confident, professional, and memorable. Return JSON: { "pitches": [{ "label": "30-Second Pitch", "content": "...", "meta": "~X words \u2022 30 seconds" }, { "label": "60-Second Pitch", "content": "...", "meta": "~X words \u2022 60 seconds" }] }',
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
  });
}
