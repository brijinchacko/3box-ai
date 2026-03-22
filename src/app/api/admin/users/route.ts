import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const { prisma } = require('@/lib/db/prisma');

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') || '';
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (plan && ['FREE', 'PRO', 'MAX'].includes(plan)) {
      where.plan = plan;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          plan: true,
          createdAt: true,
          updatedAt: true,
          onboardingDone: true,
          aiCreditsUsed: true,
          aiCreditsLimit: true,
          totalAppsUsed: true,
          dailyAppsUsed: true,
          isOforoInternal: true,
          isStudent: true,
          stripeCustomerId: true,
          referralCode: true,
          referredBy: true,
          accounts: {
            select: { provider: true },
          },
          _count: {
            select: {
              assessments: true,
              resumes: true,
              careerPlans: true,
              learningPaths: true,
              jobApplications: true,
              scoutJobs: true,
              agentActivities: true,
              auditLogs: true,
              searchProfiles: true,
              subscriptions: true,
              creditPurchases: true,
              emailConnections: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Enrich users with signup source and revenue data
    const userIds = users.map((u: any) => u.id);

    // Batch fetch revenue data (subscriptions + credit purchases)
    const [subscriptions, creditPurchases] = await Promise.all([
      prisma.subscription.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, plan: true, status: true, interval: true },
      }),
      prisma.creditPurchase.aggregate({
        where: { userId: { in: userIds } },
        _sum: { amountPaid: true },
        _count: true,
      }),
    ]);

    // Per-user revenue via credit purchases
    const perUserRevenue = await prisma.creditPurchase.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _sum: { amountPaid: true },
      _count: true,
    });
    const revenueMap = new Map(
      perUserRevenue.map((r: any) => [r.userId, { total: (r._sum.amountPaid || 0) / 100, count: r._count }])
    );

    // Subscription map
    const subMap = new Map<string, any[]>();
    for (const sub of subscriptions) {
      if (!subMap.has(sub.userId)) subMap.set(sub.userId, []);
      subMap.get(sub.userId)!.push(sub);
    }

    const enrichedUsers = users.map((u: any) => ({
      ...u,
      signupSource: u.accounts.length > 0 ? u.accounts.map((a: any) => a.provider).join(', ') : 'credentials',
      revenue: revenueMap.get(u.id) || { total: 0, count: 0 },
      subscriptions: subMap.get(u.id) || [],
    }));

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin Users]', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
