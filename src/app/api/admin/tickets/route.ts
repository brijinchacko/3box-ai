import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function GET(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status') || '';
  const search = url.searchParams.get('search') || '';

  const where: any = {};
  if (statusFilter) where.status = statusFilter;
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [tickets, counts] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.supportTicket.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  const stats = {
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    total: 0,
  };
  counts.forEach((c: any) => {
    stats[c.status as keyof typeof stats] = c._count;
    stats.total += c._count;
  });

  return NextResponse.json({ tickets, stats });
}
