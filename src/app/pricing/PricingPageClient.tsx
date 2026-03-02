'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Crown, GraduationCap } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const plans = [
  {
    name: 'Basic',
    icon: Sparkles,
    description: 'Get started with AI career tools',
    monthlyPrice: 0,
    yearlyPrice: 0,
    badge: 'Free Forever',
    badgeColor: 'bg-white/10 text-white/60',
    popular: false,
    cta: 'Start Free',
    features: [
      { label: '2 skill assessments', included: true },
      { label: '50 AI credits / month', included: true },
      { label: '1 resume template', included: true },
      { label: '3 PDF exports / month', included: true },
      { label: 'Basic career plan', included: true },
      { label: 'AI coach (limited)', included: true },
      { label: 'Full assessment suite', included: false },
      { label: 'Unlimited resumes', included: false },
      { label: 'Job matching', included: false },
      { label: 'Interview prep', included: false },
      { label: 'Automation agent', included: false },
      { label: 'Priority processing', included: false },
    ],
  },
  {
    name: 'Pro',
    icon: Zap,
    description: 'Full career toolkit for serious job seekers',
    monthlyPrice: 19,
    yearlyPrice: 15,
    badge: 'Most Popular',
    badgeColor: 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20',
    popular: true,
    cta: 'Start Pro Trial',
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
      { label: 'Interview prep + mock interviews', included: true },
      { label: 'Automation agent', included: false },
      { label: 'Priority processing', included: false },
    ],
  },
  {
    name: 'Ultra',
    icon: Crown,
    description: 'Maximum automation and intelligence',
    monthlyPrice: 49,
    yearlyPrice: 39,
    badge: 'Maximum Power',
    badgeColor: 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20',
    popular: false,
    cta: 'Start Ultra Trial',
    features: [
      { label: 'Everything in Pro', included: true },
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

const faqs = [
  { q: 'Can I switch plans anytime?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.' },
  { q: 'Is there a student discount?', a: 'Yes! Students get 30% off Pro and Ultra plans with a valid .edu email address.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and wire transfer for enterprise plans.' },
  { q: 'Can I get a refund?', a: 'We offer a 14-day money-back guarantee on all paid plans. No questions asked.' },
  { q: 'What about OFORO AI employees?', a: 'OFORO AI team members automatically receive full Ultra access at no cost.' },
];

export default function PricingPageClient() {
  const [yearly, setYearly] = useState(true);

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-purple/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
              Simple, transparent <span className="gradient-text">pricing</span>
            </h1>
            <p className="text-white/40 max-w-xl mx-auto mb-8">
              Start free. Upgrade when you&apos;re ready to accelerate your career.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1 glass rounded-full">
              <button
                onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!yearly ? 'bg-white/10 text-white' : 'text-white/40'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${yearly ? 'bg-white/10 text-white' : 'text-white/40'}`}
              >
                Yearly <span className="badge-green text-[10px]">Save 20%</span>
              </button>
            </div>
          </motion.div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`card relative ${plan.popular ? 'border-neon-blue/30 neon-glow' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`badge ${plan.badgeColor} text-xs`}>{plan.badge}</span>
                  </div>
                )}

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
                    {plan.monthlyPrice > 0 && (
                      <span className="text-sm text-white/40">/month{yearly ? ' billed yearly' : ''}</span>
                    )}
                  </div>
                </div>

                <Link
                  href="/signup"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.popular
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                  {plan.features.map((f) => (
                    <div key={f.label} className="flex items-center gap-2 text-sm">
                      {f.included ? (
                        <Check className="w-4 h-4 text-neon-green flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-white/15 flex-shrink-0" />
                      )}
                      <span className={f.included ? 'text-white/60' : 'text-white/20'}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Student Discount */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 max-w-2xl mx-auto text-center"
          >
            <div className="glass p-6 flex items-center justify-between flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-neon-green" />
                <div className="text-left">
                  <div className="font-semibold">Student Discount</div>
                  <div className="text-sm text-white/40">30% off with a .edu email</div>
                </div>
              </div>
              <Link href="/signup" className="btn-secondary text-sm">Apply Student Discount</Link>
            </div>
          </motion.div>

          {/* FAQs */}
          <div className="mt-24 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="card">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-white/40">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
