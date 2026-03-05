import { NextResponse } from 'next/server';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function GET() {
  const prisma = getPrisma();
  const entries = await prisma.changelog.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      version: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ entries });
}
