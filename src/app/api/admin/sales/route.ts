import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Monthly price in USD for each plan tier
const PLAN_PRICE: Record<string, number> = {
  FREE: 0,
  PRO: 29,
  MAX: 59,
};

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // ─── Fetch all commerce data in parallel ──────
    const [
      activeSubs,
      canceledSubs,
      pastDueSubs,
      newSubsThisMonth,
      newSubsLastMonth,
      canceledThisMonth,
      totalCreditRevenue,
      creditRevenueThisMonth,
      recentSubs,
      recentPurchases,
      allActiveSubsByPlan,
      totalUsers,
      paidUsers,
      freeUsers,
      usersThisMonth,
      subsThisMonth,
      trialStartedThisMonth,
    ] = await Promise.all([
      // Active subscriptions
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, plan: true, interval: true, currentPeriodEnd: true, cancelAtPeriodEnd: true, createdAt: true },
      }),
      // Canceled subscriptions (for churn)
      prisma.subscription.count({ where: { status: 'CANCELED' } }),
      // Past due
      prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
      // New subs this month
      prisma.subscription.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      // New subs last month
      prisma.subscription.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } } }),
      // Canceled this month
      prisma.subscription.count({
        where: {
          status: 'CANCELED',
          updatedAt: { gte: startOfThisMonth },
        },
      }),
      // Lifetime credit purchase revenue
      prisma.creditPurchase.aggregate({ _sum: { amountPaid: true }, _count: true }),
      // Credit revenue this month
      prisma.creditPurchase.aggregate({
        _sum: { amountPaid: true },
        _count: true,
        where: { createdAt: { gte: startOfThisMonth } },
      }),
      // Recent subscriptions (last 20)
      prisma.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true, plan: true, status: true, interval: true, createdAt: true,
          currentPeriodEnd: true, cancelAtPeriodEnd: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      // Recent credit purchases (last 20)
      prisma.creditPurchase.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true, credits: true, amountPaid: true, createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      // Active subs by plan
      prisma.subscription.groupBy({
        by: ['plan', 'interval'],
        where: { status: 'ACTIVE' },
        _count: true,
      }),
      // Total users for conversion rate
      prisma.user.count(),
      // Paid users (PRO or MAX plan)
      prisma.user.count({ where: { plan: { in: ['PRO', 'MAX'] } } }),
      // Free users
      prisma.user.count({ where: { plan: 'FREE' } }),
      // New users this month
      prisma.user.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      // Subs this month (for funnel)
      prisma.subscription.count({ where: { createdAt: { gte: startOfThisMonth }, status: { in: ['ACTIVE', 'TRIALING'] } } }),
      // Trial starts this month
      prisma.subscription.count({ where: { createdAt: { gte: startOfThisMonth } } }),
    ]);

    // ─── MRR Calculation ──────────────────────
    // MRR = Sum of (monthly price × qty). Annual plans divide by 12.
    let mrrCents = 0;
    let arrCents = 0;
    for (const sub of activeSubs) {
      const monthly = PLAN_PRICE[sub.plan] || 0;
      if (sub.interval === 'year') {
        // Annual billing — normalize to monthly (same plan price / 12)
        // Assume annual plan gets 20% discount on 12x monthly (typical)
        const annualPrice = monthly * 12 * 0.8;
        mrrCents += Math.round((annualPrice * 100) / 12);
        arrCents += annualPrice * 100;
      } else {
        mrrCents += monthly * 100;
        arrCents += monthly * 12 * 100;
      }
    }

    // ─── Churn Rate ───────────────────────────
    // Churn % = canceled this month / (active at start of month) × 100
    const activeAtStartOfMonth = activeSubs.length + canceledThisMonth;
    const churnRate = activeAtStartOfMonth > 0
      ? (canceledThisMonth / activeAtStartOfMonth) * 100
      : 0;

    // ─── Conversion Rate ──────────────────────
    // Conversion = Paid / Total users × 100
    const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;

    // ─── Growth Rate ──────────────────────────
    // Month-over-month new subs growth
    const growthRate = newSubsLastMonth > 0
      ? ((newSubsThisMonth - newSubsLastMonth) / newSubsLastMonth) * 100
      : newSubsThisMonth > 0 ? 100 : 0;

    // ─── Plan Distribution of Active Subs ─────
    const activeByPlan: Record<string, { monthly: number; yearly: number; total: number; mrr: number }> = {
      PRO: { monthly: 0, yearly: 0, total: 0, mrr: 0 },
      MAX: { monthly: 0, yearly: 0, total: 0, mrr: 0 },
    };
    for (const row of allActiveSubsByPlan) {
      if (!activeByPlan[row.plan]) activeByPlan[row.plan] = { monthly: 0, yearly: 0, total: 0, mrr: 0 };
      if (row.interval === 'year') activeByPlan[row.plan].yearly += row._count;
      else activeByPlan[row.plan].monthly += row._count;
      activeByPlan[row.plan].total += row._count;
      const basePrice = PLAN_PRICE[row.plan] || 0;
      if (row.interval === 'year') {
        activeByPlan[row.plan].mrr += (basePrice * 12 * 0.8 / 12) * row._count;
      } else {
        activeByPlan[row.plan].mrr += basePrice * row._count;
      }
    }

    // ─── Revenue Trend (Last 30 Days) ─────────
    const dailyRevenueRaw: any[] = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as date,
        SUM("amountPaid")::int as revenue_cents,
        COUNT(*)::int as transactions
      FROM "CreditPurchase"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Daily new subs (last 30 days)
    const dailySubs: any[] = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as date,
        COUNT(*)::int as count
      FROM "Subscription"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // ─── Subscription Status Breakdown ─────────
    const subStatusBreakdown = await prisma.subscription.groupBy({
      by: ['status'],
      _count: true,
    });

    // ─── Recent Revenue Events ────────────────
    // Combine recent subs + credit purchases for a timeline
    const recentRevenueEvents: any[] = [
      ...recentSubs.map((s: any) => ({
        type: 'subscription' as const,
        id: s.id,
        date: s.createdAt,
        amount: s.interval === 'year'
          ? (PLAN_PRICE[s.plan] || 0) * 12 * 0.8
          : (PLAN_PRICE[s.plan] || 0),
        plan: s.plan,
        interval: s.interval,
        status: s.status,
        user: s.user,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
      })),
      ...recentPurchases.map((p: any) => ({
        type: 'credit' as const,
        id: p.id,
        date: p.createdAt,
        amount: p.amountPaid / 100,
        credits: p.credits,
        user: p.user,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30);

    // ─── Funnel ──────────────────────────────
    const funnel = {
      visitors: totalUsers, // signed-up users, can't track anonymous w/o analytics
      signups: usersThisMonth,
      trials: trialStartedThisMonth,
      paid: newSubsThisMonth,
    };

    return NextResponse.json({
      // Key metrics
      mrr: mrrCents / 100,
      arr: arrCents / 100,
      churnRate: Number(churnRate.toFixed(2)),
      conversionRate: Number(conversionRate.toFixed(2)),
      growthRate: Number(growthRate.toFixed(2)),

      // User/sub counts
      totalUsers,
      paidUsers,
      freeUsers,
      activeSubscriptions: activeSubs.length,
      canceledSubscriptions: canceledSubs,
      pastDueSubscriptions: pastDueSubs,

      // This month stats
      thisMonth: {
        newSubs: newSubsThisMonth,
        canceledSubs: canceledThisMonth,
        creditRevenue: (creditRevenueThisMonth._sum?.amountPaid || 0) / 100,
        creditTransactions: creditRevenueThisMonth._count || 0,
        newUsers: usersThisMonth,
      },

      // Lifetime
      lifetime: {
        creditRevenue: (totalCreditRevenue._sum?.amountPaid || 0) / 100,
        creditTransactions: totalCreditRevenue._count || 0,
      },

      // Breakdown
      activeByPlan,
      subStatusBreakdown: Object.fromEntries(subStatusBreakdown.map((s: any) => [s.status, s._count])),

      // Charts
      dailyRevenue: dailyRevenueRaw.map((r: any) => ({
        date: r.date,
        revenue: (r.revenue_cents || 0) / 100,
        transactions: r.transactions || 0,
      })),
      dailySubs: dailySubs.map((r: any) => ({ date: r.date, count: r.count })),

      // Event stream
      recentEvents: recentRevenueEvents,

      // Funnel
      funnel,

      // Comparisons
      comparison: {
        newSubsThisMonth,
        newSubsLastMonth,
      },
    });
  } catch (error) {
    console.error('[Admin Sales]', error);
    return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 });
  }
}
