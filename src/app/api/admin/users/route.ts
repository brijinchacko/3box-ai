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
    if (plan && ['BASIC', 'STARTER', 'PRO', 'ULTRA'].includes(plan)) {
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
          plan: true,
          createdAt: true,
          updatedAt: true,
          onboardingDone: true,
          aiCreditsUsed: true,
          aiCreditsLimit: true,
          isOforoInternal: true,
          stripeCustomerId: true,
          referralCode: true,
          referredBy: true,
          _count: {
            select: {
              assessments: true,
              resumes: true,
              careerPlans: true,
              learningPaths: true,
              jobApplications: true,
              auditLogs: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
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
