'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Users, Share2 } from 'lucide-react';
import WhatsAppShare from './WhatsAppShare';

interface PlacementCellBannerProps {
  countryCode: string;
}

export default function PlacementCellBanner({ countryCode }: PlacementCellBannerProps) {
  if (countryCode !== 'IN') return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative py-12 overflow-hidden"
      aria-label="Student Discount"
    >
      <div className="max-w-3xl mx-auto px-4">
        <div className="glass p-6 sm:p-8 relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 via-transparent to-neon-blue/5" aria-hidden="true" />

          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-green/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-8 h-8 text-neon-green" />
            </div>

            {/* Content */}
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-[10px] font-semibold uppercase tracking-wider mb-3">
                <Users className="w-3 h-3" /> 30% Student Discount
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1">Your Entire Batch is Using 3BOX AI</h3>
              <p className="text-sm text-white/40 mb-4">
                Students from IIT, NIT, VIT, BITS are getting placed faster with AI. Use your .edu.in or .ac.in email for automatic 30% off.
              </p>
              <WhatsAppShare
                message="Bro our batch is getting placed using this AI tool. It auto-applies to 20 jobs for free 🤯 Try it:"
                url="https://3box.ai?ref=wa-student"
                variant="primary"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
