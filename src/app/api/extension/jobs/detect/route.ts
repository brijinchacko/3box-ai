/**
 * Extension sends scraped job data → we return match score + existing status.
 */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { detectATSType } from '@/lib/ats/router';

const { prisma } = require('@/lib/db/prisma');
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded.extensionAuth) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { jobUrl, jobTitle, company } = body;

    // Check if already applied
    const existing = await prisma.jobApplication.findFirst({
      where: {
        userId: decoded.userId,
        OR: [
          { jobUrl: jobUrl || '' },
          { AND: [{ jobTitle: jobTitle || '' }, { company: company || '' }] },
        ],
      },
      select: { id: true, status: true, appliedAt: true },
    });

    // Detect ATS type
    const atsType = detectATSType(jobUrl || '');

    // Basic match score (would be enhanced with full profile matching)
    let matchScore = 50; // Default
    try {
      const twin = await prisma.careerTwin.findFirst({
        where: { userId: decoded.userId },
        select: { targetRoles: true, skillSnapshot: true },
      });

      if (twin?.targetRoles) {
        const targets = (twin.targetRoles as string[]).map(r => r.toLowerCase());
        const title = (jobTitle || '').toLowerCase();
        const hasMatch = targets.some(t => title.includes(t) || t.includes(title));
        matchScore = hasMatch ? 80 : 40;
      }
    } catch {}

    return NextResponse.json({
      alreadyApplied: !!existing,
      applicationStatus: existing?.status || null,
      applicationId: existing?.id || null,
      atsType,
      matchScore,
    });
  } catch {
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 });
  }
}
