import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const { prisma } = require('@/lib/db/prisma');

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      planCounts,
      totalAssessments,
      totalCareerPlans,
      totalResumes,
      totalSubscriptions,
      activeSubscriptions,
      totalReferrals,
      totalBlogPosts,
      blogViews,
      newsletterSubs,
      recentUsers,
      aiCreditsUsed,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.groupBy({ by: ['plan'], _count: true }),
      prisma.assessment.count(),
      prisma.careerPlan.count(),
      prisma.resume.count(),
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.referral.count(),
      prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
      prisma.blogPost.aggregate({ _sum: { views: true } }),
      prisma.newsletterSubscriber.count({ where: { active: true } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          createdAt: true,
          onboardingDone: true,
          aiCreditsUsed: true,
          aiCreditsLimit: true,
          isOforoInternal: true,
          _count: {
            select: {
              assessments: true,
              resumes: true,
              careerPlans: true,
              jobApplications: true,
            },
          },
        },
      }),
      prisma.user.aggregate({ _sum: { aiCreditsUsed: true } }),
    ]);

    // Plan distribution
    const plans: Record<string, number> = { FREE: 0, PRO: 0, MAX: 0 };
    planCounts.forEach((p: any) => { plans[p.plan] = p._count; });

    // Daily signups for chart (last 30 days)
    const dailySignups = await prisma.$queryRaw`
      SELECT DATE(\"createdAt\") as date, COUNT(*)::int as count
      FROM "User"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    return NextResponse.json({
      overview: {
        totalUsers,
        newUsersThisMonth,
        newUsersThisWeek,
        totalAssessments,
        totalCareerPlans,
        totalResumes,
        totalAiCreditsUsed: aiCreditsUsed._sum?.aiCreditsUsed || 0,
      },
      plans,
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
      },
      content: {
        blogPosts: totalBlogPosts,
        totalBlogViews: blogViews._sum?.views || 0,
        newsletterSubs,
      },
      referrals: totalReferrals,
      recentUsers,
      dailySignups,
    });
  } catch (error) {
    console.error('[Admin Stats]', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
