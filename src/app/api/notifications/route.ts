/**
 * Notifications API — Aggregates recent events for the notification bell.
 * Pulls from JobApplication activity, email connection status, agent config, etc.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const { prisma } = require('@/lib/db/prisma');

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const notifications: {
    id: string;
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message: string;
    time: string;
    read: boolean;
  }[] = [];

  try {
    // 1. Recent applications (last 24h)
    const recentApps = await prisma.jobApplication.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        jobTitle: true,
        company: true,
        status: true,
        createdAt: true,
        appliedAt: true,
      },
    });

    for (const app of recentApps) {
      if (app.status === 'APPLIED' || app.status === 'SENT') {
        notifications.push({
          id: `app-${app.id}`,
          type: 'success',
          title: 'Application Sent',
          message: `Applied to ${app.jobTitle} at ${app.company}`,
          time: (app.appliedAt || app.createdAt).toISOString(),
          read: false,
        });
      } else if (app.status === 'FAILED') {
        notifications.push({
          id: `app-fail-${app.id}`,
          type: 'error',
          title: 'Application Failed',
          message: `Failed to apply to ${app.jobTitle} at ${app.company}`,
          time: app.createdAt.toISOString(),
          read: false,
        });
      } else if (app.status === 'QUEUED') {
        notifications.push({
          id: `app-queue-${app.id}`,
          type: 'info',
          title: 'Application Queued',
          message: `${app.jobTitle} at ${app.company} is queued for sending`,
          time: app.createdAt.toISOString(),
          read: false,
        });
      }
    }

    // 2. Email connection status
    const emailConnections = await prisma.userEmailConnection.findMany({
      where: { userId, isActive: true },
      select: { provider: true, email: true, tokenExpiry: true },
    });

    if (emailConnections.length === 0) {
      notifications.push({
        id: 'no-email',
        type: 'warning',
        title: 'No Email Connected',
        message: 'Connect your Gmail, Outlook, or SMTP to send applications from your own email address.',
        time: new Date().toISOString(),
        read: false,
      });
    }

    // Check for expiring tokens
    for (const conn of emailConnections) {
      if (new Date(conn.tokenExpiry) < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
        notifications.push({
          id: `token-expiry-${conn.provider}`,
          type: 'warning',
          title: `${conn.provider === 'gmail' ? 'Gmail' : conn.provider === 'outlook' ? 'Outlook' : 'SMTP'} Token Expiring`,
          message: `Your ${conn.email} connection may need to be reconnected soon.`,
          time: new Date().toISOString(),
          read: false,
        });
      }
    }

    // 3. Check user profile completeness
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: { resumeData: true, targetRole: true },
    });

    if (!userProfile?.resumeData) {
      notifications.push({
        id: 'no-resume',
        type: 'warning',
        title: 'Resume Not Uploaded',
        message: 'Upload your resume so AI agents can tailor applications for you.',
        time: new Date().toISOString(),
        read: false,
      });
    }

    if (!userProfile?.targetRole) {
      notifications.push({
        id: 'no-target-role',
        type: 'warning',
        title: 'No Target Role Set',
        message: 'Set your target role in Settings so agents know what jobs to find.',
        time: new Date().toISOString(),
        read: false,
      });
    }

    // 4. Search pipeline status
    const loops = await prisma.searchLoop.findMany({
      where: { userId },
      select: { active: true },
    });

    if (loops.length === 0) {
      notifications.push({
        id: 'no-pipeline',
        type: 'info',
        title: 'No Search Pipeline',
        message: 'Create your first 3BOX pipeline to start auto-applying to jobs.',
        time: new Date().toISOString(),
        read: false,
      });
    }

    // Sort: warnings/errors first, then by time
    notifications.sort((a, b) => {
      const priority = { error: 0, warning: 1, info: 2, success: 3 };
      const pDiff = priority[a.type] - priority[b.type];
      if (pDiff !== 0) return pDiff;
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

    return NextResponse.json({
      notifications: notifications.slice(0, 20),
      unreadCount: notifications.filter(n => !n.read).length,
    });
  } catch (err) {
    console.error('[Notifications] Error:', err);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}
