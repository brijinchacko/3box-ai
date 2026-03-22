import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { prepareInterview } from '@/lib/agents/atlas';

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
  const userId = session.user.id;

  // Verify ownership
  const job = await prisma.scoutJob.findFirst({
    where: { id, userId },
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

    // Auto-trigger interview prep when status changes to INTERVIEW
    if (body.status === 'INTERVIEW' && job.status !== 'INTERVIEW') {
      // Fire-and-forget: generate interview prep in the background
      const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const resume = await prisma.resume.findFirst({
        where: { userId },
        select: { content: true },
      });
      const skills = resume?.content && typeof resume.content === 'object'
        ? ((resume.content as any).skills || []).map((s: any) => typeof s === 'string' ? s : s.name || '')
        : [];

      prepareInterview(
        userId,
        job.title,
        job.company,
        job.description || '',
        skills.length > 0 ? skills : ['General skills'],
      ).then(() => {
        // Log auto-trigger activity
        return prisma.agentActivity.create({
          data: {
            userId,
            agent: 'atlas',
            action: 'auto_interview_prep',
            summary: `Auto-generated interview prep for ${job.company} — ${job.title}`,
            details: { company: job.company, jobTitle: job.title, trigger: 'status_change_to_interview' },
          },
        });
      }).catch((err) => {
        console.error('[Atlas] Auto interview prep failed for ScoutJob:', err);
      });
    }

    return NextResponse.json({ job: updated });
  } catch (err) {
    console.error('[board-jobs/PATCH]', err);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}
