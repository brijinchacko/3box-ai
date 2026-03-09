import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { aiChatWithFallback, extractJSON } from '@/lib/ai/openrouter';

const { prisma } = require('@/lib/db/prisma');

/**
 * POST /api/forge/linkedin-suggest
 * Generate LinkedIn optimization content (headline, bio, skills) for an existing resume.
 * Uses the resume content already in DB — zero extra cost (free-tier AI).
 * Updates the resume.content JSON in-place with LinkedIn fields.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json().catch(() => ({}));
    const resumeId = body.resumeId;

    if (!resumeId) {
      return NextResponse.json({ error: 'resumeId is required' }, { status: 400 });
    }

    // Fetch the resume
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true, content: true, targetJob: true },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const content = resume.content as Record<string, any>;
    if (!content) {
      return NextResponse.json({ error: 'Resume has no content' }, { status: 400 });
    }

    // Already has LinkedIn data?
    if (content.linkedinHeadline && content.linkedinBio) {
      return NextResponse.json({
        success: true,
        linkedinHeadline: content.linkedinHeadline,
        linkedinBio: content.linkedinBio,
        linkedinSuggestedSkills: content.linkedinSuggestedSkills || [],
        alreadyExists: true,
      });
    }

    // Build context from existing resume content
    const targetRole = resume.targetJob || '';
    const name = content.contact?.name || '';
    const skills = Array.isArray(content.skills) ? content.skills.join(', ') : '';
    const summary = content.summary || '';
    const experience = Array.isArray(content.experience)
      ? content.experience.map((e: any) => `${e.title} at ${e.company}`).join('; ')
      : '';

    const prompt = `Generate LinkedIn profile optimization content for this professional. Output valid JSON only.

PROFILE:
Name: ${name}
Target Role: ${targetRole}
Summary: ${summary}
Skills: ${skills}
Experience: ${experience}

Generate:
{
  "linkedinHeadline": "<compelling LinkedIn headline, max 120 chars, with relevant keywords for ${targetRole}. Example: 'Senior Software Engineer | React & Node.js | Building scalable web applications'>",
  "linkedinBio": "<3-5 sentence LinkedIn About section. First person, conversational, professional. Highlight key strengths and career goals.>",
  "linkedinSuggestedSkills": ["<top 10-15 LinkedIn skills, most relevant first>"]
}

Rules:
- Headline must be under 120 characters and keyword-rich
- Bio should be first person, professional but personable
- Skills should include both technical and soft skills from the profile
- Never fabricate skills or experience not in the profile`;

    const aiResponse = await aiChatWithFallback({ messages: [
      { role: 'system', content: 'You are a LinkedIn profile optimizer. Output valid JSON only.' },
      { role: 'user', content: prompt },
    ] }, 'free');

    const parsed = JSON.parse(extractJSON(aiResponse));

    const linkedinHeadline = typeof parsed.linkedinHeadline === 'string'
      ? parsed.linkedinHeadline.slice(0, 120) : '';
    const linkedinBio = typeof parsed.linkedinBio === 'string'
      ? parsed.linkedinBio : '';
    const linkedinSuggestedSkills = Array.isArray(parsed.linkedinSuggestedSkills)
      ? parsed.linkedinSuggestedSkills.filter((s: string) => typeof s === 'string' && s.length > 0).slice(0, 15)
      : [];

    if (!linkedinHeadline && !linkedinBio) {
      return NextResponse.json(
        { error: 'AI failed to generate LinkedIn content. Try again.' },
        { status: 500 }
      );
    }

    // Update resume content with LinkedIn fields
    const updatedContent = {
      ...content,
      ...(linkedinHeadline && { linkedinHeadline }),
      ...(linkedinBio && { linkedinBio }),
      ...(linkedinSuggestedSkills.length > 0 && { linkedinSuggestedSkills }),
    };

    await prisma.resume.update({
      where: { id: resumeId },
      data: { content: updatedContent },
    });

    return NextResponse.json({
      success: true,
      linkedinHeadline,
      linkedinBio,
      linkedinSuggestedSkills,
    });
  } catch (error) {
    console.error('[Forge LinkedIn Suggest] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate LinkedIn suggestions. Please try again.' },
      { status: 500 }
    );
  }
}
