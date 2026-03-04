/**
 * Stripe Webhook Handler
 * Processes Stripe events for subscriptions, credit packs, and payment failures
 */
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, getPlanFromPriceId, CREDIT_PACKS } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';
import {
  sendSubscriptionConfirmEmail,
  sendPaymentFailedEmail,
} from '@/lib/email';

// Force dynamic rendering — required for webhook handling
export const dynamic = 'force-dynamic';

// Credit limits per plan tier
const PLAN_CREDIT_LIMITS: Record<string, number> = {
  STARTER: 100,
  PRO: 500,
  ULTRA: -1, // unlimited
};

// ─── Webhook Signature Verification ──────────────

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  if (!WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
}

// ─── Event Handlers ──────────────────────────────

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('[Webhook] checkout.session.completed missing userId in metadata');
    return;
  }

  if (session.mode === 'subscription') {
    await handleSubscriptionCheckout(session, userId);
  } else if (session.mode === 'payment') {
    await handleCreditPackCheckout(session, userId);
  }
}

async function handleSubscriptionCheckout(
  session: Stripe.Checkout.Session,
  userId: string
): Promise<void> {
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error('[Webhook] No subscription ID in checkout session');
    return;
  }

  // Retrieve the full subscription object from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    console.error('[Webhook] No price ID found on subscription');
    return;
  }

  const planInfo = getPlanFromPriceId(priceId);
  if (!planInfo) {
    console.error('[Webhook] Could not resolve plan from price ID:', priceId);
    return;
  }

  const { plan, interval } = planInfo;
  const creditLimit = PLAN_CREDIT_LIMITS[plan] ?? 10;
  const customerId = session.customer as string;

  // Create Subscription record
  await prisma.subscription.upsert({
    where: { stripeSubId: subscriptionId },
    create: {
      userId,
      stripeSubId: subscriptionId,
      stripePriceId: priceId,
      stripeCustomerId: customerId,
      status: 'ACTIVE',
      plan,
      interval,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      stripePriceId: priceId,
      status: 'ACTIVE',
      plan,
      interval,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Update User record
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      stripeSubId: subscriptionId,
      stripePriceId: priceId,
      stripeCustomerId: customerId,
      aiCreditsLimit: creditLimit,
      aiCreditsUsed: 0, // Reset usage on new subscription
    },
  });

  // Send confirmation email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (user?.email) {
    await sendSubscriptionConfirmEmail(user.email, user.name || 'there', plan);
  }

  console.log(`[Webhook] Subscription activated: user=${userId} plan=${plan} interval=${interval}`);
}

async function handleCreditPackCheckout(
  session: Stripe.Checkout.Session,
  userId: string
): Promise<void> {
  const packId = session.metadata?.packId as keyof typeof CREDIT_PACKS | undefined;
  const creditsStr = session.metadata?.credits;

  if (!packId || !creditsStr) {
    console.error('[Webhook] Credit pack checkout missing packId or credits in metadata');
    return;
  }

  const credits = parseInt(creditsStr, 10);
  if (isNaN(credits) || credits <= 0) {
    console.error('[Webhook] Invalid credits value:', creditsStr);
    return;
  }

  const pack = CREDIT_PACKS[packId];
  if (!pack) {
    console.error('[Webhook] Unknown pack ID:', packId);
    return;
  }

  const paymentIntentId = session.payment_intent as string;

  // Create CreditPurchase record
  await prisma.creditPurchase.create({
    data: {
      userId,
      credits,
      amountPaid: pack.price,
      stripePaymentId: paymentIntentId || null,
    },
  });

  // Increment user's credit limit
  await prisma.user.update({
    where: { id: userId },
    data: {
      aiCreditsLimit: { increment: credits },
    },
  });

  console.log(`[Webhook] Credit pack purchased: user=${userId} pack=${packId} credits=${credits}`);
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const subscriptionId = subscription.id;
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    console.error('[Webhook] subscription.updated: No price ID found');
    return;
  }

  const planInfo = getPlanFromPriceId(priceId);
  if (!planInfo) {
    console.error('[Webhook] subscription.updated: Could not resolve plan from price ID:', priceId);
    return;
  }

  const { plan, interval } = planInfo;
  const creditLimit = PLAN_CREDIT_LIMITS[plan] ?? 10;

  // Map Stripe status to our enum
  const statusMap: Record<string, string> = {
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    trialing: 'TRIALING',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'CANCELED',
    unpaid: 'PAST_DUE',
    paused: 'PAST_DUE',
  };
  const status = statusMap[subscription.status] || 'ACTIVE';

  // Update Subscription record
  const existingSub = await prisma.subscription.findUnique({
    where: { stripeSubId: subscriptionId },
  });

  if (!existingSub) {
    console.warn('[Webhook] subscription.updated: No matching subscription found for', subscriptionId);
    return;
  }

  await prisma.subscription.update({
    where: { stripeSubId: subscriptionId },
    data: {
      stripePriceId: priceId,
      status: status as any,
      plan,
      interval,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Update User record
  await prisma.user.update({
    where: { id: existingSub.userId },
    data: {
      plan,
      stripePriceId: priceId,
      aiCreditsLimit: creditLimit,
    },
  });

  console.log(`[Webhook] Subscription updated: sub=${subscriptionId} plan=${plan} status=${status}`);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const subscriptionId = subscription.id;

  const existingSub = await prisma.subscription.findUnique({
    where: { stripeSubId: subscriptionId },
  });

  if (!existingSub) {
    console.warn('[Webhook] subscription.deleted: No matching subscription found for', subscriptionId);
    return;
  }

  // Update Subscription status to CANCELED
  await prisma.subscription.update({
    where: { stripeSubId: subscriptionId },
    data: {
      status: 'CANCELED',
      cancelAtPeriodEnd: false,
    },
  });

  // Reset User to BASIC plan
  await prisma.user.update({
    where: { id: existingSub.userId },
    data: {
      plan: 'BASIC',
      stripeSubId: null,
      stripePriceId: null,
      aiCreditsLimit: 10,
      aiCreditsUsed: 0,
    },
  });

  console.log(`[Webhook] Subscription canceled: sub=${subscriptionId} user=${existingSub.userId}`);
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = invoice.customer as string;
  if (!customerId) {
    console.error('[Webhook] invoice.payment_failed: No customer ID');
    return;
  }

  // Look up user by Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true, email: true, name: true, plan: true },
  });

  if (!user?.email) {
    console.warn('[Webhook] invoice.payment_failed: No user found for customer', customerId);
    return;
  }

  await sendPaymentFailedEmail(user.email, user.name || 'there');

  console.log(`[Webhook] Payment failed email sent: user=${user.id} plan=${user.plan}`);
}

// ─── Main POST Handler ──────────────────────────

export async function POST(request: Request) {
  let body: string;
  let event: Stripe.Event;

  try {
    body = await request.text();
  } catch (error) {
    console.error('[Webhook] Failed to read request body:', error);
    return NextResponse.json(
      { error: 'Failed to read request body' },
      { status: 400 }
    );
  }

  // Verify Stripe webhook signature
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  try {
    event = await verifyWebhookSignature(body, signature);
  } catch (error: any) {
    console.error('[Webhook] Signature verification failed:', error.message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${error.message}` },
      { status: 400 }
    );
  }

  // Process the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`[Webhook] Error processing ${event.type}:`, error);
    // Return 200 to prevent Stripe from retrying on application errors
    // Stripe will retry on 5xx, and we don't want infinite retries for data issues
    return NextResponse.json(
      { error: `Webhook handler error: ${error.message}` },
      { status: 200 }
    );
  }
}
