import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const prisma = getPrisma();
  const body = await req.json();

  const existing = await prisma.contentCalendar.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updateData: any = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.targetKeyword !== undefined) updateData.targetKeyword = body.targetKeyword;
  if (body.keywordDifficulty !== undefined) updateData.keywordDifficulty = body.keywordDifficulty;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.status !== undefined) {
    updateData.status = body.status;
    if (body.status === 'published') {
      updateData.publishedDate = new Date();
    }
  }
  if (body.scheduledDate !== undefined) updateData.scheduledDate = body.scheduledDate ? new Date(body.scheduledDate) : null;
  if (body.publishedUrl !== undefined) updateData.publishedUrl = body.publishedUrl;
  if (body.author !== undefined) updateData.author = body.author;
  if (body.notes !== undefined) updateData.notes = body.notes;

  const item = await prisma.contentCalendar.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const prisma = getPrisma();
  await prisma.contentCalendar.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
