import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const prisma = getPrisma();
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, image: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ticket });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const prisma = getPrisma();
  const body = await req.json();

  const data: any = {};
  if (body.status) data.status = body.status;
  if (body.priority) data.priority = body.priority;

  const ticket = await prisma.supportTicket.update({ where: { id }, data });
  return NextResponse.json({ ticket });
}
