/**
 * Stripe Webhook Handler
 * Processes Stripe events for subscriptions and payment failures
 */
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, getPlanFromPriceId } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';
import {
  sendSubscriptionConfirmEmail,
  sendSubscriptionCanceledEmail,
  sendPaymentFailedEmail,
} from '@/lib/email';

// Force dynamic rendering — required for webhook handling
export const dynamic = 'force-dynamic';

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

  // Reset User to FREE plan
  const user = await prisma.user.update({
    where: { id: existingSub.userId },
    data: {
      plan: 'FREE',
      stripeSubId: null,
      stripePriceId: null,
    },
  });

  // Send cancellation email
  if (user.email) {
    const endDate = new Date(existingSub.currentPeriodEnd).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    sendSubscriptionCanceledEmail(user.email, user.name || 'there', endDate).catch((err) => {
      console.error('[Webhook] Failed to send cancellation email:', err);
    });
  }

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
