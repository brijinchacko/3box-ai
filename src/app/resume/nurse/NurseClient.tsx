'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart,
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
  Shield,
  Stethoscope,
  ClipboardList,
  Award,
  Activity,
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
  { value: '3.2M', label: 'registered nurses in the US', icon: Heart },
  { value: '89%', label: 'of hospitals use ATS for hiring', icon: FileSearch },
  { value: '6%', label: 'projected nursing job growth through 2032', icon: Zap },
  { value: '2.5x', label: 'more callbacks with ATS-optimized resumes', icon: Target },
];

const features = [
  {
    icon: Stethoscope,
    title: 'ATS Optimization for Healthcare',
    description:
      'Our AI understands hospital ATS systems like Taleo, Workday, and iCIMS. It ensures your clinical skills, certifications (RN, BSN, ACLS, BLS), and EMR proficiency are positioned for maximum visibility.',
  },
  {
    icon: ClipboardList,
    title: 'Nursing-Specific Templates',
    description:
      'Choose from templates designed for Med-Surg, ICU, ER, L&D, Pediatrics, OR, and psychiatric nursing. Each template highlights the clinical competencies and patient populations relevant to your specialty.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Clinical Descriptions',
    description:
      'Transform generic descriptions into impactful statements. "Cared for patients" becomes "Managed care for 6-8 acute patients per shift in a 32-bed ICU, maintaining 98% medication administration accuracy."',
  },
  {
    icon: Award,
    title: 'Certification & License Management',
    description:
      'Our AI organizes your credentials professionally: compact licenses, specialty certifications (CCRN, CEN, CNOR), continuing education units, and professional memberships. Never miss a critical credential on your resume.',
  },
  {
    icon: DollarSign,
    title: 'Salary Insights for Nursing',
    description:
      'Compare pay rates across specialties, regions, and settings. See how ICU, travel nursing, and NP salaries stack up. Understand per-diem, shift differentials, and overtime compensation trends.',
  },
  {
    icon: MessageSquare,
    title: 'Nursing Interview Prep',
    description:
      'Practice behavioral questions, clinical scenarios, and situational judgment tests common in nursing interviews. Get tips on discussing patient safety, teamwork, and conflict resolution.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Enter Your Clinical Experience',
    description:
      'Add your nursing roles, unit types, patient populations, procedures, and certifications. Import from your existing resume or enter details manually.',
    icon: ClipboardList,
  },
  {
    step: '02',
    title: 'AI Builds Your Nursing Resume',
    description:
      'Our AI creates a professionally structured resume with your credentials in the header, a clinical summary, organized work history with bed counts and patient ratios, and a skills section.',
    icon: Brain,
  },
  {
    step: '03',
    title: 'ATS Score Check',
    description:
      'Run your resume through ATS simulators used by major hospital systems. Get feedback on missing certifications, keywords, and formatting that could cause rejection.',
    icon: FileSearch,
  },
  {
    step: '04',
    title: 'Apply with Confidence',
    description:
      'Export as ATS-friendly PDF. Tailor for each facility and role. Whether you are applying to a Level 1 trauma center or a community clinic, your resume will be ready.',
    icon: Sparkles,
  },
];

const tips = [
  {
    title: 'Include Certifications Prominently',
    description:
      'Place your most important credentials right after your name: "Jane Smith, RN, BSN, CCRN." Create a separate "Licenses & Certifications" section listing each with issuing body and dates. This is what recruiters scan for first.',
  },
  {
    title: 'Specify Unit Details and Patient Populations',
    description:
      'Include facility name, unit type, bed count, and patient acuity: "36-bed Level II Trauma ICU" or "24-bed Pediatric Oncology Unit." Hiring managers want to know the complexity and scale of your clinical environment.',
  },
  {
    title: 'Quantify Your Patient Care Impact',
    description:
      'Use numbers wherever possible: "Managed care for 5-6 critically ill patients per shift," "Achieved 99.2% medication administration accuracy," "Reduced patient fall rate by 30% through hourly rounding protocol implementation."',
  },
  {
    title: 'Highlight EMR and Technology Skills',
    description:
      'List specific EMR/EHR systems (Epic, Cerner, Meditech, Allscripts) and medical devices. Tech-savvy nurses are increasingly valued. Include any superuser roles or EMR training experience you have.',
  },
  {
    title: 'Showcase Leadership and Mentorship',
    description:
      'Highlight charge nurse shifts, preceptor roles, committee participation, and quality improvement projects. "Served as primary preceptor for 12 new graduate nurses over 3 years" or "Led unit-based council initiative reducing CLABSI rate by 45%."',
  },
  {
    title: 'Tailor for Your Nursing Specialty',
    description:
      'An ER nurse resume should emphasize triage skills and emergency procedures. An OR nurse should highlight surgical specialties and instrument knowledge. Travel nurses should list each assignment with facility details and contract duration.',
  },
];

const faqs = [
  {
    question: 'What should a nursing resume include?',
    answer:
      'A nursing resume should include your nursing license and certifications (RN, BSN, MSN, ACLS, BLS, PALS), clinical specializations, patient care experience with unit types and bed counts, EMR/EHR proficiency (Epic, Cerner, Meditech), education from accredited nursing programs, and any clinical leadership or preceptor experience.',
  },
  {
    question: 'How do I pass ATS as a nurse?',
    answer:
      'Hospital ATS systems like Taleo, Workday, and iCIMS search for specific nursing terms. Include your exact license type (RN, LPN, NP), specialty certifications, EMR systems you have used, clinical procedures, and unit types (ICU, ER, Med-Surg, L&D). jobTED AI auto-detects missing nursing keywords and suggests additions.',
  },
  {
    question: 'Should I use AI to write my nursing resume?',
    answer:
      'Yes. AI resume builders like jobTED AI understand healthcare terminology, HIPAA compliance language, and what nursing recruiters look for. The AI helps you articulate patient outcomes, leadership experience, and clinical skills in a way that passes ATS filters used by hospital systems and staffing agencies.',
  },
  {
    question: 'How do I highlight certifications on a nursing resume?',
    answer:
      'Place your most relevant certifications immediately after your name in the header (e.g., "Jane Smith, RN, BSN, CCRN"). Create a dedicated "Licenses & Certifications" section near the top listing each credential with its issuing body and expiration date. Include specialty certifications like CCRN, CEN, or CNOR prominently.',
  },
  {
    question: 'What resume format is best for nurses?',
    answer:
      'Reverse-chronological format works best for most nurses. Include a clinical summary at the top highlighting your specialty, years of experience, and key competencies. List each position with facility name, unit type, bed count, and patient population. New graduates should use a combination format highlighting clinical rotations and skills.',
  },
  {
    question: 'How long should a nursing resume be?',
    answer:
      'New graduates and nurses with less than 5 years experience should keep it to one page. Experienced nurses (5-15 years) can use two pages. Nurse practitioners, clinical nurse specialists, and nurse educators may use two pages to cover advanced practice experience, publications, and leadership roles.',
  },
];

export default function NurseClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ────────────────────────── */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-gradient-radial from-neon-green/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-radial from-neon-blue/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="badge-neon text-xs mb-6 inline-flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" />
              Built for Nursing Professionals
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            AI Resume Builder for{' '}
            <span className="gradient-text">Nurses</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Create an ATS-optimized nursing resume that highlights your clinical
            expertise, certifications, and patient care achievements. Built specifically
            for RNs, NPs, and healthcare professionals applying to hospitals, clinics,
            and travel nursing agencies.
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
                <stat.icon className="w-6 h-6 text-neon-green mx-auto mb-3" />
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
              Resume Tools Built for{' '}
              <span className="gradient-text">Healthcare Heroes</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              You spend your shifts caring for others. Let our AI take care of your
              career documents so you can focus on what matters most.
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
                <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center mb-4 group-hover:bg-neon-green/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-neon-green" />
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
              Your Nursing Resume in{' '}
              <span className="gradient-text">4 Simple Steps</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Build a professional nursing resume faster than a shift change report.
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
                  <div className="w-10 h-10 rounded-lg bg-neon-blue/10 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-neon-blue" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-neon-green/30 to-transparent" />
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
              <span className="gradient-text">Nurses</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Expert guidance to help your clinical resume stand out in a competitive
              healthcare market.
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
              Common questions about building a nursing resume with AI.
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
        <div className="absolute inset-0 bg-gradient-to-t from-neon-green/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Join 10,000+ Nurses Using{' '}
              <span className="gradient-text">jobTED AI</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto mb-8">
              Nurses at HCA Healthcare, Kaiser Permanente, Mayo Clinic, and travel
              nursing agencies trust jobTED AI to build resumes that showcase their
              clinical expertise and pass hospital ATS filters.
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
