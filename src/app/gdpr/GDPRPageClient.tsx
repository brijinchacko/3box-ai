'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  CheckCircle2, Globe, Shield, Download, UserCheck,
  Trash2, FileOutput, Ban, Lock
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const rights = [
  {
    icon: Download,
    title: 'Right to Access',
    description:
      'You can request a complete copy of all personal data we hold about you. Export your data anytime from Settings > Privacy > Export Data. We will respond to formal requests within 30 days.',
  },
  {
    icon: UserCheck,
    title: 'Right to Rectification',
    description:
      'You can update or correct your personal information at any time. Edit your profile in Settings or contact us to correct any inaccuracies in your data.',
  },
  {
    icon: Trash2,
    title: 'Right to Erasure',
    description:
      'Also known as the "right to be forgotten." You can delete your account and all associated data from Settings. Data is permanently removed within 30 days of deletion request.',
  },
  {
    icon: FileOutput,
    title: 'Right to Data Portability',
    description:
      'You can download your data in standard, machine-readable formats (JSON, PDF). This includes your profile, assessments, career plans, resumes, portfolio data, and AI agent activity history.',
  },
  {
    icon: Ban,
    title: 'Right to Object',
    description:
      'You can opt out of AI processing of your data at any time from Settings. You can also object to marketing communications and analytics tracking.',
  },
  {
    icon: Lock,
    title: 'Right to Restrict Processing',
    description:
      'You can request that we limit how we process your data while a dispute is being resolved. During restriction, your data is stored but not actively processed.',
  },
];

export default function GDPRPageClient() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-neon-blue/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <Globe className="w-12 h-12 text-neon-blue mx-auto mb-4" />
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
              GDPR <span className="gradient-text">Compliance</span>
            </h1>
            <p className="text-white/40 max-w-xl mx-auto mb-4">
              Your data rights under the General Data Protection Regulation
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-green/10 text-neon-green text-sm font-medium border border-neon-green/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Compliant
            </span>
          </motion.div>

          {/* Your Rights Under GDPR */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6">Your Rights Under GDPR</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {rights.map((r, i) => (
                <motion.div
                  key={r.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card"
                >
                  <r.icon className="w-8 h-8 text-neon-green mb-3" />
                  <h3 className="font-semibold mb-2">{r.title}</h3>
                  <p className="text-sm text-white/40">{r.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Legal Basis for Processing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card mb-16"
          >
            <h2 className="text-2xl font-bold mb-6">Legal Basis for Processing</h2>
            <p className="text-sm text-white/50 mb-4">
              We process your data under the following lawful bases:
            </p>
            <div className="space-y-4 text-sm text-white/50 leading-relaxed">
              <div>
                <h3 className="text-white font-semibold">Consent</h3>
                <p>When you create an account and agree to our terms. You can withdraw consent at any time.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold">Contract</h3>
                <p>To provide career development services including AI agent-powered job searching, resume optimization, application sending, and interview preparation.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold">Legitimate Interest</h3>
                <p>To improve our platform, prevent fraud, and ensure security. We balance our interests against your privacy rights.</p>
              </div>
            </div>
          </motion.div>

          {/* International Data Transfers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card mb-16"
          >
            <h2 className="text-2xl font-bold mb-6">International Data Transfers</h2>
            <div className="space-y-3">
              {[
                'Your data may be processed in countries outside the European Economic Area (EEA)',
                'We use Standard Contractual Clauses (SCCs) approved by the European Commission to safeguard transfers',
                'All data transfers are encrypted using TLS 1.3 in transit and AES-256 at rest',
                'Our cloud providers maintain EU-compliant data processing agreements',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-white/50">
                  <CheckCircle2 className="w-4 h-4 text-neon-green flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Data Protection Officer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card border-l-2 border-l-neon-blue mb-16"
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-neon-blue" />
              <h2 className="text-2xl font-bold">Data Protection Officer</h2>
            </div>
            <div className="space-y-3">
              {[
                'Our Data Protection Officer oversees GDPR compliance',
                'Contact: nishinth.m@wartens.com',
                'Response time: Within 30 days for formal requests',
                'You may also lodge a complaint with your local supervisory authority if you believe your rights have been violated',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-white/50">
                  <CheckCircle2 className="w-4 h-4 text-neon-blue flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-white/40 text-sm mb-4">For more information, review our full policies:</p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/privacy" className="btn-secondary text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="btn-secondary text-sm">
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
