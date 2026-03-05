import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, status, user } = await requireAdmin();
  if (error || !user) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const prisma = getPrisma();
  const body = await req.json();
  const { content } = body;

  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      senderId: user.id,
      senderRole: 'admin',
      content,
    },
  });

  // Auto-update status to in_progress if currently open
  if (ticket.status === 'open') {
    await prisma.supportTicket.update({
      where: { id },
      data: { status: 'in_progress' },
    });
  }

  return NextResponse.json({ message });
}
