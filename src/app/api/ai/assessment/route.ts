import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { generateAssessmentQuestions, analyzeAssessment, extractJSON, type PlanTier } from '@/lib/ai/openrouter';

const { prisma } = require('@/lib/db/prisma');

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    let userPlan: PlanTier = 'BASIC';
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
      if (user) userPlan = user.plan;
    }

    const body = await req.json();
    const { action, targetRole, answers, existingSkills } = body;

    if (action === 'generate') {
      const questions = await generateAssessmentQuestions(targetRole, existingSkills, userPlan);
      return NextResponse.json({ questions: JSON.parse(extractJSON(questions)) });
    }

    if (action === 'analyze') {
      const analysis = await analyzeAssessment(targetRole, answers, userPlan);
      return NextResponse.json({ analysis: JSON.parse(extractJSON(analysis)) });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Assessment API]', error);
    return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 500 });
  }
}
