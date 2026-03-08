import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const burstId = req.nextUrl.searchParams.get('burstId');
    if (!burstId) {
      return NextResponse.json({ error: 'burstId is required' }, { status: 400 });
    }

    const burst = await prisma.freeAutoApplyBurst.findUnique({
      where: { id: burstId },
    });

    if (!burst) {
      return NextResponse.json({ error: 'Burst not found' }, { status: 404 });
    }

    // Calculate progress percentage
    let progress = 0;
    switch (burst.status) {
      case 'pending': progress = 5; break;
      case 'scanning': progress = 30 + Math.floor(Math.random() * 20); break;
      case 'found': progress = 60; break;
      case 'applying': progress = 60 + Math.floor((burst.jobsApplied / Math.max(burst.jobsFound, 1)) * 35); break;
      case 'completed': progress = 100; break;
    }

    return NextResponse.json({
      burstId: burst.id,
      status: burst.status,
      jobsFound: burst.jobsFound,
      jobsApplied: burst.jobsApplied,
      jobs: burst.jobs || [],
      appliedJobs: burst.appliedJobs || [],
      progress,
    });
  } catch (error) {
    console.error('[free-burst/status] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
