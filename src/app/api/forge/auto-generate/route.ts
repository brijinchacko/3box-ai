import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { generateResumeFromProfile, type OnboardingProfile } from '@/lib/agents/forge';
import { checkFeatureGate } from '@/lib/tokens/featureGate';

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

    const gate = await checkFeatureGate(session.user.id);
    if (gate.locked) {
      return NextResponse.json({ error: gate.reason || 'Free plan limit reached. Please upgrade.' }, { status: 403 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, email: true, name: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    // Use name/email from the already-fetched user record (no extra DB query)
    if (profile) {
      if (user.name && (!profile.fullName || profile.fullName === user.email?.split('@')[0])) {
        profile.fullName = user.name;
      }
      if (user.email && !profile.email) {
        profile.email = user.email;
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
        template: body.template || 'modern',
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

    return NextResponse.json({
      success: true,
      resumeId: savedResume.id,
      resume,
      coverLetter,
      atsScore,
    });
  } catch (error) {
    console.error('[Forge Auto-Generate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate resume. Please try again.' },
      { status: 500 }
    );
  }
}
