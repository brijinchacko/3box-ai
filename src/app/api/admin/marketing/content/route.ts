import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function GET(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const url = new URL(req.url);
  const contentStatus = url.searchParams.get('status');
  const category = url.searchParams.get('category');

  const where: any = {};
  if (contentStatus) where.status = contentStatus;
  if (category) where.category = category;

  const items = await prisma.contentCalendar.findMany({
    where,
    orderBy: { scheduledDate: 'asc' },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const body = await req.json();
  const { title, targetKeyword, keywordDifficulty, category, status: itemStatus, scheduledDate, author, notes } = body;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const item = await prisma.contentCalendar.create({
    data: {
      title,
      targetKeyword: targetKeyword || null,
      keywordDifficulty: keywordDifficulty || 0,
      category: category || 'blog',
      status: itemStatus || 'planned',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      author: author || null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const body = await req.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: 'Content item id is required' }, { status: 400 });
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.targetKeyword !== undefined) updateData.targetKeyword = data.targetKeyword;
  if (data.keywordDifficulty !== undefined) updateData.keywordDifficulty = data.keywordDifficulty;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === 'published') {
      updateData.publishedDate = new Date();
    }
  }
  if (data.scheduledDate !== undefined) updateData.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
  if (data.publishedUrl !== undefined) updateData.publishedUrl = data.publishedUrl;
  if (data.author !== undefined) updateData.author = data.author;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const item = await prisma.contentCalendar.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ item });
}
