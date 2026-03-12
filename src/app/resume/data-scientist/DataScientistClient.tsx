'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart3,
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
  Database,
  TrendingUp,
  PieChart,
  FlaskConical,
  LineChart,
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
  { value: '126%', label: 'growth in data science jobs since 2020', icon: TrendingUp },
  { value: '75%', label: 'of data science resumes filtered by ATS', icon: FileSearch },
  { value: '$200K', label: 'median senior data scientist salary (US)', icon: DollarSign },
  { value: '3.5x', label: 'more callbacks with optimized resumes', icon: Zap },
];

const features = [
  {
    icon: Database,
    title: 'ATS Optimization for Data Roles',
    description:
      'Our AI maps your skills to the exact keywords hiring managers search for: Python, SQL, TensorFlow, PyTorch, Spark, Airflow, and more. It ensures your statistical methods and ML algorithms are ATS-visible.',
  },
  {
    icon: PieChart,
    title: 'Data Science Resume Templates',
    description:
      'Templates designed for data scientists, ML engineers, data analysts, and research scientists. Each emphasizes the right balance of technical depth, project impact, and business acumen.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Model Impact Statements',
    description:
      'Transform "built ML model" into "Developed gradient-boosted churn prediction model achieving 0.94 AUC, reducing quarterly customer attrition by 23% and saving $2.4M annually in retention costs."',
  },
  {
    icon: FlaskConical,
    title: 'Skills Assessment for Data Science',
    description:
      'Evaluate your proficiency across the data science stack: statistics, ML/DL frameworks, data engineering, visualization, and experimentation. Identify gaps relative to your target role level.',
  },
  {
    icon: DollarSign,
    title: 'Salary Insights for Data Roles',
    description:
      'Compare compensation across data scientist, ML engineer, data analyst, and analytics engineer roles. See how specialization in NLP, computer vision, or GenAI affects market rates.',
  },
  {
    icon: MessageSquare,
    title: 'Data Science Interview Prep',
    description:
      'Practice SQL queries, probability puzzles, ML system design, and case studies. Get tailored preparation based on your resume and target companies like Google, Meta, Netflix, or Airbnb.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Import Your Data Experience',
    description:
      'Add your roles, models you have built, datasets you have worked with, and tools in your stack. Import from LinkedIn or upload an existing resume.',
    icon: Database,
  },
  {
    step: '02',
    title: 'AI Structures Your Resume',
    description:
      'Our AI organizes your experience into high-impact sections: Technical Skills, Professional Experience with quantified model outcomes, Projects, Publications, and Education.',
    icon: Brain,
  },
  {
    step: '03',
    title: 'ATS Compatibility Check',
    description:
      'Scan your resume against ATS systems used by top data-hiring companies. Get keyword gap analysis, formatting fixes, and model metric suggestions.',
    icon: FileSearch,
  },
  {
    step: '04',
    title: 'Land Data Science Interviews',
    description:
      'Export as ATS-optimized PDF, tailor for specific job descriptions, and track your application outcomes to continuously improve your conversion rate.',
    icon: Sparkles,
  },
];

const tips = [
  {
    title: 'Quantify Model Performance and Business Impact',
    description:
      'Always pair model metrics with business outcomes: "Deployed XGBoost fraud detection model (precision: 0.96, recall: 0.91) reducing fraudulent transactions by 34% and saving $1.8M quarterly." Recruiters care about impact, not just accuracy scores.',
  },
  {
    title: 'Organize Skills by Category',
    description:
      'Group your technical skills logically: Languages (Python, R, SQL), ML/DL (TensorFlow, PyTorch, Scikit-learn), Big Data (Spark, Hadoop, Airflow), Visualization (Tableau, Matplotlib, Plotly), Cloud (AWS SageMaker, GCP Vertex AI, Azure ML).',
  },
  {
    title: 'Highlight End-to-End Ownership',
    description:
      'Show you can handle the full pipeline: problem framing, data collection, EDA, feature engineering, model training, evaluation, deployment, and monitoring. Companies value data scientists who can ship models to production, not just prototype in notebooks.',
  },
  {
    title: 'Include Publications and Competitions',
    description:
      'List peer-reviewed publications, conference talks, Kaggle medals (especially gold/silver), and open-source contributions. "Kaggle Competitions Master, top 0.5% globally" or "Published at NeurIPS 2025" immediately establishes credibility.',
  },
  {
    title: 'Tailor for the Data Science Subspecialty',
    description:
      'ML Engineering resumes should emphasize MLOps, deployment, and scale. Analytics roles should highlight A/B testing, dashboards, and stakeholder communication. Research roles should focus on novel methods and publications. Do not use a one-size-fits-all approach.',
  },
  {
    title: 'Show Cross-Functional Collaboration',
    description:
      'Data scientists rarely work in isolation. Highlight collaboration: "Partnered with product team to define success metrics," "Presented model insights to C-suite driving $5M investment decision," or "Collaborated with engineering to deploy real-time ML scoring API."',
  },
];

const faqs = [
  {
    question: 'What should a data scientist resume include?',
    answer:
      'A data scientist resume should feature a strong technical skills section covering Python, R, SQL, ML frameworks (TensorFlow, PyTorch, Scikit-learn), and visualization tools (Tableau, Power BI). Include work experience highlighting model development, A/B testing, ETL pipelines, and business impact. Add education (MS/PhD in quantitative fields is valuable), publications, and Kaggle competitions or open-source contributions.',
  },
  {
    question: 'How do I pass ATS as a data scientist?',
    answer:
      'Data science ATS systems look for specific technical terms. Include exact tool names (e.g., "Scikit-learn" not just "machine learning"), statistical methods (regression, classification, clustering), and business metrics. Use standard headings and avoid abbreviations that ATS may not recognize. 3BOX AI auto-maps your skills to ATS-friendly terminology.',
  },
  {
    question: 'Should I include Kaggle and personal projects on my data science resume?',
    answer:
      'Absolutely. Kaggle competitions (especially top 10% finishes), published notebooks, and personal ML projects demonstrate hands-on skills. Include the problem, approach, results, and tech stack for each project. Personal projects are especially important for career changers entering data science.',
  },
  {
    question: 'How do I quantify data science achievements on a resume?',
    answer:
      'Focus on business impact: "Developed churn prediction model reducing customer attrition by 23%, saving $2.4M annually," "Built recommendation engine increasing click-through rate by 35%," or "Automated ETL pipeline processing 50TB daily, reducing data latency from 6 hours to 20 minutes." Always tie your models to business outcomes.',
  },
  {
    question: 'What resume format works best for data scientists?',
    answer:
      'Use a reverse-chronological format with a prominent "Technical Skills" section organized by category (Languages, ML Frameworks, Cloud/Big Data, Visualization). Include a "Projects" section for significant ML work. Academic data scientists should include a "Publications" section. Keep it to 1-2 pages depending on experience level.',
  },
  {
    question: 'Should I use AI to write my data scientist resume?',
    answer:
      'Yes. AI resume builders understand data science terminology and can help you articulate model performance, business impact, and technical depth. 3BOX AI suggests quantified bullet points, maps your skills to job requirements, and optimizes for ATS systems used by tech companies and consulting firms hiring data scientists.',
  },
];

export default function DataScientistClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ────────────────────────── */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/3 w-[800px] h-[600px] bg-gradient-radial from-neon-purple/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-gradient-radial from-neon-green/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="badge-neon text-xs mb-6 inline-flex items-center gap-1.5">
              <LineChart className="w-3.5 h-3.5" />
              Built for Data Scientists
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            AI Resume Builder for{' '}
            <span className="gradient-text">Data Scientists</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Showcase your ML models, statistical expertise, and data pipeline
            experience. Our AI transforms your technical depth into business-impact
            narratives that pass ATS and impress hiring managers at top data teams.
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
              Tools Built for the{' '}
              <span className="gradient-text">Data Science Stack</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              From EDA to deployment, our AI understands every stage of the data
              science lifecycle and knows how to present it on your resume.
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
              From Raw Data to Dream Job in{' '}
              <span className="gradient-text">4 Steps</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Think of it as your personal data pipeline for career success.
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
              <span className="gradient-text">Data Scientists</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Data-driven advice to make your resume as precise as your models.
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
              Common questions about building a data scientist resume with AI.
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
              Join 10,000+ Data Scientists Using{' '}
              <span className="gradient-text">3BOX AI</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto mb-8">
              Data scientists at Google, Meta, Netflix, Spotify, and leading analytics
              firms use 3BOX AI to build resumes that showcase their impact and pass
              every ATS filter.
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
