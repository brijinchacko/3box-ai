'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, MessageCircle, FileText, Zap, Shield,
  ChevronDown, ChevronRight, ExternalLink, Users, HelpCircle,
  Cpu, BarChart3, Target, Award, ArrowRight, Mail, MessageSquare
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// ─── Data ────────────────────────────────────

const categories = [
  { id: 'getting-started', label: 'Getting Started', icon: Zap, color: 'from-neon-blue to-cyan-400' },
  { id: 'tools', label: 'Free Tools', icon: FileText, color: 'from-neon-green to-emerald-400' },
  { id: 'account', label: 'Account & Billing', icon: Shield, color: 'from-neon-purple to-violet-400' },
  { id: 'ai-features', label: 'AI Features', icon: Cpu, color: 'from-amber-400 to-orange-400' },
  { id: 'career', label: 'Career Planning', icon: Target, color: 'from-rose-400 to-pink-500' },
  { id: 'technical', label: 'Technical Docs', icon: BookOpen, color: 'from-sky-400 to-blue-500' },
];

const faqs: Record<string, { q: string; a: string }[]> = {
  'getting-started': [
    { q: 'How do I get started with 3BOX AI?', a: 'Simply visit our homepage and tell Agent Cortex (our AI coordinator) what role you want to pursue. Complete the quick onboarding by sharing your experience, education, and skills. No signup required for free tools — create a free account to unlock your full career dashboard and AI agent team.' },
    { q: 'Is 3BOX AI really free?', a: 'Yes! Our core tools (ATS Resume Checker, Resume Builder, Salary Estimator) are 100% free with no signup required. Creating a free account gives you access to your career dashboard, AI skill assessment, and personalized career plan. Pro and Ultra plans unlock advanced features like human mentorship and auto-apply.' },
    { q: 'What roles and industries does 3BOX AI support?', a: '3BOX AI supports all career fields — not just tech. Whether you want to be a Software Engineer, Nurse, Financial Analyst, Teacher, Graphic Designer, or Architect, our AI adapts assessments, skills, and career plans for your specific industry.' },
    { q: 'How does the onboarding process work?', a: 'Our conversational onboarding takes about 2 minutes. Agent Cortex asks about your dream role, experience level, current situation, education, and skills. Based on your answers, we create a personalized career profile with salary data, skill gaps, and a custom learning path — then your AI agents get to work.' },
  ],
  'tools': [
    { q: 'How does the ATS Resume Checker work?', a: 'Paste your resume text into the checker, and our AI instantly analyzes it against ATS (Applicant Tracking System) algorithms. You get a compatibility score out of 100, keyword analysis, formatting issues, and specific improvement suggestions — all for free.' },
    { q: 'Can I download my resume as PDF?', a: 'Yes! The Free Resume Builder lets you create a professional resume with live preview and download it as a PDF. No signup or watermark. Choose from clean templates optimized for both ATS systems and human readers.' },
    { q: 'How accurate is the Salary Estimator?', a: 'Our salary data is sourced from industry reports and updated regularly. Estimates are based on role, location, experience level, and skills. We show salary ranges for US, EU, UK, India, Australia, and global markets.' },
    { q: 'Do I need an account to use the free tools?', a: 'No! All three free tools (ATS Resume Checker, Resume Builder, Salary Estimator) work without any signup. We believe career tools should be accessible to everyone.' },
  ],
  'account': [
    { q: 'What plans are available?', a: 'We offer three tiers: Free (core tools + basic dashboard), Pro (AI skill assessment, career plan, proof-of-skills portfolio, human resume review), and Ultra (everything in Pro + automated job applications, dedicated career mentor, mock interviews with industry experts).' },
    { q: 'How do I cancel my subscription?', a: 'You can cancel anytime from Dashboard > Settings > Billing. Your access continues until the end of the billing period. No cancellation fees or hidden charges.' },
    { q: 'Is my data secure?', a: 'Absolutely. We use industry-standard encryption (AES-256) for data at rest and TLS 1.3 for data in transit. We never sell your personal data. Read our full security practices at /security.' },
    { q: 'Can I delete my account and data?', a: 'Yes. Go to Dashboard > Settings > Account and click "Delete Account." This permanently removes all your data within 30 days, in compliance with GDPR. You can also request data export before deletion.' },
  ],
  'ai-features': [
    { q: 'How does the AI Skill Assessment work?', a: 'Our adaptive assessment uses MCQ questions, real-world scenario analysis, and hands-on coding/task challenges to evaluate your skills. The AI adjusts difficulty based on your responses. After AI scoring, a real human expert reviews your results before finalizing — no AI-only guesswork.' },
    { q: 'What is Agent Cortex?', a: 'Agent Cortex is your AI coordinator that leads a team of 6 specialized agents (Scout, Forge, Archer, Atlas, Sage, Sentinel). Cortex learns your goals, coordinates all agents, and provides personalized recommendations. Your agents work while you sleep — discovering jobs, optimizing resumes, and sending applications.' },
    { q: 'How does auto-apply work?', a: 'Available on the Ultra plan, our AI agent finds jobs matching your profile, tailors your resume and cover letter for each application, and submits applications on your behalf. You set filters (role, location, salary range) and approve applications before they go out. Full audit trail included.' },
    { q: 'What is the Market Readiness Score?', a: 'A real-time employability score (0-100) that measures how ready you are for your target role compared to current market demand. It factors in your skills, experience, portfolio projects, and resume quality against what employers are looking for.' },
  ],
  'career': [
    { q: 'How is the AI Career Plan personalized?', a: 'Your career plan is built from your specific profile — target role, current skills, experience gaps, education, and location. It includes weekly milestones, curated learning resources, proof-of-skill projects, and estimated timeline to job-readiness.' },
    { q: 'What are Proof-of-Skill Projects?', a: 'Real-world projects scored by AI that demonstrate your abilities to employers. Unlike certificates, these prove you can actually do the work. Completed projects become part of your verified portfolio that employers can review.' },
    { q: 'Can I switch my target role mid-journey?', a: 'Absolutely. Go to Dashboard > Career Plan and update your target role anytime. The AI will recalculate your skill gaps, update your learning path, and adjust your career plan accordingly. Your completed work is preserved.' },
    { q: 'How does job matching work?', a: 'Our AI analyzes job listings across major platforms, scores each against your profile (skills, experience, location, salary expectations), and presents the best matches with a fit percentage. You can filter by remote/onsite, salary range, company size, and more.' },
  ],
  'technical': [
    { q: 'What AI models power 3BOX AI?', a: 'We use a multi-model architecture: GPT-4o for career coaching and resume generation, Claude for nuanced skill assessment, and custom fine-tuned models for job matching and salary prediction. Our model router automatically selects the best model for each task.' },
    { q: 'What is the tech stack?', a: '3BOX AI is built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Framer Motion on the frontend. Backend uses Next.js API routes, Prisma ORM with PostgreSQL, NextAuth.js for authentication, and Stripe for payments. AI integration via OpenRouter API.' },
    { q: 'Is there an API available?', a: 'We are planning a public API for enterprise integrations. If you are interested in API access for your organization (career services, universities, HR platforms), please contact us at nishinth.m@wartens.com.' },
    { q: 'How does data privacy work technically?', a: 'All user data is encrypted with AES-256 at rest. API calls use TLS 1.3. We implement row-level security in PostgreSQL. AI prompts are anonymized before processing. We do not use your data to train AI models. Full GDPR compliance with data export and deletion capabilities.' },
    { q: 'Browser and device support?', a: '3BOX AI works on all modern browsers (Chrome, Firefox, Safari, Edge) and is fully responsive for mobile, tablet, and desktop. We recommend the latest browser version for the best experience.' },
  ],
};

const communityTopics = [
  { title: 'Career Advice & Stories', desc: 'Share your journey, ask for advice, and learn from others who landed their dream roles.', posts: 234, icon: Users },
  { title: 'Resume & Portfolio Reviews', desc: 'Get feedback on your resume, portfolio, and cover letters from the community.', posts: 187, icon: FileText },
  { title: 'Interview Prep', desc: 'Practice questions, mock interview tips, and strategies for different companies and roles.', posts: 156, icon: MessageCircle },
  { title: 'Feature Requests & Feedback', desc: 'Suggest new features, report bugs, and help shape the future of 3BOX AI.', posts: 98, icon: HelpCircle },
  { title: 'Industry Insights', desc: 'Market trends, salary discussions, emerging roles, and career path analysis.', posts: 142, icon: BarChart3 },
  { title: 'Skill Development', desc: 'Learning resources, study groups, project ideas, and certification discussions.', posts: 211, icon: Award },
];

// ─── Component ───────────────────────────────

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'docs' | 'community'>('docs');

  const currentFaqs = faqs[activeCategory] || [];
  const filteredFaqs = searchQuery.trim()
    ? Object.values(faqs).flat().filter(
        (f) =>
          f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentFaqs;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold mb-4"
          >
            Help Center
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/40 text-lg mb-8"
          >
            Documentation, FAQs, and community — everything you need.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-xl mx-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 focus:border-neon-blue/40 text-sm"
            />
          </motion.div>
        </div>
      </section>

      {/* Tab Switcher */}
      <div className="max-w-5xl mx-auto px-4 mb-8">
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 w-fit mx-auto">
          <button
            onClick={() => { setActiveTab('docs'); setSearchQuery(''); }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'docs'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Docs & FAQ
          </button>
          <button
            onClick={() => { setActiveTab('community'); setSearchQuery(''); }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'community'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Community Forum
          </button>
        </div>
      </div>

      {/* ─── Docs & FAQ Tab ─── */}
      {activeTab === 'docs' && (
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Category Sidebar */}
            {!searchQuery && (
              <div className="md:w-56 flex-shrink-0">
                <div className="space-y-1 md:sticky md:top-24">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { setActiveCategory(cat.id); setOpenFaq(null); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                          activeCategory === cat.id
                            ? 'bg-white/[0.06] text-white'
                            : 'text-white/40 hover:bg-white/[0.03] hover:text-white/60'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FAQ Content */}
            <div className="flex-1 min-w-0">
              {searchQuery && (
                <p className="text-sm text-white/40 mb-4">
                  {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                </p>
              )}
              <div className="space-y-2">
                {filteredFaqs.map((faq, i) => {
                  const key = `${activeCategory}-${i}`;
                  const isOpen = openFaq === key || (searchQuery && true);
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-xl border border-white/[0.06] overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen && !searchQuery ? null : key)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                      >
                        <span className="text-sm font-medium pr-4">{faq.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-5 pb-4 text-sm text-white/50 leading-relaxed border-t border-white/5 pt-3">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
                {filteredFaqs.length === 0 && (
                  <div className="text-center py-12 text-white/30">
                    <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No results found. Try a different search term.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Community Forum Tab ─── */}
      {activeTab === 'community' && (
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="text-center mb-8">
            <p className="text-white/40 text-sm">
              Connect with other career seekers, share experiences, and get advice from the community.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {communityTopics.map((topic, i) => {
              const Icon = topic.icon;
              return (
                <motion.div
                  key={topic.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-neon-blue" />
                    </div>
                    <span className="text-[10px] text-white/20 font-medium">{topic.posts} posts</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1 group-hover:text-white transition-colors">{topic.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{topic.desc}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Coming Soon Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-neon-blue/5 to-neon-purple/5 border border-white/5 text-center"
          >
            <MessageCircle className="w-8 h-8 text-neon-blue/50 mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-2">Community Forum Launching Soon</h3>
            <p className="text-sm text-white/40 max-w-md mx-auto mb-4">
              We&apos;re building an open forum where you can ask questions, share career stories, review resumes, and connect with mentors. Join the waitlist to be first in.
            </p>
            <Link href="/signup" className="btn-primary text-sm inline-flex items-center gap-2">
              Join Waitlist <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold mb-2">Still need help?</h2>
          <p className="text-sm text-white/40 mb-6">
            Can&apos;t find what you&apos;re looking for? Our team is here to help.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/contact"
              className="btn-secondary text-sm inline-flex items-center gap-2"
            >
              <Mail className="w-4 h-4" /> Contact Support
            </a>
            <Link
              href="/help/tickets"
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> My Tickets
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
