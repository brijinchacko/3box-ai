import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';
import { getToolPrompt } from '@/lib/tools/toolPrompts';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-jdanalyzer-uses',
    requiredFields: ['jobDescription'],
    systemPrompt: getToolPrompt('job-description-analyzer'),
    buildUserPrompt: (body) => {
      return `Analyze the following job description thoroughly:\n\n${body.jobDescription}`;
    },
    responseFormat: 'json',
    maxTokens: 3000,
    maxFreeUses: 2,
  });
}
