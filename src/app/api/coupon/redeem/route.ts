import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const { prisma } = require('@/lib/db/prisma');

/**
 * POST /api/coupon/redeem — Redeem a coupon code to upgrade plan
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: {
        redemptions: { where: { userId: session.user.id } },
      },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive coupon code' }, { status: 404 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: 'This coupon has reached its maximum uses' }, { status: 400 });
    }

    if (coupon.redemptions.length > 0) {
      return NextResponse.json({ error: 'You have already redeemed this coupon' }, { status: 400 });
    }

    // Check if user already has a higher or equal plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    const planOrder = ['BASIC', 'STARTER', 'PRO', 'ULTRA'];
    const currentPlanIndex = planOrder.indexOf(user?.plan || 'BASIC');
    const couponPlanIndex = planOrder.indexOf(coupon.plan);

    if (currentPlanIndex >= couponPlanIndex) {
      return NextResponse.json({
        error: `Your current plan (${user?.plan}) is already equal or higher than this coupon (${coupon.plan})`,
      }, { status: 400 });
    }

    // Apply upgrade in a transaction
    const creditLimits: Record<string, number> = { BASIC: 10, STARTER: 100, PRO: 500, ULTRA: -1 };

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          plan: coupon.plan,
          aiCreditsLimit: creditLimits[coupon.plan],
          aiCreditsUsed: 0,
        },
      }),
      prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      }),
      prisma.couponRedemption.create({
        data: {
          couponId: coupon.id,
          userId: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      plan: coupon.plan,
      message: `Successfully upgraded to ${coupon.plan}!`,
    });
  } catch (error) {
    console.error('[Coupon Redeem]', error);
    return NextResponse.json({ error: 'Failed to redeem coupon' }, { status: 500 });
  }
}
