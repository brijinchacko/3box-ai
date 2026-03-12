'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import UpgradeModal from '@/components/ui/UpgradeModal';
import LoadingEngagement from '@/components/tools/LoadingEngagement';

interface ToolPageLayoutProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  gradient: string;
  /** Radial glow color class, e.g. "from-neon-green/8" */
  glowColor?: string;
  /** Whether to show the upgrade modal */
  showUpgrade: boolean;
  onCloseUpgrade: () => void;
  /** Service name for upgrade modal */
  serviceName: string;
  /** Agent attribution — which agent powers this tool */
  agentName?: string;
  agentColor?: string;
  agentGradient?: string;
  /** Loading state — shows engaging loading UX when true */
  loading?: boolean;
  /** Tool slug for loading tips (e.g. 'cold-email-generator') */
  toolSlug?: string;
  children: React.ReactNode;
}

export default function ToolPageLayout({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  gradient,
  glowColor = 'from-neon-blue/8',
  showUpgrade,
  onCloseUpgrade,
  serviceName,
  agentName,
  agentColor,
  agentGradient,
  loading,
  toolSlug,
  children,
}: ToolPageLayoutProps) {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-20 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial ${glowColor} via-transparent to-transparent rounded-full blur-3xl`} />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            All Tools
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-5`}>
              <Icon className={`w-8 h-8 ${iconColor}`} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">{title}</h1>
            <p className="text-white/40 text-lg max-w-xl mx-auto">{subtitle}</p>

            {/* Agent attribution */}
            {agentName && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${agentGradient || gradient} flex items-center justify-center`}>
                  <span className="text-[9px] font-bold text-white">{agentName[0]}</span>
                </div>
                <span className="text-sm text-white/40">
                  Powered by <span className={`font-semibold ${agentColor || 'text-white'}`}>Agent {agentName}</span>
                </span>
              </div>
            )}

            <span className="badge-neon text-xs mt-4 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              2 Free Uses
            </span>
          </motion.div>

          {/* Loading engagement overlay */}
          {loading && toolSlug && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card mb-6"
            >
              <LoadingEngagement
                toolSlug={toolSlug}
                agentName={agentName ? `Agent ${agentName}` : undefined}
              />
            </motion.div>
          )}

          {/* Tool content */}
          {children}

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <div className="glass p-6 max-w-md mx-auto">
              <h3 className="text-lg font-bold mb-1.5">Need unlimited access?</h3>
              <p className="text-white/40 text-sm mb-4">
                Subscribe and unlock unlimited uses of all AI tools + 6 AI agents.
              </p>
              <Link href="/pricing" className="btn-primary inline-flex items-center gap-2 text-sm">
                View Plans
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={onCloseUpgrade}
        serviceName={serviceName}
      />
    </div>
  );
}
