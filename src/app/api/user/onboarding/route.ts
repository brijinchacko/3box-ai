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
    const { targetRole, interests, profile, agentName, resumeText } = body;

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

    // Create a Resume record from onboarding data in the editor-compatible shape
    // so the dashboard resume builder can load and edit it immediately.
    if (profile) {
      try {
        // Split duration on both hyphen and em-dash
        const splitDuration = (d: string) => {
          const sep = d.includes('–') ? '–' : d.includes('—') ? '—' : '-';
          return d.split(sep).map((s: string) => s.trim());
        };

        const editorResume = {
          id: '1',
          title: `${targetRole} Resume`,
          template: 'modern',
          contact: {
            name: profile.fullName || '',
            email: session.user.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            linkedin: profile.linkedin || '',
            portfolio: '',
          },
          summary: profile.bio || '',
          experience: (profile.experiences || []).map((e: any, i: number) => {
            const [start, end] = e.duration ? splitDuration(e.duration) : ['', ''];
            // Split description into bullet points on sentence boundaries
            const desc = e.description || '';
            const bullets = desc.includes('. ')
              ? desc.split(/\.\s+/).filter((s: string) => s.trim()).map((s: string) => s.trim().replace(/\.?$/, '.'))
              : desc ? [desc] : [];
            return {
              id: String(i + 1),
              company: e.company || '',
              role: e.title || '',
              location: '',
              startDate: start || '',
              endDate: end || '',
              current: (end || '').toLowerCase().includes('present'),
              bullets,
            };
          }),
          education: profile.educationLevel ? [{
            id: '1',
            institution: profile.institution || '',
            degree: profile.educationLevel || '',
            field: profile.fieldOfStudy || '',
            startDate: '',
            endDate: profile.graduationYear || '',
            gpa: '',
          }] : [],
          skills: profile.skills || [],
          certifications: [],
          projects: [],
          // Store raw resume text so the resume builder can re-parse if needed
          ...(resumeText ? { rawResumeText: resumeText } : {}),
        };

        await prisma.resume.create({
          data: {
            userId: session.user.id,
            title: `${targetRole} Resume`,
            content: editorResume,
            template: 'modern',
            targetJob: targetRole,
            sourceType: 'onboarding',
            isFinalized: false,
            approvalStatus: 'draft',
          },
        });
      } catch (resumeErr) {
        // Non-blocking — don't fail onboarding if resume save fails
        console.warn('[Onboarding] Resume save failed:', resumeErr);
      }
    }

    // Upsert CoachSettings with agent name if provided
    if (agentName && typeof agentName === 'string' && agentName.trim().length > 0) {
      await prisma.coachSettings.upsert({
        where: { userId: session.user.id },
        update: { name: agentName.trim().slice(0, 20) },
        create: { userId: session.user.id, name: agentName.trim().slice(0, 20) },
      });
    }

    // ══════════════════════════════════════════════════════
    // POST-ONBOARDING AUTO-CREATION HOOK
    // Everything the user provided during onboarding must be
    // IMMEDIATELY used — no empty dashboard after completing setup.
    // ══════════════════════════════════════════════════════

    const userId = session.user.id;
    const location = profile?.location || '';

    // 1. If user uploaded a resume, mark it as READY (not draft)
    //    They already uploaded it — no need for a "finalize" step
    if (resumeText || (profile?.experiences && profile.experiences.length > 0)) {
      try {
        await prisma.resume.updateMany({
          where: { userId, sourceType: 'onboarding' },
          data: { approvalStatus: 'ready', isFinalized: true },
        });
      } catch (e) {
        console.warn('[Onboarding] Resume approval update failed:', e);
      }
    }

    // 2. AUTO-CREATE SearchProfile from onboarding data
    //    This is what /dashboard/jobs shows — the user should NEVER see
    //    "No search profiles yet" after completing onboarding
    try {
      const existingProfile = await prisma.searchProfile.findFirst({
        where: { userId, jobTitle: targetRole },
      });

      if (!existingProfile) {
        await prisma.searchProfile.create({
          data: {
            userId,
            name: `${targetRole}${location ? ` in ${location}` : ''}`,
            jobTitle: targetRole,
            location: location || '',
            remote: false,
            active: true,
            autoSearch: true,
            autoApply: false,
            matchTolerance: 70,
            experienceLevel: profile?.experienceLevel || '',
          },
        });
        console.log(`[Onboarding] Auto-created search profile: "${targetRole}" for user ${userId}`);
      }
    } catch (e) {
      console.warn('[Onboarding] Search profile auto-creation failed:', e);
    }

    // 3. AUTO-ENABLE Scout in AutoApplyConfig
    try {
      await prisma.autoApplyConfig.upsert({
        where: { userId },
        create: {
          userId,
          enabled: true,
          scoutEnabled: true,
          scoutAutoMode: true,
          scoutInterval: 12,
          targetRoles: [targetRole],
          targetLocations: location ? [location] : [],
        },
        update: {
          scoutEnabled: true,
          scoutAutoMode: true,
          targetRoles: [targetRole],
          targetLocations: location ? [location] : [],
        },
      });
    } catch (e) {
      console.warn('[Onboarding] AutoApplyConfig setup failed:', e);
    }

    // 4. TRIGGER first Scout run in background (fire-and-forget)
    //    This runs async — don't block the response
    try {
      const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://3box.ai';
      fetch(`${appUrl}/api/agents/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        body: JSON.stringify({ agentType: 'scout' }),
      }).catch(err => {
        console.warn('[Onboarding] Background Scout trigger failed:', err?.message);
      });
      console.log(`[Onboarding] Triggered first Scout run for user ${userId}`);
    } catch (e) {
      console.warn('[Onboarding] Scout trigger failed:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed — search profile created and Scout searching',
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
