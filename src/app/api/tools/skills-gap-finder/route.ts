import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';
import { getToolPrompt } from '@/lib/tools/toolPrompts';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-skillsgap-uses',
    requiredFields: ['resumeText', 'jobDescription'],
    systemPrompt: getToolPrompt('skills-gap-finder'),
    buildUserPrompt: (body) => {
      return `Compare the following resume against the job description and identify skill gaps.\n\n--- RESUME ---\n${body.resumeText}\n\n--- JOB DESCRIPTION ---\n${body.jobDescription}`;
    },
    responseFormat: 'json',
    maxTokens: 3000,
    maxFreeUses: 2,
  });
}
