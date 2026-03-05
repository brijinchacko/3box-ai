import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const { prisma } = require('@/lib/db/prisma');

/**
 * POST /api/portfolio/publish
 * Set the user's portfolio to public (isPublic = true).
 * Returns the public URL slug.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find existing portfolio
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: session.user.id },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: 'No portfolio found. Please save your portfolio first.' },
        { status: 404 }
      );
    }

    // Set isPublic = true
    const updated = await prisma.portfolio.update({
      where: { id: portfolio.id },
      data: { isPublic: true },
      select: {
        id: true,
        slug: true,
        isPublic: true,
      },
    });

    return NextResponse.json({
      success: true,
      slug: updated.slug,
      publicUrl: `/p/${updated.slug}`,
    });
  } catch (error) {
    console.error('Error publishing portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to publish portfolio' },
      { status: 500 }
    );
  }
}
