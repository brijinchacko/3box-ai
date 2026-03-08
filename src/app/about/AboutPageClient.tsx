'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles, Users, Target, Zap, Heart, Globe, ArrowRight,
  Mail, Twitter, Linkedin, Github
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const team = [
  { name: 'OFORO AI', role: 'Founding Team', bio: 'Building the future of career intelligence with AI-first products.' },
];

const values = [
  { icon: Target, title: 'Mission-Driven', description: 'Every feature exists to help people land their dream jobs faster and with more confidence.' },
  { icon: Heart, title: 'User-First', description: 'We build what users need, not what looks good in demos. Real outcomes over vanity metrics.' },
  { icon: Zap, title: 'AI-Native', description: 'AI isn\'t an add-on — it\'s the core of every workflow, from assessment to application.' },
  { icon: Globe, title: 'Accessible', description: 'Career advancement tools should be available to everyone, everywhere. Free tier included.' },
];

export default function AboutPageClient() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-neon-purple/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <span className="badge-purple text-sm mb-4 inline-block">About 3BOX AI</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">
              Reimagining how people <span className="gradient-text">build careers</span>
            </h1>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              3BOX AI is a product of OFORO AI, built to transform the career development journey from fragmented tools into a unified, AI-powered operating system.
            </p>
          </motion.div>

          {/* Values */}
          <div id="features" className="grid sm:grid-cols-2 gap-6 mb-24 scroll-mt-24">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
              >
                <v.icon className="w-8 h-8 text-neon-blue mb-4" />
                <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-white/40">{v.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Story */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="card mb-24"
          >
            <h2 className="text-2xl font-bold mb-4">Our Story</h2>
            <div className="space-y-4 text-white/50 text-sm leading-relaxed">
              <p>
                Career development is broken. Job seekers juggle dozens of tools — one for assessments, another for learning, a third for resume building, and yet another for job applications. Each tool works in isolation, with no shared understanding of the user&apos;s goals or progress.
              </p>
              <p>
                3BOX AI was born from a simple question: what if one AI system could understand your entire career journey and guide you through every step? From identifying your skills and gaps, to building proof of your abilities, to connecting you with the right opportunities — all in one place.
              </p>
              <p>
                We call it a Career Operating System. Powered by AI, it adapts to you, learns from your progress, and continuously optimizes your path to employment. The result is faster career transitions, higher interview success rates, and a more confident job search experience.
              </p>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            id="contact"
            className="text-center scroll-mt-24"
          >
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="text-white/40 mb-6">We&apos;d love to hear from you — whether you&apos;re a user, partner, or investor.</p>
            <div className="flex items-center justify-center gap-4">
              <a href="mailto:hello@oforo.ai" className="btn-secondary text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" /> hello@oforo.ai
              </a>
              <a href="https://x.com/oforoai" target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm"><Twitter className="w-4 h-4" /></a>
              <a href="https://linkedin.com/company/oforo-ai" target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm"><Linkedin className="w-4 h-4" /></a>
              <a href="https://github.com/oforo-ai" target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm"><Github className="w-4 h-4" /></a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
