import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const prisma = getPrisma();
  const body = await req.json();

  const existing = await prisma.marketingTask.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updateData: any = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.status !== undefined) {
    updateData.status = body.status;
    if (body.status === 'completed') {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }
  }
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.assignee !== undefined) updateData.assignee = body.assignee;
  if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const task = await prisma.marketingTask.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ task });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const prisma = getPrisma();
  await prisma.marketingTask.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
