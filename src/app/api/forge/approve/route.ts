import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const { prisma } = require('@/lib/db/prisma');

/**
 * PUT /api/forge/approve
 * Approve or reject a resume / cover letter.
 * On approval: sets isFinalized=true and updates AutoApplyConfig.resumeId → signals Archer.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { resumeId, action, type } = body as {
      resumeId: string;
      action: 'approve' | 'reject';
      type: 'resume' | 'cover_letter' | 'both';
    };

    if (!resumeId || !action) {
      return NextResponse.json({ error: 'resumeId and action are required' }, { status: 400 });
    }

    // Verify ownership
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const updateType = type || 'both';
    const now = new Date();

    if (action === 'approve') {
      // ── Approve ──
      const updateData: Record<string, any> = {};

      if (updateType === 'resume' || updateType === 'both') {
        updateData.approvalStatus = 'approved';
        updateData.approvedAt = now;
        updateData.isFinalized = true;
      }
      if (updateType === 'cover_letter' || updateType === 'both') {
        updateData.coverLetterApprovalStatus = 'approved';
      }

      await prisma.resume.update({
        where: { id: resumeId },
        data: updateData,
      });

      // Signal Archer: update AutoApplyConfig.resumeId + populate targetRoles from CareerTwin
      if (updateType === 'resume' || updateType === 'both') {
        // Get target roles and location from CareerTwin for Archer config
        const twin = await prisma.careerTwin.findUnique({
          where: { userId },
          select: { targetRoles: true, skillSnapshot: true },
        });

        const twinRoles = Array.isArray(twin?.targetRoles) ? twin.targetRoles : [];
        const targetRolesForConfig = twinRoles
          .map((r: any) => (typeof r === 'string' ? r : r?.title || ''))
          .filter(Boolean);
        const twinLocation = (twin?.skillSnapshot as any)?._profile?.location || '';
        const targetLocationsForConfig = twinLocation ? [twinLocation] : [];

        // Upsert config: create with full data, or update resumeId on existing.
        // Then populate empty targetRoles/targetLocations from CareerTwin in one step.
        const existingConfig = await prisma.autoApplyConfig.findUnique({
          where: { userId },
          select: { targetRoles: true, targetLocations: true },
        });
        const existingRoles = Array.isArray(existingConfig?.targetRoles) ? existingConfig.targetRoles : [];
        const existingLocs = Array.isArray(existingConfig?.targetLocations) ? existingConfig.targetLocations : [];

        const updateData: Record<string, any> = { resumeId };
        // Populate empty roles/locations from CareerTwin
        if (existingRoles.length === 0 && targetRolesForConfig.length > 0) {
          updateData.targetRoles = targetRolesForConfig;
        }
        if (existingLocs.length === 0 && targetLocationsForConfig.length > 0) {
          updateData.targetLocations = targetLocationsForConfig;
        }

        await prisma.autoApplyConfig.upsert({
          where: { userId },
          update: updateData,
          create: {
            userId,
            resumeId,
            enabled: false,
            automationMode: 'autopilot',
            targetRoles: targetRolesForConfig,
            targetLocations: targetLocationsForConfig,
          },
        });
      }

      // Log activity
      await prisma.agentActivity.create({
        data: {
          userId,
          agent: 'forge',
          action: 'resume_approved',
          summary: `User approved ${updateType === 'both' ? 'resume + cover letter' : updateType}. Resume is now finalized and ready for Archer.`,
          details: { resumeId, type: updateType },
        },
      });

      return NextResponse.json({
        success: true,
        message: updateType === 'both'
          ? 'Resume and cover letter approved! Archer can now use this resume.'
          : `${updateType === 'resume' ? 'Resume' : 'Cover letter'} approved.`,
        isFinalized: updateType === 'resume' || updateType === 'both',
      });
    } else {
      // ── Reject ──
      const updateData: Record<string, any> = {};

      if (updateType === 'resume' || updateType === 'both') {
        updateData.approvalStatus = 'rejected';
        updateData.isFinalized = false;
      }
      if (updateType === 'cover_letter' || updateType === 'both') {
        updateData.coverLetterApprovalStatus = 'rejected';
      }

      await prisma.resume.update({
        where: { id: resumeId },
        data: updateData,
      });

      await prisma.agentActivity.create({
        data: {
          userId,
          agent: 'forge',
          action: 'resume_rejected',
          summary: `User rejected ${updateType === 'both' ? 'resume + cover letter' : updateType}. Needs regeneration or manual edits.`,
          details: { resumeId, type: updateType },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Changes requested. You can regenerate or edit manually.',
      });
    }
  } catch (error) {
    console.error('[Forge Approve] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process approval. Please try again.' },
      { status: 500 }
    );
  }
}
