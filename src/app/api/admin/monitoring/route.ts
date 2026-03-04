import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const range = url.searchParams.get('range') || '7d'; // 1d, 7d, 30d, 90d, all

  const now = new Date();
  let since: Date;
  switch (range) {
    case '1d': since = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); break;
    case '7d': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case '30d': since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    case '90d': since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
    default: since = new Date('2020-01-01'); break;
  }

  try {
    // ─── Traffic Analytics ────────────────────
    const [
      totalPageViews,
      uniqueSessions,
      pageViewsByPath,
      pageViewsByCountry,
      pageViewsByDevice,
      pageViewsByBrowser,
      pageViewsByOS,
      topReferrers,
      dailyViews,
    ] = await Promise.all([
      prisma.pageView.count({ where: { createdAt: { gte: since } } }),
      prisma.pageView.groupBy({
        by: ['sessionId'],
        where: { createdAt: { gte: since }, sessionId: { not: null } },
      }).then((r: any[]) => r.length),
      prisma.pageView.groupBy({
        by: ['path'],
        where: { createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { path: 'desc' } },
        take: 20,
      }),
      prisma.pageView.groupBy({
        by: ['country'],
        where: { createdAt: { gte: since }, country: { not: null } },
        _count: true,
        orderBy: { _count: { country: 'desc' } },
        take: 20,
      }),
      prisma.pageView.groupBy({
        by: ['device'],
        where: { createdAt: { gte: since }, device: { not: null } },
        _count: true,
      }),
      prisma.pageView.groupBy({
        by: ['browser'],
        where: { createdAt: { gte: since }, browser: { not: null } },
        _count: true,
        orderBy: { _count: { browser: 'desc' } },
      }),
      prisma.pageView.groupBy({
        by: ['os'],
        where: { createdAt: { gte: since }, os: { not: null } },
        _count: true,
        orderBy: { _count: { os: 'desc' } },
      }),
      prisma.pageView.groupBy({
        by: ['referrer'],
        where: { createdAt: { gte: since }, referrer: { not: null } },
        _count: true,
        orderBy: { _count: { referrer: 'desc' } },
        take: 15,
      }),
      prisma.$queryRaw`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM "PageView"
        WHERE "createdAt" >= ${since}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
    ]);

    // ─── User Analytics ──────────────────────
    const [
      totalUsers,
      newUsers,
      activeUsersToday,
      planDistribution,
      onboardingRate,
      dailySignups,
      usersWithLocation,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.session.groupBy({
        by: ['userId'],
        where: { expires: { gte: now } },
      }).then((r: any[]) => r.length),
      prisma.user.groupBy({ by: ['plan'], _count: true }),
      prisma.user.count({ where: { onboardingDone: true } }),
      prisma.$queryRaw`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM "User"
        WHERE "createdAt" >= ${since}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      // Active users with unique country info from pageviews
      prisma.$queryRaw`
        SELECT country, COUNT(DISTINCT "sessionId")::int as sessions, COUNT(*)::int as views
        FROM "PageView"
        WHERE "createdAt" >= ${since} AND country IS NOT NULL
        GROUP BY country
        ORDER BY sessions DESC
        LIMIT 30
      `,
    ]);

    // ─── Payment & Subscription Analytics ────
    const [
      totalSubscriptions,
      activeSubscriptions,
      subscriptionsByPlan,
      totalRevenue,
      recentSubscriptions,
      creditPurchases,
    ] = await Promise.all([
      prisma.subscription.count({ where: { createdAt: { gte: since } } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.groupBy({
        by: ['plan'],
        where: { status: 'ACTIVE' },
        _count: true,
      }),
      prisma.creditPurchase.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { amountPaid: true },
        _count: true,
      }),
      prisma.subscription.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.creditPurchase.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

    // ─── Platform Health ─────────────────────
    const [
      totalAssessments,
      totalResumes,
      totalCareerPlans,
      totalJobApps,
      totalAiCredits,
      referrals,
      emailStats,
    ] = await Promise.all([
      prisma.assessment.count({ where: { createdAt: { gte: since } } }),
      prisma.resume.count({ where: { createdAt: { gte: since } } }),
      prisma.careerPlan.count({ where: { createdAt: { gte: since } } }),
      prisma.jobApplication.count({ where: { createdAt: { gte: since } } }),
      prisma.user.aggregate({ _sum: { aiCreditsUsed: true } }),
      prisma.referral.count({ where: { createdAt: { gte: since } } }),
      prisma.emailLog.groupBy({
        by: ['status'],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
    ]);

    // ─── SEO / Content ───────────────────────
    const [
      blogPosts,
      topBlogPosts,
      totalBlogViews,
      newsletterSubs,
    ] = await Promise.all([
      prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { views: 'desc' },
        take: 10,
        select: { title: true, slug: true, views: true, publishedAt: true, category: true },
      }),
      prisma.blogPost.aggregate({ _sum: { views: true } }),
      prisma.newsletterSubscriber.count({ where: { active: true } }),
    ]);

    return NextResponse.json({
      range,
      generatedAt: now.toISOString(),

      traffic: {
        totalPageViews,
        uniqueSessions,
        pagesByPath: pageViewsByPath.map((p: any) => ({ path: p.path, views: p._count })),
        byCountry: pageViewsByCountry.map((c: any) => ({ country: c.country, views: c._count })),
        byDevice: pageViewsByDevice.map((d: any) => ({ device: d.device, count: d._count })),
        byBrowser: pageViewsByBrowser.map((b: any) => ({ browser: b.browser, count: b._count })),
        byOS: pageViewsByOS.map((o: any) => ({ os: o.os, count: o._count })),
        topReferrers: topReferrers.map((r: any) => ({ referrer: r.referrer, count: r._count })),
        daily: dailyViews,
      },

      users: {
        total: totalUsers,
        new: newUsers,
        activeToday: activeUsersToday,
        onboarded: onboardingRate,
        onboardingPct: totalUsers > 0 ? Math.round((onboardingRate / totalUsers) * 100) : 0,
        planDistribution: Object.fromEntries(
          planDistribution.map((p: any) => [p.plan, p._count])
        ),
        dailySignups,
        byLocation: usersWithLocation,
      },

      payments: {
        totalSubscriptions,
        activeSubscriptions,
        subscriptionsByPlan: Object.fromEntries(
          subscriptionsByPlan.map((s: any) => [s.plan, s._count])
        ),
        revenue: {
          total: (totalRevenue._sum?.amountPaid || 0) / 100, // cents to dollars
          transactions: totalRevenue._count || 0,
        },
        recentSubscriptions: recentSubscriptions.map((s: any) => ({
          plan: s.plan,
          status: s.status,
          interval: s.interval,
          user: s.user?.email || 'Unknown',
          date: s.createdAt,
        })),
        creditPurchases: creditPurchases.map((c: any) => ({
          credits: c.credits,
          amount: c.amountPaid / 100,
          user: c.user?.email || 'Unknown',
          date: c.createdAt,
        })),
      },

      platform: {
        assessments: totalAssessments,
        resumes: totalResumes,
        careerPlans: totalCareerPlans,
        jobApplications: totalJobApps,
        totalAiCreditsUsed: totalAiCredits._sum?.aiCreditsUsed || 0,
        referrals,
        emails: Object.fromEntries(
          emailStats.map((e: any) => [e.status, e._count])
        ),
      },

      seo: {
        publishedPosts: blogPosts,
        totalBlogViews: totalBlogViews._sum?.views || 0,
        newsletterSubscribers: newsletterSubs,
        topPosts: topBlogPosts,
        // Basic SEO checklist
        checklist: {
          sslEnabled: true,
          sitemapExists: true,
          robotsTxt: true,
          metaTagsConfigured: true,
          openGraphTags: true,
          structuredData: false,
          pageSpeedOptimized: true,
          mobileResponsive: true,
        },
      },
    });
  } catch (error) {
    console.error('[Admin Monitoring]', error);
    return NextResponse.json({ error: 'Failed to fetch monitoring data' }, { status: 500 });
  }
}
