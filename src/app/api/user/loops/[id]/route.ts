import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/* PATCH /api/user/loops/[id] — Update a search profile */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = params;

  // Verify ownership
  const existing = await prisma.searchProfile.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  try {
    const body = await req.json();

    // Only allow updating specific fields
    const updateData: Record<string, unknown> = {};
    if (typeof body.active === 'boolean') updateData.active = body.active;
    if (typeof body.name === 'string') updateData.name = body.name.trim();
    if (typeof body.jobTitle === 'string') updateData.jobTitle = body.jobTitle.trim();
    if (typeof body.location === 'string') updateData.location = body.location.trim() || null;
    if (typeof body.remote === 'boolean') updateData.remote = body.remote;
    if (typeof body.autoApply === 'boolean') updateData.autoApply = body.autoApply;
    if (typeof body.autoSearch === 'boolean') updateData.autoSearch = body.autoSearch;
    if (typeof body.matchTolerance === 'number') updateData.matchTolerance = body.matchTolerance;
    if (typeof body.experienceLevel === 'string') updateData.experienceLevel = body.experienceLevel;
    if (body.boards !== undefined) updateData.boards = body.boards;
    if (typeof body.includeKeywords === 'string') updateData.includeKeywords = body.includeKeywords.trim() || null;
    if (typeof body.excludeKeywords === 'string') updateData.excludeKeywords = body.excludeKeywords.trim() || null;
    if (typeof body.excludeCompanies === 'string') updateData.excludeCompanies = body.excludeCompanies.trim() || null;

    const updated = await prisma.searchProfile.update({
      where: { id },
      data: updateData,
    });

    // Re-sync AutoApplyConfig so automation reflects the change
    await syncAutoApplyConfig(userId);

    return NextResponse.json({ profile: updated });
  } catch (err) {
    console.error('[loops/PATCH]', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

/* DELETE /api/user/loops/[id] — Delete a search profile */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = params;

  // Verify ownership
  const existing = await prisma.searchProfile.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  await prisma.searchProfile.delete({ where: { id } });

  // Re-sync AutoApplyConfig (removing this profile's targets)
  await syncAutoApplyConfig(userId);

  return NextResponse.json({ success: true });
}

/* ─── Shared Helper ────────────────────────────────────── */

/**
 * Aggregate all active search profiles into AutoApplyConfig
 * so Scout/Archer automation picks up the correct targets.
 */
async function syncAutoApplyConfig(userId: string) {
  const activeProfiles = await prisma.searchProfile.findMany({
    where: { userId, active: true },
    select: {
      jobTitle: true,
      location: true,
      remote: true,
      excludeKeywords: true,
      excludeCompanies: true,
      matchTolerance: true,
      autoApply: true,
      autoSearch: true,
    },
  });

  if (activeProfiles.length === 0) {
    // No active profiles — disable automation
    await prisma.autoApplyConfig.upsert({
      where: { userId },
      update: {
        enabled: false,
        scoutEnabled: false,
        scoutAutoMode: false,
        archerEnabled: false,
        targetRoles: [],
        targetLocations: [],
      },
      create: {
        userId,
        enabled: false,
        automationMode: 'autopilot',
        targetRoles: [],
        targetLocations: [],
      },
    });
    return;
  }

  // Merge all profiles into unified config
  const targetRoles = [...new Set(activeProfiles.map(p => p.jobTitle))];
  const targetLocations = [...new Set(
    activeProfiles.map(p => p.location).filter(Boolean) as string[]
  )];
  const preferRemote = activeProfiles.some(p => p.remote);
  const minMatchScore = Math.min(...activeProfiles.map(p => p.matchTolerance));

  const excludeKeywordsSet = new Set<string>();
  const excludeCompaniesSet = new Set<string>();
  for (const p of activeProfiles) {
    if (p.excludeKeywords) {
      p.excludeKeywords.split(',').map((k: string) => k.trim()).filter(Boolean).forEach((k: string) => excludeKeywordsSet.add(k));
    }
    if (p.excludeCompanies) {
      p.excludeCompanies.split(',').map((k: string) => k.trim()).filter(Boolean).forEach((k: string) => excludeCompaniesSet.add(k));
    }
  }

  const hasAutoSearch = activeProfiles.some(p => p.autoSearch);
  const hasAutoApply = activeProfiles.some(p => p.autoApply);

  await prisma.autoApplyConfig.upsert({
    where: { userId },
    update: {
      enabled: hasAutoSearch || hasAutoApply,
      targetRoles,
      targetLocations,
      preferRemote,
      minMatchScore,
      excludeKeywords: [...excludeKeywordsSet],
      excludeCompanies: [...excludeCompaniesSet],
      scoutEnabled: hasAutoSearch,
      scoutAutoMode: hasAutoSearch,
      archerEnabled: hasAutoApply,
    },
    create: {
      userId,
      enabled: hasAutoSearch || hasAutoApply,
      automationMode: 'autopilot',
      targetRoles,
      targetLocations,
      preferRemote,
      minMatchScore,
      excludeKeywords: [...excludeKeywordsSet],
      excludeCompanies: [...excludeCompaniesSet],
      scoutEnabled: hasAutoSearch,
      scoutAutoMode: hasAutoSearch,
      archerEnabled: hasAutoApply,
    },
  });
}
