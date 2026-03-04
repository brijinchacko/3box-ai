import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { generateLearningPath } from '@/lib/ai/openrouter';

const { prisma } = require('@/lib/db/prisma');

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });

    const body = await req.json();
    const { targetRole, gaps } = body;

    if (!targetRole || !gaps) {
      return NextResponse.json(
        { error: 'targetRole and gaps are required' },
        { status: 400 }
      );
    }

    const aiResponse = await generateLearningPath(targetRole, gaps, user?.plan || 'BASIC');

    let learningPathData;
    try {
      learningPathData = JSON.parse(aiResponse);
    } catch {
      console.error('[Learning Path] Failed to parse AI response:', aiResponse);
      return NextResponse.json(
        { error: 'Failed to parse learning path from AI' },
        { status: 500 }
      );
    }

    // Find existing learning path for this user + targetRole, or create new
    const existingPath = await prisma.learningPath.findFirst({
      where: {
        userId: session.user.id,
        targetRole,
      },
    });

    const savedPath = await prisma.learningPath.upsert({
      where: {
        id: existingPath?.id || 'nonexistent-id',
      },
      update: {
        modules: learningPathData.modules || [],
        progress: learningPathData.progress || {},
        adaptive: true,
      },
      create: {
        userId: session.user.id,
        targetRole,
        modules: learningPathData.modules || [],
        progress: learningPathData.progress || {},
        adaptive: true,
      },
    });

    return NextResponse.json({
      id: savedPath.id,
      targetRole: savedPath.targetRole,
      ...learningPathData,
    });
  } catch (error) {
    console.error('[Learning Path API]', error);
    return NextResponse.json(
      { error: 'Failed to generate learning path' },
      { status: 500 }
    );
  }
}
