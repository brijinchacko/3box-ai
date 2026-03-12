import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { generateCoverLetter } from '@/lib/ai/openrouter';
import { getUserContextString } from '@/lib/ai/context';
import { checkFeatureGate } from '@/lib/tokens/featureGate';

const { prisma } = require('@/lib/db/prisma');

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gate = await checkFeatureGate(session.user.id);
    if (gate.locked) {
      return NextResponse.json({ error: gate.reason || 'Free plan limit reached. Please upgrade.' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

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

    return NextResponse.json({ coverLetter });
  } catch (error) {
    console.error('[Cover Letter API]', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 },
    );
  }
}
