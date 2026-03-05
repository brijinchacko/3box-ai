import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function GET(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const url = new URL(req.url);
  const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1));
  const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

  const kpis = await prisma.marketingKPI.findMany({
    where: { month, year },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ kpis, month, year });
}

export async function POST(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const body = await req.json();
  const { name, category, target, current, unit, period, month, year } = body;

  if (!name || target === undefined || !month || !year) {
    return NextResponse.json({ error: 'name, target, month, year are required' }, { status: 400 });
  }

  const kpi = await prisma.marketingKPI.upsert({
    where: { name_month_year: { name, month, year } },
    update: {
      category: category || 'traffic',
      target,
      current: current || 0,
      unit: unit || 'count',
      period: period || 'monthly',
    },
    create: {
      name,
      category: category || 'traffic',
      target,
      current: current || 0,
      unit: unit || 'count',
      period: period || 'monthly',
      month,
      year,
    },
  });

  return NextResponse.json({ kpi }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const body = await req.json();
  const { id, current, target } = body;

  if (!id) {
    return NextResponse.json({ error: 'KPI id is required' }, { status: 400 });
  }

  const updateData: any = {};
  if (current !== undefined) updateData.current = current;
  if (target !== undefined) updateData.target = target;

  const kpi = await prisma.marketingKPI.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ kpi });
}
