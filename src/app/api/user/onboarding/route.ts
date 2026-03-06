import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const { prisma } = require('@/lib/db/prisma');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetRole, interests, profile, agentName } = body;

    if (!targetRole) {
      return NextResponse.json(
        { error: 'Target role is required' },
        { status: 400 }
      );
    }

    // Update user name if provided and mark onboarding as done
    const updateData: Record<string, any> = { onboardingDone: true };
    if (profile?.fullName) {
      updateData.name = profile.fullName;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // Build a comprehensive skill snapshot from profile data
    const skillSnapshot: Record<string, any> = {};
    if (profile?.skills) {
      profile.skills.forEach((skill: string) => {
        skillSnapshot[skill] = {
          level: profile.experienceLevel === 'fresher' ? 'beginner' :
                 profile.experienceLevel === '0-1' ? 'beginner' :
                 profile.experienceLevel === '1-3' ? 'intermediate' :
                 profile.experienceLevel === '3-5' ? 'intermediate' :
                 'advanced',
          source: 'onboarding',
        };
      });
    }

    // Save to CareerTwin with extended profile data
    await prisma.careerTwin.upsert({
      where: { userId: session.user.id },
      update: {
        skillSnapshot,
        interests: interests || [],
        targetRoles: [
          {
            title: targetRole,
            probability: 0,
            experienceLevel: profile?.experienceLevel || '',
            currentStatus: profile?.currentStatus || '',
          },
        ],
        marketReadiness: 0,
        hireProb: 0,
        // Store full profile as part of the twin data
        ...(profile ? {
          skillSnapshot: {
            ...skillSnapshot,
            _profile: {
              location: profile.location || '',
              phone: profile.phone || '',
              linkedin: profile.linkedin || '',
              experiences: profile.experiences || [],
              educationLevel: profile.educationLevel || '',
              fieldOfStudy: profile.fieldOfStudy || '',
              institution: profile.institution || '',
              graduationYear: profile.graduationYear || '',
              bio: profile.bio || '',
            },
          },
        } : {}),
      },
      create: {
        userId: session.user.id,
        skillSnapshot: {
          ...skillSnapshot,
          ...(profile ? {
            _profile: {
              location: profile.location || '',
              phone: profile.phone || '',
              linkedin: profile.linkedin || '',
              experiences: profile.experiences || [],
              educationLevel: profile.educationLevel || '',
              fieldOfStudy: profile.fieldOfStudy || '',
              institution: profile.institution || '',
              graduationYear: profile.graduationYear || '',
              bio: profile.bio || '',
            },
          } : {}),
        },
        interests: interests || [],
        targetRoles: [
          {
            title: targetRole,
            probability: 0,
            experienceLevel: profile?.experienceLevel || '',
            currentStatus: profile?.currentStatus || '',
          },
        ],
        marketReadiness: 0,
        hireProb: 0,
      },
    });

    // Upsert CoachSettings with agent name if provided
    if (agentName && typeof agentName === 'string' && agentName.trim().length > 0) {
      await prisma.coachSettings.upsert({
        where: { userId: session.user.id },
        update: { name: agentName.trim().slice(0, 20) },
        create: { userId: session.user.id, name: agentName.trim().slice(0, 20) },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
