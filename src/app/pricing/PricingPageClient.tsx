'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Check,
  Zap,
  Crown,
  GraduationCap,
  CreditCard,
  Loader2,
  ArrowRight,
  Star,
  Shield,
  Globe,
  Rocket,
  Users,
  BarChart3,
  Headphones,
  Mail,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRegion } from '@/lib/geo';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RegionSelector from '@/components/geo/RegionSelector';
import AgentAvatar from '@/components/brand/AgentAvatar';
import { AgentAvatarMini } from '@/components/brand/AgentAvatar';
import { AGENTS, type AgentId } from '@/lib/agents/registry';

// ---------------------------------------------------------------------------
// Agent showcase data
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

const allAgentIds: AgentId[] = ['scout', 'forge', 'archer', 'atlas', 'sage', 'sentinel'];

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

interface PlanDef {
  name: string;
  planKey: 'free' | 'pro' | 'max';
  icon: React.ElementType;
  tagline: string;
  badge?: string;
  recommended: boolean;
  features: string[];
}

const plans: PlanDef[] = [
  {
    name: 'Free',
    planKey: 'free',
    icon: Rocket,
    tagline: 'Great for trying out the platform',
    recommended: false,
    features: [
      '5 job applications per week',
      'All 6 AI agents unlocked',
      'AI-powered resume builder',
      'Interview prep',
      'Job search across 6+ platforms',
    ],
  },
  {
    name: 'Pro',
    planKey: 'pro',
    icon: Zap,
    tagline: 'Best for active job seekers',
    badge: 'Recommended',
    recommended: true,
    features: [
      '20 job applications per day',
      'All 6 AI agents unlocked',
      'Auto-apply automation',
      'ATS-optimized resumes per job',
      'Priority AI processing',
      'Email support',
    ],
  },
  {
    name: 'Max',
    planKey: 'max',
    icon: Crown,
    tagline: 'For power users and recruiters',
    recommended: false,
    features: [
      '50 job applications per day',
      'All 6 AI agents unlocked',
      'Maximum daily applications',
      'Advanced analytics',
      'Priority support',
      'Dedicated onboarding',
    ],
  },
];

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

const faqs = [
  {
    q: 'What do I get on the Free plan?',
    a: 'You get 5 job applications per week (resets every Monday) with full access to all 6 AI agents, the resume builder, interview prep, and job search across 6+ platforms.',
  },
  {
    q: 'What counts as a job application?',
    a: 'Each time you apply to a job through the platform counts as one application. On the Free plan this resets every Monday; on Pro and Max it resets daily.',
  },
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately and billing is prorated.',
  },
  {
    q: 'Are all agents available on every plan?',
    a: 'Yes! All 6 AI agents are fully unlocked on every plan, including Free. Paid plans give you more daily applications and premium features like auto-apply and analytics.',
  },
  {
    q: 'Can I get a refund?',
    a: 'We offer a 7-day money-back guarantee on all paid plans, subject to usage limits. See our Refund Policy for full terms.',
  },
  {
    q: 'Do you offer student pricing?',
    a: 'Yes! Students with a .edu email address qualify for a discount. Sign up and verify your student status to get the reduced rate.',
  },
];

// ---------------------------------------------------------------------------
// Skeleton component for loading state
// ---------------------------------------------------------------------------

function PricingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <section className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="h-6 w-48 mx-auto rounded-full bg-white/5 animate-pulse mb-6" />
            <div className="h-12 w-96 mx-auto rounded-xl bg-white/5 animate-pulse mb-4" />
            <div className="h-5 w-72 mx-auto rounded-lg bg-white/5 animate-pulse mb-8" />
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
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
  const [yearly, setYearly] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
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
    if (planKey === 'free') return 0;
    const planPricing = pricing[planKey as keyof typeof pricing];
    if (!planPricing || typeof planPricing !== 'object' || !('monthly' in planPricing)) return 0;
    const p = planPricing as { monthly: number; yearly: number };
    return isYearly ? Math.round(p.yearly / 12) : p.monthly;
  };

  const getPlanYearlyTotal = (planKey: string): number => {
    if (planKey === 'free') return 0;
    const planPricing = pricing[planKey as keyof typeof pricing];
    if (!planPricing || typeof planPricing !== 'object' || !('yearly' in planPricing)) return 0;
    return (planPricing as { yearly: number }).yearly;
  };

  const getPlanMonthlyPrice = (planKey: string): number => {
    if (planKey === 'free') return 0;
    const planPricing = pricing[planKey as keyof typeof pricing];
    if (!planPricing || typeof planPricing !== 'object' || !('monthly' in planPricing)) return 0;
    return (planPricing as { monthly: number }).monthly;
  };

  const yearlySavings = (planKey: string): number => {
    if (planKey === 'free') return 0;
    return getPlanMonthlyPrice(planKey) * 12 - getPlanYearlyTotal(planKey);
  };

  // ---- Stripe checkout ----
  const handleCheckout = async (planKey: string) => {
    if (planKey === 'free') return;
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
          plan: planKey.toUpperCase(),
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

  // ---- Current plan helper ----
  const userPlan = (session?.user as { plan?: string } | undefined)?.plan?.toLowerCase() ?? 'free';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f1a] via-[#0a0a0f] to-[#0a0a0f]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-radial from-blue-900/20 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Error Banner */}
          {checkoutError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400 text-center"
            >
              {checkoutError}
              <button
                onClick={() => setCheckoutError(null)}
                className="ml-3 text-red-400 hover:text-red-300 underline text-xs"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* HERO                                                         */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                <Globe className="w-3.5 h-3.5" />
                <span>Prices for {country} in {currency}</span>
              </div>
              <RegionSelector />
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <Shield className="w-3.5 h-3.5" />
              <span>7-day money-back guarantee on all paid plans</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4">
              Simple, transparent{' '}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                pricing
              </span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto mb-3 text-lg">
              All 6 AI agents included on every plan. Pick the application volume you need.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-full mt-6">
              <button
                onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  !yearly ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  yearly ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Yearly
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">
                  Save 2 months
                </span>
              </button>
            </div>
          </motion.div>

          {/* ============================================================ */}
          {/* PRICING CARDS                                                */}
          {/* ============================================================ */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
            {plans.map((plan, i) => {
              const displayPrice = getPlanPrice(plan.planKey, yearly);
              const savings = yearlySavings(plan.planKey);
              const isCurrentPlan = userPlan === plan.planKey;
              const isFree = plan.planKey === 'free';

              return (
                <motion.div
                  key={plan.planKey}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
                    plan.recommended
                      ? 'border-blue-500/30 bg-white/5 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20 lg:scale-105 z-10'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:shadow-md'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-full px-4 py-1 shadow-sm">
                        <Star className="w-3 h-3" />
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <plan.icon
                        className={`w-5 h-5 ${
                          plan.recommended ? 'text-blue-400' : 'text-gray-500'
                        }`}
                      />
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">{plan.tagline}</p>

                    {isFree ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-white">
                          {currencySymbol}0
                        </span>
                        <span className="text-sm text-gray-500">forever</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold text-white">
                            {currencySymbol}
                            {displayPrice.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500">
                            /mo{yearly ? ', billed yearly' : ''}
                          </span>
                        </div>
                        {yearly && savings > 0 && (
                          <p className="text-xs text-emerald-400 mt-1">
                            Save {currencySymbol}
                            {savings.toLocaleString()}/yr
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Agent avatars row */}
                  <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs font-semibold text-gray-400">
                        All 6 Agents Included
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {allAgentIds.map((agentId) => (
                        <AgentAvatarMini key={agentId} agentId={agentId} size={22} />
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  {isFree ? (
                    <Link
                      href={session ? '/dashboard' : '/signup'}
                      className="block text-center py-3 rounded-xl font-semibold text-sm border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      {isCurrentPlan ? 'Current Plan' : 'Get Started Free'}
                    </Link>
                  ) : isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl font-semibold text-sm bg-white/5 text-gray-500 cursor-default"
                    >
                      Current Plan
                    </button>
                  ) : !session ? (
                    <Link
                      href="/signup"
                      className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                        plan.recommended
                          ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90 shadow-sm'
                          : 'border border-white/10 text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      Get Started
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.planKey)}
                      disabled={loadingPlan === plan.planKey}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        plan.recommended
                          ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90 shadow-sm'
                          : 'border border-white/10 text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {loadingPlan === plan.planKey ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Upgrade to {plan.name}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}

                  {/* Money-back badge for paid plans */}
                  {!isFree && (
                    <p className="text-center mt-2.5">
                      <Link
                        href="/refund-policy"
                        className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <Shield className="w-3 h-3 inline mr-1 -mt-0.5" />
                        7-day money-back guarantee &middot; See terms
                      </Link>
                    </p>
                  )}

                  {/* Features list */}
                  <div className="mt-5 pt-5 border-t border-white/10 space-y-2.5 flex-1">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Money-back guarantee banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-20"
          >
            <p className="text-sm text-gray-500">
              All paid plans include a{' '}
              <Link href="/refund-policy" className="text-blue-400 hover:underline">
                7-day money-back guarantee
              </Link>
              {' '}&mdash; try risk-free.
            </p>
          </motion.div>

          {/* ============================================================ */}
          {/* MEET THE AGENTS                                              */}
          {/* ============================================================ */}
          <div className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl font-bold text-white mb-2">
                Meet Your{' '}
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  AI Agents
                </span>
              </h2>
              <p className="text-gray-500 text-sm">
                All 6 agents are included on every plan &mdash; even Free.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {agentShowcase.map((item, i) => {
                const agent = AGENTS[item.id];
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <AgentAvatar agentId={item.id} size={36} />
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {agent.displayName}
                        </h3>
                        <p className="text-[10px] font-medium text-gray-500">{agent.role}</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {item.highlights.map((h) => (
                        <li
                          key={h}
                          className="flex items-center gap-2 text-xs text-gray-400"
                        >
                          <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <span className="text-[10px] text-emerald-400 font-medium">
                        Included on all plans
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* PLAN COMPARISON TABLE                                        */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 max-w-4xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Compare Plans
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 pr-4 font-medium text-gray-500">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold text-white">Free</th>
                    <th className="text-center py-3 px-4 font-semibold text-blue-400">
                      Pro
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-white">Max</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4">Job applications</td>
                    <td className="text-center py-3 px-4">5/week</td>
                    <td className="text-center py-3 px-4 font-medium text-white">20/day</td>
                    <td className="text-center py-3 px-4 font-medium text-white">50/day</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4">AI agents</td>
                    <td className="text-center py-3 px-4">All 6</td>
                    <td className="text-center py-3 px-4">All 6</td>
                    <td className="text-center py-3 px-4">All 6</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4">Resume builder</td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4">Auto-apply automation</td>
                    <td className="text-center py-3 px-4 text-gray-600">&mdash;</td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4">ATS-optimized resumes per job</td>
                    <td className="text-center py-3 px-4 text-gray-600">&mdash;</td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4">Priority AI processing</td>
                    <td className="text-center py-3 px-4 text-gray-600">&mdash;</td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4">Advanced analytics</td>
                    <td className="text-center py-3 px-4 text-gray-600">&mdash;</td>
                    <td className="text-center py-3 px-4 text-gray-600">&mdash;</td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4">Support</td>
                    <td className="text-center py-3 px-4">Community</td>
                    <td className="text-center py-3 px-4">Email</td>
                    <td className="text-center py-3 px-4">Priority</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Dedicated onboarding</td>
                    <td className="text-center py-3 px-4 text-gray-600">&mdash;</td>
                    <td className="text-center py-3 px-4 text-gray-600">&mdash;</td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* ============================================================ */}
          {/* STUDENT DISCOUNT                                             */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 max-w-2xl mx-auto text-center"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex items-center justify-between flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-blue-400" />
                <div className="text-left">
                  <div className="font-semibold text-white">Student Discount</div>
                  <div className="text-sm text-gray-400">
                    {studentDiscount}% off with a .edu email
                  </div>
                </div>
              </div>
              <Link
                href="/signup"
                className="text-sm font-medium text-blue-400 border border-blue-500/30 rounded-xl px-5 py-2 hover:bg-blue-500/10 transition-colors"
              >
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
            className="mb-20 flex flex-wrap items-center justify-center gap-8 text-gray-400 text-sm"
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
              <span>7-day money-back</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>

          {/* ============================================================ */}
          {/* FAQS                                                         */}
          {/* ============================================================ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-sm text-gray-400">{faq.a}</p>
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
