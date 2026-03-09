/**
 * Stripe Integration Layer
 * Handles subscriptions, checkout, billing portal, and credit pack purchases
 */
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10' as any,
  typescript: true,
});

// ─── Price Configuration ────────────────────────

export const PRICE_IDS = {
  STARTER: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '',
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || '',
  },
  PRO: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
  },
  ULTRA: {
    monthly: process.env.STRIPE_ULTRA_MONTHLY_PRICE_ID || '',
    yearly: process.env.STRIPE_ULTRA_YEARLY_PRICE_ID || '',
  },
} as const;

// Credit pack one-time prices
export const CREDIT_PACK_PRICES = {
  pack_100: process.env.STRIPE_CREDITS_100_PRICE_ID || '',
  pack_500: process.env.STRIPE_CREDITS_500_PRICE_ID || '',
  pack_1000: process.env.STRIPE_CREDITS_1000_PRICE_ID || '',
} as const;

export const CREDIT_PACKS = {
  pack_100: { credits: 100, price: 500 },   // $5.00
  pack_500: { credits: 500, price: 1500 },  // $15.00
  pack_1000: { credits: 1000, price: 2500 }, // $25.00
} as const;

// Map Stripe price IDs back to plan tiers
export function getPlanFromPriceId(priceId: string): { plan: 'STARTER' | 'PRO' | 'ULTRA'; interval: 'month' | 'year' } | null {
  for (const [plan, prices] of Object.entries(PRICE_IDS)) {
    if (prices.monthly === priceId) return { plan: plan as any, interval: 'month' };
    if (prices.yearly === priceId) return { plan: plan as any, interval: 'year' };
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

// ─── Credit Pack Purchase ───────────────────────

export async function createCreditPackCheckout({
  userId,
  email,
  name,
  packId,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  email: string;
  name?: string;
  packId: keyof typeof CREDIT_PACK_PRICES;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const customerId = await getOrCreateCustomer(userId, email, name);
  const pack = CREDIT_PACKS[packId];

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${pack.credits} AI Credits`,
          description: `One-time purchase of ${pack.credits} AI credits for 3BOX AI`,
        },
        unit_amount: pack.price,
      },
      quantity: 1,
    }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, packId, credits: pack.credits.toString() },
  });
}

// ─── Unlimited Daily Applications (One-Time) ────

export const UNLIMITED_DAILY_PRICE_ID = process.env.STRIPE_UNLIMITED_DAILY_PRICE_ID || '';

export const UNLIMITED_DAILY_PACK = {
  name: 'Unlimited Daily Applications',
  price: 14900, // $149 USD base — regional pricing overrides this in the UI
} as const;

export async function createUnlimitedDailyCheckout({
  userId,
  email,
  name,
  successUrl,
  cancelUrl,
  priceOverride,
}: {
  userId: string;
  email: string;
  name?: string;
  successUrl: string;
  cancelUrl: string;
  priceOverride?: number; // For regional pricing (cents)
}): Promise<Stripe.Checkout.Session> {
  const customerId = await getOrCreateCustomer(userId, email, name);
  const price = priceOverride || UNLIMITED_DAILY_PACK.price;

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: UNLIMITED_DAILY_PACK.name,
          description: 'Remove the 30/day application limit permanently. One-time purchase, never expires.',
        },
        unit_amount: price,
      },
      quantity: 1,
    }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, type: 'unlimited_daily' },
  });
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
