import { NextResponse } from 'next/server';
import { coachChat } from '@/lib/ai/openrouter';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Rate limiting check (simplified — use Redis in production)
    // TODO: Implement proper rate limiting with Redis

    const response = await coachChat(message, context || {});

    return NextResponse.json({ response });
  } catch (error) {
    console.error('[AI Chat]', error);
    return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 500 });
  }
}
