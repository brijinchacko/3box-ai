/**
 * Stripe Integration Layer
 * Handles subscriptions, checkout, and billing portal
 */
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10' as any,
  typescript: true,
});

// ─── Price Configuration ────────────────────────

export const PRICE_IDS = {
  PRO: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
  },
  MAX: {
    monthly: process.env.STRIPE_MAX_MONTHLY_PRICE_ID || '',
    yearly: process.env.STRIPE_MAX_YEARLY_PRICE_ID || '',
  },
} as const;

// Map Stripe price IDs back to plan tiers
export function getPlanFromPriceId(priceId: string): { plan: 'PRO' | 'MAX'; interval: 'month' | 'year' } | null {
  for (const [plan, prices] of Object.entries(PRICE_IDS)) {
    if (prices.monthly === priceId) return { plan: plan as 'PRO' | 'MAX', interval: 'month' };
    if (prices.yearly === priceId) return { plan: plan as 'PRO' | 'MAX', interval: 'year' };
  }
  return null;
}

// ─── Customer Management ────────────────────────

export async function getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string> {
  const { prisma } = require('@/lib/db/prisma');
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ─── Checkout Session ───────────────────────────

export async function createCheckoutSession({
  userId,
  email,
  name,
  priceId,
  successUrl,
  cancelUrl,
  trialDays,
  couponId,
}: {
  userId: string;
  email: string;
  name?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  couponId?: string;
}): Promise<Stripe.Checkout.Session> {
  const customerId = await getOrCreateCustomer(userId, email, name);

  const params: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    allow_promotion_codes: !couponId,
    subscription_data: {
      metadata: { userId },
      ...(trialDays ? { trial_period_days: trialDays } : {}),
    },
    ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
  };

  return stripe.checkout.sessions.create(params);
}

// ─── Billing Portal ─────────────────────────────

export async function createBillingPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// ─── Subscription Management ────────────────────

export async function cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

export async function updateSubscription(subscriptionId: string, newPriceId: string): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId,
    }],
    proration_behavior: 'create_prorations',
  });
}
