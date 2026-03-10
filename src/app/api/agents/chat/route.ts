import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/* GET /api/agents/chat?agentId=scout&limit=50&before=<ISO> */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    if (!agentId) return NextResponse.json({ error: 'agentId is required' }, { status: 400 });

    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));
    const before = searchParams.get('before');

    const where: any = { userId: session.user.id, agentId };
    if (before) where.createdAt = { lt: new Date(before) };

    const messages = await prisma.agentChatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      messages: messages.reverse().map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        type: m.type,
        data: m.data,
        feedback: m.feedback,
        timestamp: m.createdAt.getTime(),
      })),
      hasMore: messages.length === limit,
    });
  } catch (err) {
    console.error('[Agent Chat] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* POST /api/agents/chat  { agentId, role, content, type?, data? } */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { agentId, role, content, type, data } = body;

    if (!agentId || !role || !content) {
      return NextResponse.json({ error: 'agentId, role, and content are required' }, { status: 400 });
    }

    const message = await prisma.agentChatMessage.create({
      data: {
        userId: session.user.id,
        agentId,
        role,
        content,
        type: type || 'text',
        data: data || undefined,
      },
    });

    return NextResponse.json({
      id: message.id,
      role: message.role,
      content: message.content,
      type: message.type,
      data: message.data,
      feedback: message.feedback,
      timestamp: message.createdAt.getTime(),
    });
  } catch (err) {
    console.error('[Agent Chat] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
