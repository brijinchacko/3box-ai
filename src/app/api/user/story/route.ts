import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { aiChatWithFallback, getModelForFeature, type PlanTier } from '@/lib/ai/openrouter';

const { prisma } = require('@/lib/db/prisma');

const STORY_PROMPT = `You are a master storyteller crafting a short, cinematic "hero's journey" narrative for a person starting their career transformation. Write in second person ("You...").

Rules:
- Maximum 3 short paragraphs (total under 150 words)
- First paragraph: Set the scene — where they are now (their current status, struggles)
- Second paragraph: The turning point — they discovered 3BOX AI and its agent team
- Third paragraph: The vision — paint a vivid picture of where they're heading (their dream role)
- Use their actual name, target role, skills, and background
- Tone: cinematic, inspiring, personal — like a movie trailer narration
- Do NOT use clichés like "embark on a journey" or "unlock your potential"
- Make it feel like THEIR unique story, not generic motivational text
- Reference specific skills they have and the role they want
- If they're a student, lean into the "first chapter" energy
- If they're career-changing, lean into the "reinvention" energy
- If they're experienced, lean into the "next level" energy
- End with a punchy, forward-looking line

Return ONLY the story text, no titles or headers.`;

async function generateStory(userId: string): Promise<string | null> {
  try {
    const careerTwin = await prisma.careerTwin.findUnique({
      where: { userId },
      select: { skillSnapshot: true, targetRoles: true, interests: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!careerTwin) return null;

    const snap = (careerTwin.skillSnapshot as any) || {};
    const profile = snap._profile || {};
    const targetRole = Array.isArray(careerTwin.targetRoles)
      ? (careerTwin.targetRoles as any[])[0]?.title || 'their dream role'
      : 'their dream role';
    const skills = Object.keys(snap).filter(k => !k.startsWith('_')).slice(0, 8);
    const interests = Array.isArray(careerTwin.interests) ? careerTwin.interests : [];

    const userContext = [
      `Name: ${user?.name || 'the user'}`,
      `Target Role: ${targetRole}`,
      `Experience Level: ${profile.experienceLevel || 'unknown'}`,
      `Current Status: ${profile.currentStatus || 'unknown'}`,
      `Skills: ${skills.length ? skills.join(', ') : interests.join(', ')}`,
      profile.educationLevel ? `Education: ${profile.educationLevel}${profile.fieldOfStudy ? ` in ${profile.fieldOfStudy}` : ''}` : null,
      profile.location ? `Location: ${profile.location}` : null,
      profile.bio ? `Bio: ${profile.bio}` : null,
    ].filter(Boolean).join('\n');

    const model = getModelForFeature('coach', 'FREE' as PlanTier);

    const result = await aiChatWithFallback(
      {
        messages: [
          { role: 'system', content: STORY_PROMPT },
          { role: 'user', content: `Write the career hero story for this person:\n\n${userContext}` },
        ],
        temperature: 0.8,
        maxTokens: 400,
      },
      model.tier
    );

    if (result) {
      // Store the story in CareerTwin
      await prisma.careerTwin.update({
        where: { userId },
        data: {
          skillSnapshot: {
            ...snap,
            _story: {
              text: result,
              generatedAt: new Date().toISOString(),
            },
          },
        },
      });
    }

    return result;
  } catch (error) {
    console.error('[Story Generation] Error:', error);
    return null;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check for existing story
    const careerTwin = await prisma.careerTwin.findUnique({
      where: { userId: session.user.id },
      select: { skillSnapshot: true },
    });

    const snap = (careerTwin?.skillSnapshot as any) || {};
    const existing = snap._story;

    if (existing?.text) {
      return NextResponse.json({
        story: existing.text,
        generatedAt: existing.generatedAt,
        isNew: false,
      });
    }

    // Generate new story
    const story = await generateStory(session.user.id);
    if (!story) {
      return NextResponse.json({ story: null, error: 'Could not generate story' });
    }

    return NextResponse.json({
      story,
      generatedAt: new Date().toISOString(),
      isNew: true,
    });
  } catch (error) {
    console.error('[Story API] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const story = await generateStory(session.user.id);
  if (!story) {
    return NextResponse.json({ error: 'Could not regenerate story' }, { status: 500 });
  }

  return NextResponse.json({
    story,
    generatedAt: new Date().toISOString(),
    isNew: true,
  });
}
