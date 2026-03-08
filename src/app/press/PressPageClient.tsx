'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Newspaper, Palette, Calendar, ExternalLink, Download,
  Mail, Twitter, Linkedin, Github
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const brandColors = [
  { name: 'Neon Blue', hex: '#00d4ff' },
  { name: 'Neon Purple', hex: '#a855f7' },
  { name: 'Neon Green', hex: '#00ff88' },
  { name: 'Neon Pink', hex: '#ff0080' },
];

const pressReleases = [
  {
    date: 'March 3, 2026',
    title: '3BOX AI Launches AI Career Operating System',
    description:
      'OFORO AI introduces 3BOX AI, a comprehensive AI-powered platform that transforms career development from skill assessment to job placement.',
  },
  {
    date: 'February 2026',
    title: 'OFORO AI Announces 3BOX AI Development',
    description:
      'OFORO AI begins development of its flagship career AI platform, designed to unify the fragmented career development tool landscape.',
  },
];

const socialLinks = [
  { icon: Twitter, href: 'https://x.com/oforoai', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/company/oforo-ai', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com/oforo-ai', label: 'GitHub' },
];

export default function PressPageClient() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-neon-blue/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Newspaper className="w-12 h-12 text-neon-blue mx-auto mb-4" />
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">
              Press &amp; <span className="gradient-text">Media</span>
            </h1>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              Resources for journalists and media professionals
            </p>
          </motion.div>

          {/* About 3BOX AI */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card mb-12"
          >
            <h2 className="text-2xl font-bold mb-4">About 3BOX AI</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              3BOX AI is the AI-powered career operating system built by OFORO AI. We help job
              seekers transform their careers with AI-driven skill assessments, personalized career
              plans, ATS-optimized resume building, portfolio creation, and intelligent job matching.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Founded', value: '2025' },
                { label: 'Product', value: 'AI Career Platform' },
                { label: 'Website', value: '3box.ai' },
                { label: 'Parent Company', value: 'OFORO AI' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-white/40">
                  <span className="text-white font-medium">{item.label}:</span>
                  {item.value}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Brand Assets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-8 h-8 text-neon-purple" />
              <h2 className="text-2xl font-bold">Brand Guidelines</h2>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-3">Brand Colors</h3>
              <div className="flex flex-wrap gap-4">
                {brandColors.map((c) => (
                  <div key={c.hex} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border border-white/10"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div className="text-sm">
                      <span className="text-white/50">{c.name}</span>{' '}
                      <span className="text-white/30 font-mono">{c.hex}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-2">Logo Usage</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                The 3BOX AI logo should be used on dark backgrounds. Maintain clear space around
                the logo equal to the height of the &apos;n&apos; character.
              </p>
            </div>

            <p className="text-sm text-white/40">
              For brand assets and logo files, contact{' '}
              <a href="mailto:press@oforo.ai" className="text-neon-blue hover:underline">
                press@oforo.ai
              </a>
            </p>
          </motion.div>

          {/* Latest News */}
          <div className="mb-12">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl font-bold mb-8 text-center"
            >
              Latest News
            </motion.h2>
            <div className="space-y-6">
              {pressReleases.map((pr, i) => (
                <motion.div
                  key={pr.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-neon-blue" />
                    <span className="text-xs text-white/30">{pr.date}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{pr.title}</h3>
                  <p className="text-sm text-white/40">{pr.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Media Contact */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold mb-4">Media Contact</h2>
            <p className="text-white/40 mb-6">
              For press inquiries, interviews, or media resources:
            </p>
            <a
              href="mailto:press@oforo.ai"
              className="inline-flex items-center gap-2 text-xl font-semibold text-neon-blue hover:underline mb-6"
            >
              <Mail className="w-5 h-5" />
              press@oforo.ai
            </a>
            <div className="flex items-center justify-center gap-3">
              {socialLinks.map((s) => (
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
        </div>
      </section>

      <Footer />
    </div>
  );
}
