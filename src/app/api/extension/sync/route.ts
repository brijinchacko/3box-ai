/**
 * Sync applied jobs from Chrome Extension back to dashboard.
 * Creates JobApplication records when the extension successfully applies.
 */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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
    const { jobTitle, company, location, jobUrl, source, applicationMethod, atsType, coverLetter } = body;

    if (!jobTitle || !company) {
      return NextResponse.json({ error: 'jobTitle and company are required' }, { status: 400 });
    }

    // Check for duplicate
    const existing = await prisma.jobApplication.findFirst({
      where: { userId: decoded.userId, jobUrl, company },
    });

    if (existing) {
      return NextResponse.json({ message: 'Already tracked', applicationId: existing.id });
    }

    const application = await prisma.jobApplication.create({
      data: {
        userId: decoded.userId,
        jobTitle,
        company,
        location: location || null,
        jobUrl: jobUrl || null,
        source: source || 'extension',
        status: 'APPLIED',
        applicationMethod: applicationMethod || 'extension',
        atsType: atsType || 'generic',
        coverLetter: coverLetter || null,
        appliedAt: new Date(),
        auditTrail: { appliedVia: 'chrome_extension', timestamp: new Date().toISOString() },
      },
    });

    // Consume application slot
    try {
      const { consumeApplicationSlot } = require('@/lib/tokens/dailyCap');
      await consumeApplicationSlot(decoded.userId);
    } catch {}

    return NextResponse.json({ success: true, applicationId: application.id });
  } catch (err) {
    console.error('[Extension Sync] Error:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
