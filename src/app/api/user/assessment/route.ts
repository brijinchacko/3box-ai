import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const { prisma } = require('@/lib/db/prisma');

/**
 * POST /api/user/assessment — Save assessment results to database
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      targetRole,
      questions,
      answers,
      skillScores,
      overallScore,
      marketReadiness,
      hireProbability,
      aiAnalysis,
    } = body;

    if (!targetRole) {
      return NextResponse.json({ error: 'Target role is required' }, { status: 400 });
    }

    // Save assessment to database
    const assessment = await prisma.assessment.create({
      data: {
        userId: session.user.id,
        targetRole,
        status: 'COMPLETED',
        questions: questions || [],
        answers: answers || [],
        skillScores: skillScores || [],
        aiAnalysis: {
          ...aiAnalysis,
          overallScore,
          marketReadiness,
          hireProbability,
        },
      },
    });

    // Update CareerTwin with latest scores
    if (overallScore !== undefined || marketReadiness !== undefined || hireProbability !== undefined) {
      await prisma.careerTwin.updateMany({
        where: { userId: session.user.id },
        data: {
          ...(marketReadiness !== undefined && { marketReadiness: Number(marketReadiness) }),
          ...(hireProbability !== undefined && { hireProb: Number(hireProbability) }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      assessmentId: assessment.id,
      overallScore,
    });
  } catch (error) {
    console.error('[Save Assessment]', error);
    return NextResponse.json({ error: 'Failed to save assessment' }, { status: 500 });
  }
}

/**
 * GET /api/user/assessment — Get latest completed assessment score
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const assessment = await prisma.assessment.findFirst({
      where: {
        userId: session.user.id,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        targetRole: true,
        skillScores: true,
        aiAnalysis: true,
        createdAt: true,
      },
    });

    if (!assessment) {
      return NextResponse.json({ hasAssessment: false, overallScore: null });
    }

    const analysis = assessment.aiAnalysis as Record<string, unknown> | null;
    const overallScore = analysis?.overallScore as number | null;

    return NextResponse.json({
      hasAssessment: true,
      overallScore: overallScore ?? null,
      targetRole: assessment.targetRole,
      skillScores: assessment.skillScores,
      assessmentDate: assessment.createdAt,
    });
  } catch (error) {
    console.error('[Get Assessment]', error);
    return NextResponse.json({ error: 'Failed to fetch assessment' }, { status: 500 });
  }
}
