import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function GET() {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const prisma = getPrisma();
  const [subscribers, activeCount, campaigns] = await Promise.all([
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.newsletterSubscriber.count({ where: { active: true } }),
    prisma.newsletterCampaign.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  return NextResponse.json({
    subscribers,
    activeCount,
    totalSubscribers: subscribers.length,
    campaigns,
    emailConfigured: !!process.env.RESEND_API_KEY,
  });
}
