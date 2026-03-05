import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const prisma = getPrisma();
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ post });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const prisma = getPrisma();
  const body = await req.json();

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data: any = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.excerpt !== undefined) data.excerpt = body.excerpt;
  if (body.content !== undefined) {
    data.content = body.content;
    data.readTime = Math.max(1, Math.ceil(body.content.split(/\s+/).length / 200));
  }
  if (body.coverImage !== undefined) data.coverImage = body.coverImage;
  if (body.author !== undefined) data.author = body.author;
  if (body.category !== undefined) data.category = body.category;
  if (body.tags !== undefined) data.tags = body.tags;
  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === 'PUBLISHED' && !existing.publishedAt) {
      data.publishedAt = new Date();
    }
  }

  const post = await prisma.blogPost.update({ where: { id }, data });
  return NextResponse.json({ post });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const prisma = getPrisma();
  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
