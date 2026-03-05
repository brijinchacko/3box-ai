import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const prisma = getPrisma();
  const body = await req.json();
  const { content } = body;

  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  // Verify ticket belongs to user
  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  if (ticket.status === 'closed') {
    return NextResponse.json({ error: 'Ticket is closed' }, { status: 400 });
  }

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      senderId: session.user.id,
      senderRole: 'user',
      content,
    },
  });

  // Re-open if resolved
  if (ticket.status === 'resolved') {
    await prisma.supportTicket.update({
      where: { id },
      data: { status: 'open' },
    });
  }

  return NextResponse.json({ message });
}
