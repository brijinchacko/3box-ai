import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function GET(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [phases, kpis, contentItems, taskStats] = await Promise.all([
    prisma.marketingPhase.findMany({
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.marketingKPI.findMany({
      where: { month: currentMonth, year: currentYear },
      orderBy: { name: 'asc' },
    }),
    prisma.contentCalendar.findMany({
      orderBy: { scheduledDate: 'asc' },
      take: 50,
    }),
    prisma.marketingTask.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ]);

  const totalTasks = taskStats.reduce((sum: number, s: any) => sum + s._count.id, 0);
  const completedTasks = taskStats.find((s: any) => s.status === 'completed')?._count?.id || 0;
  const inProgressTasks = taskStats.find((s: any) => s.status === 'in_progress')?._count?.id || 0;

  const publishedContent = contentItems.filter((c: any) => c.status === 'published').length;

  return NextResponse.json({
    phases,
    kpis,
    contentItems,
    stats: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      publishedContent,
      totalContent: contentItems.length,
      overallProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
  });
}
