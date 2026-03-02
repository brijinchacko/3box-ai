import { NextResponse } from 'next/server';
import { generateAssessmentQuestions, analyzeAssessment } from '@/lib/ai/openrouter';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, targetRole, answers, existingSkills } = body;

    if (action === 'generate') {
      const questions = await generateAssessmentQuestions(targetRole, existingSkills);
      return NextResponse.json({ questions: JSON.parse(questions) });
    }

    if (action === 'analyze') {
      const analysis = await analyzeAssessment(targetRole, answers);
      return NextResponse.json({ analysis: JSON.parse(analysis) });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Assessment API]', error);
    return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 500 });
  }
}
