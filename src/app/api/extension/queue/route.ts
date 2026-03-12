/**
 * Return extension_queue jobs that need browser-based apply.
 * These are Workday/iCIMS/etc. jobs routed to extension_queue by Archer.
 */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const { prisma } = require('@/lib/db/prisma');
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded.extensionAuth) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Get QUEUED jobs that are marked for extension apply
    const queuedJobs = await prisma.jobApplication.findMany({
      where: {
        userId: decoded.userId,
        status: 'QUEUED',
        applicationMethod: { in: ['extension', 'extension_queue'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        jobTitle: true,
        company: true,
        location: true,
        jobUrl: true,
        atsType: true,
        coverLetter: true,
        auditTrail: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ jobs: queuedJobs, total: queuedJobs.length });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }
}
