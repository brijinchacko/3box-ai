import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { generateCoverLetter } from '@/lib/ai/openrouter';

const { prisma } = require('@/lib/db/prisma');

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });

    const body = await req.json();
    const { resume, jobDescription } = body;

    if (!resume || !jobDescription) {
      return NextResponse.json(
        { error: 'resume and jobDescription are required' },
        { status: 400 },
      );
    }

    const coverLetter = await generateCoverLetter(resume, jobDescription, user?.plan || 'BASIC');

    return NextResponse.json({ coverLetter });
  } catch (error) {
    console.error('[Cover Letter API]', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 },
    );
  }
}
