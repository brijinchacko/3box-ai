import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '5', 10);

  const activities = await prisma.agentActivity.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      agent: true,
      action: true,
      summary: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 20),
  });

  return NextResponse.json({
    activities: activities.map(a => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
