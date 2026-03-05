'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Code2,
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
  Layers,
  GitBranch,
  Terminal,
  Cpu,
  BarChart3,
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
  { value: '97.8%', label: 'of Fortune 500 use ATS', icon: BarChart3 },
  { value: '75%', label: 'of tech resumes filtered before human review', icon: FileSearch },
  { value: '3x', label: 'more interviews with optimized resumes', icon: Zap },
  { value: '10s', label: 'average recruiter resume scan time', icon: Target },
];

const features = [
  {
    icon: Code2,
    title: 'ATS Optimization for Tech Roles',
    description:
      'Our AI understands how Greenhouse, Lever, and Workday parse engineering resumes. It ensures your React, Python, AWS, and system design keywords are positioned where ATS algorithms look first.',
  },
  {
    icon: Layers,
    title: 'Engineering-Specific Templates',
    description:
      'Choose from templates designed for frontend, backend, full-stack, DevOps, ML, and mobile engineers. Each template emphasizes the right sections for your specialization.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Impact Statements',
    description:
      'Transform vague descriptions into compelling bullet points. "Worked on API" becomes "Architected RESTful microservices handling 2M+ daily requests with 99.9% uptime, reducing response latency by 45%."',
  },
  {
    icon: GitBranch,
    title: 'Technical Skills Assessment',
    description:
      'Our AI evaluates your tech stack depth and breadth, identifies trending skills you should add, and flags outdated technologies that might hurt your application. Stay current with market demands.',
  },
  {
    icon: DollarSign,
    title: 'Salary Insights for Engineers',
    description:
      'See real-time compensation data for your target role. Compare salaries across FAANG, Series A startups, and mid-size companies. Understand how your experience level maps to market rates.',
  },
  {
    icon: MessageSquare,
    title: 'Technical Interview Prep',
    description:
      'Get tailored interview preparation based on your resume. Practice system design, coding challenges, and behavioral questions specific to the companies and roles you are targeting.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Enter Your Tech Experience',
    description:
      'Add your roles, projects, tech stack, and contributions. Paste from LinkedIn or upload an existing resume for instant import.',
    icon: Terminal,
  },
  {
    step: '02',
    title: 'AI Builds Your Resume',
    description:
      'Our AI structures your experience using proven formats for engineering roles. It generates quantified impact statements and organizes your technical skills by proficiency.',
    icon: Cpu,
  },
  {
    step: '03',
    title: 'ATS Score Check',
    description:
      'Run your resume through our ATS simulator. Get a compatibility score, keyword gap analysis, and formatting suggestions tailored to your target company\'s hiring system.',
    icon: FileSearch,
  },
  {
    step: '04',
    title: 'Apply with Confidence',
    description:
      'Export as ATS-friendly PDF or share a live portfolio link. Track which versions perform best and iterate based on real application outcomes.',
    icon: Sparkles,
  },
];

const tips = [
  {
    title: 'Quantify Your Engineering Impact',
    description:
      'Replace vague statements with metrics: "Reduced API latency by 40%," "Scaled infrastructure to handle 5M concurrent users," or "Decreased CI/CD pipeline time from 45 to 8 minutes." Numbers make your contributions concrete and memorable.',
  },
  {
    title: 'Lead with Your Strongest Tech Stack',
    description:
      'Place your most relevant languages and frameworks first in your skills section. If applying for a React role, lead with "React, TypeScript, Next.js" not "HTML, CSS, jQuery." Mirror the job description\'s priority order.',
  },
  {
    title: 'Showcase System Design and Architecture',
    description:
      'Senior engineers should highlight architecture decisions: "Designed event-driven microservices architecture using Kafka, reducing inter-service latency by 60%" or "Led migration from monolith to microservices serving 200K+ daily active users."',
  },
  {
    title: 'Include Open Source and Side Projects',
    description:
      'GitHub contributions, published packages, or technical blog posts demonstrate passion and depth. Include repos with real usage: "Maintained open-source CLI tool with 2K+ GitHub stars and 50+ contributors."',
  },
  {
    title: 'Tailor for Each Application Level',
    description:
      'Junior resumes should emphasize learning velocity and projects. Mid-level should show ownership and cross-team collaboration. Senior resumes need to demonstrate technical leadership, mentorship, and business impact.',
  },
  {
    title: 'Avoid Common Engineering Resume Pitfalls',
    description:
      'Skip the "Objective" section, remove irrelevant non-tech experience, never list every technology you have touched, and avoid rating your own skills with progress bars. Focus on depth over breadth for your target role.',
  },
];

const faqs = [
  {
    question: 'What should a software engineer resume include?',
    answer:
      'A strong software engineer resume should include a concise professional summary, technical skills section (languages, frameworks, tools, cloud platforms), work experience with quantified impact metrics (e.g., "Reduced API latency by 40%"), notable projects with tech stacks used, education, and relevant certifications like AWS or Google Cloud.',
  },
  {
    question: 'How do I pass ATS as a software engineer?',
    answer:
      'To pass ATS filters, include exact keywords from the job description such as specific programming languages, frameworks, and tools. Use standard section headings like "Work Experience" and "Skills." Avoid graphics, tables, and columns. NXTED AI scans your resume against ATS algorithms and suggests missing keywords automatically.',
  },
  {
    question: 'Should I use AI to write my software engineer resume?',
    answer:
      'Yes, AI resume builders like NXTED AI help you structure your experience effectively, suggest impactful bullet points with quantified metrics, and optimize for ATS compatibility. The AI understands tech industry conventions and can tailor your resume for specific roles like frontend, backend, full-stack, DevOps, or ML engineering.',
  },
  {
    question: 'How do I quantify achievements on a software engineer resume?',
    answer:
      'Use specific numbers and percentages: "Improved page load time by 60%," "Architected microservices handling 10M+ requests/day," "Reduced deployment time from 2 hours to 15 minutes with CI/CD pipeline," or "Led team of 5 engineers to deliver product 2 weeks ahead of schedule." NXTED AI suggests metrics based on your experience.',
  },
  {
    question: 'What are the best resume formats for software engineers in 2026?',
    answer:
      'Reverse-chronological format works best for most software engineers. Use a clean, single-column layout with clear section headers. Include a dedicated "Technical Skills" section near the top. For senior roles, add an "Architecture & System Design" section. For career changers, a combination format highlighting transferable skills works well.',
  },
  {
    question: 'How long should a software engineer resume be?',
    answer:
      'For junior to mid-level engineers (0-7 years), keep it to one page. Senior engineers and architects (8+ years) can use two pages if the content is relevant and impactful. Staff and principal engineers may use two pages to cover leadership, mentorship, and system design contributions. Never exceed two pages.',
  },
];

export default function SoftwareEngineerClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ────────────────────────── */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-gradient-radial from-neon-blue/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-radial from-neon-purple/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="badge-neon text-xs mb-6 inline-flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              Built for Software Engineers
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            AI Resume Builder for{' '}
            <span className="gradient-text">Software Engineers</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Build an ATS-optimized resume tailored for tech roles. Land interviews at
            FAANG, startups, and top engineering companies. Our AI understands your
            tech stack and transforms your experience into compelling, metrics-driven
            bullet points.
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
                <stat.icon className="w-6 h-6 text-neon-blue mx-auto mb-3" />
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
              Everything You Need to Land a{' '}
              <span className="gradient-text">Tech Role</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Purpose-built tools for software engineers who want their resume to match
              the quality of their code.
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
                <div className="w-12 h-12 rounded-xl bg-neon-blue/10 flex items-center justify-center mb-4 group-hover:bg-neon-blue/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-neon-blue" />
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
              From Code to Career in{' '}
              <span className="gradient-text">4 Steps</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Ship your resume like you ship code: fast, tested, and production-ready.
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
                  <div className="w-10 h-10 rounded-lg bg-neon-purple/10 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-neon-purple" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-neon-blue/30 to-transparent" />
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
              <span className="gradient-text">Software Engineers</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Expert advice to help your engineering resume stand out in a competitive
              tech market.
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
              Common questions about building a software engineer resume with AI.
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
        <div className="absolute inset-0 bg-gradient-to-t from-neon-blue/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Join 10,000+ Software Engineers Using{' '}
              <span className="gradient-text">NXTED AI</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto mb-8">
              Engineers from Google, Amazon, Meta, Netflix, and hundreds of startups
              trust NXTED AI to build resumes that pass ATS filters and impress hiring
              managers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-primary text-base flex items-center justify-center gap-2">
                Start Building for Free <ArrowRight className="w-4 h-4" />
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
