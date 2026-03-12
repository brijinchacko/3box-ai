import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';
import { getToolPrompt } from '@/lib/tools/toolPrompts';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-interviewprep-uses',
    requiredFields: ['role', 'type'],
    systemPrompt: getToolPrompt('interview-question-prep'),
    buildUserPrompt: (body) => {
      let prompt = `Target Role: ${body.role}`;
      if (body.company) prompt += `\nCompany: ${body.company}`;
      prompt += `\nInterview Type: ${body.type}`;
      if (body.level) prompt += `\nExperience Level: ${body.level}`;
      return prompt;
    },
    responseFormat: 'json',
    maxTokens: 4096,
    temperature: 0.7,
    maxFreeUses: 2,
  });
}
