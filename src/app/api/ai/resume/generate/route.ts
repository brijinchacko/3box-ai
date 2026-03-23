import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { aiChat, getModelForFeature, extractJSON } from '@/lib/ai/openrouter';
import { getUserContextString } from '@/lib/ai/context';
import { checkFeatureGate } from '@/lib/tokens/featureGate';

import { prisma } from '@/lib/db/prisma';

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

    const systemPrompt = `You are an expert professional resume writer specializing in ATS-optimized, technically dense resumes. Generate a complete resume as a JSON object.

${userContext}

CRITICAL RULES:
- Use the user's REAL name, email, phone, location from their profile context above
- The resume MUST fill at least one full page. For candidates with 3+ years experience, generate enough content to fill TWO full pages
- Use strong action verbs and quantifiable achievements with specific metrics (%, $, numbers)
- Make the summary compelling, 3-4 sentences, packed with technical keywords
- Generate 3-5 relevant work experiences (more detailed bullets for recent roles, fewer for older)
- Each experience MUST have 4-6 bullet points with measurable impact
- Include 15-25 relevant technical skills for the role
- For EACH skill, provide a brief technical description (5-12 words)
- Generate 2-3 relevant projects with technologies used
- All content should be professional and tailored to the "${tone || 'Professional'}" tone
- Target role: ${targetRole}
- Experience level: ${yearsExperience || '1-3'} years

TECHNICAL RESUME RULES:
- Maximize technical terminology in every bullet point
- Include specific technologies, frameworks, tools, and methodologies
- Use industry-standard abbreviations (CI/CD, REST API, GraphQL, ORM, etc.)
- Reference design patterns, architectures, and best practices
- Mention cloud platforms, databases, and infrastructure tools specifically
- Skills section should be comprehensive with technical depth

CONTENT VOLUME RULES:
- For 0-2 years experience: Generate content to fill 1 full page (3 experiences, 4 bullets each, 15 skills)
- For 3+ years experience: Generate content to fill 2 full pages (4-5 experiences, 5-6 bullets each, 20-25 skills, 2-3 projects)
- Summary should be 3-4 substantive sentences
- Each bullet point should be 1-2 lines of detailed technical achievement

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
  "summary": "A compelling 3-4 sentence professional summary packed with technical keywords",
  "experience": [
    {
      "id": "exp_1",
      "company": "Company Name",
      "role": "Job Title",
      "location": "City, State",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "current": false,
      "bullets": ["Detailed achievement with metrics and specific technologies used", "Another achievement with quantifiable impact"]
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
  "skills": ["React.js", "Node.js", "Python", "AWS"],
  "skillDescriptions": {
    "React.js": "Component-based UI framework for dynamic web applications",
    "Node.js": "Server-side JavaScript runtime for scalable backend services",
    "Python": "High-level language for data science and automation",
    "AWS": "Cloud computing platform for scalable infrastructure"
  },
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
      "description": "Detailed description with technical architecture and measurable impact",
      "url": "",
      "technologies": ["Tech 1", "Tech 2", "Tech 3"]
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
      maxTokens: 8192,
    });

    // Parse AI response
    let resumeData;
    try {
      resumeData = JSON.parse(extractJSON(aiResponse));
    } catch (parseErr) {
      console.error('[AI Resume Generate] Failed to parse AI response:', parseErr);
      return NextResponse.json({ error: 'AI generated invalid response. Please try again.' }, { status: 500 });
    }

    // Ensure skillDescriptions is always present
    if (!resumeData.skillDescriptions && Array.isArray(resumeData.skills)) {
      resumeData.skillDescriptions = {};
    }

    return NextResponse.json({ resume: resumeData });
  } catch (error) {
    console.error('[AI Resume Generate]', error);
    return NextResponse.json({ error: 'Failed to generate resume' }, { status: 500 });
  }
}
