import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { sendEmail } from '@/lib/email';

const { prisma } = require('@/lib/db/prisma');

const ADMIN_EMAIL = 'nishinthdemo97@gmail.com';

// GET /api/tickets — Fetch current user's tickets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({
      tickets: tickets.map((ticket: any) => ({
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        messageCount: ticket._count.messages,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// POST /api/tickets — Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, category, priority, message } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!message || message.trim().length < 20) {
      return NextResponse.json(
        { error: 'Message must be at least 20 characters' },
        { status: 400 }
      );
    }

    const validCategories = ['general', 'bug', 'feature', 'billing', 'account'];
    const validPriorities = ['low', 'medium', 'high'];

    const ticketCategory = validCategories.includes(category) ? category : 'general';
    const ticketPriority = validPriorities.includes(priority) ? priority : 'medium';

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject: subject.trim(),
        category: ticketCategory,
        priority: ticketPriority,
        messages: {
          create: {
            senderId: session.user.id,
            senderRole: 'user',
            content: message.trim(),
          },
        },
      },
      include: {
        messages: true,
      },
    });

    // Send notification email to admin (non-blocking)
    const userName = session.user.name || session.user.email || 'Unknown';
    const userEmail = session.user.email || '';
    const priorityBadge = ticketPriority === 'high' ? '🔴 HIGH' : ticketPriority === 'medium' ? '🟡 MEDIUM' : '🟢 LOW';
    const categoryLabel = ticketCategory === 'bug' ? 'Bug Report' : ticketCategory === 'feature' ? 'Feature Request' : 'General Feedback';
    // Strip base64 images from email content (too large for email)
    const cleanMessage = message.trim().replace(/data:image\/[^;]+;base64,[^\s]+/g, '[Screenshot attached — view in admin panel]');

    sendEmail({
      to: ADMIN_EMAIL,
      subject: `[3BOX Support] ${priorityBadge} ${categoryLabel}: ${subject.trim()}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
          <h2 style="color:#f59e0b;margin:0 0 16px;">New ${categoryLabel}</h2>
          <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
            <tr><td style="padding:6px 12px;color:#94a3b8;font-size:13px;">From</td><td style="padding:6px 12px;color:#f8fafc;font-size:13px;">${userName} (${userEmail})</td></tr>
            <tr><td style="padding:6px 12px;color:#94a3b8;font-size:13px;">Priority</td><td style="padding:6px 12px;font-size:13px;">${priorityBadge}</td></tr>
            <tr><td style="padding:6px 12px;color:#94a3b8;font-size:13px;">Category</td><td style="padding:6px 12px;color:#f8fafc;font-size:13px;">${categoryLabel}</td></tr>
            <tr><td style="padding:6px 12px;color:#94a3b8;font-size:13px;">Ticket ID</td><td style="padding:6px 12px;color:#f8fafc;font-size:13px;">${ticket.id}</td></tr>
          </table>
          <div style="background:#1e293b;border-radius:8px;padding:16px;margin:0 0 16px;">
            <p style="margin:0 0 8px;font-weight:600;color:#f8fafc;">${subject.trim()}</p>
            <p style="margin:0;color:#cbd5e1;font-size:14px;white-space:pre-wrap;">${cleanMessage.slice(0, 1000)}</p>
          </div>
          <a href="https://3box.ai/admin/support/${ticket.id}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">View in Admin Panel</a>
          <p style="margin:16px 0 0;color:#475569;font-size:12px;">— 3BOX AI Support System</p>
        </div>
      `,
    }).catch((err) => {
      console.error('[Ticket] Failed to send admin notification:', err);
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
