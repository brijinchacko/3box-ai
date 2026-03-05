'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Mail, MessageSquare, Handshake, HelpCircle,
  Activity, Shield, Twitter, Linkedin, Github, ArrowRight
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const contactMethods = [
  {
    icon: Mail,
    color: 'text-neon-blue',
    title: 'General Inquiries',
    description: 'For questions about NXTED AI, our mission, or anything else.',
    action: { type: 'email' as const, value: 'hello@oforo.ai' },
  },
  {
    icon: MessageSquare,
    color: 'text-neon-green',
    title: 'Support',
    description: 'Need help with your account or features? Visit our Help Center for instant answers.',
    action: { type: 'link' as const, label: 'Visit Help Center', href: '/help' },
  },
  {
    icon: Handshake,
    color: 'text-neon-purple',
    title: 'Partnerships',
    description:
      'Interested in partnering with us? We\'re open to collaborations with educational institutions, employers, and career services.',
    action: { type: 'email' as const, value: 'partnerships@oforo.ai' },
  },
];

const socials = [
  { icon: Twitter, href: 'https://x.com/oforoai', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/company/oforo-ai', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com/oforo-ai', label: 'GitHub' },
];

const quickLinks = [
  { icon: HelpCircle, title: 'Help Center', description: 'Documentation, FAQs, and guides.', href: '/help' },
  { icon: Activity, title: 'System Status', description: 'Real-time platform health monitoring.', href: '/status' },
  { icon: Shield, title: 'Security', description: 'How we protect your data.', href: '/security' },
];

export default function ContactPageClient() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-neon-blue/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <Mail className="w-12 h-12 text-neon-blue mx-auto mb-4" />
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-white/40 max-w-xl mx-auto">
              We&apos;d love to hear from you
            </p>
          </motion.div>

          {/* Contact Methods */}
          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            {contactMethods.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
              >
                <m.icon className={`w-8 h-8 ${m.color} mb-3`} />
                <h3 className="font-semibold mb-2">{m.title}</h3>
                <p className="text-sm text-white/40 mb-4">{m.description}</p>
                {m.action.type === 'email' ? (
                  <a
                    href={`mailto:${m.action.value}`}
                    className="text-sm text-neon-blue hover:underline"
                  >
                    {m.action.value}
                  </a>
                ) : (
                  <Link
                    href={m.action.href}
                    className="inline-flex items-center gap-1 text-sm text-neon-green hover:underline"
                  >
                    {m.action.label} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          {/* Connect With Us */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl font-bold mb-3">Connect With Us</h2>
            <p className="text-white/40 text-sm mb-6">
              Follow us for updates, tips, and career insights.
            </p>
            <div className="flex items-center justify-center gap-4">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                >
                  <s.icon className="w-4 h-4 text-white/50" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-6">Quick Links</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {quickLinks.map((l, i) => (
                <motion.div
                  key={l.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={l.href} className="card block group">
                    <l.icon className="w-6 h-6 text-neon-blue mb-2" />
                    <h3 className="font-semibold mb-1 group-hover:text-neon-blue transition-colors">{l.title}</h3>
                    <p className="text-sm text-white/40">{l.description}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
