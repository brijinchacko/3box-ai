import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function GET(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const url = new URL(req.url);
  const phaseId = url.searchParams.get('phaseId');
  const taskStatus = url.searchParams.get('status');
  const category = url.searchParams.get('category');

  const where: any = {};
  if (phaseId) where.phaseId = phaseId;
  if (taskStatus) where.status = taskStatus;
  if (category) where.category = category;

  const tasks = await prisma.marketingTask.findMany({
    where,
    include: { phase: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const body = await req.json();
  const { phaseId, title, description, category, priority, assignee, dueDate } = body;

  if (!phaseId || !title) {
    return NextResponse.json({ error: 'phaseId and title are required' }, { status: 400 });
  }

  const task = await prisma.marketingTask.create({
    data: {
      phaseId,
      title,
      description: description || null,
      category: category || 'seo',
      priority: priority || 'medium',
      assignee: assignee || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const body = await req.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: 'Task id is required' }, { status: 400 });
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === 'completed') {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }
  }
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.assignee !== undefined) updateData.assignee = data.assignee;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

  const task = await prisma.marketingTask.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ task });
}
