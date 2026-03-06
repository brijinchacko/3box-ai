import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const agent = searchParams.get('agent'); // optional filter
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: any = { userId: session.user.id };
    if (agent) where.agent = agent;

    const [activities, total] = await Promise.all([
      prisma.agentActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.agentActivity.count({ where }),
    ]);

    return NextResponse.json({ activities, total });
  } catch (err) {
    console.error('[Agent Activity] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
