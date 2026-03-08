'use client';

import { motion } from 'framer-motion';
import {
  Shield, Lock, Eye, Server, FileCheck, Globe, CheckCircle2,
  Key, Database, AlertTriangle
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const securityFeatures = [
  { icon: Lock, title: 'Encryption at Rest & in Transit', description: 'All data is encrypted using AES-256 at rest and TLS 1.3 in transit.' },
  { icon: Key, title: 'Secure Authentication', description: 'bcrypt password hashing, JWT tokens with short expiry, optional 2FA, and Google OAuth.' },
  { icon: Database, title: 'Data Isolation', description: 'Multi-tenant data isolation with row-level security policies in PostgreSQL.' },
  { icon: Eye, title: 'PII Redaction', description: 'AI interactions are logged with PII automatically redacted before storage.' },
  { icon: Server, title: 'SOC 2 Ready', description: 'Infrastructure and processes designed to meet SOC 2 Type II requirements.' },
  { icon: FileCheck, title: 'Audit Logging', description: 'Complete audit trail of all user actions, especially for automation features.' },
];

export default function SecurityPageClient() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <Shield className="w-12 h-12 text-neon-green mx-auto mb-4" />
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
              Security & <span className="gradient-text">Privacy</span>
            </h1>
            <p className="text-white/40 max-w-xl mx-auto">
              Your career data is sensitive. We treat it that way.
            </p>
          </motion.div>

          {/* Security Features */}
          <div className="grid sm:grid-cols-2 gap-6 mb-16">
            {securityFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
              >
                <f.icon className="w-8 h-8 text-neon-green mb-3" />
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-white/40">{f.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Privacy Policy */}
          <div id="privacy" className="card mb-8 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-6">Privacy Policy</h2>
            <div className="space-y-4 text-sm text-white/50 leading-relaxed">
              <h3 className="text-white font-semibold">Data We Collect</h3>
              <p>We collect information you provide directly: name, email, career profile data, assessment responses, resume content, and job preferences. We also collect usage analytics to improve the platform.</p>

              <h3 className="text-white font-semibold">How We Use Your Data</h3>
              <p>Your data is used exclusively to power your career features: assessments, career plans, resume generation, job matching, and AI coaching. We never sell your personal data to third parties.</p>

              <h3 className="text-white font-semibold">AI Processing</h3>
              <p>Your data may be processed by AI models (via OpenRouter) to generate assessments, career plans, and recommendations. PII is redacted from AI interaction logs. You can opt out of AI features at any time.</p>

              <h3 className="text-white font-semibold">Data Retention</h3>
              <p>Your data is retained as long as your account is active. You can request data deletion at any time through Settings or by contacting privacy@oforo.ai.</p>

              <h3 className="text-white font-semibold">Third-Party Services</h3>
              <p>We use Stripe for payments, Google for OAuth, and cloud providers for hosting. Each is bound by data processing agreements.</p>
            </div>
          </div>

          {/* Terms of Service */}
          <div id="terms" className="card mb-8 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-6">Terms of Service</h2>
            <div className="space-y-4 text-sm text-white/50 leading-relaxed">
              <h3 className="text-white font-semibold">Service Description</h3>
              <p>3BOX AI provides AI-powered career development tools including skill assessments, career planning, resume building, and job matching. The platform is provided &quot;as is&quot; and we continuously improve features.</p>

              <h3 className="text-white font-semibold">User Responsibilities</h3>
              <p>You agree to provide accurate information, maintain the security of your account, and use the platform in compliance with applicable laws. Automated access without permission is prohibited.</p>

              <h3 className="text-white font-semibold">Subscription & Billing</h3>
              <p>Paid plans are billed monthly or yearly as selected. You can cancel anytime. Refunds are available within 14 days of purchase. Plan changes take effect immediately with prorated billing.</p>

              <h3 className="text-white font-semibold">Automation Disclaimer</h3>
              <p>Ultra automation features apply to jobs on your behalf. You are responsible for reviewing automation settings and maintaining compliance with job platform terms. 3BOX AI provides tools, not guarantees of employment.</p>

              <h3 className="text-white font-semibold">Intellectual Property</h3>
              <p>You retain ownership of all content you create (resumes, portfolios, etc). We retain rights to the platform, AI models, and proprietary algorithms.</p>
            </div>
          </div>

          {/* GDPR */}
          <div id="gdpr" className="card scroll-mt-24">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Globe className="w-6 h-6 text-neon-blue" /> GDPR Compliance
            </h2>
            <div className="space-y-3">
              {[
                'Right to access: Export all your data at any time',
                'Right to rectification: Update your personal information in Settings',
                'Right to erasure: Delete your account and all associated data',
                'Right to data portability: Download data in standard formats',
                'Right to object: Opt out of AI processing at any time',
                'Data Protection Officer: dpo@oforo.ai',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-white/50">
                  <CheckCircle2 className="w-4 h-4 text-neon-green flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
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
