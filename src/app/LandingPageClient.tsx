'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles, Brain, Target, BookOpen, FileText, Briefcase, Shield,
  ChevronRight, ArrowRight, Zap, TrendingUp, Users, Star,
  CheckCircle2, BarChart3, Bot, Cpu, Award
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

const pipelineSteps = [
  { icon: Brain, label: 'Assess', desc: 'AI skill assessment maps your abilities', color: 'from-blue-500 to-cyan-400' },
  { icon: Target, label: 'Plan', desc: 'Personalized AI career roadmap', color: 'from-purple-500 to-pink-400' },
  { icon: BookOpen, label: 'Learn', desc: 'Adaptive AI learning paths', color: 'from-green-500 to-emerald-400' },
  { icon: Award, label: 'Certify', desc: 'AI-verified credentials & proof of skills', color: 'from-yellow-500 to-orange-400' },
  { icon: Briefcase, label: 'Connect', desc: 'AI job matching & automated applications', color: 'from-red-500 to-pink-400' },
];

const features = [
  {
    icon: Cpu,
    title: 'Proof-of-Skill Engine',
    description: 'Complete real AI-scored projects that become verifiable evidence of your abilities. Employers trust proof over claims — build yours today.',
    badge: 'Unique',
  },
  {
    icon: Bot,
    title: 'Career Twin AI Coach',
    description: 'A persistent AI career coach that learns your goals, tracks progress, and predicts your hire probability with machine learning.',
    badge: 'Innovative',
  },
  {
    icon: BarChart3,
    title: 'Market Readiness Score',
    description: 'Real-time AI employability scoring against market demand. Know exactly where you stand and what skills to improve for your target role.',
    badge: 'Data-Driven',
  },
  {
    icon: TrendingUp,
    title: 'AI Role Simulator',
    description: 'Explore alternate career pathways with AI career transition planning. See probability, timeline, and skill requirements for each path.',
    badge: 'Exploratory',
  },
  {
    icon: FileText,
    title: 'ATS-Optimized AI Resume Builder',
    description: 'Free AI resume builder that generates and tailors your resume for each job application. Beat the ATS with AI keyword optimization every time.',
    badge: 'Essential',
  },
  {
    icon: Zap,
    title: 'Automated Job Application Agent',
    description: 'AI-powered automated job applications with compliance controls, audit trails, smart targeting, and personalized cover letters for every role.',
    badge: 'Ultra',
  },
];

const stats = [
  { value: '10x', label: 'Faster AI skill assessment' },
  { value: '85%', label: 'Interview success rate' },
  { value: '3 weeks', label: 'Avg time to first job offer' },
  { value: '50k+', label: 'Career paths mapped by AI' },
];

const testimonials = [
  { name: 'Sarah K.', role: 'Now AI Engineer @ Scale AI', text: 'NXTED AI skill assessment mapped my gaps perfectly. The proof-of-skill projects made my portfolio unstoppable.', rating: 5 },
  { name: 'Marcus T.', role: 'Data Scientist @ Stripe', text: 'The Career Twin AI predicted I was 78% ready. After following the AI career plan, I landed 3 offers in 2 weeks.', rating: 5 },
  { name: 'Priya R.', role: 'Full Stack Dev @ Vercel', text: 'Ultra auto-apply saved me 40+ hours of job searching. The AI tailored each application and resume perfectly.', rating: 5 },
];

const howItWorks = [
  { step: '01', title: 'Tell us your dream role', desc: 'Start with your career goal. Our AI career coach adapts every tool and recommendation from here.' },
  { step: '02', title: 'Get AI skill assessment', desc: 'Adaptive AI assessment across MCQ, real-world scenarios, and hands-on tasks. See your skill chart and gap analysis instantly.' },
  { step: '03', title: 'Follow your AI career plan', desc: 'A personalized career roadmap with milestones, proof-of-work projects, and curated learning paths — all tailored to your skill gaps.' },
  { step: '04', title: 'Build proof-of-skills portfolio', desc: 'Complete AI-scored projects that verify your abilities. Build a portfolio with verified credentials that proves you can do the work.' },
  { step: '05', title: 'AI job matching and auto-apply', desc: 'AI matches you to jobs with fit scores, tailors your resume for each role, and optionally automates applications.' },
];

export default function LandingPageClient() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ─── Hero Section ─────────────────────────── */}
      <main>
        <section className="relative pt-32 pb-20 overflow-hidden" aria-label="AI Career Platform Hero">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-grid opacity-50" aria-hidden="true" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-blue/10 via-neon-purple/5 to-transparent rounded-full blur-3xl" aria-hidden="true" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <span className="badge-neon text-sm">
                  <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" /> Powered by OFORO AI
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
              >
                Your AI Career
                <br />
                <span className="gradient-text">Operating System</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 text-balance"
              >
                Free AI resume builder, personalized career coaching, skill assessment,
                adaptive learning paths, and AI-powered job matching — from skill assessment
                to dream job, all in one platform.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link href="/signup" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
                  Start Free AI Skill Assessment <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
                <Link href="/pricing" className="btn-secondary text-lg px-8 py-4">
                  View Pricing
                </Link>
              </motion.div>
            </header>

            {/* Pipeline Animation */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-20 max-w-4xl mx-auto"
              aria-label="AI Career Pipeline: Assess, Plan, Learn, Certify, Connect"
            >
              <div className="flex items-center justify-between relative">
                {/* Connecting line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-neon-blue/30 via-neon-purple/30 to-neon-pink/30 -translate-y-1/2 hidden md:block" aria-hidden="true" />

                {pipelineSteps.map((step, i) => (
                  <motion.div
                    key={step.label}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col items-center relative z-10"
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-3 shadow-lg`}>
                      <step.icon className="w-7 h-7 text-white" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-semibold text-white">{step.label}</span>
                    <span className="text-xs text-white/40 mt-1 hidden sm:block">{step.desc}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── Stats Bar ────────────────────────────── */}
        <section className="py-16 border-y border-white/5" aria-label="AI Career Platform Statistics">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                  <div className="text-sm text-white/40">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features Grid ────────────────────────── */}
        <section id="features" className="py-24" aria-label="AI Career Platform Features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="section-heading mb-4">
                AI-Powered Career Tools to <span className="gradient-text">Land Your Dream Job</span>
              </h2>
              <p className="text-white/40 max-w-2xl mx-auto">
                Six AI career features that no other job search platform offers — from AI resume building to automated job applications.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.article
                  key={feature.title}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="card group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center group-hover:from-neon-blue/30 group-hover:to-neon-purple/30 transition-colors">
                      <feature.icon className="w-6 h-6 text-neon-blue" aria-hidden="true" />
                    </div>
                    <span className="badge-neon text-[10px]">{feature.badge}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─────────────────────────── */}
        <section className="py-24 bg-surface-50" aria-label="How AI Career Platform Works">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="section-heading mb-4">How NXTED AI Career Platform Works</h2>
              <p className="text-white/40 max-w-xl mx-auto">Five AI-powered steps from where you are to your dream career.</p>
            </motion.div>

            <div className="space-y-8 max-w-3xl mx-auto">
              {howItWorks.map((item, i) => (
                <motion.div
                  key={item.step}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex gap-6 items-start"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center text-sm font-bold text-neon-blue" aria-hidden="true">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-white/40">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─────────────────────────── */}
        <section className="py-24" aria-label="Customer Reviews and Testimonials">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="section-heading mb-4">Trusted by Job Seekers and Career Changers</h2>
              <p className="text-white/40 max-w-xl mx-auto">See how NXTED AI helped professionals land their dream jobs with AI career tools.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.article
                  key={t.name}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="card"
                >
                  <div className="flex gap-1 mb-4" aria-label={`${t.rating} out of 5 stars`}>
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-sm text-white/60 mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-white/30">{t.role}</div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Section ──────────────────────────── */}
        <section className="py-24" aria-label="Get Started with AI Career Tools">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative glass p-12 md:p-16 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-neon-purple/5" aria-hidden="true" />
              <div className="relative">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">
                  Ready to <span className="gradient-text">Transform Your Career with AI</span>?
                </h2>
                <p className="text-white/40 max-w-xl mx-auto mb-8">
                  Join thousands of job seekers who used NXTED AI to land their dream jobs faster with AI resume builder, career coaching, and automated job applications.
                </p>
                <Link href="/signup" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
                  Get Started Free — No Credit Card <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
