import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { generateCoverLetter } from '@/lib/ai/openrouter';
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
      select: { plan: true, aiCreditsUsed: true, aiCreditsLimit: true },
    });

    // Token check
    const cost = TOKEN_COSTS.cover_letter;
    if (!canAfford(user?.aiCreditsUsed ?? 0, user?.aiCreditsLimit ?? 0, cost)) {
      return NextResponse.json(
        { error: 'Insufficient tokens', code: 'INSUFFICIENT_TOKENS', required: cost, remaining: Math.max(0, (user?.aiCreditsLimit ?? 0) - (user?.aiCreditsUsed ?? 0)) },
        { status: 402 },
      );
    }

    const body = await req.json();
    const { resume, jobDescription } = body;

    if (!resume) {
      return NextResponse.json(
        { error: 'resume is required' },
        { status: 400 },
      );
    }

    // Build user context for AI personalization
    const userContext = await getUserContextString(session.user.id);

    // jobDescription is now optional — when missing, a generic cover letter is generated
    const coverLetter = await generateCoverLetter(resume, jobDescription || '', user?.plan || 'BASIC', userContext);

    // Deduct tokens
    await prisma.user.update({
      where: { id: session.user.id },
      data: { aiCreditsUsed: { increment: cost } },
    });

    return NextResponse.json({ coverLetter });
  } catch (error) {
    console.error('[Cover Letter API]', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 },
    );
  }
}
