import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const { prisma } = require('@/lib/db/prisma');

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only PRO and MAX users can request human support
    if (user.plan !== 'PRO' && user.plan !== 'MAX') {
      return NextResponse.json({ error: 'Upgrade to Pro or Max for human expert access' }, { status: 403 });
    }

    const body = await request.json();
    const { type, targetRole, message } = body;

    if (!type || !message) {
      return NextResponse.json({ error: 'Type and message are required' }, { status: 400 });
    }

    // Log the support request to AuditLog
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SUPPORT_REQUEST',
        details: JSON.stringify({
          type,
          targetRole: targetRole || null,
          message,
          userName: user.name,
          userEmail: user.email,
          userPlan: user.plan,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Your request has been submitted. Our team will reach out within 24-48 hours.',
    });
  } catch (error) {
    console.error('[Support Request]', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}
