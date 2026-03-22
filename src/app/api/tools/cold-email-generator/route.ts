import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';
import { getToolPrompt } from '@/lib/tools/toolPrompts';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-coldemail-uses',
    requiredFields: ['recipientRole', 'yourBackground', 'purpose'],
    systemPrompt: getToolPrompt('cold-email-generator'),
    buildUserPrompt: (body) => {
      let prompt = `Recipient Role: ${body.recipientRole}`;
      prompt += `\nMy Background: ${body.yourBackground}`;
      prompt += `\nEmail Purpose: ${body.purpose}`;
      if (body.company) prompt += `\nCompany: ${body.company}`;
      if (body.connection) prompt += `\nConnection: ${body.connection}`;
      return prompt;
    },
    responseFormat: 'json',
    maxTokens: 1500,
    maxFreeUses: 2,
    cta: 'Email drafted! Sign up free to auto-send applications with personalized cover letters.',
  });
}
