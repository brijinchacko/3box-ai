import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const { prisma } = require('@/lib/db/prisma');

/**
 * GET /api/admin/users/[id] — Full user detail with all activity
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        onboardingDone: true,
        aiCreditsUsed: true,
        aiCreditsLimit: true,
        totalAppsUsed: true,
        dailyAppsUsed: true,
        dailyAppsResetAt: true,
        isOforoInternal: true,
        isStudent: true,
        stripeCustomerId: true,
        stripeSubId: true,
        referralCode: true,
        referredBy: true,
        hasUnlimitedDaily: true,
        accounts: { select: { provider: true, type: true, createdAt: true } },
        resumes: {
          select: { id: true, isFinalized: true, approvalStatus: true, version: true, createdAt: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        },
        jobApplications: {
          select: {
            id: true, jobTitle: true, company: true, status: true,
            applicationMethod: true, matchScore: true, appliedAt: true, createdAt: true, source: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        subscriptions: {
          select: {
            id: true, plan: true, status: true, interval: true,
            currentPeriodStart: true, currentPeriodEnd: true, cancelAtPeriodEnd: true, createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        creditPurchases: {
          select: { id: true, credits: true, amountPaid: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        agentActivities: {
          select: { id: true, agent: true, action: true, summary: true, creditsUsed: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        scoutJobs: {
          select: { id: true, title: true, company: true, status: true, matchScore: true, source: true, discoveredAt: true, appliedAt: true },
          orderBy: { discoveredAt: 'desc' },
          take: 50,
        },
        searchProfiles: {
          select: { id: true, name: true, roles: true, locations: true, active: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        autoApplyConfig: {
          select: { enabled: true, automationMode: true, scoutEnabled: true, archerEnabled: true },
        },
        careerTwin: {
          select: { targetRoles: true, skillSnapshot: true, marketReadiness: true, hireProb: true },
        },
        emailConnections: {
          select: { provider: true, emailAddress: true, isActive: true, expiresAt: true },
        },
        referralsGiven: { select: { id: true, createdAt: true } },
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
            chatMessages: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Compute aggregates
    const totalRevenue = user.creditPurchases.reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0) / 100;
    const appStatusBreakdown: Record<string, number> = {};
    for (const app of user.jobApplications) {
      appStatusBreakdown[app.status] = (appStatusBreakdown[app.status] || 0) + 1;
    }
    const appMethodBreakdown: Record<string, number> = {};
    for (const app of user.jobApplications) {
      const m = app.applicationMethod || 'unknown';
      appMethodBreakdown[m] = (appMethodBreakdown[m] || 0) + 1;
    }

    return NextResponse.json({
      ...user,
      signupSource: user.accounts.length > 0 ? user.accounts.map((a: any) => a.provider).join(', ') : 'credentials',
      totalRevenue,
      appStatusBreakdown,
      appMethodBreakdown,
    });
  } catch (error) {
    console.error('[Admin Get User]', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    if (id === auth.user?.id) return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, plan: true, isOforoInternal: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.isOforoInternal) return NextResponse.json({ error: 'Cannot delete internal/admin users' }, { status: 403 });

    console.log(`[Admin Delete] Admin ${auth.user?.email} deleting user ${user.id} (${user.email})`);
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `User ${user.email} has been permanently deleted` });
  } catch (error) {
    console.error('[Admin Delete User]', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users/[id] — Update user plan
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = params;
    const body = await request.json();
    const { plan } = body;

    const validPlans = ['FREE', 'BASIC', 'STARTER', 'PRO', 'ULTRA', 'MAX'];
    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan tier' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, plan: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const creditLimits: Record<string, number> = { FREE: 10, BASIC: 10, STARTER: 100, PRO: 500, MAX: 500, ULTRA: -1 };

    const updated = await prisma.user.update({
      where: { id },
      data: { plan, aiCreditsLimit: creditLimits[plan] ?? 10, aiCreditsUsed: 0 },
      select: { id: true, email: true, plan: true, aiCreditsLimit: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.user!.id,
        action: 'ADMIN_PLAN_CHANGE',
        details: { targetUserId: id, targetEmail: user.email, oldPlan: user.plan, newPlan: plan },
      },
    });

    console.log(`[Admin Plan Change] Admin ${auth.user?.email} changed ${user.email} from ${user.plan} to ${plan}`);
    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('[Admin Update User Plan]', error);
    return NextResponse.json({ error: 'Failed to update user plan' }, { status: 500 });
  }
}
