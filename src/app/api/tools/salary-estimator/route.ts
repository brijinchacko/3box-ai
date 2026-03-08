import { NextResponse, NextRequest } from 'next/server';
import { getAggregatedSalaryEstimate } from '@/lib/salary/aggregator';
import { checkFreeUsage, buildUsageCookie } from '@/lib/usage/serverUsageCheck';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, location, experience, skills, clientCount } = body;

    if (!role || !location || !experience) {
      return NextResponse.json(
        { error: 'Role, location, and experience are required' },
        { status: 400 },
      );
    }

    // ── Usage limit tracking ─────────────────────
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/3box-salary-uses=(\d+)/);
    const cookieValue = cookieMatch ? cookieMatch[1] : undefined;
    const { allowed, realCount } = checkFreeUsage(cookieValue, clientCount ?? 0);

    if (!allowed) {
      // Check if user has a paid session
      let isPaidUser = false;
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
          const { prisma } = await import('@/lib/db/prisma');
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { plan: true },
          });
          const plan = (user?.plan ?? 'BASIC').toUpperCase();
          if (plan !== 'BASIC') {
            isPaidUser = true;
          }
        }
      } catch {
        // Session check is optional
      }

      if (!isPaidUser) {
        return NextResponse.json(
          { error: 'limit_reached', message: 'You have used your free salary estimate. Sign up or subscribe to continue.' },
          { status: 403 },
        );
      }
    }

    // ── Get aggregated salary estimate ───────────
    try {
      const estimate = await getAggregatedSalaryEstimate({
        role,
        location,
        experience,
        skills: Array.isArray(skills) ? skills : undefined,
      });

      const response = NextResponse.json(estimate);
      const newCount = realCount + 1;
      response.headers.set('Set-Cookie', buildUsageCookie('3box-salary-uses', newCount));
      return response;
    } catch (estimateError) {
      console.error('Salary estimation failed:', estimateError);

      const defaultEstimate = {
        low: 50000,
        median: 75000,
        high: 100000,
        currency: 'USD',
        factors: [
          'Salary estimation is temporarily unavailable.',
          'These are placeholder values.',
          'Please try again later for accurate estimates.',
        ],
        marketTrend: 'stable' as const,
        demandLevel: 'medium' as const,
        dataSources: [] as string[],
      };

      const response = NextResponse.json(defaultEstimate);
      const newCount = realCount + 1;
      response.headers.set('Set-Cookie', buildUsageCookie('3box-salary-uses', newCount));
      return response;
    }
  } catch (error) {
    console.error('Error in salary estimator:', error);
    return NextResponse.json(
      { error: 'Failed to estimate salary' },
      { status: 500 },
    );
  }
}
