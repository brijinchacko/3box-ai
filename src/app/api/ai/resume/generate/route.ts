import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { aiChat, getModelForFeature, extractJSON } from '@/lib/ai/openrouter';
import { getUserContextString } from '@/lib/ai/context';
import { checkFeatureGate } from '@/lib/tokens/featureGate';

const { prisma } = require('@/lib/db/prisma');

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gate = await checkFeatureGate(session.user.id);
  if (gate.locked) {
    return NextResponse.json({ error: gate.reason || 'Free plan limit reached. Please upgrade.' }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { targetRole, yearsExperience, achievements, tone } = body;

    if (!targetRole) {
      return NextResponse.json({ error: 'Target role is required' }, { status: 400 });
    }

    // Get full user context
    const userContext = await getUserContextString(session.user.id);

    const systemPrompt = `You are an expert professional resume writer. Generate a complete, ATS-optimized resume as a JSON object.

${userContext}

IMPORTANT RULES:
- Use the user's REAL name, email, phone, location from their profile context above
- Create realistic, impressive content tailored to the target role
- Use strong action verbs and quantifiable achievements
- Make the summary compelling and role-specific
- Generate 2-3 relevant work experiences if none exist in profile
- Include 8-12 relevant skills for the role
- All content should be professional and tailored to the "${tone || 'Professional'}" tone
- Target role: ${targetRole}
- Experience level: ${yearsExperience || '1-3'} years

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "contact": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "portfolio": "string"
  },
  "summary": "A compelling 2-3 sentence professional summary",
  "experience": [
    {
      "id": "exp_1",
      "company": "Company Name",
      "role": "Job Title",
      "location": "City, State",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "current": false,
      "bullets": ["Achievement 1 with metrics", "Achievement 2 with metrics", "Achievement 3"]
    }
  ],
  "education": [
    {
      "id": "edu_1",
      "institution": "University Name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "startDate": "YYYY",
      "endDate": "YYYY",
      "gpa": ""
    }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "certifications": [
    {
      "id": "cert_1",
      "name": "Certification Name",
      "issuer": "Issuer",
      "date": "YYYY-MM",
      "verified": false
    }
  ],
  "projects": [
    {
      "id": "proj_1",
      "name": "Project Name",
      "description": "Brief description with impact",
      "url": "",
      "technologies": ["Tech 1", "Tech 2"]
    }
  ]
}`;

    const userMessage = `Generate a complete professional resume for the role of "${targetRole}".

Experience level: ${yearsExperience || '1-3'} years
Key achievements: ${achievements || 'Not specified'}
Tone: ${tone || 'Professional'}

Use my real profile information where available. Fill in realistic content for any gaps. Make it ATS-optimized and compelling.`;

    const model = getModelForFeature('resume', user.plan);
    const aiResponse = await aiChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      model: model.id,
      temperature: 0.6,
      jsonMode: model.supportsJsonMode,
      maxTokens: 4096,
    });

    // Parse AI response
    let resumeData;
    try {
      resumeData = JSON.parse(extractJSON(aiResponse));
    } catch (parseErr) {
      console.error('[AI Resume Generate] Failed to parse AI response:', parseErr);
      return NextResponse.json({ error: 'AI generated invalid response. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ resume: resumeData });
  } catch (error) {
    console.error('[AI Resume Generate]', error);
    return NextResponse.json({ error: 'Failed to generate resume' }, { status: 500 });
  }
}
