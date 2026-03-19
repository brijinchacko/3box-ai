import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/user/resume — Load the user's latest resume.
 *
 * Priority:
 * 1. Finalized (approved) resume
 * 2. Most recently updated resume
 * 3. Onboarding-created resume (convert to editor shape)
 * 4. Populate from CareerTwin/onboarding profile if no resume exists
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Try to find existing resume
  const resume = await prisma.resume.findFirst({
    where: { userId },
    orderBy: [
      { isFinalized: 'desc' },
      { updatedAt: 'desc' },
    ],
  });

  if (resume) {
    // Check if the content is in the editor shape or the old onboarding shape
    const content = resume.content as any;

    if (content?.contact) {
      // Already in editor shape — return as-is
      return NextResponse.json({
        resumeId: resume.id,
        resume: {
          ...content,
          template: resume.template || content.template || 'modern',
        },
        isFinalized: resume.isFinalized,
      });
    }

    // Old onboarding shape — convert to editor shape
    const editorResume = convertOnboardingToEditor(content, resume.template);
    return NextResponse.json({
      resumeId: resume.id,
      resume: editorResume,
      isFinalized: resume.isFinalized,
    });
  }

  // No resume record — return a blank resume with only name/email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const freshResume = {
    id: '1',
    title: 'My Resume',
    template: 'modern',
    contact: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
  };

  return NextResponse.json({
    resumeId: null,
    resume: freshResume,
    isFinalized: false,
  });
}

/**
 * PUT /api/user/resume — Save (create or update) the user's resume.
 * This is the single source of truth used by Archer for applications.
 */
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const { resumeId, resume, template, verify } = body;

  if (!resume?.contact?.name) {
    return NextResponse.json({ error: 'Resume must have at least a name' }, { status: 400 });
  }

  const resolvedTemplate = template || resume.template || 'modern';

  // Only update finalization fields when verify flag is explicitly passed
  const hasVerifyFlag = typeof verify === 'boolean';
  const isVerifying = verify === true;

  // Build finalization fields only when verify is explicitly set
  const finalizationData = hasVerifyFlag
    ? {
        isFinalized: isVerifying,
        approvalStatus: isVerifying ? 'approved' : 'draft',
        ...(isVerifying ? { approvedAt: new Date() } : {}),
      }
    : {};

  try {
    let saved;

    if (resumeId) {
      // Update existing resume
      saved = await prisma.resume.update({
        where: { id: resumeId },
        data: {
          content: resume,
          template: resolvedTemplate,
          title: resume.title || 'My Resume',
          targetJob: resume.targetJob || null,
          ...finalizationData,
        },
      });
    } else {
      // Create new resume (or find existing to update)
      const existing = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      if (existing) {
        saved = await prisma.resume.update({
          where: { id: existing.id },
          data: {
            content: resume,
            template: resolvedTemplate,
            title: resume.title || 'My Resume',
            ...finalizationData,
          },
        });
      } else {
        saved = await prisma.resume.create({
          data: {
            userId,
            content: resume,
            template: resolvedTemplate,
            title: resume.title || 'My Resume',
            sourceType: 'manual',
            isFinalized: isVerifying,
            approvalStatus: isVerifying ? 'approved' : 'draft',
            ...(isVerifying ? { approvedAt: new Date() } : {}),
          },
        });
      }
    }

    // Only sync resumeId to AutoApplyConfig when user explicitly verifies
    if (isVerifying) {
      await prisma.autoApplyConfig.upsert({
        where: { userId },
        update: { resumeId: saved.id },
        create: {
          userId,
          resumeId: saved.id,
          automationMode: 'autopilot',
        },
      });
    }

    return NextResponse.json({
      resumeId: saved.id,
      success: true,
      isFinalized: saved.isFinalized,
    });
  } catch (err) {
    console.error('[user/resume/PUT]', err);
    return NextResponse.json({ error: 'Failed to save resume' }, { status: 500 });
  }
}

/**
 * DELETE /api/user/resume — Delete all resumes for the current user.
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.resume.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[user/resume/DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
  }
}

/* ─── Helper ──────────────────────────────────────────── */

function convertOnboardingToEditor(content: any, template?: string) {
  const pi = content.personalInfo || {};
  return {
    id: '1',
    title: 'My Resume',
    template: template || 'modern',
    contact: {
      name: pi.fullName || '',
      email: pi.email || '',
      phone: pi.phone || '',
      location: pi.location || '',
      linkedin: pi.linkedin || '',
      portfolio: '',
    },
    summary: content.summary || '',
    experience: (content.experience || []).map((exp: any, i: number) => ({
      id: String(i + 1),
      company: exp.company || '',
      role: exp.title || '',
      location: '',
      startDate: exp.duration?.split('-')[0]?.trim() || '',
      endDate: exp.duration?.split('-')[1]?.trim() || '',
      current: false,
      bullets: exp.description ? [exp.description] : [],
    })),
    education: content.education ? [{
      id: '1',
      institution: content.education.institution || '',
      degree: content.education.level || '',
      field: content.education.field || '',
      startDate: '',
      endDate: content.education.year || '',
      gpa: '',
    }] : [],
    skills: content.skills || [],
    certifications: [],
    projects: [],
  };
}
