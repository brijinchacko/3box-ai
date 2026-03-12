'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ShieldCheck, Clock, XCircle, Mail, CreditCard,
  CalendarDays, Coins, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const sections = [
  {
    icon: ShieldCheck,
    title: '7-Day Money-Back Guarantee',
    color: 'text-neon-green',
    content: [
      'All paid plans (Starter Duo, Job Hunter Pack, Full Squad) purchased directly through 3BOX AI include a 7-day money-back guarantee from the date of initial purchase.',
      'If you are not satisfied with the platform for any reason, you may request a full refund within 7 calendar days of your first payment.',
      'This guarantee applies to the initial subscription purchase only. Renewals (monthly or annual) are not covered under this guarantee.',
    ],
  },
  {
    icon: XCircle,
    title: 'When a Refund Is NOT Available',
    color: 'text-red-400',
    content: [
      'Your refund request will be denied if any of the following conditions apply:',
    ],
    list: [
      {
        icon: AlertTriangle,
        text: 'More than 30 AI job applications have been submitted via agents (Scout or Archer) during the subscription period.',
      },
      {
        icon: Coins,
        text: 'More than 50% of your monthly AI credit allocation has been consumed.',
      },
      {
        icon: CalendarDays,
        text: 'More than 7 calendar days have passed since the initial purchase date.',
      },
      {
        icon: CreditCard,
        text: 'Any add-on credit packs have been purchased. Credit pack purchases are non-refundable.',
      },
      {
        icon: XCircle,
        text: 'Your account was terminated or suspended for violating our Terms of Service.',
      },
      {
        icon: Clock,
        text: 'The subscription is a renewal (monthly or annual). The guarantee covers initial purchase only.',
      },
    ],
  },
  {
    icon: Mail,
    title: 'How to Request a Refund',
    color: 'text-neon-blue',
    content: [
      'To request a refund, send an email to refund@oforo.ai with the following information:',
    ],
    steps: [
      'Your registered account email address.',
      'Your order or subscription ID (found in Settings > Billing).',
      'A brief reason for the refund request (optional, helps us improve).',
    ],
    footer: 'Refund requests are reviewed within 2 business days. Approved refunds are processed within 5-10 business days and returned to your original payment method.',
  },
  {
    icon: CalendarDays,
    title: 'Annual Plan Refunds',
    color: 'text-neon-purple',
    content: [
      'Annual (yearly) subscriptions are eligible for a full refund within 7 calendar days of the initial purchase, provided the eligibility conditions above are met.',
      'No partial or prorated refunds are available after the 7-day window for annual plans.',
      'If you wish to cancel an annual plan after the refund window, you may do so from Settings. Your access continues until the end of the billing period.',
    ],
  },
  {
    icon: Coins,
    title: 'Credit Packs & Add-Ons',
    color: 'text-amber-400',
    content: [
      'One-time AI credit pack purchases (100, 500, or 1,000 credits) are non-refundable.',
      'Unlimited Daily Applications add-on purchases are non-refundable.',
      'Credits do not roll over between billing periods and are non-transferable.',
    ],
  },
  {
    icon: CreditCard,
    title: 'Refund Method',
    color: 'text-white/60',
    content: [
      'All approved refunds are returned to the original payment method used during purchase.',
      'Depending on your bank or payment provider, it may take an additional 5-10 business days for the refund to appear in your account after processing.',
      'If your original payment method is no longer available, contact refund@oforo.ai for alternative arrangements.',
    ],
  },
];

export default function RefundPolicyClient() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-neon-green/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <ShieldCheck className="w-12 h-12 text-neon-green mx-auto mb-4" />
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
              Refund <span className="gradient-text">Policy</span>
            </h1>
            <p className="text-white/40 max-w-xl mx-auto mb-4">
              Our 7-day money-back guarantee ensures you can try 3BOX AI risk-free.
            </p>
            <span className="inline-block text-xs text-white/50 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
              Last updated: March 11, 2026
            </span>
          </motion.div>

          {/* Summary box */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12 p-6 rounded-2xl border border-neon-green/20 bg-neon-green/[0.04]"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-neon-green" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-2">Quick Summary</h2>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neon-green flex-shrink-0" />
                    Full refund within 7 days of initial purchase
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    Not available if you used 30+ applications or 50%+ credits
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    Credit packs and add-ons are non-refundable
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-neon-blue flex-shrink-0" />
                    Email refund@oforo.ai to request a refund
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Content Cards */}
          <div className="space-y-8">
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card"
              >
                <div className="flex items-center gap-3 mb-4">
                  <section.icon className={`w-6 h-6 ${section.color} flex-shrink-0`} />
                  <h2 className="text-xl font-bold">{section.title}</h2>
                </div>
                <div className="space-y-3 text-sm text-white/50 leading-relaxed">
                  {section.content.map((text, j) => (
                    <p key={j}>{text}</p>
                  ))}
                  {section.list && (
                    <div className="space-y-3 mt-4">
                      {section.list.map((item, j) => (
                        <div key={j} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                          <item.icon className="w-4 h-4 text-red-400/60 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-white/50">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.steps && (
                    <ol className="space-y-2 mt-3">
                      {section.steps.map((step, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-neon-blue/10 text-neon-blue text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {j + 1}
                          </span>
                          <span className="text-sm text-white/50">{step}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {section.footer && (
                    <p className="mt-3 text-sm text-white/40 italic">{section.footer}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <p className="text-sm text-white/30 mb-4">
              Have questions about our refund policy?
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/contact"
                className="btn-secondary text-sm"
              >
                Contact Support
              </Link>
              <Link
                href="/terms"
                className="btn-ghost text-sm"
              >
                Terms of Service
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
