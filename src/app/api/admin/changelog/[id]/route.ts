import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const prisma = getPrisma();
  const body = await req.json();

  const entry = await prisma.changelog.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.version !== undefined && { version: body.version }),
      ...(body.isPublic !== undefined && { isPublic: body.isPublic, publishedAt: body.isPublic ? new Date() : null }),
    },
  });

  return NextResponse.json({ entry });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const prisma = getPrisma();
  await prisma.changelog.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
