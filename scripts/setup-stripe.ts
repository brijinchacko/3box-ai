/**
 * Stripe Setup Script
 *
 * Creates all required Stripe products and prices for 3BOX AI,
 * then updates the .env file with the generated price IDs.
 *
 * Prerequisites:
 *   1. Create a Stripe account at https://stripe.com
 *   2. Get your API keys from Dashboard > Developers > API Keys
 *   3. Set STRIPE_SECRET_KEY in .env
 *
 * Usage:
 *   npx tsx scripts/setup-stripe.ts
 */

import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('\n❌ STRIPE_SECRET_KEY is not set in .env');
  console.error('\nTo set up Stripe:');
  console.error('  1. Go to https://dashboard.stripe.com/apikeys');
  console.error('  2. Copy your Secret Key (starts with sk_test_ or sk_live_)');
  console.error('  3. Add it to your .env file: STRIPE_SECRET_KEY="sk_test_..."');
  console.error('  4. Run this script again: npx tsx scripts/setup-stripe.ts\n');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' as any });

interface PlanConfig {
  name: string;
  description: string;
  monthlyPrice: number; // cents
  yearlyPrice: number;  // cents
  features: string[];
}

const PLANS: Record<string, PlanConfig> = {
  STARTER: {
    name: '3BOX AI Starter',
    description: 'Perfect for getting started with AI-powered career tools',
    monthlyPrice: 1200, // $12
    yearlyPrice: 9600,  // $96/yr ($8/mo)
    features: ['5 assessments/mo', '100 AI credits/mo', '3 resume templates', 'Full career plan', 'AI coach access'],
  },
  PRO: {
    name: '3BOX AI Pro',
    description: 'Advanced career tools with human expert support',
    monthlyPrice: 2900, // $29
    yearlyPrice: 23200, // $232/yr (~$19.33/mo)
    features: ['Unlimited assessments', '500 AI credits/mo', 'All templates', 'Job matching', 'Human mock interviews', 'Human resume review'],
  },
  ULTRA: {
    name: '3BOX AI Ultra',
    description: 'The complete career acceleration package',
    monthlyPrice: 5900, // $59
    yearlyPrice: 47200, // $472/yr (~$39.33/mo)
    features: ['Everything in Pro', 'Unlimited AI credits', 'Auto-apply', 'Dedicated career mentor', '1-on-1 expert coaching', 'LinkedIn optimizer'],
  },
};

async function main() {
  console.log('\n🚀 Setting up Stripe products and prices for 3BOX AI...\n');

  const envPath = path.join(process.cwd(), '.env');
  let envContent = fs.readFileSync(envPath, 'utf-8');

  const priceIds: Record<string, string> = {};

  // Create subscription products and prices
  for (const [planKey, config] of Object.entries(PLANS)) {
    console.log(`📦 Creating ${config.name}...`);

    const product = await stripe.products.create({
      name: config.name,
      description: config.description,
      metadata: { plan: planKey, app: '3box-ai' },
    });

    // Monthly price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: config.monthlyPrice,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan: planKey, interval: 'monthly' },
    });

    // Yearly price
    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: config.yearlyPrice,
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { plan: planKey, interval: 'yearly' },
    });

    priceIds[`STRIPE_${planKey}_MONTHLY_PRICE_ID`] = monthlyPrice.id;
    priceIds[`STRIPE_${planKey}_YEARLY_PRICE_ID`] = yearlyPrice.id;

    console.log(`  ✅ Monthly: $${config.monthlyPrice / 100}/mo (${monthlyPrice.id})`);
    console.log(`  ✅ Yearly:  $${config.yearlyPrice / 100}/yr (${yearlyPrice.id})`);
  }

  // Create credit pack products
  const creditPacks = [
    { key: '100', credits: 100, price: 500, name: '100 AI Credits' },
    { key: '500', credits: 500, price: 1500, name: '500 AI Credits' },
    { key: '1000', credits: 1000, price: 2500, name: '1000 AI Credits' },
  ];

  console.log('\n💳 Creating credit packs...');

  for (const pack of creditPacks) {
    const product = await stripe.products.create({
      name: `3BOX AI - ${pack.name}`,
      description: `One-time purchase of ${pack.credits} AI credits`,
      metadata: { type: 'credit-pack', credits: pack.credits.toString(), app: '3box-ai' },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pack.price,
      currency: 'usd',
      metadata: { type: 'credit-pack', credits: pack.credits.toString() },
    });

    priceIds[`STRIPE_CREDITS_${pack.key}_PRICE_ID`] = price.id;
    console.log(`  ✅ ${pack.name}: $${pack.price / 100} (${price.id})`);
  }

  // Update .env file
  console.log('\n📝 Updating .env file...');

  for (const [key, value] of Object.entries(priceIds)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}="${value}"`);
    } else {
      envContent += `\n${key}="${value}"`;
    }
  }

  fs.writeFileSync(envPath, envContent);

  // Also get and display the publishable key info
  console.log('\n✅ All Stripe products and prices created successfully!');
  console.log('\n📋 Price IDs saved to .env\n');
  console.log('─────────────────────────────────────────');
  console.log('NEXT STEPS:');
  console.log('─────────────────────────────────────────');
  console.log('1. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env');
  console.log('   (Find it at https://dashboard.stripe.com/apikeys)');
  console.log('');
  console.log('2. Set up webhooks:');
  console.log('   For local testing:');
  console.log('     stripe listen --forward-to localhost:3000/api/stripe/webhook');
  console.log('   For production:');
  console.log('     Add webhook endpoint at https://dashboard.stripe.com/webhooks');
  console.log('     URL: https://your-domain.com/api/stripe/webhook');
  console.log('     Events: checkout.session.completed, customer.subscription.updated,');
  console.log('             customer.subscription.deleted, invoice.payment_failed');
  console.log('');
  console.log('3. Set STRIPE_WEBHOOK_SECRET in .env');
  console.log('   (Shown after creating the webhook endpoint)\n');
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
