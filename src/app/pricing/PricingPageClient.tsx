'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Sparkles,
  Zap,
  Crown,
  GraduationCap,
  Rocket,
  CreditCard,
  Loader2,
  ArrowRight,
  Star,
  Shield,
  Brain,
  FileText,
  Target,
  Mic,
  Bot,
  BarChart3,
  Headphones,
  Briefcase,
  Users,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// ---------------------------------------------------------------------------
// Plan data
// ---------------------------------------------------------------------------

interface PlanFeature {
  label: string;
  included: boolean;
}

interface Plan {
  name: string;
  key: string;
  icon: React.ElementType;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  badge: string;
  badgeColor: string;
  popular: boolean;
  features: PlanFeature[];
}

const plans: Plan[] = [
  {
    name: 'Basic',
    key: 'basic',
    icon: Sparkles,
    description: 'Explore AI career tools at zero cost',
    monthlyPrice: 0,
    yearlyPrice: 0,
    badge: 'Free Forever',
    badgeColor: 'bg-white/10 text-white/60',
    popular: false,
    features: [
      { label: '1 skill assessment', included: true },
      { label: '10 AI credits / month', included: true },
      { label: '1 resume (watermarked)', included: true },
      { label: 'Basic career plan', included: true },
      { label: 'AI coach (limited)', included: true },
      { label: 'PDF resume export', included: false },
      { label: 'Full assessment suite', included: false },
      { label: 'Job matching', included: false },
      { label: 'Automation agent', included: false },
    ],
  },
  {
    name: 'Starter',
    key: 'starter',
    icon: Rocket,
    description: 'Everything you need to start your job search',
    monthlyPrice: 12,
    yearlyPrice: 10,
    badge: 'Best Value',
    badgeColor: 'bg-neon-green/10 text-neon-green border border-neon-green/20',
    popular: false,
    features: [
      { label: '5 skill assessments / month', included: true },
      { label: '100 AI credits / month', included: true },
      { label: '3 resume templates', included: true },
      { label: '5 PDF exports / month', included: true },
      { label: 'Full career plan', included: true },
      { label: 'AI coach (full access)', included: true },
      { label: 'Learning path', included: true },
      { label: 'Portfolio builder', included: false },
      { label: 'Job matching', included: false },
      { label: 'Automation agent', included: false },
    ],
  },
  {
    name: 'Pro',
    key: 'pro',
    icon: Zap,
    description: 'Full career toolkit for serious job seekers',
    monthlyPrice: 29,
    yearlyPrice: 24,
    badge: 'Most Popular',
    badgeColor: 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20',
    popular: true,
    features: [
      { label: 'Unlimited assessments', included: true },
      { label: '500 AI credits / month', included: true },
      { label: 'All resume templates', included: true },
      { label: 'Unlimited PDF exports', included: true },
      { label: 'Full career plan + timeline', included: true },
      { label: 'AI coach (full access)', included: true },
      { label: 'Adaptive learning path', included: true },
      { label: 'Portfolio builder', included: true },
      { label: 'Job matching + fit reports', included: true },
      { label: 'AI + Human mock interviews', included: true },
      { label: 'Human resume review (1/mo)', included: true },
      { label: 'Industry expert mentoring', included: true },
      { label: 'Automation agent', included: false },
      { label: 'Priority processing', included: false },
    ],
  },
  {
    name: 'Ultra',
    key: 'ultra',
    icon: Crown,
    description: 'Maximum automation and intelligence',
    monthlyPrice: 59,
    yearlyPrice: 49,
    badge: 'Maximum Power',
    badgeColor: 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20',
    popular: false,
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'Human resume verification by experts', included: true },
      { label: 'Unlimited human mock interviews', included: true },
      { label: 'Dedicated career mentor', included: true },
      { label: '1-on-1 expert coaching sessions', included: true },
      { label: 'Unlimited AI credits', included: true },
      { label: 'Automation agent', included: true },
      { label: 'Auto-apply to jobs', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Priority AI processing', included: true },
      { label: 'LinkedIn optimizer', included: true },
      { label: 'Cover letter generator', included: true },
      { label: 'Role simulator', included: true },
      { label: 'Market readiness forecasting', included: true },
      { label: 'Verified credentials', included: true },
      { label: 'Premium support', included: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Credit Packs
// ---------------------------------------------------------------------------

interface CreditPack {
  id: string;
  credits: number;
  price: number;
  popular: boolean;
}

const creditPacks: CreditPack[] = [
  { id: 'pack_100', credits: 100, price: 5, popular: false },
  { id: 'pack_500', credits: 500, price: 15, popular: true },
  { id: 'pack_1000', credits: 1000, price: 25, popular: false },
];

// ---------------------------------------------------------------------------
// Comparison table data
// ---------------------------------------------------------------------------

interface ComparisonRow {
  feature: string;
  icon: React.ElementType;
  basic: string;
  starter: string;
  pro: string;
  ultra: string;
}

const comparisonRows: ComparisonRow[] = [
  { feature: 'Assessments', icon: Brain, basic: '1', starter: '5 / mo', pro: 'Unlimited', ultra: 'Unlimited' },
  { feature: 'AI Credits', icon: Sparkles, basic: '10 / mo', starter: '100 / mo', pro: '500 / mo', ultra: 'Unlimited' },
  { feature: 'Resume Templates', icon: FileText, basic: '1 (watermarked)', starter: '3', pro: 'All', ultra: 'All' },
  { feature: 'PDF Exports', icon: FileText, basic: '--', starter: '5 / mo', pro: 'Unlimited', ultra: 'Unlimited' },
  { feature: 'Career Plan', icon: Target, basic: 'Basic', starter: 'Full', pro: 'Full + Timeline', ultra: 'Full + Timeline' },
  { feature: 'AI Coach', icon: Bot, basic: 'Limited', starter: 'Full', pro: 'Full', ultra: 'Full' },
  { feature: 'Learning Path', icon: Rocket, basic: '--', starter: 'check', pro: 'Adaptive', ultra: 'Adaptive' },
  { feature: 'Portfolio', icon: Briefcase, basic: '--', starter: '--', pro: 'check', ultra: 'check' },
  { feature: 'Job Matching', icon: Target, basic: '--', starter: '--', pro: 'check', ultra: 'check' },
  { feature: 'Interview Prep', icon: Mic, basic: '--', starter: '--', pro: 'check', ultra: 'check' },
  { feature: 'Auto-Apply', icon: Zap, basic: '--', starter: '--', pro: '--', ultra: 'check' },
  { feature: 'Priority AI', icon: BarChart3, basic: '--', starter: '--', pro: '--', ultra: 'check' },
  { feature: 'Human Mock Interviews', icon: Users, basic: '--', starter: '--', pro: '1 / mo', ultra: 'Unlimited' },
  { feature: 'Human Resume Review', icon: Users, basic: '--', starter: '--', pro: '1 / mo', ultra: 'Unlimited' },
  { feature: 'Career Mentor', icon: Users, basic: '--', starter: '--', pro: '--', ultra: 'Dedicated' },
  { feature: 'Support', icon: Headphones, basic: 'Community', starter: 'Email', pro: 'Priority', ultra: 'Premium' },
];

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

const faqs = [
  {
    q: 'What can I do on the free plan?',
    a: 'The Basic plan gives you 1 skill assessment, 10 AI credits per month, a watermarked resume, a basic career plan, and limited AI coaching -- perfect for trying out the platform.',
  },
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.',
  },
  {
    q: 'Is there a student discount?',
    a: 'Yes! Students get 30% off Starter, Pro, and Ultra plans with a valid .edu email address.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards, PayPal, and wire transfer for enterprise plans. Payments are processed securely through Stripe.',
  },
  {
    q: 'Can I buy extra AI credits without upgrading?',
    a: 'Absolutely. You can purchase credit packs (100, 500, or 1,000 credits) any time as a one-time purchase. They never expire.',
  },
  {
    q: 'Can I get a refund?',
    a: 'We offer a 14-day money-back guarantee on all paid plans. No questions asked.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PricingPageClient() {
  const [yearly, setYearly] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const { data: session } = useSession();

  // ---- Stripe checkout for plans ----
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handlePlanCheckout = async (plan: Plan) => {
    if (plan.key === 'basic') return;
    if (!session) {
      window.location.href = '/login?redirect=/pricing';
      return;
    }
    setLoadingPlan(plan.key);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkout',
          plan: plan.key,
          interval: yearly ? 'yearly' : 'monthly',
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.error) {
        setCheckoutError(data.error === 'Price configuration not found for the selected plan and interval'
          ? 'Payment system is being configured. Please try again shortly or contact support.'
          : data.error === 'Authentication required'
          ? 'Please log in first to upgrade your plan.'
          : data.error);
      }
    } catch (err) {
      console.error('Checkout error', err);
      setCheckoutError('Unable to connect to payment service. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  // ---- Stripe checkout for credit packs ----
  const handleCreditCheckout = async (pack: CreditPack) => {
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

  // ---- Render helpers ----

  const renderComparisonCell = (value: string) => {
    if (value === 'check') {
      return <Check className="w-5 h-5 text-neon-green mx-auto" />;
    }
    if (value === '--') {
      return <X className="w-5 h-5 text-white/15 mx-auto" />;
    }
    return <span className="text-white/70 text-sm">{value}</span>;
  };

  const planCTA = (plan: Plan) => {
    if (plan.key === 'basic') return 'Start Free';
    if (session) return `Upgrade to ${plan.name}`;
    return `Start ${plan.name} Trial`;
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-purple/8 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-neon-blue/5 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Checkout Error Banner */}
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
          {/* HEADER                                                       */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 badge-neon mb-6">
              <Star className="w-3.5 h-3.5" />
              <span>14-day money-back guarantee</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4">
              Simple, transparent{' '}
              <span className="gradient-text">pricing</span>
            </h1>
            <p className="text-white/40 max-w-xl mx-auto mb-8 text-lg">
              Start free. Upgrade when you&apos;re ready to accelerate your career.
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
          {/* PLANS GRID                                                   */}
          {/* ============================================================ */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`card relative flex flex-col ${
                  plan.popular ? 'border-neon-blue/30 neon-glow lg:scale-105 z-10' : ''
                }`}
              >
                {/* Badge */}
                {(plan.popular || plan.badge) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`badge ${plan.badgeColor} text-xs whitespace-nowrap`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan info */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <plan.icon className="w-5 h-5 text-neon-blue" />
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-white/40 mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">
                      ${yearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    {plan.monthlyPrice > 0 ? (
                      <span className="text-sm text-white/40">
                        /mo{yearly ? ', billed yearly' : ''}
                      </span>
                    ) : (
                      <span className="text-sm text-white/40">forever</span>
                    )}
                  </div>
                  {yearly && plan.monthlyPrice > 0 && (
                    <p className="text-xs text-neon-green/70 mt-1">
                      Save ${(plan.monthlyPrice - plan.yearlyPrice) * 12}/yr
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                {plan.key === 'basic' ? (
                  <Link
                    href="/signup"
                    className="block text-center py-3 rounded-xl font-semibold text-sm transition-all btn-secondary"
                  >
                    Start Free
                  </Link>
                ) : !session ? (
                  <Link
                    href="/signup"
                    className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                      plan.popular ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    Start {plan.name} Trial
                  </Link>
                ) : (
                  <button
                    onClick={() => handlePlanCheckout(plan)}
                    disabled={loadingPlan === plan.key}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      plan.popular ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {loadingPlan === plan.key ? (
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

                {/* Features list */}
                <div className="mt-6 pt-6 border-t border-white/5 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <div key={f.label} className="flex items-center gap-2 text-sm">
                      {f.included ? (
                        <Check className="w-4 h-4 text-neon-green flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-white/15 flex-shrink-0" />
                      )}
                      <span className={f.included ? 'text-white/60' : 'text-white/20'}>
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* ============================================================ */}
          {/* HUMAN + AI SECTION                                           */}
          {/* ============================================================ */}
          {/* Human + AI Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 max-w-4xl mx-auto"
          >
            <div className="glass p-8 bg-gradient-to-br from-neon-purple/5 to-neon-blue/5 border-neon-purple/20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 badge-purple mb-4">
                  <Users className="w-3.5 h-3.5" />
                  <span>Not just AI — Real humans too</span>
                </div>
                <h2 className="text-3xl font-bold mb-3">
                  AI-powered, <span className="gradient-text">human-verified</span>
                </h2>
                <p className="text-white/40 max-w-lg mx-auto">
                  Our Pro and Ultra plans combine the speed of AI with the expertise of real industry professionals.
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-blue/5 flex items-center justify-center mx-auto mb-3">
                    <Mic className="w-7 h-7 text-neon-blue" />
                  </div>
                  <h3 className="font-semibold mb-1">Mock Interviews</h3>
                  <p className="text-sm text-white/40">Practice with real industry experts who give personalized feedback</p>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-green/5 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-7 h-7 text-neon-green" />
                  </div>
                  <h3 className="font-semibold mb-1">Resume Verification</h3>
                  <p className="text-sm text-white/40">Human recruiters review and verify your resume for accuracy</p>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-purple/5 flex items-center justify-center mx-auto mb-3">
                    <Headphones className="w-7 h-7 text-neon-purple" />
                  </div>
                  <h3 className="font-semibold mb-1">Expert Mentoring</h3>
                  <p className="text-sm text-white/40">1-on-1 sessions with career coaches from top companies</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ============================================================ */}
          {/* COMPARISON TABLE                                             */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-28 max-w-6xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center mb-2">
              Full feature <span className="gradient-text">comparison</span>
            </h2>
            <p className="text-white/40 text-center mb-10">
              See exactly what you get at every tier.
            </p>

            <div className="glass overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-5 font-semibold text-white/60">Feature</th>
                    {plans.map((p) => (
                      <th
                        key={p.key}
                        className={`py-4 px-4 text-center font-bold ${
                          p.popular ? 'text-neon-blue' : 'text-white/80'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <p.icon className="w-4 h-4" />
                          {p.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, idx) => (
                    <tr
                      key={row.feature}
                      className={idx % 2 === 0 ? 'bg-white/[0.02]' : ''}
                    >
                      <td className="py-3 px-5 flex items-center gap-2 text-white/60">
                        <row.icon className="w-4 h-4 text-white/30 flex-shrink-0" />
                        {row.feature}
                      </td>
                      <td className="py-3 px-4 text-center">{renderComparisonCell(row.basic)}</td>
                      <td className="py-3 px-4 text-center">{renderComparisonCell(row.starter)}</td>
                      <td className={`py-3 px-4 text-center ${plans[2].popular ? 'bg-neon-blue/5' : ''}`}>
                        {renderComparisonCell(row.pro)}
                      </td>
                      <td className="py-3 px-4 text-center">{renderComparisonCell(row.ultra)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* ============================================================ */}
          {/* BUY AI CREDITS                                               */}
          {/* ============================================================ */}
          <motion.div
            id="credits"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-28 max-w-4xl mx-auto scroll-mt-24"
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
                  <div className="text-2xl font-bold mb-4">${pack.price}</div>
                  <p className="text-xs text-white/30 mb-5">
                    ${(pack.price / pack.credits * 100).toFixed(1)}&cent; per credit
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
                    30% off with a .edu email
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
