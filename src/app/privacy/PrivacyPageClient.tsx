'use client';

import { motion } from 'framer-motion';
import { Shield, UserCheck, Brain, Cookie, Link2, Trash2, Scale, Baby, RefreshCw } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const sections = [
  {
    icon: UserCheck,
    title: 'Data We Collect',
    content: [
      { heading: 'Personal Information', text: 'Name, email address, phone number (optional), profile photo, career goals and target roles.' },
      { heading: 'Career Data', text: 'Resume content, portfolio projects, skill assessment responses, job preferences, application history.' },
      { heading: 'Usage Data', text: 'Pages visited, features used, time spent on platform, device information, IP address.' },
      { heading: 'AI Interaction Data', text: 'Queries to career coach, generated content preferences (PII redacted from logs).' },
    ],
  },
  {
    icon: Shield,
    title: 'How We Use Your Data',
    content: [
      { text: 'Provide and personalize career development features (assessments, career plans, resume building, job matching).' },
      { text: 'Generate AI-powered recommendations and coaching responses.' },
      { text: 'Improve platform accuracy through aggregated, anonymized analytics.' },
      { text: 'Send important account and service notifications.' },
      { text: 'Process payments and manage subscriptions via Stripe.' },
      { text: 'We never sell your personal data to third parties.' },
    ],
  },
  {
    icon: Brain,
    title: 'AI Processing',
    content: [
      { text: 'Your data may be processed by AI models (via OpenRouter) to generate assessments, career plans, and recommendations.' },
      { text: 'PII is automatically redacted from AI interaction logs before storage.' },
      { text: 'You can opt out of AI processing at any time in Settings.' },
      { text: 'AI-generated content (resumes, cover letters, career plans) belongs to you.' },
    ],
  },
  {
    icon: Cookie,
    title: 'Cookies & Tracking',
    content: [
      { heading: 'Essential cookies', text: 'Session management, authentication state, security tokens.' },
      { heading: 'Preference cookies', text: 'Theme settings, dashboard layout preferences, language.' },
      { heading: 'Analytics cookies', text: 'Page views, feature usage, performance metrics (anonymized).' },
      { text: 'You can manage cookie preferences through the cookie consent banner on first visit.' },
      { heading: 'Third-party cookies', text: 'Google OAuth (authentication only).' },
    ],
  },
  {
    icon: Link2,
    title: 'Third-Party Services',
    content: [
      { heading: 'Stripe', text: 'Payment processing (PCI DSS compliant).' },
      { heading: 'Google', text: 'OAuth authentication.' },
      { heading: 'OpenRouter', text: 'AI model API (no data retained by provider).' },
      { heading: 'Cloud infrastructure', text: 'Encrypted data storage and hosting.' },
      { text: 'All third parties are bound by data processing agreements.' },
    ],
  },
  {
    icon: Trash2,
    title: 'Data Retention & Deletion',
    content: [
      { text: 'Account data retained while your account is active.' },
      { text: 'Deleted accounts: Data permanently removed within 30 days.' },
      { text: 'AI interaction logs: Auto-purged after 90 days.' },
      { text: 'Payment records: Retained as required by law (typically 7 years).' },
      { text: 'Request data deletion anytime: Settings page or email privacy@oforo.ai.' },
    ],
  },
  {
    icon: Scale,
    title: 'Your Rights',
    content: [
      { heading: 'Access', text: 'Export your data at any time from Settings.' },
      { heading: 'Rectification', text: 'Update personal information in your profile.' },
      { heading: 'Erasure', text: 'Delete your account and all associated data.' },
      { heading: 'Portability', text: 'Download data in standard formats (JSON, PDF).' },
      { heading: 'Object', text: 'Opt out of AI processing or marketing communications.' },
      { text: 'For GDPR-specific rights, see our GDPR Compliance page.' },
    ],
  },
  {
    icon: Baby,
    title: "Children's Privacy",
    content: [
      { text: '3BOX AI is not intended for users under 16 years of age.' },
      { text: 'We do not knowingly collect data from children under 16.' },
      { text: 'If we discover such data has been collected, it will be deleted promptly.' },
    ],
  },
  {
    icon: RefreshCw,
    title: 'Changes to This Policy',
    content: [
      { text: 'We may update this policy periodically to reflect platform changes.' },
      { text: 'Significant changes will be communicated via email and in-app notification.' },
      { text: 'Continued use of the platform after changes constitutes acceptance.' },
      { text: 'Contact: privacy@oforo.ai for questions about this policy.' },
    ],
  },
];

export default function PrivacyPageClient() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Shield className="w-12 h-12 text-neon-green mx-auto mb-4" />
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
              Privacy <span className="gradient-text">Policy</span>
            </h1>
            <p className="text-white/40 max-w-xl mx-auto mb-4">
              Your career data is sensitive. Here is exactly how we collect, use, and protect it.
            </p>
            <span className="inline-block text-xs text-white/50 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
              Last updated: March 1, 2026
            </span>
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
                  <section.icon className="w-6 h-6 text-neon-green flex-shrink-0" />
                  <h2 className="text-xl font-bold">{section.title}</h2>
                </div>
                <div className="space-y-4 text-sm text-white/50 leading-relaxed">
                  {section.content.map((item, j) => (
                    <p key={j}>
                      {'heading' in item && item.heading && (
                        <span className="text-white font-semibold">{item.heading}: </span>
                      )}
                      {item.text}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
