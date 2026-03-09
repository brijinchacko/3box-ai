import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { generateResumeFromProfile, type OnboardingProfile } from '@/lib/agents/forge';
import { TOKEN_COSTS, canAfford } from '@/lib/tokens/pricing';

const { prisma } = require('@/lib/db/prisma');

/**
 * POST /api/forge/auto-generate
 * Generate a resume + cover letter from the user's onboarding profile.
 * Reads profile from CareerTwin._profile (DB) or accepts it in the request body.
 * Cost: 5 tokens (3 resume + 2 cover letter)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // ── Check token budget ──
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiCreditsUsed: true, aiCreditsLimit: true, plan: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const totalCost = TOKEN_COSTS.resume_generate + TOKEN_COSTS.cover_letter; // 3 + 2 = 5
    if (!canAfford(user.aiCreditsUsed, user.aiCreditsLimit, totalCost)) {
      return NextResponse.json(
        { error: `Not enough tokens. This costs ${totalCost} tokens. You have ${Math.max(0, user.aiCreditsLimit - user.aiCreditsUsed)} remaining.` },
        { status: 402 }
      );
    }

    // ── Get profile data ──
    // Priority: request body > CareerTwin._profile from DB
    let profile: OnboardingProfile | null = null;

    const body = await request.json().catch(() => ({}));
    if (body.profile && body.profile.fullName) {
      profile = body.profile as OnboardingProfile;
    }

    if (!profile) {
      // Fall back to CareerTwin._profile in DB
      const twin = await prisma.careerTwin.findUnique({
        where: { userId },
        select: { skillSnapshot: true, targetRoles: true },
      });

      if (twin?.skillSnapshot) {
        const snapshot = twin.skillSnapshot as Record<string, any>;
        const p = snapshot._profile || {};
        const targetRole = Array.isArray(twin.targetRoles) && twin.targetRoles[0]
          ? (twin.targetRoles[0] as any).title || ''
          : '';
        const experienceLevel = Array.isArray(twin.targetRoles) && twin.targetRoles[0]
          ? (twin.targetRoles[0] as any).experienceLevel || ''
          : '';
        const currentStatus = Array.isArray(twin.targetRoles) && twin.targetRoles[0]
          ? (twin.targetRoles[0] as any).currentStatus || ''
          : '';

        // Extract skills from snapshot (keys that aren't _profile)
        const skills = Object.keys(snapshot).filter(k => k !== '_profile');

        profile = {
          fullName: user.email?.split('@')[0] || '', // Fallback from user model
          phone: p.phone || '',
          location: p.location || '',
          linkedin: p.linkedin || '',
          targetRole,
          experienceLevel,
          currentStatus,
          experiences: Array.isArray(p.experiences) ? p.experiences : [],
          educationLevel: p.educationLevel || '',
          fieldOfStudy: p.fieldOfStudy || '',
          institution: p.institution || '',
          graduationYear: p.graduationYear || '',
          skills,
          bio: p.bio || '',
          email: user.email || '',
        };
      }
    }

    // Also try to get user's name from the User model
    if (profile) {
      const userData = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      if (userData?.name && (!profile.fullName || profile.fullName === userData.email?.split('@')[0])) {
        profile.fullName = userData.name;
      }
      if (userData?.email && !profile.email) {
        profile.email = userData.email;
      }
    }

    if (!profile || !profile.fullName) {
      return NextResponse.json(
        { error: 'No profile data found. Please complete onboarding first.' },
        { status: 400 }
      );
    }

    // ── Generate resume + cover letter via Forge AI ──
    const { resume, coverLetter, atsScore } = await generateResumeFromProfile(userId, profile);

    // ── Save to DB ──
    const savedResume = await prisma.resume.create({
      data: {
        userId,
        title: `${profile.targetRole} Resume`,
        template: 'modern',
        content: resume as any,
        targetJob: profile.targetRole,
        atsScore,
        isFinalized: false,
        approvalStatus: 'pending',
        sourceType: 'onboarding',
        coverLetter,
        coverLetterApprovalStatus: 'pending',
      },
    });

    // ── Deduct tokens ──
    await prisma.user.update({
      where: { id: userId },
      data: { aiCreditsUsed: { increment: totalCost } },
    });

    return NextResponse.json({
      success: true,
      resumeId: savedResume.id,
      resume,
      coverLetter,
      atsScore,
      tokensUsed: totalCost,
      tokensRemaining: Math.max(0, user.aiCreditsLimit - user.aiCreditsUsed - totalCost),
    });
  } catch (error) {
    console.error('[Forge Auto-Generate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate resume. Please try again.' },
      { status: 500 }
    );
  }
}
