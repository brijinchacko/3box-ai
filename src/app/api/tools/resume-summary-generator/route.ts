import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: 'jobted-resumesum-uses',
    requiredFields: ['jobTitle'],
    systemPrompt:
      'You are an expert resume writer. Generate 3 compelling professional summary paragraphs for a resume. Each should be 2-3 sentences, highlight key achievements, and be ATS-friendly. Return JSON: { "summaries": [{ "label": "Option 1", "content": "..." }, { "label": "Option 2", "content": "..." }, { "label": "Option 3", "content": "..." }] }',
    buildUserPrompt: (body) => {
      let prompt = `Write 3 professional resume summary options for a ${body.jobTitle}.`;
      if (body.experience) prompt += ` Experience: ${body.experience}.`;
      if (body.targetRole) prompt += ` Target role: ${body.targetRole}.`;
      return prompt;
    },
    responseFormat: 'json',
    maxFreeUses: 2,
  });
}
