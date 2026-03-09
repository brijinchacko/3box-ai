import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const { prisma } = require('@/lib/db/prisma');

/**
 * GET /api/forge/status
 * Get the current Forge state: latest resume, approval status, settings, token balance.
 * Used by the dashboard to determine which view to render.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // Parallel fetch all relevant data
    const [user, latestResume, autoConfig, twin, variants] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          aiCreditsUsed: true,
          aiCreditsLimit: true,
          plan: true,
          onboardingDone: true,
          name: true,
        },
      }),
      prisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          template: true,
          content: true,
          targetJob: true,
          atsScore: true,
          isFinalized: true,
          approvalStatus: true,
          approvedAt: true,
          sourceType: true,
          coverLetter: true,
          coverLetterApprovalStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.autoApplyConfig.findUnique({
        where: { userId },
        select: {
          resumeId: true,
          perJobResumeRewrite: true,
          perJobAutoApprove: true,
        },
      }),
      prisma.careerTwin.findUnique({
        where: { userId },
        select: { skillSnapshot: true, targetRoles: true },
      }),
      prisma.resumeVariant.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          jobTitle: true,
          company: true,
          atsScore: true,
          createdAt: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine if profile exists from CareerTwin
    const hasProfile = !!(twin?.skillSnapshot && (twin.skillSnapshot as any)._profile);
    const tokensRemaining = Math.max(0, user.aiCreditsLimit - user.aiCreditsUsed);

    // Determine dashboard state
    let dashboardState: 'no_resume' | 'pending_approval' | 'approved' | 'editing' = 'no_resume';
    if (latestResume) {
      if (latestResume.approvalStatus === 'pending') {
        dashboardState = 'pending_approval';
      } else if (latestResume.approvalStatus === 'approved' && latestResume.isFinalized) {
        dashboardState = 'approved';
      } else if (latestResume.approvalStatus === 'rejected') {
        dashboardState = 'editing';
      } else if (latestResume.approvalStatus === 'draft') {
        // Has a resume but not through the approval flow
        dashboardState = 'approved';
      }
    }

    return NextResponse.json({
      success: true,
      dashboardState,
      resume: latestResume,
      settings: {
        perJobResumeRewrite: autoConfig?.perJobResumeRewrite ?? false,
        perJobAutoApprove: autoConfig?.perJobAutoApprove ?? false,
      },
      tokens: {
        used: user.aiCreditsUsed,
        limit: user.aiCreditsLimit,
        remaining: tokensRemaining,
      },
      plan: user.plan,
      hasProfile,
      onboardingDone: user.onboardingDone,
      variants,
    });
  } catch (error) {
    console.error('[Forge Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Forge status.' },
      { status: 500 }
    );
  }
}
