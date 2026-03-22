import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/jobs/report-scam — Report a Scout job as a suspected scam
 *
 * Sets scamScore to 100 and status to SKIPPED, creates an AuditLog entry.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { jobId, reason } = body as { jobId: string; reason?: string };

    if (!jobId) {
      return NextResponse.json({ error: 'Missing required field: jobId' }, { status: 400 });
    }

    // Verify job belongs to this user
    const job = await prisma.scoutJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Update scamScore and status
    await prisma.scoutJob.update({
      where: { id: jobId },
      data: { scamScore: 100, status: 'SKIPPED' },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SCAM_REPORT',
        details: {
          jobId,
          jobTitle: job.title,
          company: job.company,
          reason: reason || null,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[report-scam] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
