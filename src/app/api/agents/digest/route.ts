import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/agents/digest
 * Returns recent auto-apply digests for the authenticated user.
 * Query params:
 *   - unviewed=true  — only return digests not yet viewed
 *   - limit=N        — limit results (default 10, max 50)
 *
 * Digests are automatically marked as viewed when fetched (unless ?unviewed=true).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unviewedOnly = searchParams.get('unviewed') === 'true';
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 10));

    const where: any = { userId: session.user.id };
    if (unviewedOnly) {
      where.viewed = false;
    }

    const digests = await prisma.autoApplyDigest.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    });

    // Mark fetched digests as viewed
    if (digests.length > 0) {
      const unviewedIds = digests.filter(d => !d.viewed).map(d => d.id);
      if (unviewedIds.length > 0) {
        await prisma.autoApplyDigest.updateMany({
          where: { id: { in: unviewedIds } },
          data: { viewed: true },
        });
      }
    }

    // Get unviewed count for badge display
    const unviewedCount = await prisma.autoApplyDigest.count({
      where: { userId: session.user.id, viewed: false },
    });

    return NextResponse.json({
      digests,
      unviewedCount,
    });
  } catch (err) {
    console.error('[Digest GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
