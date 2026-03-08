import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { generateCareerPlan, extractJSON } from '@/lib/ai/openrouter';
import { getUserContextString } from '@/lib/ai/context';
import { TOKEN_COSTS, canAfford } from '@/lib/tokens/pricing';

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

    // Token check
    const cost = TOKEN_COSTS.career_plan;
    if (!canAfford(user.aiCreditsUsed ?? 0, user.aiCreditsLimit ?? 0, cost)) {
      return NextResponse.json(
        { error: 'Insufficient tokens', code: 'INSUFFICIENT_TOKENS', required: cost, remaining: Math.max(0, (user.aiCreditsLimit ?? 0) - (user.aiCreditsUsed ?? 0)) },
        { status: 402 }
      );
    }

    const body = await req.json();
    const { targetRole, skillScores } = body;

    if (!targetRole || !skillScores) {
      return NextResponse.json(
        { error: 'targetRole and skillScores are required' },
        { status: 400 }
      );
    }

    // Build user context for AI personalization
    const userContext = await getUserContextString(session.user.id);

    let careerPlanData;
    try {
      const aiResponse = await generateCareerPlan(targetRole, skillScores, user.plan, userContext);
      careerPlanData = JSON.parse(extractJSON(aiResponse));
    } catch (aiError) {
      console.warn('[Career Plan] AI generation failed, using demo data:', aiError);
      // Structured demo fallback when AI is unavailable
      careerPlanData = {
        milestones: [
          {
            id: '1',
            title: `${targetRole} Fundamentals`,
            description: `Master the core concepts, tools, and technologies essential for a ${targetRole} role.`,
            skills: Object.keys(skillScores).slice(0, 3),
            duration: '4 weeks',
            status: 'in-progress',
            projects: [
              { id: '1-1', title: `Build a ${targetRole} Portfolio Project`, description: 'Create a foundational project demonstrating core skills.', skills: Object.keys(skillScores).slice(0, 2), difficulty: 'beginner', estimatedHours: 15, status: 'not-started' },
              { id: '1-2', title: 'Technical Documentation', description: 'Write documentation for your project.', skills: ['Communication', 'Documentation'], difficulty: 'beginner', estimatedHours: 5, status: 'not-started' },
            ],
          },
          {
            id: '2',
            title: 'Intermediate Skills & Projects',
            description: `Build on fundamentals with more complex ${targetRole} projects and advanced techniques.`,
            skills: ['Advanced Concepts', 'Problem Solving', 'Collaboration'],
            duration: '6 weeks',
            status: 'upcoming',
            projects: [
              { id: '2-1', title: 'Team Collaboration Project', description: 'Contribute to an open-source or team project.', skills: ['Git', 'Code Review', 'Collaboration'], difficulty: 'intermediate', estimatedHours: 25, status: 'not-started' },
              { id: '2-2', title: 'Technical Blog Series', description: 'Write 3-5 posts about key concepts in your field.', skills: ['Communication', 'Deep Understanding'], difficulty: 'intermediate', estimatedHours: 15, status: 'not-started' },
            ],
          },
          {
            id: '3',
            title: 'Job-Ready Preparation',
            description: 'Prepare for the job market with interview practice, networking, and applications.',
            skills: ['Interview Prep', 'Networking', 'Resume'],
            duration: '4 weeks',
            status: 'upcoming',
            projects: [
              { id: '3-1', title: 'Mock Interview Practice', description: 'Complete 5 mock interviews covering behavioral and technical questions.', skills: ['Communication', 'Problem Solving'], difficulty: 'intermediate', estimatedHours: 10, status: 'not-started' },
              { id: '3-2', title: 'Capstone Portfolio Project', description: 'Build a comprehensive capstone project that showcases all your skills.', skills: ['Full Stack', 'Deployment'], difficulty: 'advanced', estimatedHours: 40, status: 'not-started' },
            ],
          },
        ],
        totalDuration: '14 weeks',
        keyMetrics: { totalProjects: 6, estimatedHours: 110, skillsCovered: Object.keys(skillScores).length },
        _demo: true,
      };
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

    // Deduct tokens
    await prisma.user.update({
      where: { id: session.user.id },
      data: { aiCreditsUsed: { increment: cost } },
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
