'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  GraduationCap,
  CreditCard,
  Loader2,
  ArrowRight,
  Star,
  Shield,
  Users,
  Globe,
  Rocket,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRegion } from '@/lib/geo';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RegionSelector from '@/components/geo/RegionSelector';
import AgentAvatar from '@/components/brand/AgentAvatar';
import { useVisitorName } from '@/hooks/useVisitorName';
import { AgentAvatarMini } from '@/components/brand/AgentAvatar';
import { AGENTS, AGENT_LIST, type AgentId } from '@/lib/agents/registry';

// ---------------------------------------------------------------------------
// Agent data for individual cards
// ---------------------------------------------------------------------------

const agentShowcase: { id: AgentId; highlights: string[] }[] = [
  {
    id: 'scout',
    highlights: ['Scans 6+ job boards daily', 'AI match scoring', 'Smart alerts'],
  },
  {
    id: 'forge',
    highlights: ['ATS-optimized resumes', 'Keyword injection', 'Multiple variants'],
  },
  {
    id: 'archer',
    highlights: ['Cover letter generation', 'Portal auto-fill', 'Cold outreach emails'],
  },
  {
    id: 'atlas',
    highlights: ['Company-specific prep', 'STAR method coaching', 'Mock interviews'],
  },
  {
    id: 'sage',
    highlights: ['Skill gap analysis', 'Learning roadmaps', 'Progress tracking'],
  },
  {
    id: 'sentinel',
    highlights: ['Quality review', 'Fabrication detection', 'Consistency checks'],
  },
];

// ---------------------------------------------------------------------------
// Team bundle definitions (map to existing plan tiers)
// ---------------------------------------------------------------------------

interface TeamBundle {
  name: string;
  planKey: 'starter' | 'pro' | 'ultra';
  icon: React.ElementType;
  description: string;
  badge?: string;
  badgeColor?: string;
  popular: boolean;
  agents: AgentId[];
  highlights: string[];
}

const teamBundles: TeamBundle[] = [
  {
    name: 'Starter Duo',
    planKey: 'starter',
    icon: Rocket,
    description: 'Start your job search with the essentials',
    badge: 'Best Value',
    badgeColor: 'bg-neon-green/10 text-neon-green border border-neon-green/20',
    popular: false,
    agents: ['scout', 'forge'],
    highlights: [
      '100 AI credits / month',
      'Job discovery + resume optimization',
      '3 resume templates',
      'Full career plan',
      'AI coach (full access)',
    ],
  },
  {
    name: 'Job Hunter Pack',
    planKey: 'pro',
    icon: Zap,
    description: 'Full toolkit for serious job seekers',
    badge: 'Most Popular',
    badgeColor: 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20',
    popular: true,
    agents: ['scout', 'forge', 'archer', 'atlas'],
    highlights: [
      '500 AI credits / month',
      'Everything in Starter Duo',
      'Auto-apply + cover letters',
      'Interview prep + mock interviews',
      'Job matching + fit reports',
      'Human resume review (1/mo)',
    ],
  },
  {
    name: 'Full Squad',
    planKey: 'ultra',
    icon: Crown,
    description: 'Maximum automation — AI works while you sleep',
    badge: 'Maximum Power',
    badgeColor: 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20',
    popular: false,
    agents: ['scout', 'forge', 'archer', 'atlas', 'sage', 'sentinel'],
    highlights: [
      'Unlimited AI credits',
      'All 6 agents working 24/7',
      'Full Agent autopilot mode',
      'Skill gap analysis + learning',
      'Quality assurance + verification',
      'Dedicated career mentor',
      'Priority AI processing',
    ],
  },
];

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

const faqs = [
  {
    q: 'What is Cortex?',
    a: 'Cortex is your free AI coordinator. It manages all your hired agents and provides basic career coaching with 10 AI credits per month.',
  },
  {
    q: 'Can I hire individual agents?',
    a: 'Currently agents are available in team bundles. Individual agent hiring is coming soon! For now, pick the bundle that best fits your needs.',
  },
  {
    q: 'Can I switch bundles anytime?',
    a: 'Yes, you can upgrade or downgrade your bundle at any time. Changes take effect immediately and billing is prorated.',
  },
  {
    q: 'What are AI credits?',
    a: 'AI credits power agent actions like resume optimization, job matching, and cover letter generation. Each bundle includes a monthly allocation, and you can buy extra credit packs anytime.',
  },
  {
    q: 'Can I buy extra AI credits without upgrading?',
    a: 'Absolutely. You can purchase credit packs (100, 500, or 1,000 credits) any time as a one-time purchase. They never expire.',
  },
  {
    q: 'Can I get a refund?',
    a: 'We offer a 14-day money-back guarantee on all paid bundles. No questions asked.',
  },
];

// ---------------------------------------------------------------------------
// Skeleton component for loading state
// ---------------------------------------------------------------------------

function PricingSkeleton() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="h-6 w-48 mx-auto rounded-full bg-white/5 animate-pulse mb-6" />
            <div className="h-12 w-96 mx-auto rounded-xl bg-white/5 animate-pulse mb-4" />
            <div className="h-5 w-72 mx-auto rounded-lg bg-white/5 animate-pulse mb-8" />
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 space-y-4">
                <div className="h-5 w-24 rounded bg-white/5 animate-pulse" />
                <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
                <div className="h-10 w-32 rounded bg-white/5 animate-pulse" />
                <div className="h-10 w-full rounded-xl bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PricingPageClient() {
  const { firstName } = useVisitorName();
  const [yearly, setYearly] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const { data: session } = useSession();
  const {
    region,
    country,
    currency,
    currencySymbol,
    pricing,
    studentDiscount,
    isLoading,
    formatPrice,
  } = useRegion();

  if (isLoading) return <PricingSkeleton />;

  // ---- Compute plan prices from region ----
  const getPlanPrice = (planKey: string, isYearly: boolean): number => {
    if (planKey === 'basic') return 0;
    const planPricing = pricing[planKey as keyof typeof pricing];
    if (!planPricing || typeof planPricing !== 'object' || !('monthly' in planPricing)) return 0;
    const p = planPricing as { monthly: number; yearly: number };
    return isYearly ? Math.round(p.yearly / 12) : p.monthly;
  };

  const getPlanYearlyTotal = (planKey: string): number => {
    if (planKey === 'basic') return 0;
    const planPricing = pricing[planKey as keyof typeof pricing];
    if (!planPricing || typeof planPricing !== 'object' || !('yearly' in planPricing)) return 0;
    return (planPricing as { yearly: number }).yearly;
  };

  const getPlanMonthlyPrice = (planKey: string): number => {
    if (planKey === 'basic') return 0;
    const planPricing = pricing[planKey as keyof typeof pricing];
    if (!planPricing || typeof planPricing !== 'object' || !('monthly' in planPricing)) return 0;
    return (planPricing as { monthly: number }).monthly;
  };

  const yearlySavings = (planKey: string): number => {
    if (planKey === 'basic') return 0;
    return getPlanMonthlyPrice(planKey) * 12 - getPlanYearlyTotal(planKey);
  };

  const creditPacks = [
    { id: 'pack_100', credits: 100, price: pricing.credits.pack100, popular: false },
    { id: 'pack_500', credits: 500, price: pricing.credits.pack500, popular: true },
    { id: 'pack_1000', credits: 1000, price: pricing.credits.pack1000, popular: false },
  ];

  // ---- Stripe checkout for plans ----
  const handlePlanCheckout = async (planKey: string) => {
    if (planKey === 'basic') return;
    if (!session) {
      window.location.href = '/login?redirect=/pricing';
      return;
    }
    setLoadingPlan(planKey);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkout',
          plan: planKey,
          interval: yearly ? 'yearly' : 'monthly',
          region,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.error) {
        setCheckoutError(
          data.error === 'Price configuration not found for the selected plan and interval'
            ? 'Payment system is being configured. Please try again shortly or contact support.'
            : data.error === 'Authentication required'
            ? 'Please log in first to upgrade your plan.'
            : data.error
        );
      }
    } catch (err) {
      console.error('Checkout error', err);
      setCheckoutError('Unable to connect to payment service. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  // ---- Stripe checkout for credit packs ----
  const handleCreditCheckout = async (pack: typeof creditPacks[0]) => {
    if (!session) {
      window.location.href = '/login?redirect=/pricing';
      return;
    }
    setLoadingPack(pack.id);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'credit-pack',
          packId: pack.id,
          region,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.error) {
        setCheckoutError(data.error);
      }
    } catch (err) {
      console.error('Credit checkout error', err);
      setCheckoutError('Unable to connect to payment service. Please try again.');
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-purple/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Error Banner */}
          {checkoutError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center"
            >
              {checkoutError}
              <button onClick={() => setCheckoutError(null)} className="ml-3 text-red-400/60 hover:text-red-400 underline text-xs">Dismiss</button>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* HERO                                                         */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 text-xs text-white/40">
                <Globe className="w-3.5 h-3.5" />
                <span>Prices for {country} in {currency}</span>
              </div>
              <RegionSelector />
            </div>

            <div className="inline-flex items-center gap-2 badge-neon mb-6">
              <Star className="w-3.5 h-3.5" />
              <span>14-day money-back guarantee</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4">
              {firstName ? `${firstName}, Hire` : 'Hire'} Your{' '}
              <span className="gradient-text">AI Agent Team</span>
            </h1>
            <p className="text-white/40 max-w-xl mx-auto mb-3 text-lg">
              Pick the agents you need. They work 24/7 so you don&apos;t have to.
            </p>
            <p className="text-sm text-white/30 max-w-md mx-auto mb-8">
              Cortex (free coordinator) is always included with 10 AI credits/mo.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1 glass rounded-full">
              <button
                onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  !yearly ? 'bg-white/10 text-white' : 'text-white/40'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  yearly ? 'bg-white/10 text-white' : 'text-white/40'
                }`}
              >
                Yearly{' '}
                <span className="badge-green text-[10px]">Save 20%</span>
              </button>
            </div>
          </motion.div>

          {/* ============================================================ */}
          {/* MEET THE AGENTS                                              */}
          {/* ============================================================ */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-center mb-2">
              Meet Your <span className="gradient-text">Agents</span>
            </h2>
            <p className="text-white/40 text-center mb-8 text-sm">
              Each agent is a specialist. Hire them individually or as a team.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {agentShowcase.map((item, i) => {
                const agent = AGENTS[item.id];
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <AgentAvatar agentId={item.id} size={36} />
                      <div>
                        <h3 className="text-sm font-bold">{agent.displayName}</h3>
                        <p className={`text-[10px] font-medium ${agent.color}`}>{agent.role}</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {item.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2 text-xs text-white/50">
                          <Check className="w-3 h-3 text-neon-green flex-shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <span className="text-[10px] text-white/25">
                        Included in {agent.minPlan} and above
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* TEAM BUNDLES                                                  */}
          {/* ============================================================ */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-center mb-2">
              Choose Your <span className="gradient-text">Team</span>
            </h2>
            <p className="text-white/40 text-center mb-8 text-sm">
              Bundle agents together and save. All bundles include Cortex as your free coordinator.
            </p>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {teamBundles.map((bundle, i) => {
                const displayPrice = getPlanPrice(bundle.planKey, yearly);
                const savings = yearlySavings(bundle.planKey);

                return (
                  <motion.div
                    key={bundle.planKey}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`card relative flex flex-col ${
                      bundle.popular ? 'border-neon-blue/30 neon-glow lg:scale-105 z-10' : ''
                    }`}
                  >
                    {/* Badge */}
                    {bundle.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className={`badge ${bundle.badgeColor} text-xs whitespace-nowrap`}>
                          {bundle.badge}
                        </span>
                      </div>
                    )}

                    {/* Bundle info */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-2">
                        <bundle.icon className="w-5 h-5 text-neon-blue" />
                        <h3 className="text-xl font-bold">{bundle.name}</h3>
                      </div>
                      <p className="text-sm text-white/40 mb-4">{bundle.description}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold">
                          {currencySymbol}{displayPrice.toLocaleString()}
                        </span>
                        <span className="text-sm text-white/40">
                          /mo{yearly ? ', billed yearly' : ''}
                        </span>
                      </div>
                      {yearly && savings > 0 && (
                        <p className="text-xs text-neon-green/70 mt-1">
                          Save {currencySymbol}{savings.toLocaleString()}/yr
                        </p>
                      )}
                    </div>

                    {/* Agent avatars */}
                    <div className="mb-5 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-3.5 h-3.5 text-neon-purple" />
                        <span className="text-xs font-semibold text-white/70">
                          {bundle.agents.length} Agents
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {bundle.agents.map((agentId) => (
                          <AgentAvatarMini key={agentId} agentId={agentId} size={22} />
                        ))}
                      </div>
                      <p className="text-[10px] text-white/40">
                        {bundle.agents.map((id) => AGENTS[id].displayName).join(' + ')}
                      </p>
                    </div>

                    {/* CTA */}
                    {!session ? (
                      <Link
                        href="/signup"
                        className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                          bundle.popular ? 'btn-primary' : 'btn-secondary'
                        }`}
                      >
                        Hire {bundle.name}
                      </Link>
                    ) : (
                      <button
                        onClick={() => handlePlanCheckout(bundle.planKey)}
                        disabled={loadingPlan === bundle.planKey}
                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                          bundle.popular ? 'btn-primary' : 'btn-secondary'
                        }`}
                      >
                        {loadingPlan === bundle.planKey ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Hire {bundle.name}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}

                    {/* Highlights */}
                    <div className="mt-5 pt-5 border-t border-white/5 space-y-2.5 flex-1">
                      {bundle.highlights.map((h) => (
                        <div key={h} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-neon-green flex-shrink-0" />
                          <span className="text-white/60">{h}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Free tier note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-8"
            >
              <p className="text-sm text-white/30">
                Not ready to hire?{' '}
                <Link href="/signup" className="text-neon-blue hover:underline">
                  Start free with Cortex
                </Link>
                {' '} — 10 AI credits/mo, basic career tools, no credit card required.
              </p>
            </motion.div>
          </div>

          {/* ============================================================ */}
          {/* BUY AI CREDITS                                               */}
          {/* ============================================================ */}
          <motion.div
            id="credits"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 max-w-4xl mx-auto scroll-mt-24"
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 badge-purple mb-4">
                <CreditCard className="w-3.5 h-3.5" />
                <span>One-time purchase</span>
              </div>
              <h2 className="text-3xl font-bold mb-2">
                Need more <span className="gradient-text">AI credits</span>?
              </h2>
              <p className="text-white/40">
                Top up anytime. Credit packs never expire.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {creditPacks.map((pack, i) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`card text-center relative ${
                    pack.popular ? 'border-neon-purple/30 neon-glow-purple' : ''
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="badge bg-neon-purple/10 text-neon-purple border border-neon-purple/20 text-xs">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <Sparkles
                    className={`w-8 h-8 mx-auto mb-3 ${
                      pack.popular ? 'text-neon-purple' : 'text-neon-blue/60'
                    }`}
                  />
                  <div className="text-3xl font-extrabold mb-1">
                    {pack.credits.toLocaleString()}
                  </div>
                  <p className="text-sm text-white/40 mb-1">credits</p>
                  <div className="text-2xl font-bold mb-4">
                    {formatPrice(pack.price)}
                  </div>
                  <p className="text-xs text-white/30 mb-5">
                    {formatPrice(Math.round((pack.price / pack.credits) * 100) / 100)} per credit
                  </p>
                  <button
                    onClick={() => handleCreditCheckout(pack)}
                    disabled={loadingPack === pack.id}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      pack.popular ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {loadingPack === pack.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Buy Credits'
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ============================================================ */}
          {/* STUDENT DISCOUNT                                             */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 max-w-2xl mx-auto text-center"
          >
            <div className="glass p-6 flex items-center justify-between flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-neon-green" />
                <div className="text-left">
                  <div className="font-semibold">Student Discount</div>
                  <div className="text-sm text-white/40">
                    {studentDiscount}% off with a .edu email
                  </div>
                </div>
              </div>
              <Link href="/signup" className="btn-secondary text-sm">
                Apply Student Discount
              </Link>
            </div>
          </motion.div>

          {/* ============================================================ */}
          {/* TRUST BADGES                                                 */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/30 text-sm"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>Powered by Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>14-day money-back</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>

          {/* ============================================================ */}
          {/* FAQS                                                         */}
          {/* ============================================================ */}
          <div className="mt-24 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="card"
                >
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-white/40">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
