import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/* PATCH /api/user/board-jobs/[id] — Update a ScoutJob status */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  // Verify ownership
  const job = await prisma.scoutJob.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  try {
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;

    const updated = await prisma.scoutJob.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ job: updated });
  } catch (err) {
    console.error('[board-jobs/PATCH]', err);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}
