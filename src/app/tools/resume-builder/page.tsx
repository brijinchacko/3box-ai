'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  ArrowLeft,
  ArrowRight,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// ── Types ──────────────────────────────────────

interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
}

interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string;
}

interface EducationEntry {
  id: string;
  degree: string;
  school: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string;
}

const STORAGE_KEY = 'nxted-resume-builder-data';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const defaultResume: ResumeData = {
  contact: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
  },
  summary: '',
  experience: [
    {
      id: generateId(),
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: '',
    },
  ],
  education: [
    {
      id: generateId(),
      degree: '',
      school: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
    },
  ],
  skills: '',
};

// ── Skill Tags Component ───────────────────────

function SkillTags({ skills }: { skills: string }) {
  const tags = skills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="px-2.5 py-1 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/20 text-xs font-medium"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

// ── Live Preview Component ─────────────────────

function ResumePreview({ data }: { data: ResumeData }) {
  const { contact, summary, experience, education, skills } = data;
  const hasContact =
    contact.fullName || contact.email || contact.phone || contact.location;
  const hasSummary = summary.trim();
  const hasExperience = experience.some((e) => e.title || e.company);
  const hasEducation = education.some((e) => e.degree || e.school);
  const hasSkills = skills.trim();

  return (
    <div className="bg-white text-gray-900 p-6 sm:p-8 rounded-xl shadow-2xl min-h-[600px] text-[13px] leading-relaxed">
      {/* Name & Contact */}
      {hasContact && (
        <div className="mb-5 border-b border-gray-200 pb-4">
          {contact.fullName && (
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 tracking-tight">
              {contact.fullName}
            </h1>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
            {contact.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {contact.email}
              </span>
            )}
            {contact.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {contact.phone}
              </span>
            )}
            {contact.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {contact.location}
              </span>
            )}
            {contact.linkedin && (
              <span className="flex items-center gap-1">
                <Linkedin className="w-3 h-3" />
                {contact.linkedin}
              </span>
            )}
            {contact.website && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {contact.website}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {hasSummary && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1.5 border-b border-gray-300 pb-1">
            Summary
          </h2>
          <p className="text-gray-700 whitespace-pre-line">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {hasExperience && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2 border-b border-gray-300 pb-1">
            Experience
          </h2>
          <div className="space-y-3">
            {experience
              .filter((e) => e.title || e.company)
              .map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{exp.title}</p>
                      <p className="text-gray-600 text-[12px]">
                        {exp.company}
                        {exp.location ? ` - ${exp.location}` : ''}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
                      {exp.startDate}
                      {(exp.endDate || exp.current) && (
                        <> &ndash; {exp.current ? 'Present' : exp.endDate}</>
                      )}
                    </span>
                  </div>
                  {exp.bullets && (
                    <ul className="mt-1 space-y-0.5">
                      {exp.bullets
                        .split('\n')
                        .filter(Boolean)
                        .map((b, i) => (
                          <li key={i} className="text-gray-700 pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[7px] before:w-1.5 before:h-1.5 before:bg-gray-400 before:rounded-full">
                            {b.replace(/^[-*]\s*/, '')}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Education */}
      {hasEducation && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2 border-b border-gray-300 pb-1">
            Education
          </h2>
          <div className="space-y-2">
            {education
              .filter((e) => e.degree || e.school)
              .map((edu) => (
                <div key={edu.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{edu.degree}</p>
                    <p className="text-gray-600 text-[12px]">
                      {edu.school}
                      {edu.location ? ` - ${edu.location}` : ''}
                      {edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
                    {edu.startDate}
                    {edu.endDate && <> &ndash; {edu.endDate}</>}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {hasSkills && (
        <div>
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2 border-b border-gray-300 pb-1">
            Skills
          </h2>
          <p className="text-gray-700">
            {skills
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
              .join(' \u2022 ')}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!hasContact && !hasSummary && !hasExperience && !hasEducation && !hasSkills && (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
          <FileText className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Start filling in the form to see your resume preview here.</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────

export default function ResumeBuilderPage() {
  const [resume, setResume] = useState<ResumeData>(defaultResume);
  const [showPreview, setShowPreview] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('contact');
  const printRef = useRef<HTMLDivElement>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setResume(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
    } catch {
      // ignore storage errors
    }
  }, [resume]);

  // Updaters
  const updateContact = useCallback((field: keyof ContactInfo, value: string) => {
    setResume((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  }, []);

  const updateSummary = useCallback((value: string) => {
    setResume((prev) => ({ ...prev, summary: value }));
  }, []);

  const updateExperience = useCallback((id: string, field: keyof ExperienceEntry, value: string | boolean) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    }));
  }, []);

  const addExperience = useCallback(() => {
    setResume((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: generateId(),
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          bullets: '',
        },
      ],
    }));
  }, []);

  const removeExperience = useCallback((id: string) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.filter((e) => e.id !== id),
    }));
  }, []);

  const updateEducation = useCallback((id: string, field: keyof EducationEntry, value: string) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    }));
  }, []);

  const addEducation = useCallback(() => {
    setResume((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: generateId(),
          degree: '',
          school: '',
          location: '',
          startDate: '',
          endDate: '',
          gpa: '',
        },
      ],
    }));
  }, []);

  const removeEducation = useCallback((id: string) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
  }, []);

  const updateSkills = useCallback((value: string) => {
    setResume((prev) => ({ ...prev, skills: value }));
  }, []);

  // Print / Download PDF
  function handleDownload() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const { contact, summary, experience, education, skills } = resume;

    const skillsList = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' &bull; ');

    const experienceHtml = experience
      .filter((e) => e.title || e.company)
      .map(
        (exp) => `
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:baseline">
            <div>
              <strong style="font-size:14px">${exp.title}</strong><br/>
              <span style="color:#555;font-size:12px">${exp.company}${exp.location ? ' - ' + exp.location : ''}</span>
            </div>
            <span style="font-size:11px;color:#999;white-space:nowrap">${exp.startDate}${exp.endDate || exp.current ? ' &ndash; ' + (exp.current ? 'Present' : exp.endDate) : ''}</span>
          </div>
          ${
            exp.bullets
              ? '<ul style="margin:4px 0 0 16px;padding:0">' +
                exp.bullets
                  .split('\n')
                  .filter(Boolean)
                  .map((b) => `<li style="margin-bottom:2px;font-size:13px;color:#333">${b.replace(/^[-*]\s*/, '')}</li>`)
                  .join('') +
                '</ul>'
              : ''
          }
        </div>
      `
      )
      .join('');

    const educationHtml = education
      .filter((e) => e.degree || e.school)
      .map(
        (edu) => `
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
          <div>
            <strong style="font-size:14px">${edu.degree}</strong><br/>
            <span style="color:#555;font-size:12px">${edu.school}${edu.location ? ' - ' + edu.location : ''}${edu.gpa ? ' | GPA: ' + edu.gpa : ''}</span>
          </div>
          <span style="font-size:11px;color:#999;white-space:nowrap">${edu.startDate}${edu.endDate ? ' &ndash; ' + edu.endDate : ''}</span>
        </div>
      `
      )
      .join('');

    const contactLine = [contact.email, contact.phone, contact.location, contact.linkedin, contact.website]
      .filter(Boolean)
      .join(' &bull; ');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${contact.fullName || 'Resume'} - Resume</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #222; line-height: 1.5; padding: 40px 50px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; color: #333; }
          .contact { font-size: 11px; color: #666; margin-bottom: 16px; }
          .section { margin-bottom: 16px; }
          p { font-size: 13px; color: #444; }
          @media print {
            body { padding: 20px 30px; }
            @page { margin: 0.5in; }
          }
        </style>
      </head>
      <body>
        ${contact.fullName ? `<h1>${contact.fullName}</h1>` : ''}
        ${contactLine ? `<div class="contact">${contactLine}</div>` : ''}
        ${summary ? `<div class="section"><h2>Summary</h2><p>${summary}</p></div>` : ''}
        ${experienceHtml ? `<div class="section"><h2>Experience</h2>${experienceHtml}</div>` : ''}
        ${educationHtml ? `<div class="section"><h2>Education</h2>${educationHtml}</div>` : ''}
        ${skillsList ? `<div class="section"><h2>Skills</h2><p>${skillsList}</p></div>` : ''}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }

  const sections = [
    { id: 'contact', label: 'Contact', icon: User },
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Wrench },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-green/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            All Tools
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-blue/20 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-neon-green" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
              Free <span className="gradient-text-alt">Resume Builder</span>
            </h1>
            <p className="text-white/40 max-w-lg mx-auto">
              Build a clean, professional resume in minutes. No signup required. Your data stays in your browser.
            </p>
          </motion.div>

          {/* Mobile preview toggle */}
          <div className="lg:hidden flex justify-center mb-6">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Edit Resume' : 'Preview Resume'}
            </button>
          </div>

          {/* Main layout */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`${showPreview ? 'hidden lg:block' : ''}`}
            >
              {/* Section Tabs */}
              <div className="flex gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                      activeSection === s.id
                        ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/60'
                    }`}
                  >
                    <s.icon className="w-3.5 h-3.5" />
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="card">
                <AnimatePresence mode="wait">
                  {/* Contact Section */}
                  {activeSection === 'contact' && (
                    <motion.div
                      key="contact"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <User className="w-5 h-5 text-neon-blue" />
                        Contact Information
                      </h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-white/50 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={resume.contact.fullName}
                            onChange={(e) => updateContact('fullName', e.target.value)}
                            placeholder="John Doe"
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/50 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={resume.contact.email}
                            onChange={(e) => updateContact('email', e.target.value)}
                            placeholder="john@email.com"
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/50 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={resume.contact.phone}
                            onChange={(e) => updateContact('phone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/50 mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={resume.contact.location}
                            onChange={(e) => updateContact('location', e.target.value)}
                            placeholder="San Francisco, CA"
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/50 mb-1">
                            LinkedIn
                          </label>
                          <input
                            type="text"
                            value={resume.contact.linkedin}
                            onChange={(e) => updateContact('linkedin', e.target.value)}
                            placeholder="linkedin.com/in/johndoe"
                            className="input-field text-sm"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-white/50 mb-1">
                            Website / Portfolio
                          </label>
                          <input
                            type="text"
                            value={resume.contact.website}
                            onChange={(e) => updateContact('website', e.target.value)}
                            placeholder="johndoe.com"
                            className="input-field text-sm"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Summary Section */}
                  {activeSection === 'summary' && (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-neon-blue" />
                        Professional Summary
                      </h2>
                      <div>
                        <label className="block text-xs font-medium text-white/50 mb-1">
                          A brief 2-3 sentence summary of your professional background
                        </label>
                        <textarea
                          value={resume.summary}
                          onChange={(e) => updateSummary(e.target.value)}
                          placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications..."
                          rows={4}
                          className="input-field text-sm resize-y"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Experience Section */}
                  {activeSection === 'experience' && (
                    <motion.div
                      key="experience"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-neon-blue" />
                          Work Experience
                        </h2>
                        <button
                          onClick={addExperience}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-green/10 text-neon-green border border-neon-green/20 text-xs font-medium hover:bg-neon-green/20 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>

                      {resume.experience.map((exp, idx) => (
                        <div
                          key={exp.id}
                          className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-white/30">
                              Position {idx + 1}
                            </span>
                            {resume.experience.length > 1 && (
                              <button
                                onClick={() => removeExperience(exp.id)}
                                className="p-1 rounded-lg hover:bg-red-400/10 text-white/30 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-white/50 mb-1">
                                Job Title
                              </label>
                              <input
                                type="text"
                                value={exp.title}
                                onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                                placeholder="Software Engineer"
                                className="input-field text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-white/50 mb-1">
                                Company
                              </label>
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                placeholder="Google"
                                className="input-field text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-white/50 mb-1">
                                Location
                              </label>
                              <input
                                type="text"
                                value={exp.location}
                                onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                                placeholder="Mountain View, CA"
                                className="input-field text-sm"
                              />
                            </div>
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-white/50 mb-1">
                                  Start
                                </label>
                                <input
                                  type="text"
                                  value={exp.startDate}
                                  onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                  placeholder="Jan 2020"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-white/50 mb-1">
                                  End
                                </label>
                                <input
                                  type="text"
                                  value={exp.current ? '' : exp.endDate}
                                  onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                  placeholder={exp.current ? 'Present' : 'Dec 2023'}
                                  className="input-field text-sm"
                                  disabled={exp.current}
                                />
                              </div>
                            </div>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) =>
                                updateExperience(exp.id, 'current', e.target.checked)
                              }
                              className="w-4 h-4 rounded bg-white/10 border-white/20 text-neon-blue focus:ring-neon-blue/20 accent-[#00d4ff]"
                            />
                            <span className="text-xs text-white/50">I currently work here</span>
                          </label>
                          <div>
                            <label className="block text-xs font-medium text-white/50 mb-1">
                              Bullet Points (one per line, start with action verbs)
                            </label>
                            <textarea
                              value={exp.bullets}
                              onChange={(e) => updateExperience(exp.id, 'bullets', e.target.value)}
                              placeholder={"Led development of customer-facing features serving 1M+ users\nReduced page load time by 40% through code splitting and lazy loading\nMentored 3 junior developers on React best practices"}
                              rows={4}
                              className="input-field text-sm resize-y font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Education Section */}
                  {activeSection === 'education' && (
                    <motion.div
                      key="education"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-neon-blue" />
                          Education
                        </h2>
                        <button
                          onClick={addEducation}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-green/10 text-neon-green border border-neon-green/20 text-xs font-medium hover:bg-neon-green/20 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>

                      {resume.education.map((edu, idx) => (
                        <div
                          key={edu.id}
                          className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-white/30">
                              Education {idx + 1}
                            </span>
                            {resume.education.length > 1 && (
                              <button
                                onClick={() => removeEducation(edu.id)}
                                className="p-1 rounded-lg hover:bg-red-400/10 text-white/30 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-white/50 mb-1">
                                Degree
                              </label>
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                placeholder="B.S. Computer Science"
                                className="input-field text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-white/50 mb-1">
                                School
                              </label>
                              <input
                                type="text"
                                value={edu.school}
                                onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                                placeholder="Stanford University"
                                className="input-field text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-white/50 mb-1">
                                Location
                              </label>
                              <input
                                type="text"
                                value={edu.location}
                                onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                                placeholder="Stanford, CA"
                                className="input-field text-sm"
                              />
                            </div>
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-white/50 mb-1">
                                  Start
                                </label>
                                <input
                                  type="text"
                                  value={edu.startDate}
                                  onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                                  placeholder="2016"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-white/50 mb-1">
                                  End
                                </label>
                                <input
                                  type="text"
                                  value={edu.endDate}
                                  onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                                  placeholder="2020"
                                  className="input-field text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-white/50 mb-1">
                                GPA (optional)
                              </label>
                              <input
                                type="text"
                                value={edu.gpa}
                                onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                                placeholder="3.8/4.0"
                                className="input-field text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Skills Section */}
                  {activeSection === 'skills' && (
                    <motion.div
                      key="skills"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-neon-blue" />
                        Skills
                      </h2>
                      <div>
                        <label className="block text-xs font-medium text-white/50 mb-1">
                          Enter skills separated by commas
                        </label>
                        <textarea
                          value={resume.skills}
                          onChange={(e) => updateSkills(e.target.value)}
                          placeholder="JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, CI/CD, Agile, Team Leadership"
                          rows={3}
                          className="input-field text-sm resize-y"
                        />
                      </div>
                      {resume.skills.trim() && (
                        <div>
                          <label className="block text-xs font-medium text-white/30 mb-2">
                            Preview
                          </label>
                          <SkillTags skills={resume.skills} />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Download Button */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleDownload}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </motion.div>

            {/* Right: Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`${showPreview ? '' : 'hidden lg:block'}`}
            >
              <div className="sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white/40 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Live Preview
                  </h2>
                </div>
                <div ref={printRef} className="overflow-auto max-h-[calc(100vh-200px)] rounded-xl border border-white/10">
                  <ResumePreview data={resume} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <div className="card text-center bg-gradient-to-br from-neon-blue/5 to-neon-purple/5">
              <Sparkles className="w-8 h-8 text-neon-blue mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">
                Want AI-powered enhancements?
              </h2>
              <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">
                Sign up free to unlock AI-generated bullet points, ATS optimization, tailored keywords, and multiple professional templates.
              </p>
              <Link
                href="/signup"
                className="btn-primary inline-flex items-center gap-2"
              >
                Sign Up Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
