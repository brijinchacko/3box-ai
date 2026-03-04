'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, Plus, Edit3, Download, Copy, Trash2, Eye, Wand2,
  Briefcase, GraduationCap, Code, Award, User, Mail, Phone,
  MapPin, Linkedin, Globe, ArrowRight, CheckCircle2, Sparkles,
  Crown, Lock,
} from 'lucide-react';

// Demo resume data
const demoResume = {
  id: '1',
  title: 'AI Engineer Resume',
  template: 'modern',
  contact: {
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexjohnson',
    portfolio: 'alexjohnson.dev',
  },
  summary: 'Results-driven AI Engineer with 3+ years of experience in designing, developing, and deploying machine learning systems at scale. Expertise in deep learning, NLP, and MLOps. Passionate about building AI products that create real-world impact.',
  experience: [
    {
      id: '1', company: 'TechCorp AI', role: 'ML Engineer', location: 'San Francisco, CA',
      startDate: '2022-06', endDate: 'Present', current: true,
      bullets: [
        'Designed and deployed a real-time recommendation engine serving 2M+ daily active users, improving click-through rate by 23%',
        'Built an end-to-end ML pipeline using PyTorch, MLflow, and Kubernetes, reducing model deployment time from 2 weeks to 4 hours',
        'Led the implementation of a transformer-based NLP system for automated content moderation, achieving 96% accuracy',
      ],
    },
    {
      id: '2', company: 'DataStart Inc.', role: 'Data Scientist', location: 'Remote',
      startDate: '2020-08', endDate: '2022-05', current: false,
      bullets: [
        'Developed predictive models for customer churn that saved $2.1M annually through targeted retention campaigns',
        'Created automated data pipelines processing 50GB+ daily using Apache Spark and Python',
        'Collaborated with product teams to integrate ML models into production applications',
      ],
    },
  ],
  education: [
    { id: '1', institution: 'Stanford University', degree: 'M.S.', field: 'Computer Science (AI Track)', startDate: '2018', endDate: '2020', gpa: '3.9' },
    { id: '1b', institution: 'UC Berkeley', degree: 'B.S.', field: 'Computer Science', startDate: '2014', endDate: '2018', gpa: '3.7' },
  ],
  skills: ['Python', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Docker', 'Kubernetes', 'MLflow', 'SQL', 'AWS', 'GCP', 'Transformers', 'LLMs', 'Computer Vision', 'NLP'],
  certifications: [
    { id: '1', name: 'AWS Machine Learning Specialty', issuer: 'Amazon Web Services', date: '2023', verified: true },
    { id: '2', name: 'Deep Learning Specialization', issuer: 'DeepLearning.AI', date: '2022', verified: true },
  ],
  projects: [
    { id: '1', name: 'Open Source LLM Toolkit', description: 'Contributed to an open-source toolkit for LLM fine-tuning with 2K+ GitHub stars', url: 'github.com/alexj/llm-toolkit', technologies: ['Python', 'PyTorch', 'HuggingFace'] },
  ],
};

const templates = [
  { id: 'modern', name: 'Modern', desc: 'Clean, ATS-optimized' },
  { id: 'executive', name: 'Executive', desc: 'Professional & bold' },
  { id: 'minimal', name: 'Minimal', desc: 'Simple & elegant' },
  { id: 'creative', name: 'Creative', desc: 'Standout design' },
];

export default function ResumePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [resume, setResume] = useState(demoResume);
  const [activeSection, setActiveSection] = useState('contact');
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const userPlan = ((session?.user as any)?.plan ?? 'BASIC').toUpperCase();
  const isBasic = userPlan === 'BASIC';
  const isStarter = userPlan === 'STARTER';

  const handleAIEnhance = async () => {
    setGenerating(true);
    // Simulate AI enhancement
    await new Promise(r => setTimeout(r, 2000));
    setGenerating(false);
  };

  const handleExportPDF = async () => {
    if (isBasic) {
      window.location.href = '/pricing';
      return;
    }

    setExporting(true);
    try {
      const res = await fetch('/api/resume/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: {
            contact: resume.contact,
            summary: resume.summary,
            experience: resume.experience,
            education: resume.education,
            skills: resume.skills,
            certifications: resume.certifications,
          },
          template: resume.template,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        if (err?.error === 'upgrade_required') {
          window.location.href = '/pricing';
          return;
        }
        throw new Error(err?.message ?? 'Export failed');
      }

      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export resume. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── Paywall Banner (BASIC plan) ─────────────────────── */}
      {isBasic && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-neon-blue/30 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(168,85,247,0.12) 100%)',
          }}
        >
          <div className="px-5 py-5 sm:px-6 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-neon-purple" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Upgrade to export your resume as PDF
                </h3>
                <p className="text-sm text-white/50 mt-0.5">
                  Free users can edit and preview. Upgrade to Starter ($12/mo) to export PDF.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white text-sm font-semibold hover:shadow-lg hover:shadow-neon-blue/25 transition-all"
            >
              <Crown className="w-4 h-4" />
              Upgrade Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
              <FileText className="w-7 h-7 text-neon-blue" /> Resume Builder
            </h1>
            <p className="text-white/40">ATS-optimized resumes powered by AI</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAIEnhance} className="btn-secondary text-sm flex items-center gap-2" disabled={generating}>
              <Wand2 className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Enhancing...' : 'AI Enhance'}
            </button>

            {/* Export PDF button -- plan-aware */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className={`text-sm flex items-center gap-2 ${
                  isBasic
                    ? 'btn-secondary opacity-80 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                {isBasic ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>

              {isStarter && (
                <span className="text-xs text-white/40 hidden sm:inline">
                  Exported with nxtED AI watermark
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Switch */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'editor' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          <Edit3 className="w-4 h-4 inline mr-1" /> Editor
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'preview' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          <Eye className="w-4 h-4 inline mr-1" /> Preview
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Editor Panel */}
        {activeTab === 'editor' && (
          <>
            {/* Section Nav */}
            <div className="lg:col-span-1">
              <div className="card sticky top-4 space-y-1">
                <h3 className="text-sm font-semibold text-white/60 mb-3">Sections</h3>
                {[
                  { id: 'contact', icon: User, label: 'Contact Info' },
                  { id: 'summary', icon: FileText, label: 'Summary' },
                  { id: 'experience', icon: Briefcase, label: 'Experience' },
                  { id: 'education', icon: GraduationCap, label: 'Education' },
                  { id: 'skills', icon: Code, label: 'Skills' },
                  { id: 'certifications', icon: Award, label: 'Certifications' },
                  { id: 'projects', icon: Code, label: 'Projects' },
                  { id: 'template', icon: Sparkles, label: 'Template' },
                  { id: 'tailor', icon: Wand2, label: 'Tailor to Job' },
                ].map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                      activeSection === section.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                    }`}
                  >
                    <section.icon className="w-4 h-4" /> {section.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Edit Form */}
            <div className="lg:col-span-2 space-y-6">
              {activeSection === 'contact' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <h3 className="font-semibold mb-4">Contact Information</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Full Name</label>
                      <input value={resume.contact.name} onChange={(e) => setResume({...resume, contact: {...resume.contact, name: e.target.value}})} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Email</label>
                      <input value={resume.contact.email} onChange={(e) => setResume({...resume, contact: {...resume.contact, email: e.target.value}})} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Phone</label>
                      <input value={resume.contact.phone} onChange={(e) => setResume({...resume, contact: {...resume.contact, phone: e.target.value}})} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Location</label>
                      <input value={resume.contact.location} onChange={(e) => setResume({...resume, contact: {...resume.contact, location: e.target.value}})} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">LinkedIn</label>
                      <input value={resume.contact.linkedin} onChange={(e) => setResume({...resume, contact: {...resume.contact, linkedin: e.target.value}})} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Portfolio</label>
                      <input value={resume.contact.portfolio} onChange={(e) => setResume({...resume, contact: {...resume.contact, portfolio: e.target.value}})} className="input-field" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'summary' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Professional Summary</h3>
                    <button className="badge-neon text-xs flex items-center gap-1"><Wand2 className="w-3 h-3" /> AI Write</button>
                  </div>
                  <textarea
                    value={resume.summary}
                    onChange={(e) => setResume({...resume, summary: e.target.value})}
                    className="input-field h-32 resize-none"
                  />
                </motion.div>
              )}

              {activeSection === 'experience' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {resume.experience.map((exp, idx) => (
                    <div key={exp.id} className="card">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold">{exp.role}</h4>
                          <p className="text-sm text-white/40">{exp.company} • {exp.location}</p>
                          <p className="text-xs text-white/30">{exp.startDate} — {exp.endDate}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-1.5 rounded-lg hover:bg-white/5"><Edit3 className="w-3.5 h-3.5 text-white/40" /></button>
                          <button className="p-1.5 rounded-lg hover:bg-white/5"><Trash2 className="w-3.5 h-3.5 text-red-400/60" /></button>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {exp.bullets.map((bullet, bi) => (
                          <li key={bi} className="text-sm text-white/60 flex items-start gap-2">
                            <span className="text-white/20 mt-1">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <button className="w-full py-3 border border-dashed border-white/10 rounded-xl text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Experience
                  </button>
                </motion.div>
              )}

              {activeSection === 'skills' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <h3 className="font-semibold mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {resume.skills.map((skill) => (
                      <span key={skill} className="badge bg-white/5 text-white/60 text-xs">
                        {skill}
                        <button className="ml-1 text-white/30 hover:text-red-400">×</button>
                      </span>
                    ))}
                  </div>
                  <input className="input-field" placeholder="Add a skill and press Enter..." />
                </motion.div>
              )}

              {activeSection === 'template' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <h3 className="font-semibold mb-4">Choose Template</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setResume({...resume, template: t.id})}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          resume.template === t.id ? 'border-neon-blue/50 bg-neon-blue/5' : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="w-full h-24 rounded-lg bg-white/5 mb-3 flex items-center justify-center text-2xl">
                          {t.id === 'modern' ? '📄' : t.id === 'executive' ? '📊' : t.id === 'minimal' ? '📝' : '🎨'}
                        </div>
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs text-white/40">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeSection === 'tailor' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <h3 className="font-semibold mb-2">Tailor to Job Description</h3>
                  <p className="text-sm text-white/40 mb-4">Paste a job description and AI will optimize your resume for it.</p>
                  <textarea className="input-field h-40 resize-none mb-4" placeholder="Paste the job description here..." />
                  <button className="btn-primary flex items-center gap-2">
                    <Wand2 className="w-4 h-4" /> Optimize Resume
                  </button>
                </motion.div>
              )}

              {/* Default for other sections */}
              {!['contact', 'summary', 'experience', 'skills', 'template', 'tailor'].includes(activeSection) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <h3 className="font-semibold mb-4 capitalize">{activeSection}</h3>
                  <p className="text-sm text-white/40">Edit your {activeSection} section here. AI can help generate content.</p>
                  <button className="btn-secondary text-sm mt-4 flex items-center gap-2">
                    <Wand2 className="w-4 h-4" /> AI Generate {activeSection}
                  </button>
                </motion.div>
              )}
            </div>
          </>
        )}

        {/* Preview Panel */}
        {activeTab === 'preview' && (
          <div className="lg:col-span-3">
            <div className="bg-white text-gray-900 rounded-2xl p-8 sm:p-12 max-w-3xl mx-auto shadow-2xl">
              {/* Resume Preview */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{resume.contact.name}</h1>
                <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {resume.contact.email}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {resume.contact.phone}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {resume.contact.location}</span>
                </div>
                <div className="flex items-center justify-center gap-4 mt-1 text-sm text-blue-600">
                  <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" /> {resume.contact.linkedin}</span>
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {resume.contact.portfolio}</span>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-2">Professional Summary</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{resume.summary}</p>
              </div>

              {/* Experience */}
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3">Experience</h2>
                {resume.experience.map((exp) => (
                  <div key={exp.id} className="mb-4">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="font-semibold text-sm">{exp.role}</span>
                        <span className="text-sm text-gray-500"> — {exp.company}</span>
                      </div>
                      <span className="text-xs text-gray-400">{exp.startDate} – {exp.endDate}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{exp.location}</p>
                    <ul className="space-y-1 mt-1">
                      {exp.bullets.map((b, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-gray-300 mt-0.5">•</span> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Education */}
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3">Education</h2>
                {resume.education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-baseline mb-2">
                    <div>
                      <span className="font-semibold text-sm">{edu.degree} {edu.field}</span>
                      <span className="text-sm text-gray-500"> — {edu.institution}</span>
                      {edu.gpa && <span className="text-xs text-gray-400 ml-2">GPA: {edu.gpa}</span>}
                    </div>
                    <span className="text-xs text-gray-400">{edu.startDate} – {edu.endDate}</span>
                  </div>
                ))}
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-2">Technical Skills</h2>
                <p className="text-sm text-gray-600">{resume.skills.join(' • ')}</p>
              </div>

              {/* Certifications */}
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-2">Certifications</h2>
                {resume.certifications.map((cert) => (
                  <div key={cert.id} className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    {cert.verified && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                    <span className="font-medium">{cert.name}</span>
                    <span className="text-gray-400">— {cert.issuer} ({cert.date})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
