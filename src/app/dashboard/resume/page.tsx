'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Edit3, Download, Copy, Trash2, Eye, Wand2,
  Briefcase, GraduationCap, Code, Award, User, Mail, Phone,
  MapPin, Linkedin, Globe, ArrowRight, CheckCircle2, Sparkles,
  Crown, Lock, X, Loader2, Users,
} from 'lucide-react';
import TemplatePreview from '@/components/resume/TemplatePreview';

const RESUME_STORAGE_KEY = 'nxted_resume_data';

// Empty resume template
const emptyResume = {
  id: '1',
  title: 'My Resume',
  template: 'modern',
  contact: {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
  },
  summary: '',
  experience: [] as { id: string; company: string; role: string; location: string; startDate: string; endDate: string; current: boolean; bullets: string[] }[],
  education: [] as { id: string; institution: string; degree: string; field: string; startDate: string; endDate: string; gpa: string }[],
  skills: [] as string[],
  certifications: [] as { id: string; name: string; issuer: string; date: string; verified: boolean }[],
  projects: [] as { id: string; name: string; description: string; url: string; technologies: string[] }[],
};

const templates = [
  { id: 'modern', name: 'Modern', desc: 'Clean, ATS-optimized' },
  { id: 'classic', name: 'Classic', desc: 'Traditional & polished' },
  { id: 'minimal', name: 'Minimal', desc: 'Simple & elegant' },
  { id: 'creative', name: 'Creative', desc: 'Standout design' },
];

const AI_FREE_LIMIT = 3;
const AI_USES_KEY = 'nxted_ai_uses';

function getAIUses(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(AI_USES_KEY) || '0', 10);
}

function incrementAIUses(): number {
  const current = getAIUses() + 1;
  localStorage.setItem(AI_USES_KEY, String(current));
  return current;
}

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl flex items-center gap-2 ${
        type === 'success'
          ? 'bg-green-500/20 border border-green-500/30 text-green-300'
          : 'bg-red-500/20 border border-red-500/30 text-red-300'
      }`}
    >
      {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
    </motion.div>
  );
}

export default function ResumePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [resume, setResume] = useState(emptyResume);
  const [activeSection, setActiveSection] = useState('contact');
  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState<string | null>(null); // tracks which AI operation is running
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Tailor state
  const [tailorJobDesc, setTailorJobDesc] = useState('');
  const [tailoring, setTailoring] = useState(false);

  // Cover letter state
  const [coverLetterModal, setCoverLetterModal] = useState(false);
  const [coverLetterJobDesc, setCoverLetterJobDesc] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);

  // Load resume from localStorage on mount, then fill user profile if empty
  useEffect(() => {
    const stored = localStorage.getItem(RESUME_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setResume(parsed);
        setResumeLoaded(true);
        return;
      } catch { /* ignore */ }
    }
    // No stored resume — fetch user profile to pre-fill contact
    fetch('/api/user/profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setResume(prev => ({
            ...prev,
            title: data.targetRole ? `${data.targetRole} Resume` : 'My Resume',
            contact: {
              ...prev.contact,
              name: data.name || '',
              email: data.email || '',
              location: data.location || '',
            },
          }));
        }
      })
      .catch(() => {})
      .finally(() => setResumeLoaded(true));
  }, []);

  // Save resume to localStorage whenever it changes (after initial load)
  useEffect(() => {
    if (resumeLoaded) {
      localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(resume));
    }
  }, [resume, resumeLoaded]);

  const userPlan = ((session?.user as any)?.plan ?? 'BASIC').toUpperCase();
  const isBasic = userPlan === 'BASIC';
  const isStarter = userPlan === 'STARTER';

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const checkAILimit = useCallback((): boolean => {
    if (!isBasic) return true;
    const uses = getAIUses();
    if (uses >= AI_FREE_LIMIT) {
      showToast(`Free AI limit reached (${AI_FREE_LIMIT}/${AI_FREE_LIMIT}). Upgrade to continue.`, 'error');
      return false;
    }
    return true;
  }, [isBasic, showToast]);

  // ── AI Enhance (full resume) ───────────────────
  const handleAIEnhance = async () => {
    if (!checkAILimit()) return;
    setGenerating(true);
    setAiLoading('enhance');

    try {
      // Enhance summary
      const summaryRes = await fetch('/api/ai/resume/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'summary',
          content: resume.summary,
        }),
      });

      if (!summaryRes.ok) {
        const errData = await summaryRes.json().catch(() => null);
        if (errData?.code === 'PLAN_LIMIT_REACHED') {
          showToast('Free AI limit reached. Upgrade to continue.', 'error');
          return;
        }
        throw new Error('Failed to enhance summary');
      }
      const summaryData = await summaryRes.json();

      // Enhance experience bullets for each role
      const enhancedExperience = [...resume.experience];
      for (let i = 0; i < enhancedExperience.length; i++) {
        const expRes = await fetch('/api/ai/resume/enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: 'experience',
            content: enhancedExperience[i].bullets.join('\n'),
          }),
        });

        if (expRes.ok) {
          const expData = await expRes.json();
          // The enhanced text might be a list of bullets; try to parse as lines
          const enhanced = expData.enhanced || '';
          const lines = enhanced.split('\n').map((l: string) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
          if (lines.length > 0) {
            enhancedExperience[i] = { ...enhancedExperience[i], bullets: lines };
          }
        }
      }

      setResume((prev) => ({
        ...prev,
        summary: summaryData.enhanced || prev.summary,
        experience: enhancedExperience,
      }));

      if (isBasic) incrementAIUses();
      showToast('Resume enhanced by AI successfully!', 'success');
    } catch (error) {
      console.error('AI Enhance error:', error);
      showToast('AI enhancement failed. Please try again.', 'error');
    } finally {
      setGenerating(false);
      setAiLoading(null);
    }
  };

  // ── AI Write Summary ───────────────────────────
  const handleAIWriteSummary = async () => {
    if (!checkAILimit()) return;
    setAiLoading('summary');

    try {
      const res = await fetch('/api/ai/resume/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'summary',
          content: resume.summary || `${resume.experience.map(e => `${e.role} at ${e.company}`).join('. ')}. Skills: ${resume.skills.join(', ')}.`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (errData?.code === 'PLAN_LIMIT_REACHED') {
          showToast('Free AI limit reached. Upgrade to continue.', 'error');
          return;
        }
        throw new Error('Failed to generate summary');
      }
      const data = await res.json();

      setResume((prev) => ({ ...prev, summary: data.enhanced || prev.summary }));
      if (isBasic) incrementAIUses();
      showToast('AI-generated summary applied!', 'success');
    } catch (error) {
      console.error('AI Write Summary error:', error);
      showToast('Failed to generate summary. Try again.', 'error');
    } finally {
      setAiLoading(null);
    }
  };

  // ── Tailor to Job Description ──────────────────
  const handleTailorToJob = async () => {
    if (!tailorJobDesc.trim()) {
      showToast('Please paste a job description first.', 'error');
      return;
    }
    if (!checkAILimit()) return;
    setTailoring(true);
    setAiLoading('tailor');

    try {
      // Build a text representation of the full resume for the API
      const fullContent = [
        `Summary: ${resume.summary}`,
        ...resume.experience.map((e) => `Experience - ${e.role} at ${e.company}:\n${e.bullets.join('\n')}`),
        `Skills: ${resume.skills.join(', ')}`,
      ].join('\n\n');

      const res = await fetch('/api/ai/resume/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'full',
          content: fullContent,
          targetJob: tailorJobDesc,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (errData?.code === 'PLAN_LIMIT_REACHED') {
          showToast('Free AI limit reached. Upgrade to continue.', 'error');
          return;
        }
        throw new Error('Failed to tailor resume');
      }
      const data = await res.json();

      // The API returns { enhanced, suggestions }
      // Enhanced might be JSON or plain text
      const enhanced = data.enhanced || '';
      try {
        const parsed = JSON.parse(enhanced);

        setResume((prev) => {
          const updated = { ...prev };

          if (parsed.summary) {
            updated.summary = parsed.summary;
          }

          if (Array.isArray(parsed.experience)) {
            updated.experience = prev.experience.map((exp) => {
              const match = parsed.experience.find((e: any) => e.id === exp.id);
              if (match && Array.isArray(match.bullets)) {
                return { ...exp, bullets: match.bullets };
              }
              return exp;
            });
          }

          if (Array.isArray(parsed.skills)) {
            updated.skills = parsed.skills;
          }

          return updated;
        });
      } catch {
        // Fallback: treat the enhanced response as a new summary if it's plain text
        if (enhanced.length > 20) {
          setResume((prev) => ({ ...prev, summary: enhanced }));
        }
      }

      if (isBasic) incrementAIUses();
      showToast('Resume tailored to job description!', 'success');
    } catch (error) {
      console.error('Tailor error:', error);
      showToast('Tailoring failed. Please try again.', 'error');
    } finally {
      setTailoring(false);
      setAiLoading(null);
    }
  };

  // ── Generate Cover Letter ──────────────────────
  const handleGenerateCoverLetter = async () => {
    if (!coverLetterJobDesc.trim()) {
      showToast('Please paste a job description first.', 'error');
      return;
    }
    if (!checkAILimit()) return;
    setCoverLetterLoading(true);

    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: {
            contact: resume.contact,
            summary: resume.summary,
            experience: resume.experience,
            skills: resume.skills,
            education: resume.education,
          },
          jobDescription: coverLetterJobDesc,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate cover letter');
      const data = await res.json();
      setCoverLetter(data.coverLetter || '');
      if (isBasic) incrementAIUses();
      showToast('Cover letter generated!', 'success');
    } catch (error) {
      console.error('Cover letter error:', error);
      showToast('Failed to generate cover letter. Try again.', 'error');
    } finally {
      setCoverLetterLoading(false);
    }
  };

  const handleCopyCoverLetter = () => {
    navigator.clipboard.writeText(coverLetter);
    showToast('Cover letter copied to clipboard!', 'success');
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
      showToast('Failed to export resume. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Cover Letter Modal */}
      <AnimatePresence>
        {coverLetterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setCoverLetterModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto glass border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-neon-blue" />
                  Generate Cover Letter
                </h3>
                <button onClick={() => setCoverLetterModal(false)} className="p-1.5 rounded-lg hover:bg-white/5">
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>

              {!coverLetter ? (
                <>
                  <p className="text-sm text-white/40 mb-4">
                    Paste the job description below and AI will generate a tailored cover letter based on your resume.
                  </p>
                  <textarea
                    value={coverLetterJobDesc}
                    onChange={(e) => setCoverLetterJobDesc(e.target.value)}
                    className="input-field h-40 resize-none mb-4"
                    placeholder="Paste the job description here..."
                  />
                  <button
                    onClick={handleGenerateCoverLetter}
                    disabled={coverLetterLoading}
                    className="btn-primary flex items-center gap-2"
                  >
                    {coverLetterLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI is writing your cover letter...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Generate Cover Letter
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 whitespace-pre-wrap text-sm text-white/80 leading-relaxed">
                    {coverLetter}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCopyCoverLetter} className="btn-secondary text-sm flex items-center gap-2">
                      <Copy className="w-4 h-4" /> Copy to Clipboard
                    </button>
                    <button
                      onClick={() => { setCoverLetter(''); setCoverLetterJobDesc(''); }}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <Wand2 className="w-4 h-4" /> Generate Another
                    </button>
                  </div>
                </>
              )}

              {isBasic && (
                <p className="text-xs text-white/30 mt-4">
                  Free plan: {Math.max(0, AI_FREE_LIMIT - getAIUses())} AI uses remaining
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* ── Human Expert Resume Review Banner ─────────────── */}
      <div className="card bg-gradient-to-r from-neon-green/10 to-neon-blue/10 border-neon-green/20 mb-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-neon-green/20 flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6 text-neon-green" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Get Your Resume Verified by Human Experts</h3>
          <p className="text-xs text-white/40">Pro & Ultra plans include professional resume review by real recruiters</p>
        </div>
        <Link href="/pricing" className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0">
          Upgrade
        </Link>
      </div>

      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
              <FileText className="w-7 h-7 text-neon-blue" /> Resume Builder
            </h1>
            <p className="text-white/40">ATS-optimized resumes powered by AI</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAIEnhance}
              className="btn-secondary text-sm flex items-center gap-2"
              disabled={generating || aiLoading !== null}
            >
              {aiLoading === 'enhance' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is enhancing...
                </>
              ) : (
                <>
                  <Wand2 className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                  AI Enhance
                </>
              )}
            </button>

            <button
              onClick={() => { setCoverLetter(''); setCoverLetterJobDesc(''); setCoverLetterModal(true); }}
              className="btn-secondary text-sm flex items-center gap-2"
              disabled={aiLoading !== null}
            >
              <FileText className="w-4 h-4" />
              Cover Letter
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

                {/* AI uses counter for BASIC plan */}
                {isBasic && (
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <p className="text-xs text-white/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI uses: {getAIUses()}/{AI_FREE_LIMIT} free
                    </p>
                  </div>
                )}
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
                    <button
                      onClick={handleAIWriteSummary}
                      disabled={aiLoading !== null}
                      className="badge-neon text-xs flex items-center gap-1"
                    >
                      {aiLoading === 'summary' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          AI is writing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3 h-3" /> AI Write
                        </>
                      )}
                    </button>
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
                          <button
                            onClick={async () => {
                              if (!checkAILimit()) return;
                              setAiLoading(`exp-${exp.id}`);
                              try {
                                const res = await fetch('/api/ai/resume/enhance', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ section: 'experience', content: exp.bullets.join('\n') }),
                                });
                                if (!res.ok) {
                                  const errData = await res.json().catch(() => null);
                                  if (errData?.code === 'PLAN_LIMIT_REACHED') {
                                    showToast('Free AI limit reached. Upgrade to continue.', 'error');
                                    return;
                                  }
                                  throw new Error('Enhance failed');
                                }
                                const data = await res.json();
                                const enhanced = data.enhanced || '';
                                const lines = enhanced.split('\n').map((l: string) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
                                if (lines.length > 0) {
                                  setResume((prev) => ({
                                    ...prev,
                                    experience: prev.experience.map((e) =>
                                      e.id === exp.id ? { ...e, bullets: lines } : e
                                    ),
                                  }));
                                  if (isBasic) incrementAIUses();
                                  showToast(`Enhanced ${exp.role} bullets!`, 'success');
                                }
                              } catch (error) {
                                console.error('Enhance exp error:', error);
                                showToast('Failed to enhance. Try again.', 'error');
                              } finally {
                                setAiLoading(null);
                              }
                            }}
                            disabled={aiLoading !== null}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-neon-blue/60 hover:text-neon-blue transition-colors"
                            title="AI Enhance bullets"
                          >
                            {aiLoading === `exp-${exp.id}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Wand2 className="w-3.5 h-3.5" />
                            )}
                          </button>
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
                        <button className="ml-1 text-white/30 hover:text-red-400">x</button>
                      </span>
                    ))}
                  </div>
                  <input className="input-field" placeholder="Add a skill and press Enter..." />
                </motion.div>
              )}

              {activeSection === 'template' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <h3 className="font-semibold mb-4">Choose Template</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">
                    {templates.map((t) => (
                      <TemplatePreview
                        key={t.id}
                        template={t.id as 'modern' | 'classic' | 'minimal' | 'creative'}
                        selected={resume.template === t.id}
                        onClick={() => setResume({...resume, template: t.id})}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {activeSection === 'tailor' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <h3 className="font-semibold mb-2">Tailor to Job Description</h3>
                  <p className="text-sm text-white/40 mb-4">Paste a job description and AI will optimize your resume for it.</p>
                  <textarea
                    value={tailorJobDesc}
                    onChange={(e) => setTailorJobDesc(e.target.value)}
                    className="input-field h-40 resize-none mb-4"
                    placeholder="Paste the job description here..."
                  />
                  <button
                    onClick={handleTailorToJob}
                    disabled={tailoring || aiLoading !== null}
                    className="btn-primary flex items-center gap-2"
                  >
                    {tailoring ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI is tailoring your resume...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" /> Optimize Resume
                      </>
                    )}
                  </button>
                  {isBasic && (
                    <p className="text-xs text-white/30 mt-3">
                      Free plan: {Math.max(0, AI_FREE_LIMIT - getAIUses())} AI uses remaining
                    </p>
                  )}
                </motion.div>
              )}

              {/* Default for other sections */}
              {!['contact', 'summary', 'experience', 'skills', 'template', 'tailor'].includes(activeSection) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <h3 className="font-semibold mb-4 capitalize">{activeSection}</h3>
                  <p className="text-sm text-white/40">Edit your {activeSection} section here. AI can help generate content.</p>
                  <button
                    onClick={async () => {
                      if (!checkAILimit()) return;
                      setAiLoading(activeSection);
                      try {
                        // Build content string from the section data
                        let sectionContent = '';
                        if (activeSection === 'certifications') {
                          sectionContent = resume.certifications.map(c => `${c.name} - ${c.issuer} (${c.date})`).join('\n');
                        } else if (activeSection === 'projects') {
                          sectionContent = resume.projects.map(p => `${p.name}: ${p.description}`).join('\n');
                        } else if (activeSection === 'education') {
                          sectionContent = resume.education.map(e => `${e.degree} ${e.field} at ${e.institution}`).join('\n');
                        }
                        const res = await fetch('/api/ai/resume/enhance', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            section: 'experience', // Use a valid section type
                            content: sectionContent || `Generate ${activeSection} content for an AI Engineer with skills: ${resume.skills.join(', ')}`,
                          }),
                        });
                        if (!res.ok) {
                          const errData = await res.json().catch(() => null);
                          if (errData?.code === 'PLAN_LIMIT_REACHED') {
                            showToast('Free AI limit reached. Upgrade to continue.', 'error');
                            return;
                          }
                          throw new Error('Generation failed');
                        }
                        const data = await res.json();
                        if (isBasic) incrementAIUses();
                        showToast(`AI generated ${activeSection} content!`, 'success');
                      } catch (error) {
                        console.error('AI Generate error:', error);
                        showToast('AI generation failed. Try again.', 'error');
                      } finally {
                        setAiLoading(null);
                      }
                    }}
                    disabled={aiLoading !== null}
                    className="btn-secondary text-sm mt-4 flex items-center gap-2"
                  >
                    {aiLoading === activeSection ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI is generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" /> AI Generate {activeSection}
                      </>
                    )}
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
