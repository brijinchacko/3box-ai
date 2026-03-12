/**
 * Stripe Checkout API Route
 * Handles subscription checkout and billing portal access
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import {
  PRICE_IDS,
  getOrCreateCustomer,
  createCheckoutSession,
  createBillingPortalSession,
} from '@/lib/stripe';

const APP_URL = process.env.NEXTAUTH_URL || 'https://3box.ai';

type PlanKey = 'PRO' | 'MAX';
type IntervalKey = 'monthly' | 'yearly';

interface CheckoutBody {
  action: 'checkout';
  plan: string;
  interval: string;
}

interface PortalBody {
  action: 'portal';
}

type RequestBody = CheckoutBody | PortalBody;

const VALID_PLANS: PlanKey[] = ['PRO', 'MAX'];
const VALID_INTERVALS: IntervalKey[] = ['monthly', 'yearly'];

export async function POST(request: Request) {
  try {
    // ── Authentication ───────────────────────────
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: userId, email, name } = session.user;

    // ── Parse body ───────────────────────────────
    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!body.action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      );
    }

    // ── Route by action ──────────────────────────

    switch (body.action) {
      // ─── Subscription Checkout ─────────────────
      case 'checkout': {
        const { plan, interval } = body as CheckoutBody;

        const normalizedPlan = plan?.toUpperCase() as PlanKey;
        const normalizedInterval = interval?.toLowerCase() as IntervalKey;

        if (!normalizedPlan || !VALID_PLANS.includes(normalizedPlan)) {
          return NextResponse.json(
            { error: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ').toLowerCase()}` },
            { status: 400 }
          );
        }

        if (!normalizedInterval || !VALID_INTERVALS.includes(normalizedInterval)) {
          return NextResponse.json(
            { error: `Invalid interval. Must be one of: ${VALID_INTERVALS.join(', ')}` },
            { status: 400 }
          );
        }

        const priceId = PRICE_IDS[normalizedPlan][normalizedInterval];
        if (!priceId) {
          return NextResponse.json(
            { error: 'Price configuration not found for the selected plan and interval' },
            { status: 500 }
          );
        }

        const checkoutSession = await createCheckoutSession({
          userId,
          email,
          name: name || undefined,
          priceId,
          successUrl: `${APP_URL}/dashboard/settings?checkout=success`,
          cancelUrl: `${APP_URL}/pricing?checkout=canceled`,
        });

        return NextResponse.json({ url: checkoutSession.url });
      }

      // ─── Billing Portal ────────────────────────
      case 'portal': {
        const customerId = await getOrCreateCustomer(userId, email, name || undefined);

        const portalSession = await createBillingPortalSession(
          customerId,
          `${APP_URL}/dashboard/settings`
        );

        return NextResponse.json({ url: portalSession.url });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${(body as any).action}. Must be one of: checkout, portal` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[Stripe Checkout] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
