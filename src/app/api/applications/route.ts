import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { prepareInterview } from '@/lib/agents/atlas';

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

    // Fetch applications + stats in parallel using groupBy instead of 10 separate counts
    const [applications, total, statusGroups, methodGroups] = await Promise.all([
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
      // Single groupBy for all status counts (replaces 7 separate COUNT queries)
      prisma.jobApplication.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      // Single groupBy for method counts (replaces 3 separate COUNT queries)
      prisma.jobApplication.groupBy({
        by: ['applicationMethod'],
        where: { userId },
        _count: true,
      }),
    ]);

    // Build stats from groupBy results
    const statusMap: Record<string, number> = {};
    for (const g of statusGroups) statusMap[g.status] = g._count;
    const methodMap: Record<string, number> = {};
    for (const g of methodGroups) methodMap[g.applicationMethod || 'unknown'] = g._count;
    const totalAll = Object.values(statusMap).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        total: totalAll,
        queued: statusMap['QUEUED'] || 0,
        emailed: statusMap['EMAILED'] || 0,
        applied: statusMap['APPLIED'] || 0,
        interview: statusMap['INTERVIEW'] || 0,
        offer: statusMap['OFFER'] || 0,
        rejected: statusMap['REJECTED'] || 0,
        byMethod: {
          ats_api: methodMap['ats_api'] || 0,
          cold_email: methodMap['cold_email'] || 0,
          portal: methodMap['portal'] || 0,
        },
      },
    });
  } catch (err) {
    console.error('[API] /api/applications error:', err);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

/**
 * PATCH /api/applications
 * Update a job application's status. Auto-triggers interview prep when status → INTERVIEW.
 *
 * Body: { id: string, status: string, notes?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.jobApplication.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status };
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: updateData,
    });

    // Auto-trigger interview prep when status changes to INTERVIEW
    if (status === 'INTERVIEW' && existing.status !== 'INTERVIEW') {
      // Fire-and-forget: generate interview prep in the background
      const resume = await prisma.resume.findFirst({
        where: { userId },
        select: { content: true },
      });
      const skills = resume?.content && typeof resume.content === 'object'
        ? ((resume.content as any).skills || []).map((s: any) => typeof s === 'string' ? s : s.name || '')
        : [];

      prepareInterview(
        userId,
        existing.jobTitle,
        existing.company,
        '', // job description not stored on JobApplication
        skills.length > 0 ? skills : ['General skills'],
      ).then(() => {
        return prisma.agentActivity.create({
          data: {
            userId,
            agent: 'atlas',
            action: 'auto_interview_prep',
            summary: `Auto-generated interview prep for ${existing.company} — ${existing.jobTitle}`,
            details: { company: existing.company, jobTitle: existing.jobTitle, trigger: 'status_change_to_interview' },
          },
        });
      }).catch((err) => {
        console.error('[Atlas] Auto interview prep failed for JobApplication:', err);
      });
    }

    return NextResponse.json({ application: updated });
  } catch (err) {
    console.error('[API] /api/applications PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
