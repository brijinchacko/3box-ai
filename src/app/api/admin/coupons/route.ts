import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const { prisma } = require('@/lib/db/prisma');

function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CPN-';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * GET /api/admin/coupons — List all coupons
 */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { redemptions: true } },
      },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('[Admin List Coupons]', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

/**
 * POST /api/admin/coupons — Create a new coupon
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { code, plan, maxUses, durationDays, expiresAt } = body;

    const validPlans = ['BASIC', 'STARTER', 'PRO', 'ULTRA'];
    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan tier' }, { status: 400 });
    }

    const couponCode = code?.toUpperCase().trim() || generateCouponCode();

    // Check for duplicate code
    const existing = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: couponCode,
        plan,
        maxUses: maxUses || 1,
        durationDays: durationDays || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: auth.user!.id,
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error('[Admin Create Coupon]', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/coupons — Toggle coupon active/inactive
 */
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error('[Admin Toggle Coupon]', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}
