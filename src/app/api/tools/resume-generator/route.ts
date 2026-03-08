import { NextRequest } from 'next/server';
import { handleToolRequest } from '@/lib/tools/apiHelper';

export async function POST(request: NextRequest) {
  return handleToolRequest(request, {
    cookieName: '3box-resumegen-uses',
    requiredFields: ['fullName', 'currentRole', 'targetRole', 'skills'],
    systemPrompt: `You are an expert resume writer. Generate a complete, ATS-optimized resume. Return JSON: { "summary": "string", "experience": [{ "title": "string", "company": "string", "duration": "string", "bullets": ["string"] }], "skills": { "technical": ["string"], "soft": ["string"] }, "education": [{ "degree": "string", "institution": "string", "year": "string" }], "certifications": ["string"] }. If specific company names aren't provided, use realistic placeholder names. Make bullet points achievement-oriented with metrics.`,
    buildUserPrompt: (body) => {
      let prompt = `Full Name: ${body.fullName}`;
      prompt += `\nCurrent/Most Recent Job Title: ${body.currentRole}`;
      prompt += `\nTarget Role: ${body.targetRole}`;
      prompt += `\nYears of Experience: ${body.yearsExperience || '1-3'}`;
      prompt += `\nKey Skills: ${body.skills}`;
      if (body.email) prompt += `\nEmail: ${body.email}`;
      if (body.phone) prompt += `\nPhone: ${body.phone}`;
      if (body.experience) prompt += `\nWork Experience Summary: ${body.experience}`;
      if (body.education) prompt += `\nEducation: ${body.education}`;
      return prompt;
    },
    responseFormat: 'json',
    maxTokens: 4096,
    temperature: 0.6,
    maxFreeUses: 2,
  });
}
