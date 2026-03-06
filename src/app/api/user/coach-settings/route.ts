import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

const VALID_PERSONALITIES = ['friendly', 'professional', 'casual', 'motivational'] as const;

const DEFAULTS = {
  name: 'Horace',
  personality: 'friendly',
  enabled: true,
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coachSettings = await prisma.coachSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!coachSettings) {
      return NextResponse.json(DEFAULTS);
    }

    return NextResponse.json({
      id: coachSettings.id,
      name: coachSettings.name,
      personality: coachSettings.personality,
      avatarUrl: coachSettings.avatarUrl,
      enabled: coachSettings.enabled,
    });
  } catch (error) {
    console.error('Error fetching coach settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coach settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, personality, enabled } = body;

    // Validate name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 20) {
        return NextResponse.json(
          { error: 'Name must be between 1 and 20 characters' },
          { status: 400 }
        );
      }
    }

    // Validate personality
    if (personality !== undefined) {
      if (!VALID_PERSONALITIES.includes(personality)) {
        return NextResponse.json(
          { error: `Personality must be one of: ${VALID_PERSONALITIES.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate enabled
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Enabled must be a boolean' },
        { status: 400 }
      );
    }

    // Build the data object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (personality !== undefined) updateData.personality = personality;
    if (enabled !== undefined) updateData.enabled = enabled;

    const coachSettings = await prisma.coachSettings.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
      },
    });

    return NextResponse.json({
      id: coachSettings.id,
      name: coachSettings.name,
      personality: coachSettings.personality,
      avatarUrl: coachSettings.avatarUrl,
      enabled: coachSettings.enabled,
    });
  } catch (error) {
    console.error('Error updating coach settings:', error);
    return NextResponse.json(
      { error: 'Failed to update coach settings' },
      { status: 500 }
    );
  }
}
