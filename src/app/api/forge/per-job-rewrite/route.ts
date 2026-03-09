import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { analyzeResumeForJob, generateOptimizedResume } from '@/lib/agents/forge';
import { TOKEN_COSTS, canAfford } from '@/lib/tokens/pricing';

const { prisma } = require('@/lib/db/prisma');

/**
 * POST /api/forge/per-job-rewrite
 * Generate a per-job resume variant tailored to a specific job.
 * Cost: 2 tokens (resume_enhance)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { resumeId, jobTitle, company, jobDescription } = body as {
      resumeId: string;
      jobTitle: string;
      company: string;
      jobDescription: string;
    };

    if (!resumeId || !jobTitle || !company || !jobDescription) {
      return NextResponse.json(
        { error: 'resumeId, jobTitle, company, and jobDescription are required' },
        { status: 400 }
      );
    }

    // ── Token check ──
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiCreditsUsed: true, aiCreditsLimit: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cost = TOKEN_COSTS.resume_enhance; // 2 tokens
    if (!canAfford(user.aiCreditsUsed, user.aiCreditsLimit, cost)) {
      return NextResponse.json(
        { error: `Not enough tokens. Per-job rewrite costs ${cost} tokens. You have ${Math.max(0, user.aiCreditsLimit - user.aiCreditsUsed)} remaining.` },
        { status: 402 }
      );
    }

    // ── Get base resume ──
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const resumeContent = resume.content as any;

    // ── Analyze + Generate variant ──
    const analysis = await analyzeResumeForJob(userId, resumeContent, jobTitle, jobDescription, company);
    const optimizedResume = await generateOptimizedResume(userId, resumeContent, jobTitle, jobDescription, company, analysis);

    // ── Save as ResumeVariant ──
    const variant = await prisma.resumeVariant.create({
      data: {
        resumeId,
        userId,
        jobTitle,
        company,
        content: optimizedResume as any,
        atsScore: analysis.atsScore,
      },
    });

    // ── Deduct tokens ──
    await prisma.user.update({
      where: { id: userId },
      data: { aiCreditsUsed: { increment: cost } },
    });

    // Check auto-approve setting
    const autoConfig = await prisma.autoApplyConfig.findUnique({
      where: { userId },
      select: { perJobAutoApprove: true },
    });

    return NextResponse.json({
      success: true,
      variantId: variant.id,
      variant: {
        ...variant,
        content: optimizedResume,
      },
      analysis: {
        atsScore: analysis.atsScore,
        keywordGaps: analysis.keywordGaps,
        suggestions: analysis.suggestions,
      },
      autoApproved: autoConfig?.perJobAutoApprove ?? false,
      tokensUsed: cost,
      tokensRemaining: Math.max(0, user.aiCreditsLimit - user.aiCreditsUsed - cost),
    });
  } catch (error) {
    console.error('[Forge Per-Job Rewrite] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate per-job variant. Please try again.' },
      { status: 500 }
    );
  }
}
