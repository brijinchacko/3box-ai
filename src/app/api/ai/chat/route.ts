import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { coachChat } from '@/lib/ai/openrouter';

const { prisma } = require('@/lib/db/prisma');

export interface ChatContext {
  coachName?: string;
  personality?: string;
  targetRole?: string;
  progress?: number;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export async function POST(req: Request) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });

    const body = await req.json();
    const { message, context } = body as { message?: string; context?: ChatContext };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build context with defaults
    const chatContext: ChatContext = {
      coachName: context?.coachName || 'Horace',
      personality: context?.personality || 'friendly',
      targetRole: context?.targetRole || 'not set',
      progress: context?.progress ?? 0,
      history: context?.history || [],
    };

    const reply = await coachChat(message, chatContext, user?.plan || 'BASIC');

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[AI Chat]', error);
    return NextResponse.json(
      { error: 'AI service temporarily unavailable' },
      { status: 500 }
    );
  }
}
