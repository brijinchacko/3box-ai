'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileSearch, DollarSign, FileText, ArrowRight, Sparkles } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const tools = [
  {
    title: 'ATS Resume Checker',
    description:
      'Paste your resume and get instant ATS compatibility score with improvement suggestions',
    icon: FileSearch,
    href: '/tools/ats-checker',
    cta: 'Check My Resume',
    gradient: 'from-neon-blue/20 to-neon-purple/20',
    iconColor: 'text-neon-blue',
    borderHover: 'hover:border-neon-blue/30',
  },
  {
    title: 'Free Resume Builder',
    description:
      'Build a clean, professional resume with live preview and PDF download. No signup required.',
    icon: FileText,
    href: '/tools/resume-builder',
    cta: 'Build My Resume',
    gradient: 'from-neon-green/20 to-neon-blue/20',
    iconColor: 'text-neon-green',
    borderHover: 'hover:border-neon-green/30',
  },
  {
    title: 'Salary Estimator',
    description:
      'Get AI-powered salary estimates based on role, location, and experience',
    icon: DollarSign,
    href: '/tools/salary-estimator',
    cta: 'Estimate Salary',
    gradient: 'from-neon-orange/20 to-neon-pink/20',
    iconColor: 'text-neon-orange',
    borderHover: 'hover:border-neon-orange/30',
  },
];

export default function ToolsPageClient() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-green/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="badge-neon text-xs mb-4 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              100% Free
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
              Free AI <span className="gradient-text">Career Tools</span>
            </h1>
            <p className="text-white/40 max-w-xl mx-auto text-lg">
              No signup required. Powered by AI.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tool Cards */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={tool.href} className="block group">
                <div className={`card h-full flex flex-col items-center text-center transition-all duration-300 ${tool.borderHover}`}>
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <tool.icon className={`w-8 h-8 ${tool.iconColor}`} />
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold mb-3">{tool.title}</h2>

                  {/* Description */}
                  <p className="text-sm text-white/40 mb-6 flex-1">{tool.description}</p>

                  {/* CTA Button */}
                  <span className="btn-primary inline-flex items-center gap-2 text-sm">
                    {tool.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
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
          <div className="glass p-8 max-w-xl mx-auto">
            <h3 className="text-xl font-bold mb-2">Want the full career experience?</h3>
            <p className="text-white/40 text-sm mb-6">
              Get AI-powered resume building, career planning, skill assessments, and more.
            </p>
            <Link href="/signup" className="btn-primary inline-flex items-center gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
