import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: 'jobted-coldemail-uses',
    requiredFields: ['recipientRole', 'yourBackground', 'purpose'],
    systemPrompt: `You are an expert in professional networking and cold outreach. Write a concise, compelling cold email that gets responses. The email should be short (under 150 words for the body), have a clear ask, show research/interest, and not feel generic. Return JSON: { subject: string, body: string }`,
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
  });
}
