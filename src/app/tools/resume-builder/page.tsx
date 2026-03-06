'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Loader2,
  Check,
  Lock,
  ChevronRight,
  AlertCircle,
  X,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TemplatePreview from '@/components/resume/TemplatePreview';
import Link from 'next/link';

// ── Types ──────────────────────────────────────

interface ResumeContact {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
}

interface ResumeExperience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

interface ResumeDataV2 {
  contact: ResumeContact;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
}

// ── Constants ──────────────────────────────────

const STORAGE_KEY = 'nxted-resume-builder-data-v2';
const OLD_STORAGE_KEY = 'nxted-resume-builder-data';
const DOWNLOAD_KEY = 'nxted-free-downloads';
const MAX_FREE_DOWNLOADS = 2;
const FREE_TEMPLATE = 'modern';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const defaultResume: ResumeDataV2 = {
  contact: { name: '', email: '', phone: '', location: '', linkedin: '', portfolio: '' },
  summary: '',
  experience: [
    {
      id: generateId(),
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [''],
    },
  ],
  education: [
    {
      id: generateId(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
    },
  ],
  skills: [],
};

// ── Step labels ────────────────────────────────

const STEP_LABELS = [
  'Choose Mode',
  'Job Description',
  'Build Resume',
  'Template',
  'Preview',
  'Download',
];

// ── Accent colors per template ─────────────────

const ACCENT_COLORS: Record<string, string> = {
  modern: '#2563eb',
  classic: '#1e293b',
  minimal: '#374151',
  creative: '#7c3aed',
};

// ── Section tabs for the manual form ───────────

const SECTIONS = [
  { key: 'contact', label: 'Contact', icon: User },
  { key: 'summary', label: 'Summary', icon: FileText },
  { key: 'experience', label: 'Experience', icon: Briefcase },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'skills', label: 'Skills', icon: Wrench },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

// ── Animation variants ─────────────────────────

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease: 'easeIn' } },
};

// ═══════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════

export default function FreeResumeBuilderPage() {
  // ── State ──────────────────────────────────────
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'jd' | 'manual' | null>(null);
  const [resume, setResume] = useState<ResumeDataV2>(defaultResume);
  const [template, setTemplate] = useState<'modern' | 'classic' | 'minimal' | 'creative'>(FREE_TEMPLATE as 'modern');
  const [section, setSection] = useState<SectionKey>('contact');

  // JD mode state
  const [jobDescription, setJobDescription] = useState('');
  const [jdName, setJdName] = useState('');
  const [jdEmail, setJdEmail] = useState('');
  const [jdTargetRole, setJdTargetRole] = useState('');
  const [jdYearsExp, setJdYearsExp] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  // Download state
  const [downloadCount, setDownloadCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // ── Data migration on mount ────────────────────
  useEffect(() => {
    // Check for old format data
    try {
      const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldRaw) {
        const oldData = JSON.parse(oldRaw);
        const migrated: ResumeDataV2 = {
          contact: {
            name: oldData.contact?.fullName ?? '',
            email: oldData.contact?.email ?? '',
            phone: oldData.contact?.phone ?? '',
            location: oldData.contact?.location ?? '',
            linkedin: oldData.contact?.linkedin ?? '',
            portfolio: oldData.contact?.website ?? '',
          },
          summary: oldData.summary ?? '',
          experience: (oldData.experience ?? []).map((exp: any) => ({
            id: exp.id || generateId(),
            company: exp.company ?? '',
            role: exp.title ?? '',
            location: exp.location ?? '',
            startDate: exp.startDate ?? '',
            endDate: exp.endDate ?? '',
            current: exp.current ?? false,
            bullets:
              typeof exp.bullets === 'string'
                ? exp.bullets.split('\n').filter((b: string) => b.trim())
                : Array.isArray(exp.bullets)
                  ? exp.bullets
                  : [''],
          })),
          education: (oldData.education ?? []).map((edu: any) => ({
            id: edu.id || generateId(),
            institution: edu.school ?? '',
            degree: edu.degree ?? '',
            field: '',
            startDate: edu.startDate ?? '',
            endDate: edu.endDate ?? '',
            gpa: edu.gpa ?? '',
          })),
          skills:
            typeof oldData.skills === 'string'
              ? oldData.skills
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              : Array.isArray(oldData.skills)
                ? oldData.skills
                : [],
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        localStorage.removeItem(OLD_STORAGE_KEY);
        setResume(migrated);
        return;
      }
    } catch {
      // Ignore migration errors
    }

    // Load V2 data
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setResume(parsed);
      }
    } catch {
      // Ignore
    }

    // Load download count
    try {
      const dlRaw = localStorage.getItem(DOWNLOAD_KEY);
      if (dlRaw) setDownloadCount(parseInt(dlRaw, 10) || 0);
    } catch {
      // Ignore
    }
  }, []);

  // ── Auto-save (debounced) ──────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
      } catch {
        // Ignore storage errors
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [resume]);

  // ── Helpers ────────────────────────────────────

  const updateContact = useCallback(
    (field: keyof ResumeContact, value: string) => {
      setResume((prev) => ({
        ...prev,
        contact: { ...prev.contact, [field]: value },
      }));
    },
    [],
  );

  const updateExperience = useCallback(
    (id: string, field: keyof ResumeExperience, value: any) => {
      setResume((prev) => ({
        ...prev,
        experience: prev.experience.map((exp) =>
          exp.id === id ? { ...exp, [field]: value } : exp,
        ),
      }));
    },
    [],
  );

  const addExperience = useCallback(() => {
    setResume((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: generateId(),
          company: '',
          role: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          bullets: [''],
        },
      ],
    }));
  }, []);

  const removeExperience = useCallback((id: string) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }));
  }, []);

  const updateEducation = useCallback(
    (id: string, field: keyof ResumeEducation, value: string) => {
      setResume((prev) => ({
        ...prev,
        education: prev.education.map((edu) =>
          edu.id === id ? { ...edu, [field]: value } : edu,
        ),
      }));
    },
    [],
  );

  const addEducation = useCallback(() => {
    setResume((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: generateId(),
          institution: '',
          degree: '',
          field: '',
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
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  }, []);

  // ── JD Generate ────────────────────────────────

  const handleGenerate = async () => {
    if (!jobDescription.trim() || !jdName.trim() || !jdEmail.trim()) {
      setGenError('Please fill in the job description, your name, and email.');
      return;
    }

    setGenerating(true);
    setGenError('');

    try {
      const res = await fetch('/api/tools/resume-builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: jobDescription.trim(),
          basicInfo: {
            name: jdName.trim(),
            email: jdEmail.trim(),
            targetRole: jdTargetRole.trim(),
            yearsExperience: jdYearsExp,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Generation failed');
      }

      const data = await res.json();
      const generated = data.resume;

      // Map AI response to our format
      const newResume: ResumeDataV2 = {
        contact: {
          name: generated.contact?.name ?? jdName,
          email: generated.contact?.email ?? jdEmail,
          phone: generated.contact?.phone ?? '',
          location: generated.contact?.location ?? '',
          linkedin: generated.contact?.linkedin ?? '',
          portfolio: generated.contact?.portfolio ?? '',
        },
        summary: generated.summary ?? '',
        experience: (generated.experience ?? []).map((exp: any) => ({
          id: exp.id || generateId(),
          company: exp.company ?? '',
          role: exp.role ?? '',
          location: exp.location ?? '',
          startDate: exp.startDate ?? '',
          endDate: exp.endDate ?? '',
          current: exp.current ?? false,
          bullets: Array.isArray(exp.bullets) ? exp.bullets : [''],
        })),
        education: (generated.education ?? []).map((edu: any) => ({
          id: edu.id || generateId(),
          institution: edu.institution ?? '',
          degree: edu.degree ?? '',
          field: edu.field ?? '',
          startDate: edu.startDate ?? '',
          endDate: edu.endDate ?? '',
          gpa: edu.gpa ?? '',
        })),
        skills: Array.isArray(generated.skills) ? generated.skills : [],
      };

      setResume(newResume);
      setStep(3); // Jump to template selection
    } catch (err: any) {
      setGenError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Export / Download ──────────────────────────

  const handleExport = async () => {
    if (downloadCount >= MAX_FREE_DOWNLOADS) {
      setShowLimitModal(true);
      return;
    }

    setExporting(true);
    setExportError('');
    setExportSuccess(false);

    try {
      const res = await fetch('/api/tools/resume-builder/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: resume,
          template,
          clientCount: downloadCount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.error === 'limit_reached') {
          setShowLimitModal(true);
          return;
        }
        throw new Error(err.message || 'Export failed');
      }

      const html = await res.text();
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      }

      const newCount = downloadCount + 1;
      setDownloadCount(newCount);
      localStorage.setItem(DOWNLOAD_KEY, String(newCount));
      setExportSuccess(true);
    } catch (err: any) {
      setExportError(err.message || 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // ── Navigation helpers ─────────────────────────

  const goBack = () => {
    if (step === 3 && mode === 'jd') {
      setStep(1);
    } else if (step > 0) {
      setStep(step - 1);
    }
  };

  // ═══════════════════════════════════════════════
  //  RENDER HELPERS
  // ═══════════════════════════════════════════════

  // ── Progress Stepper ───────────────────────────

  const renderStepper = () => {
    // Determine visible steps based on mode
    const visibleSteps =
      mode === 'jd'
        ? [0, 1, 3, 4, 5]
        : mode === 'manual'
          ? [0, 2, 3, 4, 5]
          : [0];

    const visibleIndex = visibleSteps.indexOf(step);

    return (
      <div className="flex items-center justify-center gap-2 mb-10">
        {visibleSteps.map((s, i) => {
          const isCompleted = visibleIndex > i;
          const isCurrent = s === step;
          const isFuture = visibleIndex < i;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                        ? 'bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-white shadow-[0_0_16px_rgba(0,212,255,0.4)]'
                        : 'bg-white/[0.06] text-white/30 border border-white/10'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-[10px] whitespace-nowrap ${
                    isCurrent ? 'text-[#00d4ff]' : isFuture ? 'text-white/20' : 'text-white/50'
                  }`}
                >
                  {STEP_LABELS[s]}
                </span>
              </div>
              {i < visibleSteps.length - 1 && (
                <div
                  className={`w-8 h-px mb-4 ${
                    isCompleted ? 'bg-emerald-500/50' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Input component ────────────────────────────

  const Input = ({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    icon: Icon,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    icon?: any;
  }) => (
    <div>
      <label className="block text-xs text-white/50 mb-1.5 font-medium">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder:text-white/30 text-sm py-2.5 focus:outline-none focus:border-[#00d4ff]/50 focus:ring-1 focus:ring-[#00d4ff]/25 transition-all ${
            Icon ? 'pl-10 pr-4' : 'px-4'
          }`}
        />
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════
  //  STEP 0 — Choose Mode
  // ═══════════════════════════════════════════════

  const renderStep0 = () => (
    <motion.div
      key="step0"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-3xl mx-auto"
    >
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Free Resume Builder
        </h1>
        <p className="text-white/50 text-lg">
          Create a professional resume in minutes. Choose how you want to start.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* JD Card */}
        <motion.button
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setMode('jd');
            setStep(1);
          }}
          className="group relative bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-left hover:border-[#00d4ff]/30 hover:bg-white/[0.05] transition-all duration-300"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00d4ff]/20 to-[#0066ff]/20 flex items-center justify-center mb-5 group-hover:shadow-[0_0_24px_rgba(0,212,255,0.2)] transition-all">
            <Sparkles className="w-7 h-7 text-[#00d4ff]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Create from Job Description
          </h3>
          <p className="text-white/40 text-sm leading-relaxed">
            Paste a job description and our AI will create a tailored resume that highlights relevant skills and experience.
          </p>
          <div className="mt-5 flex items-center gap-2 text-[#00d4ff] text-sm font-medium">
            Get started <ChevronRight className="w-4 h-4" />
          </div>
          <div className="absolute top-4 right-4 px-2 py-0.5 rounded-md bg-[#00d4ff]/10 text-[#00d4ff] text-[10px] font-bold uppercase tracking-wider">
            AI Powered
          </div>
        </motion.button>

        {/* Manual Card */}
        <motion.button
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setMode('manual');
            setStep(2);
          }}
          className="group relative bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-left hover:border-white/25 hover:bg-white/[0.05] transition-all duration-300"
        >
          <div className="w-14 h-14 rounded-xl bg-white/[0.06] flex items-center justify-center mb-5 group-hover:bg-white/[0.1] transition-all">
            <FileText className="w-7 h-7 text-white/70" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Build Manually</h3>
          <p className="text-white/40 text-sm leading-relaxed">
            Fill in your details step by step. Full control over every section of your resume.
          </p>
          <div className="mt-5 flex items-center gap-2 text-white/60 text-sm font-medium group-hover:text-white/80">
            Get started <ChevronRight className="w-4 h-4" />
          </div>
        </motion.button>
      </div>
    </motion.div>
  );

  // ═══════════════════════════════════════════════
  //  STEP 1 — JD Input
  // ═══════════════════════════════════════════════

  const renderStep1 = () => (
    <motion.div
      key="step1"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Paste the Job Description</h2>
        <p className="text-white/40 text-sm">
          Our AI will analyze the role and create a tailored resume for you.
        </p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
        {/* Job Description */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5 font-medium">
            Job Description *
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={8}
            className="w-full bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder:text-white/30 text-sm p-4 focus:outline-none focus:border-[#00d4ff]/50 focus:ring-1 focus:ring-[#00d4ff]/25 transition-all resize-y min-h-[150px]"
          />
        </div>

        {/* Basic Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Your Name *"
            value={jdName}
            onChange={setJdName}
            placeholder="John Doe"
            icon={User}
          />
          <Input
            label="Email *"
            value={jdEmail}
            onChange={setJdEmail}
            placeholder="john@example.com"
            type="email"
            icon={Mail}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Target Role"
            value={jdTargetRole}
            onChange={setJdTargetRole}
            placeholder="Software Engineer"
            icon={Briefcase}
          />
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">
              Years of Experience
            </label>
            <select
              value={jdYearsExp}
              onChange={(e) => setJdYearsExp(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm py-2.5 px-4 focus:outline-none focus:border-[#00d4ff]/50 focus:ring-1 focus:ring-[#00d4ff]/25 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#1a1a2e]">
                Select...
              </option>
              <option value="0-1" className="bg-[#1a1a2e]">
                0-1 years
              </option>
              <option value="1-3" className="bg-[#1a1a2e]">
                1-3 years
              </option>
              <option value="3-5" className="bg-[#1a1a2e]">
                3-5 years
              </option>
              <option value="5-10" className="bg-[#1a1a2e]">
                5-10 years
              </option>
              <option value="10+" className="bg-[#1a1a2e]">
                10+ years
              </option>
            </select>
          </div>
        </div>

        {genError && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {genError}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-white rounded-xl py-3 font-semibold text-sm hover:shadow-[0_0_24px_rgba(0,212,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Resume...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Resume with AI
            </>
          )}
        </button>
      </div>

      {/* Back button */}
      <button
        onClick={goBack}
        className="mt-6 flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
    </motion.div>
  );

  // ═══════════════════════════════════════════════
  //  STEP 2 — Manual Form
  // ═══════════════════════════════════════════════

  const renderStep2 = () => (
    <motion.div
      key="step2"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Build Your Resume</h2>
        <p className="text-white/40 text-sm">
          Fill in each section. Your progress is auto-saved.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Section tabs (left sidebar) */}
        <div className="hidden md:flex flex-col gap-1 w-48 flex-shrink-0">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                section === key
                  ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Mobile section tabs */}
        <div className="flex md:hidden overflow-x-auto gap-2 mb-4 pb-2 -mx-4 px-4 w-[calc(100%+2rem)]">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                section === key
                  ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20'
                  : 'text-white/50 hover:text-white/80 bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Form content */}
        <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <AnimatePresence mode="wait">
            {/* ── Contact ──────────────── */}
            {section === 'contact' && (
              <motion.div
                key="sec-contact"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={resume.contact.name}
                    onChange={(v) => updateContact('name', v)}
                    placeholder="John Doe"
                    icon={User}
                  />
                  <Input
                    label="Email"
                    value={resume.contact.email}
                    onChange={(v) => updateContact('email', v)}
                    placeholder="john@example.com"
                    type="email"
                    icon={Mail}
                  />
                  <Input
                    label="Phone"
                    value={resume.contact.phone}
                    onChange={(v) => updateContact('phone', v)}
                    placeholder="+1 (555) 000-0000"
                    icon={Phone}
                  />
                  <Input
                    label="Location"
                    value={resume.contact.location}
                    onChange={(v) => updateContact('location', v)}
                    placeholder="San Francisco, CA"
                    icon={MapPin}
                  />
                  <Input
                    label="LinkedIn"
                    value={resume.contact.linkedin}
                    onChange={(v) => updateContact('linkedin', v)}
                    placeholder="linkedin.com/in/johndoe"
                    icon={Linkedin}
                  />
                  <Input
                    label="Portfolio / Website"
                    value={resume.contact.portfolio}
                    onChange={(v) => updateContact('portfolio', v)}
                    placeholder="johndoe.com"
                    icon={Globe}
                  />
                </div>
              </motion.div>
            )}

            {/* ── Summary ──────────────── */}
            {section === 'summary' && (
              <motion.div
                key="sec-summary"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-white mb-4">
                  Professional Summary
                </h3>
                <textarea
                  value={resume.summary}
                  onChange={(e) =>
                    setResume((prev) => ({ ...prev, summary: e.target.value }))
                  }
                  placeholder="Write a brief 2-3 sentence summary of your professional background and goals..."
                  rows={5}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder:text-white/30 text-sm p-4 focus:outline-none focus:border-[#00d4ff]/50 focus:ring-1 focus:ring-[#00d4ff]/25 transition-all resize-y"
                />
              </motion.div>
            )}

            {/* ── Experience ──────────────── */}
            {section === 'experience' && (
              <motion.div
                key="sec-experience"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Experience</h3>
                  <button
                    onClick={addExperience}
                    className="flex items-center gap-1.5 text-[#00d4ff] text-sm font-medium hover:text-[#00d4ff]/80 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Entry
                  </button>
                </div>

                {resume.experience.map((exp, idx) => (
                  <div
                    key={exp.id}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/30 font-medium uppercase tracking-wider">
                        Experience {idx + 1}
                      </span>
                      {resume.experience.length > 1 && (
                        <button
                          onClick={() => removeExperience(exp.id)}
                          className="text-red-400/60 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Job Title / Role"
                        value={exp.role}
                        onChange={(v) => updateExperience(exp.id, 'role', v)}
                        placeholder="Software Engineer"
                      />
                      <Input
                        label="Company"
                        value={exp.company}
                        onChange={(v) => updateExperience(exp.id, 'company', v)}
                        placeholder="Google"
                      />
                      <Input
                        label="Location"
                        value={exp.location}
                        onChange={(v) => updateExperience(exp.id, 'location', v)}
                        placeholder="Mountain View, CA"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Start Date"
                          value={exp.startDate}
                          onChange={(v) => updateExperience(exp.id, 'startDate', v)}
                          placeholder="Jan 2022"
                        />
                        <div>
                          <Input
                            label="End Date"
                            value={exp.current ? 'Present' : exp.endDate}
                            onChange={(v) => updateExperience(exp.id, 'endDate', v)}
                            placeholder="Dec 2023"
                          />
                          <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) => {
                                updateExperience(exp.id, 'current', e.target.checked);
                                if (e.target.checked) {
                                  updateExperience(exp.id, 'endDate', 'Present');
                                }
                              }}
                              className="rounded border-white/20 bg-white/5 text-[#00d4ff] focus:ring-[#00d4ff]/25"
                            />
                            <span className="text-[11px] text-white/40">Current role</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-white/50 mb-1.5 font-medium">
                        Bullet Points (one per line)
                      </label>
                      <textarea
                        value={exp.bullets.join('\n')}
                        onChange={(e) =>
                          updateExperience(
                            exp.id,
                            'bullets',
                            e.target.value.split('\n'),
                          )
                        }
                        placeholder={"Led a team of 5 engineers to deliver a key product feature\nIncreased user engagement by 30% through A/B testing\nReduced API response time by 40% via caching optimizations"}
                        rows={4}
                        className="w-full bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder:text-white/30 text-sm p-4 focus:outline-none focus:border-[#00d4ff]/50 focus:ring-1 focus:ring-[#00d4ff]/25 transition-all resize-y"
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── Education ──────────────── */}
            {section === 'education' && (
              <motion.div
                key="sec-education"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Education</h3>
                  <button
                    onClick={addEducation}
                    className="flex items-center gap-1.5 text-[#00d4ff] text-sm font-medium hover:text-[#00d4ff]/80 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Entry
                  </button>
                </div>

                {resume.education.map((edu, idx) => (
                  <div
                    key={edu.id}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/30 font-medium uppercase tracking-wider">
                        Education {idx + 1}
                      </span>
                      {resume.education.length > 1 && (
                        <button
                          onClick={() => removeEducation(edu.id)}
                          className="text-red-400/60 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Institution"
                        value={edu.institution}
                        onChange={(v) => updateEducation(edu.id, 'institution', v)}
                        placeholder="Stanford University"
                      />
                      <Input
                        label="Degree"
                        value={edu.degree}
                        onChange={(v) => updateEducation(edu.id, 'degree', v)}
                        placeholder="B.S."
                      />
                      <Input
                        label="Field of Study"
                        value={edu.field}
                        onChange={(v) => updateEducation(edu.id, 'field', v)}
                        placeholder="Computer Science"
                      />
                      <Input
                        label="GPA (optional)"
                        value={edu.gpa}
                        onChange={(v) => updateEducation(edu.id, 'gpa', v)}
                        placeholder="3.8"
                      />
                      <Input
                        label="Start Date"
                        value={edu.startDate}
                        onChange={(v) => updateEducation(edu.id, 'startDate', v)}
                        placeholder="Sep 2018"
                      />
                      <Input
                        label="End Date"
                        value={edu.endDate}
                        onChange={(v) => updateEducation(edu.id, 'endDate', v)}
                        placeholder="Jun 2022"
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── Skills ──────────────── */}
            {section === 'skills' && (
              <motion.div
                key="sec-skills"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">
                    Enter skills separated by commas
                  </label>
                  <textarea
                    value={resume.skills.join(', ')}
                    onChange={(e) =>
                      setResume((prev) => ({
                        ...prev,
                        skills: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="JavaScript, TypeScript, React, Node.js, Python, AWS, Docker"
                    rows={3}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder:text-white/30 text-sm p-4 focus:outline-none focus:border-[#00d4ff]/50 focus:ring-1 focus:ring-[#00d4ff]/25 transition-all resize-y"
                  />
                </div>

                {/* Skill pills */}
                {resume.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {resume.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={() => setStep(3)}
          className="bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-white rounded-xl px-8 py-2.5 font-semibold text-sm hover:shadow-[0_0_24px_rgba(0,212,255,0.3)] transition-all flex items-center gap-2"
        >
          Next: Choose Template
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  // ═══════════════════════════════════════════════
  //  STEP 3 — Choose Template
  // ═══════════════════════════════════════════════

  const renderStep3 = () => (
    <motion.div
      key="step3"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Choose a Template</h2>
        <p className="text-white/40 text-sm">
          Select a design for your resume. Premium templates include a subtle watermark.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        <TemplatePreview
          template="modern"
          selected={template === 'modern'}
          onClick={() => setTemplate('modern')}
          isFree={true}
        />
        <TemplatePreview
          template="classic"
          selected={template === 'classic'}
          onClick={() => setTemplate('classic')}
          isPremium={true}
        />
        <TemplatePreview
          template="minimal"
          selected={template === 'minimal'}
          onClick={() => setTemplate('minimal')}
          isPremium={true}
        />
        <TemplatePreview
          template="creative"
          selected={template === 'creative'}
          onClick={() => setTemplate('creative')}
          isPremium={true}
        />
      </div>

      <div className="text-center mt-6">
        <p className="text-white/30 text-xs">
          Premium templates include a subtle watermark.{' '}
          <Link href="/pricing" className="text-[#00d4ff] hover:underline">
            Subscribe to remove it
          </Link>
          .
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={() => setStep(4)}
          className="bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-white rounded-xl px-8 py-2.5 font-semibold text-sm hover:shadow-[0_0_24px_rgba(0,212,255,0.3)] transition-all flex items-center gap-2"
        >
          Next: Preview
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  // ═══════════════════════════════════════════════
  //  STEP 4 — Preview
  // ═══════════════════════════════════════════════

  const accent = ACCENT_COLORS[template] ?? ACCENT_COLORS.modern;

  const renderStep4 = () => (
    <motion.div
      key="step4"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Preview Your Resume</h2>
        <p className="text-white/40 text-sm">
          Review your resume before downloading. Make sure everything looks good.
        </p>
      </div>

      {/* A4-like preview card */}
      <div className="mx-auto max-w-[800px] bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-12 md:p-14" style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
          {/* Header */}
          <div
            className="text-center mb-6 pb-5"
            style={{ borderBottom: `2px solid ${accent}` }}
          >
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: accent }}
            >
              {resume.contact.name || 'Your Name'}
            </h1>
            <div className="text-sm text-gray-500 flex flex-wrap items-center justify-center gap-1">
              {resume.contact.email && <span>{resume.contact.email}</span>}
              {resume.contact.phone && (
                <>
                  {resume.contact.email && <span className="text-gray-300"> | </span>}
                  <span>{resume.contact.phone}</span>
                </>
              )}
              {resume.contact.location && (
                <>
                  {(resume.contact.email || resume.contact.phone) && (
                    <span className="text-gray-300"> | </span>
                  )}
                  <span>{resume.contact.location}</span>
                </>
              )}
              {resume.contact.linkedin && (
                <>
                  <span className="text-gray-300"> | </span>
                  <span style={{ color: accent }}>{resume.contact.linkedin}</span>
                </>
              )}
              {resume.contact.portfolio && (
                <>
                  <span className="text-gray-300"> | </span>
                  <span style={{ color: accent }}>{resume.contact.portfolio}</span>
                </>
              )}
            </div>
          </div>

          {/* Summary */}
          {resume.summary && (
            <>
              <div
                className="text-xs font-bold uppercase tracking-widest mb-2 mt-5 pb-1"
                style={{ color: accent, borderBottom: '1px solid #e5e7eb' }}
              >
                Professional Summary
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{resume.summary}</p>
            </>
          )}

          {/* Experience */}
          {resume.experience.length > 0 &&
            resume.experience.some((e) => e.role || e.company) && (
              <>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-2 mt-5 pb-1"
                  style={{ color: accent, borderBottom: '1px solid #e5e7eb' }}
                >
                  Experience
                </div>
                {resume.experience
                  .filter((e) => e.role || e.company)
                  .map((exp) => (
                    <div key={exp.id} className="mb-4">
                      <div className="flex justify-between items-baseline flex-wrap">
                        <div>
                          <span className="font-semibold text-sm text-gray-800">
                            {exp.role}
                          </span>
                          {exp.company && (
                            <span className="text-sm text-gray-500">
                              {' '}
                              &mdash; {exp.company}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {exp.startDate}
                          {exp.startDate && (exp.endDate || exp.current) && ' \u2013 '}
                          {exp.current ? 'Present' : exp.endDate}
                        </span>
                      </div>
                      {exp.location && (
                        <div className="text-xs text-gray-400">{exp.location}</div>
                      )}
                      {exp.bullets.filter((b) => b.trim()).length > 0 && (
                        <ul className="list-disc pl-5 mt-1 space-y-0.5">
                          {exp.bullets
                            .filter((b) => b.trim())
                            .map((bullet, i) => (
                              <li
                                key={i}
                                className="text-sm text-gray-700 leading-snug"
                              >
                                {bullet}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </>
            )}

          {/* Education */}
          {resume.education.length > 0 &&
            resume.education.some((e) => e.institution || e.degree) && (
              <>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-2 mt-5 pb-1"
                  style={{ color: accent, borderBottom: '1px solid #e5e7eb' }}
                >
                  Education
                </div>
                {resume.education
                  .filter((e) => e.institution || e.degree)
                  .map((edu) => (
                    <div key={edu.id} className="mb-3">
                      <div className="flex justify-between items-baseline flex-wrap">
                        <div>
                          <span className="font-semibold text-sm text-gray-800">
                            {edu.degree}
                            {edu.field && ` ${edu.field}`}
                          </span>
                          {edu.institution && (
                            <span className="text-sm text-gray-500">
                              {' '}
                              &mdash; {edu.institution}
                            </span>
                          )}
                          {edu.gpa && (
                            <span className="text-xs text-gray-400 ml-2">
                              GPA: {edu.gpa}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {edu.startDate}
                          {edu.startDate && edu.endDate && ' \u2013 '}
                          {edu.endDate}
                        </span>
                      </div>
                    </div>
                  ))}
              </>
            )}

          {/* Skills */}
          {resume.skills.length > 0 && (
            <>
              <div
                className="text-xs font-bold uppercase tracking-widest mb-2 mt-5 pb-1"
                style={{ color: accent, borderBottom: '1px solid #e5e7eb' }}
              >
                Technical Skills
              </div>
              <div className="text-sm text-gray-700">
                {resume.skills.join(' \u2022 ')}
              </div>
            </>
          )}

          {/* Watermark notice for premium templates */}
          {template !== 'modern' && (
            <div className="text-center text-xs text-gray-400 mt-8 pt-3 border-t border-gray-200">
              Created with nxtED AI &mdash; nxted.ai
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setStep(2);
              setSection('contact');
            }}
            className="bg-white/[0.06] border border-white/10 text-white/80 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-white/[0.1] transition-all"
          >
            Edit Resume
          </button>
          <button
            onClick={() => setStep(3)}
            className="bg-white/[0.06] border border-white/10 text-white/80 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-white/[0.1] transition-all"
          >
            Change Template
          </button>
        </div>
        <button
          onClick={() => setStep(5)}
          className="bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-white rounded-xl px-8 py-2.5 font-semibold text-sm hover:shadow-[0_0_24px_rgba(0,212,255,0.3)] transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>
    </motion.div>
  );

  // ═══════════════════════════════════════════════
  //  STEP 5 — Download
  // ═══════════════════════════════════════════════

  const renderStep5 = () => {
    const remaining = MAX_FREE_DOWNLOADS - downloadCount;
    const canDownload = remaining > 0;

    return (
      <motion.div
        key="step5"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-lg mx-auto"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Download Your Resume</h2>
          <p className="text-white/40 text-sm">
            Your resume is ready! Download it as a PDF.
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center">
          {canDownload ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d4ff]/20 to-[#0066ff]/20 flex items-center justify-center mx-auto mb-5">
                <Download className="w-8 h-8 text-[#00d4ff]" />
              </div>

              <p className="text-white/50 text-sm mb-6">
                You have <span className="text-[#00d4ff] font-semibold">{remaining}</span>{' '}
                free download{remaining !== 1 ? 's' : ''} remaining.
              </p>

              {exportError && (
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {exportError}
                </div>
              )}

              {exportSuccess && (
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 mb-4">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  Resume exported! Check the new tab to print/save as PDF.
                </div>
              )}

              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-white rounded-xl py-3 font-semibold text-sm hover:shadow-[0_0_24px_rgba(0,212,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF ({remaining} remaining)
                  </>
                )}
              </button>

              {template !== 'modern' && (
                <p className="text-white/30 text-xs mt-4">
                  This template will include a subtle watermark.{' '}
                  <Link href="/pricing" className="text-[#00d4ff] hover:underline">
                    Upgrade to remove it
                  </Link>
                  .
                </p>
              )}
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center mx-auto mb-5">
                <Lock className="w-8 h-8 text-white/40" />
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">
                You&apos;ve used your 2 free downloads!
              </h3>
              <p className="text-white/40 text-sm mb-6">
                Create a free account to continue downloading, or upgrade for unlimited
                exports without watermarks.
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  href="/signup"
                  className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-white rounded-xl py-3 font-semibold text-sm text-center hover:shadow-[0_0_24px_rgba(0,212,255,0.3)] transition-all"
                >
                  Create a Free Account
                </Link>
                <Link
                  href="/pricing"
                  className="w-full bg-white/[0.06] border border-white/10 text-white/80 rounded-xl py-3 font-medium text-sm text-center hover:bg-white/[0.1] transition-all"
                >
                  View Premium Plans
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Back button */}
        <button
          onClick={() => setStep(4)}
          className="mt-6 flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Preview
        </button>
      </motion.div>
    );
  };

  // ═══════════════════════════════════════════════
  //  LIMIT REACHED MODAL
  // ═══════════════════════════════════════════════

  const renderLimitModal = () => (
    <AnimatePresence>
      {showLimitModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setShowLimitModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#0f0f23] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLimitModal(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-white/40" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              You&apos;ve used your 2 free downloads!
            </h3>
            <p className="text-white/40 text-sm mb-6">
              Create a free account to continue, or view our premium plans for unlimited
              exports without watermarks.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/signup"
                className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-white rounded-xl py-3 font-semibold text-sm text-center hover:shadow-[0_0_24px_rgba(0,212,255,0.3)] transition-all"
              >
                Create a Free Account
              </Link>
              <Link
                href="/pricing"
                className="w-full bg-white/[0.06] border border-white/10 text-white/80 rounded-xl py-3 font-medium text-sm text-center hover:bg-white/[0.1] transition-all"
              >
                View Premium Plans
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ═══════════════════════════════════════════════
  //  MAIN RENDER
  // ═══════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 md:px-8 py-12 md:py-16">
        {/* Progress stepper */}
        {step > 0 && renderStepper()}

        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </AnimatePresence>
      </main>

      {/* Limit modal */}
      {renderLimitModal()}

      <Footer />
    </div>
  );
}
