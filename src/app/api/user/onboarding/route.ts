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
    const { targetRole, interests } = body;

    if (!targetRole) {
      return NextResponse.json(
        { error: 'Target role is required' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingDone: true,
        targetRole,
      },
    });

    await prisma.careerTwin.upsert({
      where: { userId: session.user.id },
      update: {
        skillSnapshot: {},
        interests: interests || [],
        targetRoles: [
          {
            title: targetRole,
            probability: 0,
          },
        ],
        marketReadiness: 0,
        hireProb: 0,
      },
      create: {
        userId: session.user.id,
        skillSnapshot: {},
        interests: interests || [],
        targetRoles: [
          {
            title: targetRole,
            probability: 0,
          },
        ],
        marketReadiness: 0,
        hireProb: 0,
      },
    });

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
