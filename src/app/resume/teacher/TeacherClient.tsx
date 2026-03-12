'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  GraduationCap,
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
  BookOpen,
  Users,
  PenTool,
  Award,
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
  { value: '3.7M', label: 'public school teachers in the US', icon: Users },
  { value: '82%', label: 'of school districts use ATS software', icon: FileSearch },
  { value: '300K+', label: 'annual teaching job openings', icon: Zap },
  { value: '2x', label: 'more interviews with tailored education resumes', icon: Target },
];

const features = [
  {
    icon: GraduationCap,
    title: 'ATS Optimization for Education',
    description:
      'Our AI understands school district hiring platforms like Frontline Education, AppliTrack, and TalentEd. It maps your certifications, endorsements, and teaching methods to the exact keywords hiring committees search for.',
  },
  {
    icon: BookOpen,
    title: 'Education-Specific Templates',
    description:
      'Choose from templates designed for elementary, middle school, high school, special education, ESL, and higher education roles. Each template emphasizes grade levels, subjects, and the teaching competencies your audience expects.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Achievement Statements',
    description:
      'Transform "taught math" into "Designed and implemented differentiated math curriculum for 28 diverse learners, resulting in 22% improvement in state assessment scores and 100% student participation in STEM fair."',
  },
  {
    icon: Award,
    title: 'Certification & Endorsement Tracking',
    description:
      'Organize your state teaching license, subject endorsements, Praxis scores, ESOL certification, gifted endorsement, and professional development hours. Our AI ensures no credential is overlooked on your resume.',
  },
  {
    icon: DollarSign,
    title: 'Salary Insights for Educators',
    description:
      'Compare teacher salaries across districts, states, and school types. See how advanced degrees (MEd, EdD), National Board Certification, and specialty endorsements affect compensation on district salary schedules.',
  },
  {
    icon: MessageSquare,
    title: 'Teaching Interview Prep',
    description:
      'Practice common interview questions: classroom management scenarios, differentiation strategies, parent communication, IEP collaboration, and teaching demonstrations. Prepare answers aligned with your resume content.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Enter Your Teaching Experience',
    description:
      'Add your positions, schools, grade levels, subjects, class sizes, and certifications. Import from an existing resume or build from scratch.',
    icon: PenTool,
  },
  {
    step: '02',
    title: 'AI Builds Your Education Resume',
    description:
      'Our AI structures your experience using formats that hiring principals prefer: certifications up front, student outcomes highlighted, and teaching philosophy integrated into your professional summary.',
    icon: Brain,
  },
  {
    step: '03',
    title: 'ATS Compatibility Check',
    description:
      'Scan your resume against the ATS platforms used by school districts in your target area. Get specific feedback on missing certifications, pedagogical keywords, and formatting issues.',
    icon: FileSearch,
  },
  {
    step: '04',
    title: 'Land Your Teaching Position',
    description:
      'Export as ATS-friendly PDF, tailor for specific districts and positions, and prepare your application portfolio with confidence knowing your resume meets district standards.',
    icon: Sparkles,
  },
];

const tips = [
  {
    title: 'Lead with Certifications and Endorsements',
    description:
      'Place your state teaching license, subject endorsements, and National Board Certification prominently. "State Certified K-6, Reading Endorsement, ESOL Certified, Gifted Endorsed" tells hiring committees you are qualified before they read further.',
  },
  {
    title: 'Quantify Student Outcomes',
    description:
      'Use data to demonstrate your effectiveness: "Improved class reading levels by an average of 1.5 grade levels," "Achieved 95% student proficiency on state science assessment," or "Increased AP exam pass rate from 62% to 89% over three years."',
  },
  {
    title: 'Highlight Curriculum Development',
    description:
      'Showcase curriculum you created or adapted: "Developed project-based STEM curriculum adopted by 12 teachers across the district," "Created culturally responsive ELA units aligned to Common Core standards," or "Designed blended learning modules using Google Classroom and Nearpod."',
  },
  {
    title: 'Showcase Technology Integration',
    description:
      'Modern schools value tech-savvy educators. List specific tools: Google Classroom, Canvas, Seesaw, Smartboard, Kahoot, Nearpod, Flipgrid, and coding platforms. Mention any ed-tech training, Google Certified Educator status, or 1:1 device classroom experience.',
  },
  {
    title: 'Include Extracurricular Leadership',
    description:
      'Clubs, sports coaching, drama productions, student council advising, and committee work matter. "Founded school coding club growing from 8 to 45 members" or "Coached debate team to state finals three consecutive years" shows commitment beyond the classroom.',
  },
  {
    title: 'Tailor for Your Teaching Specialty',
    description:
      'Special education resumes should emphasize IEP development and behavior intervention plans. ESL teachers should highlight language acquisition strategies and cultural competency. STEM teachers should showcase lab management and hands-on learning approaches.',
  },
];

const faqs = [
  {
    question: 'What should a teacher resume include?',
    answer:
      'A teacher resume should include your teaching certifications and endorsements, education (degree type and institution), teaching experience with grade levels and subjects, classroom management approach, curriculum development experience, student achievement data, technology integration skills (Google Classroom, Canvas, Smartboard), and professional development activities.',
  },
  {
    question: 'How do I pass ATS as a teacher?',
    answer:
      'School district ATS systems like Frontline Education, AppliTrack, and TalentEd search for specific education terms. Include your exact certification type, subject endorsements, grade levels, teaching methods (differentiated instruction, project-based learning), and ed-tech tools. 3BOX AI identifies missing education keywords and suggests additions.',
  },
  {
    question: 'Should I use AI to write my teacher resume?',
    answer:
      'Yes. AI resume builders like 3BOX AI understand education terminology, state certification requirements, and what hiring principals look for. The AI helps you articulate student outcomes, curriculum innovations, and classroom management strategies in a way that passes district ATS filters and impresses interview committees.',
  },
  {
    question: 'How do I quantify teaching achievements on a resume?',
    answer:
      'Focus on measurable student outcomes: "Improved standardized test scores by 22% across 120 students," "Achieved 95% student proficiency rate in state math assessment," "Reduced chronic absenteeism by 18% through parent engagement program," or "Mentored 8 student teachers over 4 years, all of whom received full-time offers."',
  },
  {
    question: 'What resume format is best for teachers?',
    answer:
      'Use a reverse-chronological format with a "Certifications & Endorsements" section near the top. Include a professional summary highlighting your teaching philosophy, years of experience, and subject expertise. List each position with school name, district, grade levels, subjects, and class sizes. New teachers should emphasize student teaching and practicum experience.',
  },
  {
    question: 'Should I include a teaching philosophy on my resume?',
    answer:
      'Include a brief 2-3 sentence professional summary that reflects your teaching philosophy, not a separate section. Save the detailed teaching philosophy statement for your application portfolio. Your summary might read: "Student-centered educator with 8 years of experience in differentiated instruction for diverse learners, committed to project-based learning and social-emotional development."',
  },
];

export default function TeacherClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ────────────────────────── */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 right-1/3 w-[800px] h-[600px] bg-gradient-radial from-neon-orange/8 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-gradient-radial from-neon-purple/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="badge-neon text-xs mb-6 inline-flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              Built for Educators
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            AI Resume Builder for{' '}
            <span className="gradient-text">Teachers</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Create an ATS-optimized teaching resume that highlights your classroom
            impact, certifications, and student achievement data. Designed for K-12
            educators, special education teachers, administrators, and higher education
            professionals.
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
              Resume Tools Built for{' '}
              <span className="gradient-text">Educators</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              You shape the next generation. Our AI helps you present your classroom
              impact in a way that resonates with hiring committees.
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
              From Classroom to Career Move in{' '}
              <span className="gradient-text">4 Steps</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Build a teaching resume that earns you an interview, not just a spot in
              the applicant pile.
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
              <span className="gradient-text">Teachers</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Actionable advice to help your teaching resume earn that interview
              invitation.
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
              Common questions about building a teacher resume with AI.
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
              Join 10,000+ Educators Using{' '}
              <span className="gradient-text">3BOX AI</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto mb-8">
              Teachers across public schools, private academies, charter networks, and
              international schools trust 3BOX AI to build resumes that showcase their
              classroom impact and pass district ATS filters.
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
              7-day money-back guarantee. Plans include AI resume builder + ATS checker.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
