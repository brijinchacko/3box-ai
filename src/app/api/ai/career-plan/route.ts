import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { generateCareerPlan } from '@/lib/ai/openrouter';

const { prisma } = require('@/lib/db/prisma');

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { targetRole, skillScores } = body;

    if (!targetRole || !skillScores) {
      return NextResponse.json(
        { error: 'targetRole and skillScores are required' },
        { status: 400 }
      );
    }

    const aiResponse = await generateCareerPlan(targetRole, skillScores, user.plan);

    let careerPlanData;
    try {
      careerPlanData = JSON.parse(aiResponse);
    } catch {
      console.error('[Career Plan] Failed to parse AI response:', aiResponse);
      return NextResponse.json(
        { error: 'Failed to parse career plan from AI' },
        { status: 500 }
      );
    }

    // Find existing career plan for this user + targetRole, or create new
    const existingPlan = await prisma.careerPlan.findFirst({
      where: {
        userId: session.user.id,
        targetRole,
      },
    });

    const savedPlan = await prisma.careerPlan.upsert({
      where: {
        id: existingPlan?.id || 'nonexistent-id',
      },
      update: {
        timeline: careerPlanData.totalDuration || careerPlanData.timeline || {},
        milestones: careerPlanData.milestones || [],
        projects: careerPlanData.projects || careerPlanData.milestones?.flatMap((m: any) => m.projects || []) || [],
        status: 'active',
      },
      create: {
        userId: session.user.id,
        targetRole,
        timeline: careerPlanData.totalDuration || careerPlanData.timeline || {},
        milestones: careerPlanData.milestones || [],
        projects: careerPlanData.projects || careerPlanData.milestones?.flatMap((m: any) => m.projects || []) || [],
        status: 'active',
      },
    });

    return NextResponse.json({
      id: savedPlan.id,
      targetRole: savedPlan.targetRole,
      ...careerPlanData,
    });
  } catch (error) {
    console.error('[Career Plan API]', error);
    return NextResponse.json(
      { error: 'Failed to generate career plan' },
      { status: 500 }
    );
  }
}
