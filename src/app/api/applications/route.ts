import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/applications
 * Returns user's job applications with stats for the Archer dashboard.
 *
 * Query params:
 *   status — filter by status (all | QUEUED | EMAILED | APPLIED | INTERVIEW | OFFER | REJECTED | VIEWED | WITHDRAWN)
 *   page — pagination (default 1)
 *   limit — per page (default 20, max 50)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };
    if (statusFilter !== 'all') {
      where.status = statusFilter;
    }

    // Fetch applications + stats in parallel
    const [applications, total, stats] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          jobTitle: true,
          company: true,
          location: true,
          salaryRange: true,
          matchScore: true,
          status: true,
          appliedAt: true,
          source: true,
          applicationMethod: true,
          atsType: true,
          emailSentTo: true,
          emailConfidence: true,
          coverLetter: true,
          jobUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.jobApplication.count({ where }),
      // Aggregate stats
      Promise.all([
        prisma.jobApplication.count({ where: { userId } }),
        prisma.jobApplication.count({ where: { userId, status: 'QUEUED' } }),
        prisma.jobApplication.count({ where: { userId, status: 'EMAILED' } }),
        prisma.jobApplication.count({ where: { userId, status: 'APPLIED' } }),
        prisma.jobApplication.count({ where: { userId, status: 'INTERVIEW' } }),
        prisma.jobApplication.count({ where: { userId, status: 'OFFER' } }),
        prisma.jobApplication.count({ where: { userId, status: 'REJECTED' } }),
        prisma.jobApplication.count({ where: { userId, applicationMethod: 'ats_api' } }),
        prisma.jobApplication.count({ where: { userId, applicationMethod: 'cold_email' } }),
        prisma.jobApplication.count({ where: { userId, applicationMethod: 'portal' } }),
      ]),
    ]);

    const [totalAll, queued, emailed, applied, interview, offer, rejected, byAtsApi, byColdEmail, byPortal] = stats;

    return NextResponse.json({
      applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        total: totalAll,
        queued,
        emailed,
        applied,
        interview,
        offer,
        rejected,
        byMethod: {
          ats_api: byAtsApi,
          cold_email: byColdEmail,
          portal: byPortal,
        },
      },
    });
  } catch (err) {
    console.error('[API] /api/applications error:', err);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
