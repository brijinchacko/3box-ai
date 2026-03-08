import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

export async function GET(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
  const search = url.searchParams.get('search') || '';
  const statusFilter = url.searchParams.get('status') || '';

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (statusFilter) {
    where.status = statusFilter;
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const body = await req.json();
  const { title, excerpt, content, coverImage, author, category, tags, status: postStatus } = body;

  if (!title || !excerpt || !content) {
    return NextResponse.json({ error: 'Title, excerpt, and content are required' }, { status: 400 });
  }

  let slug = slugify(title);
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const post = await prisma.blogPost.create({
    data: {
      slug,
      title,
      excerpt,
      content,
      coverImage: coverImage || null,
      author: author || 'jobTED AI Team',
      category: category || 'career-tips',
      tags: tags || [],
      status: postStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
      publishedAt: postStatus === 'PUBLISHED' ? new Date() : null,
      readTime: Math.max(1, Math.ceil(content.split(/\s+/).length / 200)),
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
