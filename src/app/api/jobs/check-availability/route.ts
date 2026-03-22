import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/jobs/check-availability
 *
 * Checks whether a ScoutJob listing is still live by doing a HEAD request
 * to the original job URL. Updates the ScoutJob status accordingly.
 *
 * Body: { jobId: string }
 * Returns: { available: boolean, status: string }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await request.json();
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Fetch the ScoutJob (must belong to this user)
    const scoutJob = await prisma.scoutJob.findFirst({
      where: { id: jobId, userId: session.user.id },
      select: { id: true, jobUrl: true, status: true },
    });

    if (!scoutJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // HEAD request with 10-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let available = false;
    let status = 'EXPIRED';

    try {
      const res = await fetch(scoutJob.jobUrl, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; 3BOX-JobCheck/1.0; +https://3box.ai)',
        },
      });

      if (res.status === 200 || res.status === 301 || res.status === 302) {
        available = true;
        status = 'ACTIVE';
      }
      // 404/410 or any other status -> EXPIRED
    } catch {
      // Network error or timeout -> EXPIRED
    } finally {
      clearTimeout(timeout);
    }

    // Update ScoutJob status if expired
    if (!available && scoutJob.status !== 'EXPIRED') {
      await prisma.scoutJob.update({
        where: { id: scoutJob.id },
        data: { status: 'EXPIRED' },
      });
    }

    return NextResponse.json({ available, status });
  } catch (error) {
    console.error('[check-availability] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
