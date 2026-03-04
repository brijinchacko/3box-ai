/**
 * Stripe Billing Portal API Route
 * Creates a billing portal session for managing subscriptions and payment methods
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import {
  getOrCreateCustomer,
  createBillingPortalSession,
} from '@/lib/stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nxted.ai';

export async function POST() {
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

    // ── Get or create Stripe customer ────────────
    const customerId = await getOrCreateCustomer(userId, email, name || undefined);

    // ── Create billing portal session ────────────
    const portalSession = await createBillingPortalSession(
      customerId,
      `${APP_URL}/dashboard/settings`
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('[Stripe Portal] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
