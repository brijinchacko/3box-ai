import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const { prisma } = require('@/lib/db/prisma');

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user + journey progress in parallel
    const [user, assessmentCount, careerPlanCount, resumeCount, jobAppCount, interviewCount, offerCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          careerTwin: true,
          coachSettings: true,
        },
      }),
      prisma.assessment.count({ where: { userId: session.user.id, status: 'COMPLETED' } }),
      prisma.careerPlan.count({ where: { userId: session.user.id } }),
      prisma.resume.count({ where: { userId: session.user.id } }),
      prisma.jobApplication.count({ where: { userId: session.user.id } }),
      prisma.jobApplication.count({ where: { userId: session.user.id, status: 'INTERVIEW' } }),
      prisma.jobApplication.count({ where: { userId: session.user.id, status: 'OFFER' } }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get targetRole from CareerTwin's targetRoles array
    const targetRoles = user.careerTwin?.targetRoles as any;
    const targetRole = Array.isArray(targetRoles) && targetRoles.length > 0
      ? (typeof targetRoles[0] === 'string' ? targetRoles[0] : targetRoles[0]?.title || '')
      : '';

    // Get location from CareerTwin's skillSnapshot._profile
    const skillSnapshot = user.careerTwin?.skillSnapshot as any;
    const location = skillSnapshot?._profile?.location || '';

    // Career journey steps
    const journey = {
      onboarding: user.onboardingDone,
      assessment: assessmentCount > 0,
      careerPlan: careerPlanCount > 0,
      resume: resumeCount > 0,
      applied: jobAppCount > 0,
      interview: interviewCount > 0,
      offer: offerCount > 0,
    };

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      targetRole,
      location,
      plan: user.plan,
      aiCreditsUsed: user.aiCreditsUsed,
      aiCreditsLimit: user.aiCreditsLimit,
      referralCode: user.referralCode,
      onboardingDone: user.onboardingDone,
      careerTwin: user.careerTwin,
      coachSettings: user.coachSettings,
      journey,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
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
    const { name, targetRole, location } = body;

    // Update user name
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
      });
    }

    // Update targetRole/location in CareerTwin
    if (targetRole !== undefined || location !== undefined) {
      const existing = await prisma.careerTwin.findUnique({
        where: { userId: session.user.id },
      });
      if (existing) {
        const careerUpdate: Record<string, unknown> = {};
        if (targetRole !== undefined) {
          careerUpdate.targetRoles = [{ title: targetRole, probability: 0 }];
        }
        if (location !== undefined) {
          const snap = (existing.skillSnapshot as any) || {};
          careerUpdate.skillSnapshot = {
            ...snap,
            _profile: { ...(snap._profile || {}), location },
          };
        }
        await prisma.careerTwin.update({
          where: { userId: session.user.id },
          data: careerUpdate,
        });
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { careerTwin: true },
    });

    const targetRolesArr = updatedUser?.careerTwin?.targetRoles as any;
    const resolvedRole = Array.isArray(targetRolesArr) && targetRolesArr.length > 0
      ? (typeof targetRolesArr[0] === 'string' ? targetRolesArr[0] : targetRolesArr[0]?.title || '')
      : '';

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser?.id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        targetRole: resolvedRole,
        updatedAt: updatedUser?.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
