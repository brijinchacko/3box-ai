'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Repeat,
  FileSearch,
  Sparkles,
  Target,
  Brain,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Zap,
  Compass,
  Route,
  Puzzle,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const stats = [
  { value: '52%', label: 'of workers plan to change careers in 2026', icon: TrendingUp },
  { value: '83%', label: 'of career changers say resume was hardest part', icon: FileSearch },
  { value: '67%', label: 'of skills are transferable across industries', icon: Puzzle },
  { value: '4.2x', label: 'more callbacks with properly positioned resumes', icon: Zap },
];

const features = [
  {
    icon: Puzzle,
    title: 'Transferable Skills Identification',
    description:
      'Our AI analyzes your entire career history and surfaces skills that cross industry boundaries. Project management, stakeholder communication, data analysis, and leadership translate everywhere. We find connections you might miss.',
  },
  {
    icon: Route,
    title: 'Career Pivot Templates',
    description:
      'Choose from combination resume templates designed for transitions: tech-to-consulting, military-to-corporate, education-to-L&D, healthcare-to-health-tech, and more. Each template leads with transferable strengths.',
  },
  {
    icon: Brain,
    title: 'AI Experience Reframing',
    description:
      'Our AI rewrites your bullet points using target industry language. "Managed a classroom of 30 students" becomes "Led daily sessions for 30+ participants, designing curriculum and measuring learning outcomes through data-driven assessment."',
  },
  {
    icon: Compass,
    title: 'Career Gap & Transition Analysis',
    description:
      'Identify the exact skills, certifications, or experiences you need to bridge the gap. Our AI compares your profile against target roles and provides a concrete action plan for closing any gaps.',
  },
  {
    icon: DollarSign,
    title: 'Salary Insights Across Industries',
    description:
      'See how your compensation might change in your new field. Compare equivalent roles across industries, understand how experience in your current field translates to salary expectations in the new one.',
  },
  {
    icon: MessageSquare,
    title: 'Career Change Interview Prep',
    description:
      'Practice answering the inevitable "Why are you switching?" question. Get tailored responses for your specific transition, prepare compelling narratives, and learn to turn your unique background into a competitive advantage.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Map Your Experience',
    description:
      'Enter your complete work history across all industries and roles. The more context you provide, the better our AI can identify hidden transferable skills and relevant achievements.',
    icon: Compass,
  },
  {
    step: '02',
    title: 'AI Bridges the Gap',
    description:
      'Tell us your target role. Our AI cross-references your experience with target job requirements, identifies skill overlaps, reframes your achievements using new industry language, and builds a compelling narrative.',
    icon: Brain,
  },
  {
    step: '03',
    title: 'ATS + Narrative Check',
    description:
      'We check your resume against ATS systems in your target industry AND evaluate whether your career change story is coherent and compelling. Get feedback on both technical optimization and narrative clarity.',
    icon: FileSearch,
  },
  {
    step: '04',
    title: 'Pivot with Confidence',
    description:
      'Export your resume tailored for each target role. Apply to positions knowing your transferable skills are front and center and your career change narrative is polished and professional.',
    icon: Sparkles,
  },
];

const tips = [
  {
    title: 'Lead with a Powerful Professional Summary',
    description:
      'Your summary is the most important section on a career change resume. Connect your past and future in 2-3 sentences: "Operations leader with 10 years driving process efficiency, transitioning to product management to apply deep expertise in cross-functional team leadership and data-driven decision making."',
  },
  {
    title: 'Identify and Highlight Transferable Skills',
    description:
      'Skills like project management, data analysis, client communication, budgeting, team leadership, and problem-solving span every industry. Create a "Core Competencies" section that maps your existing skills to your target role using the new industry\'s terminology.',
  },
  {
    title: 'Reframe, Do Not Reinvent Your History',
    description:
      'You do not need to hide your past. Reframe it. A restaurant manager has operational excellence, P&L management, team building, and customer experience skills. A military officer has strategic planning, logistics, and leadership under pressure. Use language that bridges both worlds.',
  },
  {
    title: 'Fill Gaps with Projects and Learning',
    description:
      'Add certifications, bootcamps, freelance projects, or volunteer work in your target field. "Completed Google Data Analytics Certificate" or "Led pro-bono UX redesign for nonprofit" proves commitment and provides concrete examples for interviews.',
  },
  {
    title: 'Use a Combination Resume Format',
    description:
      'Skip the pure chronological format. Use a combination format that leads with a skills-based section followed by work history. This lets recruiters see your relevant capabilities before they see potentially unfamiliar job titles from your previous industry.',
  },
  {
    title: 'Tell a Coherent Career Narrative',
    description:
      'Your resume should tell a story of intentional evolution, not random career jumps. Draw a clear thread from where you have been to where you are going. Show that your career change is a strategic move building on genuine experience, not a whim.',
  },
];

const faqs = [
  {
    question: 'How do I write a resume for a career change?',
    answer:
      'Focus on transferable skills rather than job titles. Lead with a strong professional summary explaining your transition. Use a combination resume format that highlights relevant skills and achievements before work history. Reframe past experience using language from your target industry. NXTED AI automatically identifies transferable skills and suggests how to position them.',
  },
  {
    question: 'What resume format is best for career changers?',
    answer:
      'A combination (functional + chronological) format works best for career changers. Start with a compelling summary, follow with a "Relevant Skills & Achievements" section organized by skill category, then include work history. This format lets you lead with transferable strengths while still providing the chronological detail that ATS systems and recruiters expect.',
  },
  {
    question: 'How do I explain a career change on my resume?',
    answer:
      'Use your professional summary to briefly address the transition and connect the dots. For example: "Operations manager transitioning to data analytics, bringing 8 years of experience optimizing business processes through data-driven decision making." Then let your bullet points demonstrate relevant skills. Avoid apologizing for the switch or over-explaining.',
  },
  {
    question: 'Should I include all my past experience on a career change resume?',
    answer:
      'Only include experience that supports your new direction. Trim irrelevant roles or summarize them briefly. Expand on positions where you used transferable skills. If you were a teacher transitioning to corporate training, emphasize curriculum design, presentation skills, and learner outcomes rather than classroom management details.',
  },
  {
    question: 'How do I pass ATS when changing careers?',
    answer:
      'Mirror the job description language exactly. Even if you have the skill under a different name, use the target industry terminology. Include both your current industry keywords and target industry keywords in your skills section. NXTED AI cross-references your experience with target job requirements and suggests keyword bridges.',
  },
  {
    question: 'Can AI help with a career change resume?',
    answer:
      'Absolutely. AI resume builders like NXTED AI are especially powerful for career changers. The AI identifies transferable skills you might overlook, suggests how to reframe your experience for a new industry, generates industry-appropriate bullet points, and optimizes for ATS keywords in your target field. It bridges the gap between what you have done and what you want to do.',
  },
];

export default function CareerChangerClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ────────────────────────── */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-gradient-radial from-neon-purple/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-radial from-neon-green/8 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-[400px] h-[300px] bg-gradient-radial from-neon-blue/6 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="badge-neon text-xs mb-6 inline-flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5" />
              Built for Career Changers
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Resume Builder for{' '}
            <span className="gradient-text">Career Changers</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Your experience is an asset, not a liability. Our AI identifies your
            transferable skills, reframes your achievements for your target industry,
            and builds a resume that tells a compelling career pivot story.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/signup" className="btn-primary text-base flex items-center justify-center gap-2">
              Build Your Resume Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/tools/ats-checker" className="btn-secondary text-base flex items-center justify-center gap-2">
              <FileSearch className="w-4 h-4" /> Check Your Resume ATS Score
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────── */}
      <section className="py-12 border-y border-white/5 bg-surface-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
              >
                <stat.icon className="w-6 h-6 text-neon-purple mx-auto mb-3" />
                <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-white/40">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────── */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tools That Turn Your Past Into{' '}
              <span className="gradient-text">Your Advantage</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Career changers bring unique perspectives. Our AI helps you articulate
              why your diverse background makes you a stronger candidate, not a weaker
              one.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="glass p-6 hover:bg-white/[0.07] transition-all duration-300 group"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
              >
                <div className="w-12 h-12 rounded-xl bg-neon-purple/10 flex items-center justify-center mb-4 group-hover:bg-neon-purple/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-neon-purple" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────── */}
      <section className="py-24 relative border-t border-white/5">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Navigate Your Career Pivot in{' '}
              <span className="gradient-text">4 Steps</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              From where you are to where you want to be, with a resume that bridges
              the gap.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                className="relative"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
              >
                <div className="glass p-6 h-full">
                  <div className="text-5xl font-bold text-white/5 mb-4 font-mono">
                    {step.step}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-neon-green/10 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-neon-green" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-neon-purple/30 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Resume Tips ────────────────────────── */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Resume Tips for{' '}
              <span className="gradient-text">Career Changers</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Strategic advice to help you pivot with clarity and confidence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map((tip, i) => (
              <motion.div
                key={tip.title}
                className="glass p-6"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
              >
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-neon-green mt-0.5 shrink-0" />
                  <h3 className="font-semibold">{tip.title}</h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed pl-8">
                  {tip.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ─────────────────────────── */}
      <section className="py-24 relative border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Frequently Asked{' '}
              <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-white/50">
              Common questions about building a career change resume with AI.
            </p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                className="glass overflow-hidden"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white/40 shrink-0 transition-transform duration-300 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="px-5 pb-5 text-white/50 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────── */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-neon-purple/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Join 10,000+ Career Changers Using{' '}
              <span className="gradient-text">NXTED AI</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto mb-8">
              Military veterans, teachers moving to corporate, healthcare workers
              pivoting to tech, and professionals from every industry trust NXTED AI to
              build resumes that open doors to their next chapter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-primary text-base flex items-center justify-center gap-2">
                Start Your Career Pivot Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/tools/ats-checker" className="btn-secondary text-base flex items-center justify-center gap-2">
                Check Your Existing Resume
              </Link>
            </div>
            <p className="text-white/30 text-sm mt-6">
              No credit card required. Free plan includes AI resume builder + ATS checker.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
