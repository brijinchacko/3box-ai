import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/* PATCH /api/agents/chat/:messageId  { feedback: 'up' | 'down' | null } */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { feedback } = await request.json();

    if (feedback !== null && feedback !== 'up' && feedback !== 'down') {
      return NextResponse.json({ error: 'Invalid feedback value' }, { status: 400 });
    }

    const message = await prisma.agentChatMessage.findFirst({
      where: { id: params.messageId, userId: session.user.id },
    });
    if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.agentChatMessage.update({
      where: { id: params.messageId },
      data: { feedback },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Agent Chat] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
