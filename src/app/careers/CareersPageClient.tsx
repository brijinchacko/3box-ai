'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Briefcase, Target, Heart, Zap, Globe, Rocket,
  Users, Coffee, MapPin, Mail, ArrowRight
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const values = [
  {
    icon: Target,
    color: 'text-neon-blue',
    title: 'Mission-Driven',
    description: 'Every feature exists to help people land their dream jobs faster and with more confidence.',
  },
  {
    icon: Heart,
    color: 'text-neon-pink',
    title: 'User-First',
    description: 'We build what users need, not what looks good in demos. Real outcomes over vanity metrics.',
  },
  {
    icon: Zap,
    color: 'text-neon-green',
    title: 'AI-Native',
    description: 'AI isn\'t an add-on \u2014 it\'s the core of every workflow, from assessment to application.',
  },
  {
    icon: Globe,
    color: 'text-neon-purple',
    title: 'Accessible',
    description: 'Career advancement tools should be available to everyone, everywhere. Free tier included.',
  },
];

const perks = [
  {
    icon: MapPin,
    title: 'Remote-First',
    description: 'Work from anywhere in the world. We believe in flexibility and trust.',
  },
  {
    icon: Rocket,
    title: 'Cutting-Edge AI',
    description: 'Work with the latest AI models and build products that directly impact people\u2019s careers.',
  },
  {
    icon: Users,
    title: 'Small Team, Big Impact',
    description: 'Join a lean, high-impact team where every contribution matters.',
  },
];

export default function CareersPageClient() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-neon-purple/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Briefcase className="w-12 h-12 text-neon-purple mx-auto mb-4" />
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">
              Join <span className="gradient-text">Our Team</span>
            </h1>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              Help us build the future of AI-powered career development
            </p>
          </motion.div>

          {/* Our Values */}
          <div className="mb-24">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl font-bold mb-8 text-center"
            >
              Our Values
            </motion.h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card"
                >
                  <v.icon className={`w-8 h-8 ${v.color} mb-4`} />
                  <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
                  <p className="text-sm text-white/40">{v.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Why Work With Us */}
          <div className="mb-24">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl font-bold mb-8 text-center"
            >
              Why Work With Us
            </motion.h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {perks.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card"
                >
                  <p.icon className="w-8 h-8 text-neon-blue mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
                  <p className="text-sm text-white/40">{p.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Open Positions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card text-center mb-24"
          >
            <Coffee className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">No Open Positions Right Now</h2>
            <p className="text-white/50 max-w-lg mx-auto mb-6">
              We&apos;re not actively hiring at the moment, but we&apos;re always looking for
              exceptional talent. If you&apos;re passionate about AI and career development,
              we&apos;d love to hear from you.
            </p>
            <p className="text-white/40 mb-6">
              Send your resume to{' '}
              <span className="text-white font-semibold">careers@oforo.ai</span>
            </p>
            <a
              href="mailto:careers@oforo.ai"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Mail className="w-4 h-4" />
              Get in Touch
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
