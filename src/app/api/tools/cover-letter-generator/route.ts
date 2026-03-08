import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-coverletter-uses',
    requiredFields: ['jobTitle', 'jobDescription'],
    systemPrompt: `You are an expert cover letter writer. Write a compelling, professional cover letter tailored to the specific job description provided. The letter should:
- Be 3-4 paragraphs long
- Open with a strong hook that shows genuine interest
- Highlight relevant skills and achievements that match the job requirements
- Show knowledge of the company if provided
- End with a confident call-to-action
- Use the specified tone
- Be ATS-friendly with relevant keywords from the job description
Return ONLY the cover letter text, no subject line, no formatting instructions.`,
    buildUserPrompt: (body) => {
      let prompt = `Job Title: ${body.jobTitle}`;
      if (body.company) prompt += `\nCompany: ${body.company}`;
      prompt += `\nJob Description: ${body.jobDescription}`;
      if (body.experience) prompt += `\nMy Experience: ${body.experience}`;
      if (body.tone) prompt += `\nTone: ${body.tone}`;
      return prompt;
    },
    responseFormat: 'text',
    maxFreeUses: 2,
  });
}
