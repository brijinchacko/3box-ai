import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function GET() {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const entries = await prisma.changelog.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const body = await req.json();
  const { title, content, category, version, isPublic, sendToNewsletter } = body;

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
  }

  const entry = await prisma.changelog.create({
    data: {
      title,
      content,
      category: category || 'feature',
      version: version || null,
      isPublic: isPublic !== false,
      sendToNewsletter: sendToNewsletter || false,
      publishedAt: isPublic !== false ? new Date() : null,
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
