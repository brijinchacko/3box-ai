import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobs = await prisma.scoutJob.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      source: true,
      matchScore: true,
      jobUrl: true,
      discoveredAt: true,
      appliedAt: true,
      status: true,
    },
    orderBy: { discoveredAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({ jobs });
}
