import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/user/story/:userId
 * Public read-only endpoint — returns a user's story if it exists.
 * Used by the public portfolio page. No authentication required.
 * Does NOT generate stories — only returns existing ones.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { userId } = await params;

    const careerTwin = await prisma.careerTwin.findUnique({
      where: { userId },
      select: { skillSnapshot: true },
    });

    const snap = (careerTwin?.skillSnapshot as any) || {};
    const storyData = snap._story;

    if (!storyData?.text) {
      return NextResponse.json({ story: null }, { status: 404 });
    }

    return NextResponse.json({
      story: storyData.text,
      generatedAt: storyData.generatedAt || null,
    });
  } catch (err) {
    console.error('[Public Story API]', err);
    return NextResponse.json({ story: null }, { status: 500 });
  }
}
