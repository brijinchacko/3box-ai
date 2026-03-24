'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Edit3, Download, Copy, Trash2, Eye, Wand2,
  Briefcase, GraduationCap, Code, Award, User, Mail, Phone,
  MapPin, Linkedin, Globe, ArrowRight, CheckCircle2, Sparkles,
  Crown, Lock, X, Loader2, Users, ShieldCheck, FileEdit, BarChart3, AlertTriangle, ClipboardCopy,
  FolderKanban,
} from 'lucide-react';
import TemplatePreview from '@/components/resume/TemplatePreview';
import AgentPageHeader from '@/components/dashboard/AgentPageHeader';
import AgentConfigPanel from '@/components/dashboard/AgentConfigPanel';
import AgentLockedPage from '@/components/dashboard/AgentLockedPage';
import AgentLoader from '@/components/brand/AgentLoader';
import ForgeAutoGenerate from '@/components/forge/ForgeAutoGenerate';
import { isAgentAvailable, type PlanTier } from '@/lib/agents/permissions';
import { notifyAgentCompleted } from '@/lib/notifications/toast';
import { useDashboardMode } from '@/components/providers/DashboardModeProvider';
import AgenticWorkspace from '@/components/dashboard/shared/AgenticWorkspace';
import { cn } from '@/lib/utils';
import '@/lib/resume/a4Styles.css';
import { calculatePageCount, getContentFillPercentage } from '@/lib/resume/a4Layout';

const RESUME_STORAGE_KEY = '3box_resume_data';

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
  skillDescriptions: {} as Record<string, string>,
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
const AI_USES_KEY = '3box_ai_uses';

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

function HumanExpertBanner({ userPlan }: { userPlan: string }) {
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasAccess = userPlan === 'PRO' || userPlan === 'MAX';

  const handleRequest = async () => {
    setLoading(true);
    try {
      await fetch('/api/support/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'resume_review',
          message: 'Request for professional resume review and verification by a human expert',
        }),
      });
      setRequested(true);
    } catch {
      setRequested(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-400/20 mb-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-orange-400/20 flex items-center justify-center flex-shrink-0">
        <Users className="w-6 h-6 text-orange-400" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm">Get Your Resume Verified by Human Experts</h3>
        <p className="text-xs text-white/40">
          {hasAccess
            ? 'Get your resume reviewed and verified by professional recruiters'
            : 'Pro & Max plans include professional resume review by real recruiters'}
        </p>
      </div>
      {hasAccess ? (
        requested ? (
          <span className="text-xs text-orange-400 flex items-center gap-1 flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" /> Request Sent
          </span>
        ) : (
          <button
            onClick={handleRequest}
            disabled={loading}
            className="btn-primary text-xs px-3 py-1.5 flex-shrink-0 flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
            Request Review
          </button>
        )
      ) : (
        <Link href="/pricing" className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0">
          Upgrade
        </Link>
      )}
    </div>
  );
}

// ── Autopilot Mode — Clean Resume Builder ────────────────
function AutopilotResume() {
  const { data: session } = useSession();
  const [resume, setResume] = useState(emptyResume);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'ats' | 'cover-letter' | 'linkedin'>('preview');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('contact');
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [atsResult, setAtsResult] = useState<any>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterJobDesc, setCoverLetterJobDesc] = useState('');
  const [genericCoverLetter, setGenericCoverLetter] = useState('');
  const [jdCoverLetter, setJdCoverLetter] = useState('');
  const [genericCLLoading, setGenericCLLoading] = useState(false);
  const [jdCLLoading, setJdCLLoading] = useState(false);
  const [linkedinSuggestions, setLinkedinSuggestions] = useState<any>(null);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [linkedinChecklist, setLinkedinChecklist] = useState<Record<string, boolean>>({
    headline: false,
    photo: false,
    about: false,
    openToWork: false,
    experience: false,
    skills: false,
    location: false,
    uploadCV: false,
  });
  const [portfolio, setPortfolio] = useState<any>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioFetched, setPortfolioFetched] = useState(false);
  const [showAddPortfolioPrompt, setShowAddPortfolioPrompt] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [wizardForm, setWizardForm] = useState({ targetRole: '', yearsExperience: '1-3', achievements: '', tone: 'Professional' });
  const [wizardGenerating, setWizardGenerating] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [autoGenerating, setAutoGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ text: string; section: string }[]>([]);

  // A4 preview scaling
  const [previewScale, setPreviewScale] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Revert / AI enhance state ──
  const [preEnhanceSnapshot, setPreEnhanceSnapshot] = useState<typeof emptyResume | null>(null);
  const [fieldAILoading, setFieldAILoading] = useState<string | null>(null); // e.g. 'summary', 'exp-0', 'exp-1'
  const [fieldPreSnapshots, setFieldPreSnapshots] = useState<Record<string, any>>({}); // field-key → old value

  // ── Resume preview HTML (rendered via iframe for native scrolling) ──
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // ── Own resume toggle (uploaded PDF vs 3BOX resume) ──
  const [ownResumeUrl, setOwnResumeUrl] = useState<string | null>(null);
  const [resumeSource, setResumeSource] = useState<'3box' | 'uploaded'>('3box');

  // ── Auto portfolio creation guard ──
  const portfolioAutoCreated = useRef(false);
  const userHasEdited = useRef(false);
  const dbLoadComplete = useRef(false); // guards localStorage writes until DB is loaded

  // A4 preview scale calculation (794px = A4 width at 96dpi)
  useEffect(() => {
    const updateScale = () => {
      if (previewRef.current) {
        const containerWidth = previewRef.current.offsetWidth - 32; // subtract wrapper padding
        setPreviewScale(Math.min(1, containerWidth / 794));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Generate preview HTML when switching to preview tab or when resume changes
  useEffect(() => {
    if (activeTab !== 'preview' || !resumeLoaded || !resume.contact.name) return;
    const timer = setTimeout(() => {
      setPreviewLoading(true);
      fetch('/api/resume/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: {
            contact: resume.contact,
            summary: resume.summary,
            experience: resume.experience,
            education: resume.education,
            skills: resume.skills,
            skillDescriptions: resume.skillDescriptions,
            certifications: resume.certifications,
            projects: resume.projects,
          },
          template: resume.template,
          previewOnly: true,
        }),
      })
        .then(res => res.ok ? res.text() : null)
        .then(html => { if (html) setPreviewHtml(html); })
        .catch(() => {})
        .finally(() => setPreviewLoading(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [activeTab, resume, resumeLoaded]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Sanitize bullet text: remove markdown bold, leading bullet chars, etc.
  const sanitizeBullet = (b: string) => {
    let clean = b
      .replace(/^\*\*.*?\*\*\s*/, '')  // Remove **bold prefix** like **Spearheaded**
      .replace(/\*\*/g, '')             // Remove remaining ** markers
      .replace(/^#{1,3}\s*/, '')        // Remove markdown headings
      .trim();
    // Remove leading bullet markers (may appear multiple times: "• · Spearheaded")
    while (/^[•·●\-*]\s*/.test(clean) && clean.length > 0) {
      clean = clean.replace(/^[•·●\-*]\s*/, '').trim();
    }
    return clean;
  };

  // Clean experience bullets from DB or AI
  const cleanExperience = (exps: any[]) => (exps || []).map((exp: any) => {
    // Fix duplicate endDate like "Dec 2021 – Dec 2021" or "Present – Present"
    // Only split on space-surrounded dashes to avoid breaking dates like "Jan-2020"
    let endDate = exp.endDate || '';
    const endParts = endDate.split(/\s+[–-]\s+/);
    if (endParts.length === 2 && endParts[0].trim() === endParts[1].trim()) {
      endDate = endParts[0].trim();
    }
    return {
      ...exp,
      endDate,
      bullets: (exp.bullets || [])
        .map((b: string) => sanitizeBullet(b))
        .filter((b: string) => {
          if (b.length < 3) return false; // Only filter truly empty bullets
          return true;
        }),
    };
  });

  // Load resume from DB (single source of truth), fallback to localStorage on error
  useEffect(() => {
    fetch('/api/user/resume')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.resume) {
          setResume(prev => ({
            ...prev,
            ...data.resume,
            contact: { ...prev.contact, ...(data.resume.contact || {}), email: data.resume.contact?.email || session?.user?.email || '' },
            experience: cleanExperience(data.resume.experience || []),
            education: data.resume.education || [],
            skills: data.resume.skills || [],
            certifications: data.resume.certifications || [],
            projects: data.resume.projects || [],
            skillDescriptions: data.resume.skillDescriptions || {},
          }));
          if (data.resumeId) setResumeId(data.resumeId);
          if (data.pdfUrl) setOwnResumeUrl(data.pdfUrl);
          setIsVerified(!!data.isFinalized);
          setIsFirstTime(false);
          dbLoadComplete.current = true;
          // Sync DB data to localStorage cache
          localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(data.resume));
          // Only generate AI suggestions — never auto-generate over an existing DB resume
          generateAISuggestions(data.resume);
        } else {
          dbLoadComplete.current = true;
          // No resume in DB — try pre-filling from user profile
          fetch('/api/user/profile')
            .then(res => res.ok ? res.json() : null)
            .then(profileData => {
              if (profileData) {
                const pd = profileData.careerTwin?.skillSnapshot?._profile || {};
                setResume(prev => ({
                  ...prev,
                  title: profileData.targetRole ? `${profileData.targetRole} Resume` : 'My Resume',
                  contact: {
                    ...prev.contact,
                    name: profileData.name || '',
                    email: profileData.email || '',
                    location: profileData.location || '',
                    phone: pd.phone || profileData.phone || '',
                    linkedin: pd.linkedin || profileData.linkedin || '',
                  },
                }));
              }
            })
            .catch(() => {});
          // Auto-generate
          autoGenerateResume(session?.user?.name || '');
        }
      })
      .catch(() => {
        // DB load failed — try localStorage as fallback
        try {
          const stored = localStorage.getItem(RESUME_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            setResume(parsed);
            setIsFirstTime(false);
            showToast('Loaded from local cache — changes may be out of date.', 'error');
          }
        } catch { /* localStorage also failed */ }
        dbLoadComplete.current = true;
      })
      .finally(() => setResumeLoaded(true));
  }, [session?.user?.email, session?.user?.name]);

  // Auto-generate a full resume from onboarding/profile data
  const autoGenerateResume = async (userName: string) => {
    setAutoGenerating(true);
    setIsFirstTime(false); // Don't show welcome screen — show loading state in editor
    try {
      // First check if there's a search profile or onboarding data to get target role
      let targetRole = '';
      try {
        const profileRes = await fetch('/api/user/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          targetRole = profileData.targetRole || profileData.currentRole || '';
        }
      } catch {}

      // If no target role from profile, try search profiles (loops)
      if (!targetRole) {
        try {
          const loopsRes = await fetch('/api/user/loops');
          if (loopsRes.ok) {
            const loopsData = await loopsRes.json();
            if (loopsData.profiles?.length > 0) {
              targetRole = loopsData.profiles[0].jobTitle || '';
            }
          }
        } catch {}
      }

      // Fallback to a generic role
      if (!targetRole) targetRole = 'Software Developer';

      const res = await fetch('/api/ai/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          yearsExperience: '1-3',
          achievements: '',
          tone: 'Professional',
        }),
      });

      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      if (data.resume) {
        setResume(prev => ({
          ...prev,
          ...data.resume,
          contact: {
            ...prev.contact,
            ...(data.resume.contact || {}),
            name: data.resume.contact?.name || userName || prev.contact.name,
            email: data.resume.contact?.email || session?.user?.email || prev.contact.email,
          },
          experience: data.resume.experience || [],
          education: data.resume.education || [],
          skills: data.resume.skills || [],
          skillDescriptions: data.resume.skillDescriptions || {},
          certifications: data.resume.certifications || [],
          projects: data.resume.projects || [],
        }));
        generateAISuggestions(data.resume);
        showToast('AI generated your resume! Review and customize it.', 'success');
      }
    } catch {
      // If AI generation fails, still show the editor with empty form
      showToast('Could not auto-generate. Fill in your details manually.', 'error');
    } finally {
      setAutoGenerating(false);
    }
  };

  // Generate AI suggestions for what's missing or could be improved
  const generateAISuggestions = (resumeData: any) => {
    const suggestions: { text: string; section: string }[] = [];
    if (!resumeData.contact?.phone) suggestions.push({ text: 'Add your phone number for recruiters to reach you', section: 'contact' });
    if (!resumeData.contact?.linkedin) suggestions.push({ text: 'Add your LinkedIn profile URL - recruiters check this first', section: 'contact' });
    if (!resumeData.contact?.portfolio) suggestions.push({ text: 'Create a portfolio to showcase your work', section: 'contact' });
    if (!resumeData.contact?.location) suggestions.push({ text: 'Add your location - many jobs filter by location', section: 'contact' });
    if (!resumeData.summary || resumeData.summary.length < 50) suggestions.push({ text: 'Write a compelling 3-4 sentence professional summary', section: 'summary' });
    if (!resumeData.experience || resumeData.experience.length === 0) suggestions.push({ text: 'Add your work experience - even internships count', section: 'experience' });
    if (resumeData.experience?.length > 0) {
      const hasWeakBullets = resumeData.experience.some((e: any) => !e.bullets || e.bullets.length < 3);
      if (hasWeakBullets) suggestions.push({ text: 'Add more bullet points with measurable achievements', section: 'experience' });
    }
    if (!resumeData.education || resumeData.education.length === 0) suggestions.push({ text: 'Add your education details', section: 'education' });
    if (!resumeData.skills || resumeData.skills.length < 5) suggestions.push({ text: 'Add at least 10-15 relevant skills for ATS optimization', section: 'skills' });
    if (!resumeData.projects || resumeData.projects.length === 0) suggestions.push({ text: 'Add 2-3 projects to showcase your technical abilities', section: 'projects' });
    if (!resumeData.certifications || resumeData.certifications.length === 0) suggestions.push({ text: 'Add relevant certifications to stand out', section: 'certifications' });
    setAiSuggestions(suggestions);
  };

  // Auto-save to DB with debounce
  useEffect(() => {
    if (!resumeLoaded || !resume.contact.name) return;
    // Skip the first auto-save triggered by initial data load (only when a resume was loaded from DB)
    if (!userHasEdited.current) {
      userHasEdited.current = true;
      if (resumeId) return; // Only skip if we loaded an existing resume — otherwise this IS a real edit
    }
    const timer = setTimeout(() => {
      setSaving(true);
      fetch('/api/user/resume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, resume, template: resume.template }),
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.resumeId && !resumeId) setResumeId(data.resumeId);
          setLastSaved(new Date().toLocaleTimeString());
          // Keep localStorage in sync with DB after successful save
          localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(resume));
          // Any real edit un-verifies the resume (user must re-verify)
          if (isVerified) setIsVerified(false);

          // Auto-create portfolio after first save (if none exists)
          if (!portfolioAutoCreated.current && resume.contact.name && resume.summary) {
            portfolioAutoCreated.current = true;
            autoCreatePortfolio();
          }
        })
        .catch(() => {
          showToast('Auto-save failed. Your changes may not be saved.', 'error');
        })
        .finally(() => setSaving(false));
    }, 2000);
    return () => clearTimeout(timer);
  }, [resume, resumeLoaded, resumeId]);

  // Re-evaluate AI suggestions with 1s debounce to avoid firing on every keystroke
  useEffect(() => {
    if (!resumeLoaded || !resume.contact) return;
    const timer = setTimeout(() => generateAISuggestions(resume), 1000);
    return () => clearTimeout(timer);
  }, [resume, resumeLoaded]);

  // Auto-create portfolio from resume data
  const autoCreatePortfolio = async () => {
    try {
      // Check if portfolio already exists
      const checkRes = await fetch('/api/portfolio');
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.portfolio) {
          // Portfolio exists — update contact field if published and not already set
          if (checkData.portfolio.isPublic && checkData.portfolio.slug && !resume.contact.portfolio) {
            const publicUrl = `${window.location.origin}/p/${checkData.portfolio.slug}`;
            setResume(prev => ({ ...prev, contact: { ...prev.contact, portfolio: publicUrl } }));
          }
          return;
        }
      }

      // Create portfolio from resume data
      const createRes = await fetch('/api/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${resume.contact.name}'s Portfolio`,
          bio: resume.summary || '',
          skills: resume.skills || [],
          projects: resume.projects || [],
          theme: 'midnight',
        }),
      });

      if (!createRes.ok) return;
      const createData = await createRes.json();

      // Auto-publish immediately
      const publishRes = await fetch('/api/portfolio/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (publishRes.ok) {
        const publishData = await publishRes.json();
        const publicUrl = `${window.location.origin}/p/${publishData.slug || createData.portfolio?.slug}`;
        setResume(prev => ({ ...prev, contact: { ...prev.contact, portfolio: publicUrl } }));
        setPortfolio(createData.portfolio);
        showToast('Portfolio auto-created and published!', 'success');
      }
    } catch {
      // Non-blocking — don't fail resume save if portfolio creation fails
      console.warn('[Resume] Auto-portfolio creation failed');
    }
  };

  const handleAIGenerate = async () => {
    if (!wizardForm.targetRole) return;
    setWizardGenerating(true);
    try {
      const res = await fetch('/api/ai/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wizardForm),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      if (data.resume) {
        setResume(prev => ({
          ...prev,
          ...data.resume,
          contact: { ...prev.contact, ...(data.resume.contact || {}) },
          experience: data.resume.experience || [],
          education: data.resume.education || [],
          skills: data.resume.skills || [],
          skillDescriptions: data.resume.skillDescriptions || {},
          certifications: data.resume.certifications || [],
          projects: data.resume.projects || [],
        }));
        setIsFirstTime(false);
        setShowAIWizard(false);
        showToast('Resume generated! Review and customize it.', 'success');
      }
    } catch { showToast('Failed to generate resume. Try again.', 'error'); }
    finally { setWizardGenerating(false); }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    setUploadedFileName(file.name);
    // Create a preview URL for the original uploaded file (PDF only)
    if (file.type === 'application/pdf') {
      const blobUrl = URL.createObjectURL(file);
      setOwnResumeUrl(blobUrl);
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Failed to parse resume. Please try again.', 'error');
        return;
      }
      const data = await res.json();
      const p = data.data; // API returns { success, data: { fullName, experiences, ... } }
      if (p) {
        // Convert onboarding-format parsed data to editor-format resume
        setResume(prev => ({
          ...prev,
          contact: {
            ...prev.contact,
            name: p.fullName || prev.contact.name,
            email: p.email || prev.contact.email,
            phone: p.phone || prev.contact.phone,
            location: p.location || prev.contact.location,
            linkedin: p.linkedin || prev.contact.linkedin,
            portfolio: p.website || p.portfolio || prev.contact.portfolio,
          },
          summary: p.bio || prev.summary,
          experience: (p.experiences || []).map((exp: any, i: number) => {
            // Parse duration safely — split on space-surrounded dashes only
            const parts = (exp.duration || '').split(/\s+[–-]\s+/);
            return {
              id: String(i + 1),
              company: exp.company || '',
              role: exp.title || '',
              location: '',
              startDate: parts[0]?.trim() || '',
              endDate: parts[1]?.trim() || '',
              current: false,
              bullets: exp.description ? [exp.description] : [],
            };
          }),
          education: p.educationLevel ? [{
            id: '1',
            institution: p.institution || '',
            degree: p.educationLevel || '',
            field: p.fieldOfStudy || '',
            startDate: '',
            endDate: p.graduationYear || '',
            gpa: '',
          }] : prev.education,
          skills: p.skills || prev.skills,
          skillDescriptions: prev.skillDescriptions,
          certifications: (p.certifications || []).length > 0
            ? p.certifications.map((c: any, i: number) => ({
                id: String(i + 1),
                name: c.name || '',
                issuer: c.issuer || '',
                date: c.date || '',
                verified: false,
              }))
            : prev.certifications,
          projects: (p.projects || []).length > 0
            ? p.projects.map((proj: any, i: number) => ({
                id: String(i + 1),
                name: proj.name || '',
                description: proj.description || '',
                url: proj.url || '',
                technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
              }))
            : prev.projects,
        }));
        setIsFirstTime(false);
        showToast('Resume parsed successfully!', 'success');
      }
    } catch { showToast('Failed to parse resume. Try AI Generate.', 'error'); }
    finally { setUploadingResume(false); }
  };

  const handleAIEnhance = async () => {
    setGenerating(true);
    // Save snapshot for revert
    setPreEnhanceSnapshot(JSON.parse(JSON.stringify(resume)));
    try {
      // Build full resume content to send to AI
      const fullContent = [
        `Name: ${resume.contact.name}`,
        `Email: ${resume.contact.email}`,
        resume.contact.phone ? `Phone: ${resume.contact.phone}` : '',
        resume.contact.location ? `Location: ${resume.contact.location}` : '',
        resume.summary ? `\nSummary:\n${resume.summary}` : '',
        resume.experience.length > 0 ? `\nExperience:\n${resume.experience.map(e => `${e.role} at ${e.company} (${e.startDate} - ${e.endDate || 'Present'})\n${(e.bullets || []).join('\n')}`).join('\n\n')}` : '',
        resume.education.length > 0 ? `\nEducation:\n${resume.education.map(e => `${e.degree} in ${e.field} at ${e.institution}`).join('\n')}` : '',
        resume.skills.length > 0 ? `\nSkills: ${resume.skills.join(', ')}` : '',
        resume.certifications.length > 0 ? `\nCertifications: ${resume.certifications.map(c => c.name).join(', ')}` : '',
      ].filter(Boolean).join('\n');

      const res = await fetch('/api/ai/resume/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'full', content: fullContent }),
      });

      if (res.ok) {
        const data = await res.json();
        // The API now returns structured data for 'full' enhancement
        // data.enhanced can be: { summary, experience, skills } or a string
        let parsed: any = null;
        try {
          parsed = typeof data.enhanced === 'string' ? JSON.parse(data.enhanced) : data.enhanced;
        } catch {
          // Not JSON — try extracting JSON from the string (non-greedy match for first complete object)
          try {
            const text = data.enhanced || '';
            const start = text.indexOf('{');
            if (start !== -1) {
              let depth = 0;
              let end = -1;
              for (let i = start; i < text.length; i++) {
                if (text[i] === '{') depth++;
                else if (text[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
              }
              if (end !== -1) parsed = JSON.parse(text.slice(start, end + 1));
            }
          } catch {
            showToast('AI returned unexpected format. Some changes may not have applied.', 'error');
          }
        }

        // Validate parsed structure before applying
        if (parsed && typeof parsed === 'object') {
          if (parsed.summary && typeof parsed.summary !== 'string') parsed.summary = undefined;
          if (parsed.experience && !Array.isArray(parsed.experience)) parsed.experience = undefined;
          if (parsed.skills && !Array.isArray(parsed.skills)) parsed.skills = undefined;
        }

        if (parsed?.summary) {
          // Clean any leftover JSON/markdown artifacts from summary
          const cleanSummary = parsed.summary.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
          setResume(prev => ({ ...prev, summary: cleanSummary }));
        }

        if (parsed?.experience && Array.isArray(parsed.experience)) {
          setResume(prev => ({
            ...prev,
            experience: prev.experience.map((exp, i) => {
              const enhanced = parsed.experience[i];
              if (!enhanced) return exp;
              const cleanBullet = (b: string) => sanitizeBullet(b);
              const cleanedBullets = (enhanced.bullets || [])
                .map((b: string) => cleanBullet(b))
                .filter((b: string) => {
                  if (!b || b.length < 10) return false;
                  // Filter out bullets that are just role titles or company names
                  const lower = b.toLowerCase();
                  const role = (enhanced.role || exp.role || '').toLowerCase();
                  const company = (enhanced.company || exp.company || '').toLowerCase();
                  if (role && lower.startsWith(role)) return false;
                  if (company && lower.includes(company) && b.length < 80 && !lower.includes('led') && !lower.includes('managed') && !lower.includes('developed')) return false;
                  return true;
                });
              return {
                ...exp,
                role: enhanced.role || exp.role,
                company: enhanced.company || exp.company,
                bullets: cleanedBullets.length > 0 ? cleanedBullets : exp.bullets,
              };
            }),
          }));
        }

        if (parsed?.skills && Array.isArray(parsed.skills)) {
          setResume(prev => ({ ...prev, skills: parsed.skills }));
        }

        if (!parsed) {
          // Fallback: enhance summary only, but clean any JSON artifacts
          const clean = (data.enhanced || '').replace(/```json[\s\S]*```/g, '').replace(/\{[\s\S]*\}/g, '').trim();
          if (clean.length > 20) {
            setResume(prev => ({ ...prev, summary: clean }));
            showToast('AI enhancement partially applied (summary only).', 'success');
          } else {
            showToast('AI enhancement returned no usable data.', 'error');
          }
        }

        showToast('Resume enhanced! Click "Revert" if you want to undo.', 'success');
      } else {
        setPreEnhanceSnapshot(null);
        showToast('Failed to enhance. Please try again.', 'error');
      }
    } catch {
      setPreEnhanceSnapshot(null);
      showToast('Failed to enhance. Please try again.', 'error');
    }
    finally { setGenerating(false); }
  };

  const handleRevertEnhance = () => {
    if (preEnhanceSnapshot) {
      setResume(preEnhanceSnapshot);
      setPreEnhanceSnapshot(null);
      showToast('Reverted to previous version.', 'success');
    }
  };

  // Per-field AI writing (summary, experience bullets, etc.)
  const handleFieldAI = async (fieldKey: string, content: string, context: string) => {
    setFieldAILoading(fieldKey);
    try {
      const section = fieldKey.startsWith('exp-') ? 'experience' : fieldKey;
      const res = await fetch('/api/ai/resume/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, content: content || context }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.enhanced) {
          if (fieldKey === 'summary') {
            setFieldPreSnapshots(prev => ({ ...prev, [fieldKey]: resume.summary }));
            setResume(prev => ({ ...prev, summary: data.enhanced }));
          } else if (fieldKey.startsWith('exp-')) {
            const idx = parseInt(fieldKey.split('-')[1]);
            setFieldPreSnapshots(prev => ({ ...prev, [fieldKey]: [...(resume.experience[idx]?.bullets || [])] }));
            const enhancedBullets = data.enhanced.split('\n').filter((b: string) => b.trim());
            setResume(prev => {
              const updated = [...prev.experience];
              if (updated[idx]) updated[idx] = { ...updated[idx], bullets: enhancedBullets };
              return { ...prev, experience: updated };
            });
          }
          showToast('AI enhanced! Click revert to undo.', 'success');
        }
      }
    } catch { showToast('AI writing failed. Try again.', 'error'); }
    finally { setFieldAILoading(null); }
  };

  const handleFieldRevert = (fieldKey: string) => {
    const snapshot = fieldPreSnapshots[fieldKey];
    if (snapshot === undefined) return;
    if (fieldKey === 'summary') {
      setResume(prev => ({ ...prev, summary: snapshot }));
    } else if (fieldKey.startsWith('exp-')) {
      const idx = parseInt(fieldKey.split('-')[1]);
      setResume(prev => {
        const updated = [...prev.experience];
        if (updated[idx]) updated[idx] = { ...updated[idx], bullets: snapshot };
        return { ...prev, experience: updated };
      });
    }
    setFieldPreSnapshots(prev => {
      const copy = { ...prev };
      delete copy[fieldKey];
      return copy;
    });
    showToast('Reverted to previous version.', 'success');
  };

  const handleExport = async () => {
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
            skillDescriptions: resume.skillDescriptions,
            certifications: resume.certifications,
            projects: resume.projects,
          },
          template: resume.template,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        if (err?.error === 'upgrade_required') {
          setExporting(false);
          window.location.href = '/pricing';
          return;
        }
        throw new Error(err?.message ?? 'Export failed');
      }
      // API returns HTML with auto-print script — open in new tab
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      showToast('Resume opened - use the print dialog to save as PDF.', 'success');
    } catch { showToast('Export failed.', 'error'); }
    finally { setExporting(false); }
  };

  // Verify resume — marks it as finalized & approved for job applications
  const handleVerifyResume = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/user/resume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, resume, template: resume.template, verify: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.resumeId && !resumeId) setResumeId(data.resumeId);
        setIsVerified(true);
        setActiveTab('preview');
        showToast('Resume verified! Ready for job applications.', 'success');
        // Auto-generate cover letter & LinkedIn suggestions on verification
        if (!genericCoverLetter && !genericCLLoading) {
          handleGenericCoverLetter();
        }
        if (!linkedinSuggestions && !linkedinLoading) {
          handleLinkedinSuggestions();
        }
      } else {
        showToast('Failed to verify resume.', 'error');
      }
    } catch {
      showToast('Failed to verify resume.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleATSCheck = async () => {
    setAtsLoading(true);
    setAtsResult(null);
    try {
      const res = await fetch('/api/ai/resume/ats-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: resume }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'ATS check failed');
      }
      const data = await res.json();
      setAtsResult(data);
      // If user navigated away from ATS tab, auto-switch back and notify
      if (activeTab !== 'ats') {
        setActiveTab('ats');
      }
      showToast('ATS analysis complete!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'ATS check failed. Try again.', 'error');
    }
    finally { setAtsLoading(false); }
  };

  const handleGenericCoverLetter = async () => {
    setGenericCLLoading(true);
    setGenericCoverLetter('');
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: '' }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setGenericCoverLetter(data.coverLetter);
    } catch { showToast('Failed to generate cover letter.', 'error'); }
    finally { setGenericCLLoading(false); }
  };

  const handleJDCoverLetter = async () => {
    if (!coverLetterJobDesc.trim()) {
      showToast('Please paste a job description first.', 'error');
      return;
    }
    setJdCLLoading(true);
    setJdCoverLetter('');
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: coverLetterJobDesc }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setJdCoverLetter(data.coverLetter);
      showToast('Targeted cover letter generated!', 'success');
    } catch { showToast('Failed to generate cover letter.', 'error'); }
    finally { setJdCLLoading(false); }
  };

  const handleLinkedinSuggestions = async () => {
    setLinkedinLoading(true);
    setLinkedinSuggestions(null);
    try {
      const res = await fetch('/api/ai/resume/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'linkedin',
          content: JSON.stringify({
            name: resume.contact.name,
            role: resume.experience?.[0]?.role || '',
            summary: resume.summary,
            skills: resume.skills,
            experience: resume.experience?.map(e => `${e.role} at ${e.company}`).join(', '),
          }),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      // Try to parse as JSON, otherwise generate structured suggestions
      try {
        const parsed = JSON.parse(data.enhanced);
        setLinkedinSuggestions(parsed);
      } catch {
        // AI returned text — construct structured format
        setLinkedinSuggestions({
          headline: data.enhanced?.split('\n')?.[0] || `${resume.experience?.[0]?.role || 'Professional'} | ${resume.skills?.slice(0, 3).join(' • ')}`,
          about: data.enhanced || resume.summary,
        });
      }
      showToast('LinkedIn suggestions generated!', 'success');
    } catch {
      // Fallback — generate locally based on resume data
      const role = resume.experience?.[0]?.role || 'Professional';
      const topSkills = resume.skills?.slice(0, 5).join(' | ') || '';
      setLinkedinSuggestions({
        headline: `${role} | ${topSkills}`,
        about: resume.summary || 'Update your LinkedIn About section based on your resume summary.',
      });
      showToast('Generated suggestions from your resume data.', 'success');
    }
    finally { setLinkedinLoading(false); }
  };

  // Auto-generate generic cover letter when tab is opened
  useEffect(() => {
    let cancelled = false;
    if (activeTab === 'cover-letter' && !genericCoverLetter && !genericCLLoading && resume.contact.name && !isFirstTime) {
      handleGenericCoverLetter();
    }
    return () => { cancelled = true; };
  }, [activeTab, resume.contact.name, isFirstTime]);

  const sections = [
    { id: 'contact', label: 'Contact', icon: User },
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
  ];

  const templateAccents: Record<string, string> = {
    modern: '#2563eb',
    classic: '#1e293b',
    minimal: '#374151',
    creative: '#7c3aed',
  };

  const accent = templateAccents[resume.template] || '#2563eb';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* Auto-generating loading state */}
      {autoGenerating && (
        <div className="max-w-md mx-auto py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-5 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI is building your resume...</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Using your profile data to create a professional, ATS-optimized resume.</p>
          <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto" />
        </div>
      )}

      {/* First-time fallback — only shows if auto-generate hasn't kicked in */}
      {isFirstTime && resumeLoaded && !autoGenerating && !showAIWizard && (
        <div className="max-w-2xl mx-auto py-16">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Your Professional Resume</h1>
            <p className="text-gray-500 dark:text-gray-400">Get started by uploading an existing resume or let AI create one for you.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="cursor-pointer group">
              <input type="file" accept=".pdf,.docx,.doc" className="hidden" onChange={handleResumeUpload} disabled={uploadingResume} />
              <div className="p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all bg-white dark:bg-gray-900 group-hover:shadow-lg text-center">
                {uploadingResume ? (
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
                ) : (
                  <Download className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                )}
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Upload Resume</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">PDF or DOCX - we&apos;ll parse and import it</p>
              </div>
            </label>

            <button onClick={() => setShowAIWizard(true)} className="text-left group">
              <div className="p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all bg-white dark:bg-gray-900 group-hover:shadow-lg text-center">
                <Sparkles className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Generate with AI</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Answer a few questions and AI builds it</p>
              </div>
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
            You can always edit everything after generation.
          </p>
        </div>
      )}

      {/* AI Resume Wizard */}
      {showAIWizard && (
        <div className="max-w-xl mx-auto py-10">
          <button onClick={() => setShowAIWizard(false)} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back
          </button>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Resume Generator</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tell us about yourself and we'll create a professional resume</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Target Role *</label>
              <input
                value={wizardForm.targetRole}
                onChange={(e) => setWizardForm(prev => ({ ...prev, targetRole: e.target.value }))}
                placeholder="e.g., Senior Full-Stack Developer"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Years of Experience</label>
              <select
                value={wizardForm.yearsExperience}
                onChange={(e) => setWizardForm(prev => ({ ...prev, yearsExperience: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="0-1">0-1 years (Entry Level)</option>
                <option value="1-3">1-3 years (Junior)</option>
                <option value="3-5">3-5 years (Mid-Level)</option>
                <option value="5-8">5-8 years (Senior)</option>
                <option value="8+">8+ years (Lead/Principal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Key Achievements (optional)</label>
              <textarea
                value={wizardForm.achievements}
                onChange={(e) => setWizardForm(prev => ({ ...prev, achievements: e.target.value }))}
                placeholder="e.g., Led a team of 5, Reduced load time by 40%, Built microservices handling 1M+ requests..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tone</label>
              <div className="flex gap-2">
                {['Professional', 'Technical', 'Executive', 'Creative'].map(t => (
                  <button
                    key={t}
                    onClick={() => setWizardForm(prev => ({ ...prev, tone: t }))}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      wizardForm.tone === t
                        ? 'border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAIGenerate}
              disabled={wizardGenerating || !wizardForm.targetRole}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {wizardGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating your resume...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Resume
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {!isFirstTime && !showAIWizard && !autoGenerating && (<>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Builder</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and customize your professional resume.
            {lastSaved && <span className="ml-2 text-xs text-green-500">{saving ? 'Saving...' : `Saved ${lastSaved}`}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isVerified && (<>
            {preEnhanceSnapshot && (
              <button
                onClick={handleRevertEnhance}
                className="px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Revert
              </button>
            )}
            <button
              onClick={handleAIEnhance}
              disabled={generating}
              className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors flex items-center gap-1.5"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Enhance
            </button>
          </>)}
          {/* Export PDF moved to Resume tab */}
        </div>
      </div>

      {/* Template selector moved inside Editor & Preview tabs */}

      {/* AI Suggestions Banner — hidden when verified */}
      {!isVerified && aiSuggestions.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">AI Suggestions to Improve Your Resume</span>
            </div>
            <button onClick={() => setAiSuggestions([])} className="text-xs text-amber-500/60 hover:text-amber-500">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiSuggestions.slice(0, 4).map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveTab('editor');
                  setActiveSection(s.section);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-[11px] text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3 h-3 shrink-0" />{s.text}
              </button>
            ))}
            {aiSuggestions.length > 4 && (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-[11px] text-purple-600 dark:text-purple-400 hover:from-purple-500/20 hover:to-blue-500/20 transition-colors"
              >
                <Crown className="w-3 h-3" /> Upgrade to see {aiSuggestions.length - 4} more suggestions
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Grouped navigation tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {/* Resume first, then Editor */}
        <button
          onClick={() => setActiveTab('preview')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
            activeTab === 'preview' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400',
          )}
        >
          <FileText className="w-4 h-4 inline mr-1.5" />Resume
        </button>
        {!isVerified && (
        <button
          onClick={() => setActiveTab('editor')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
            activeTab === 'editor' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400',
          )}
        >
          <Edit3 className="w-4 h-4 inline mr-1.5" />Editor
        </button>
        )}

        {/* Separator */}
        <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700 inline-block" />

        {/* Optimization group */}
        <button
          onClick={() => setActiveTab('ats')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
            activeTab === 'ats' ? 'border-green-600 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 dark:text-gray-400',
          )}
        >
          <ShieldCheck className="w-4 h-4 inline mr-1.5" />ATS Check
        </button>
        <button
          onClick={() => setActiveTab('cover-letter')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
            activeTab === 'cover-letter' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400',
          )}
        >
          <FileEdit className="w-4 h-4 inline mr-1.5" />Cover Letter
        </button>

        {/* Separator */}
        <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700 inline-block" />

        {/* Career Assets group */}
        <button
          onClick={() => setActiveTab('linkedin')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
            activeTab === 'linkedin' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400',
          )}
        >
          <Linkedin className="w-4 h-4 inline mr-1.5" />LinkedIn
        </button>
        {/* Portfolio removed — has its own sidebar page at /dashboard/portfolio */}
      </div>

      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Section nav */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 space-y-1">
              {sections.map(s => {
                const filled = s.id === 'contact' ? !!resume.contact.name
                  : s.id === 'summary' ? !!resume.summary
                  : s.id === 'experience' ? resume.experience.length > 0
                  : s.id === 'education' ? resume.education.length > 0
                  : s.id === 'skills' ? resume.skills.length > 0
                  : s.id === 'certifications' ? resume.certifications.length > 0
                  : s.id === 'projects' ? resume.projects.length > 0
                  : false;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                      activeSection === s.id
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                    )}
                  >
                    <s.icon className="w-4 h-4" />
                    {s.label}
                    {filled && <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />}
                  </button>
                );
              })}
            </div>

            {/* Template Selector with Visual Previews */}
            <div className="mt-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">Template</h4>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((t) => {
                  const isSelected = resume.template === t.id;
                  const accents: Record<string, { border: string; bg: string; text: string }> = {
                    modern: { border: 'border-cyan-400 dark:border-cyan-400/60', bg: 'bg-cyan-50 dark:bg-cyan-400/10', text: 'text-cyan-600 dark:text-cyan-400' },
                    classic: { border: 'border-amber-400 dark:border-amber-400/60', bg: 'bg-amber-50 dark:bg-amber-400/10', text: 'text-amber-600 dark:text-amber-400' },
                    minimal: { border: 'border-gray-400 dark:border-white/40', bg: 'bg-gray-50 dark:bg-white/5', text: 'text-gray-600 dark:text-white/70' },
                    creative: { border: 'border-purple-400 dark:border-purple-400/60', bg: 'bg-purple-50 dark:bg-purple-400/10', text: 'text-purple-600 dark:text-purple-400' },
                  };
                  const a = accents[t.id] || accents.modern;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setResume(prev => ({ ...prev, template: t.id }))}
                      className={cn(
                        'relative group rounded-xl overflow-hidden transition-all duration-200',
                        isSelected
                          ? `border-2 ${a.border} shadow-sm`
                          : 'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                      )}
                    >
                      <div className={cn('h-20', isSelected ? a.bg : 'bg-gray-50 dark:bg-gray-800/50 group-hover:bg-gray-100 dark:group-hover:bg-gray-800', 'transition-all p-1.5')}>
                        <TemplatePreviewMini template={t.id as 'modern' | 'classic' | 'minimal' | 'creative'} />
                      </div>
                      {isSelected && (
                        <div className={cn('absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center', a.bg, 'border', a.border)}>
                          <svg className={cn('w-2.5 h-2.5', a.text)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className={cn('py-1.5 px-1.5 text-center', isSelected ? a.bg : '')}>
                        <div className={cn('text-[11px] font-semibold', isSelected ? a.text : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200')}>{t.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resume File Management moved to Resume tab */}
          </div>

          {/* Editor content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              {activeSection === 'contact' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: 'name', label: 'Full Name', icon: User, placeholder: 'John Doe' },
                      { key: 'email', label: 'Email', icon: Mail, placeholder: 'john@example.com' },
                      { key: 'phone', label: 'Phone', icon: Phone, placeholder: '+1 (555) 123-4567' },
                      { key: 'location', label: 'Location', icon: MapPin, placeholder: 'San Francisco, CA' },
                      { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/johndoe' },
                      { key: 'portfolio', label: 'Portfolio', icon: Globe, placeholder: 'johndoe.dev' },
                    ].map(field => (
                      <div key={field.key}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{field.label}</label>
                          {field.key === 'portfolio' && resume.contact.portfolio && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-green-500 flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Published
                              </span>
                              <a
                                href={resume.contact.portfolio.startsWith('http') ? resume.contact.portfolio : `https://${resume.contact.portfolio}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-blue-500 hover:text-blue-600 flex items-center gap-0.5"
                              >
                                View <ArrowRight className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={(resume.contact as any)[field.key] || ''}
                          onChange={(e) => setResume(prev => ({ ...prev, contact: { ...prev.contact, [field.key]: e.target.value } }))}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'summary' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Professional Summary</h3>
                    <div className="flex items-center gap-2">
                      {fieldPreSnapshots['summary'] !== undefined && (
                        <button
                          onClick={() => handleFieldRevert('summary')}
                          className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <ArrowRight className="w-3 h-3 rotate-180" /> Revert
                        </button>
                      )}
                      <button
                        onClick={() => handleFieldAI('summary', resume.summary, 'Professional summary for a resume')}
                        disabled={fieldAILoading === 'summary' || generating}
                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                      >
                        {fieldAILoading === 'summary' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {fieldAILoading === 'summary' ? 'Writing...' : 'AI Write'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={resume.summary}
                    onChange={(e) => setResume(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="Write a brief professional summary highlighting your key strengths and career objectives..."
                    rows={5}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                  />
                </div>
              )}

              {activeSection === 'experience' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Work Experience</h3>

                  {/* Text-based experience entry */}
                  <div className="p-3 rounded-lg border border-dashed border-purple-300 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardCopy className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-400">Paste Experience as Text</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                      Paste your full experience text below. AI will parse it into structured fields (role, company, dates, achievements).
                    </p>
                    <textarea
                      id="exp-text-paste"
                      placeholder={"Software Engineer at Google, Mountain View, CA\nJan 2020 - Present\n- Built microservices handling 1M+ requests/day\n- Led migration from monolith to event-driven architecture\n\nJunior Developer at Startup Inc, Remote\nJun 2018 - Dec 2019\n- Developed React dashboard used by 500+ customers"}
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-y mb-2"
                    />
                    <button
                      onClick={async () => {
                        const textarea = document.getElementById('exp-text-paste') as HTMLTextAreaElement;
                        const text = textarea?.value?.trim();
                        if (!text) { showToast('Please paste your experience text first.', 'error'); return; }
                        setFieldAILoading('exp-parse');
                        try {
                          const res = await fetch('/api/ai/resume/enhance', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              section: 'experience',
                              content: `Parse the following raw experience text into structured experience entries. Return a JSON array where each entry has: role, company, location, startDate, endDate, bullets (array of strings). Text:\n\n${text}`,
                            }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            try {
                              const parsed = JSON.parse(typeof data.enhanced === 'string' ? data.enhanced : JSON.stringify(data.enhanced));
                              const entries = Array.isArray(parsed) ? parsed : (parsed.experience || parsed.entries || [parsed]);
                              if (entries.length > 0) {
                                const newExps = entries.map((e: any) => ({
                                  id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
                                  role: e.role || e.title || e.position || '',
                                  company: e.company || e.organization || '',
                                  location: e.location || '',
                                  startDate: e.startDate || e.start_date || e.start || '',
                                  endDate: e.endDate || e.end_date || e.end || '',
                                  current: false,
                                  bullets: Array.isArray(e.bullets) ? e.bullets : (e.achievements || e.descriptions || []),
                                }));
                                setResume(prev => ({ ...prev, experience: [...prev.experience, ...newExps] }));
                                textarea.value = '';
                                showToast(`Added ${newExps.length} experience${newExps.length > 1 ? 's' : ''} from text!`, 'success');
                              }
                            } catch {
                              // Fallback: add as single experience with text as bullets
                              const bullets = text.split('\n').filter((l: string) => l.trim());
                              setResume(prev => ({
                                ...prev,
                                experience: [...prev.experience, {
                                  id: Date.now().toString(),
                                  role: '', company: '', location: '', startDate: '', endDate: '', current: false,
                                  bullets,
                                }],
                              }));
                              textarea.value = '';
                              showToast('Added experience. Please fill in role & company details.', 'success');
                            }
                          } else {
                            showToast('AI parsing failed. Try structured fields below.', 'error');
                          }
                        } catch {
                          showToast('Failed to parse. Try adding manually.', 'error');
                        } finally {
                          setFieldAILoading(null);
                        }
                      }}
                      disabled={fieldAILoading === 'exp-parse'}
                      className="px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-500/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/10 transition-colors flex items-center gap-1.5"
                    >
                      {fieldAILoading === 'exp-parse' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {fieldAILoading === 'exp-parse' ? 'Parsing...' : 'Parse with AI'}
                    </button>
                  </div>

                  {resume.experience.map((exp, i) => (
                    <div key={exp.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{exp.role || 'New Role'}</span>
                        <button onClick={() => setResume(prev => ({ ...prev, experience: prev.experience.filter((_, idx) => idx !== i) }))} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Job Title" value={exp.role} onChange={(e) => { const updated = [...resume.experience]; updated[i] = { ...updated[i], role: e.target.value }; setResume(prev => ({ ...prev, experience: updated })); }} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <input placeholder="Company" value={exp.company} onChange={(e) => { const updated = [...resume.experience]; updated[i] = { ...updated[i], company: e.target.value }; setResume(prev => ({ ...prev, experience: updated })); }} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <input placeholder="Location" value={exp.location} onChange={(e) => { const updated = [...resume.experience]; updated[i] = { ...updated[i], location: e.target.value }; setResume(prev => ({ ...prev, experience: updated })); }} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <div className="flex gap-2">
                          <input placeholder="Start" value={exp.startDate} onChange={(e) => { const updated = [...resume.experience]; updated[i] = { ...updated[i], startDate: e.target.value }; setResume(prev => ({ ...prev, experience: updated })); }} className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                          <input placeholder="End" value={exp.endDate} onChange={(e) => { const updated = [...resume.experience]; updated[i] = { ...updated[i], endDate: e.target.value }; setResume(prev => ({ ...prev, experience: updated })); }} className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                      </div>
                      {/* Key Achievements textarea with AI Write + Revert */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Key Achievements</label>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">One achievement per line. Each line becomes a bullet point.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {fieldPreSnapshots[`exp-${i}`] !== undefined && (
                              <button
                                onClick={() => handleFieldRevert(`exp-${i}`)}
                                className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                              >
                                <ArrowRight className="w-2.5 h-2.5 rotate-180" /> Revert
                              </button>
                            )}
                            <button
                              onClick={() => handleFieldAI(`exp-${i}`, (exp.bullets || []).join('\n'), `Experience bullets for ${exp.role || 'this role'} at ${exp.company || 'this company'}`)}
                              disabled={fieldAILoading === `exp-${i}` || generating}
                              className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
                            >
                              {fieldAILoading === `exp-${i}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                              {fieldAILoading === `exp-${i}` ? 'Writing...' : 'AI Write'}
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={(exp.bullets || []).join('\n')}
                          onChange={(e) => {
                            const updated = [...resume.experience];
                            const bullets = e.target.value.split('\n');
                            updated[i] = { ...updated[i], bullets };
                            setResume(prev => ({ ...prev, experience: updated }));
                          }}
                          placeholder="Paste or type your achievements here, one per line&#10;e.g. Led a team of 10 engineers to deliver project 2 weeks early&#10;Reduced operational costs by 25% through process optimization"
                          rows={5}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setResume(prev => ({ ...prev, experience: [...prev.experience, { id: Date.now().toString(), company: '', role: '', location: '', startDate: '', endDate: '', current: false, bullets: [] }] }))}
                    className="w-full py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Experience
                  </button>
                </div>
              )}

              {activeSection === 'education' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Education</h3>
                  {resume.education.map((edu, i) => (
                    <div key={edu.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{edu.degree || 'New Degree'}</span>
                        <button onClick={() => setResume(prev => ({ ...prev, education: prev.education.filter((_, idx) => idx !== i) }))} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Institution" value={edu.institution} onChange={(e) => { const updated = [...resume.education]; updated[i] = { ...updated[i], institution: e.target.value }; setResume(prev => ({ ...prev, education: updated })); }} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <input placeholder="Degree" value={edu.degree} onChange={(e) => { const updated = [...resume.education]; updated[i] = { ...updated[i], degree: e.target.value }; setResume(prev => ({ ...prev, education: updated })); }} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <input placeholder="Field of Study" value={edu.field} onChange={(e) => { const updated = [...resume.education]; updated[i] = { ...updated[i], field: e.target.value }; setResume(prev => ({ ...prev, education: updated })); }} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <input placeholder="GPA" value={edu.gpa} onChange={(e) => { const updated = [...resume.education]; updated[i] = { ...updated[i], gpa: e.target.value }; setResume(prev => ({ ...prev, education: updated })); }} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <input placeholder="Start Year (e.g. 2018)" value={edu.startDate} onChange={(e) => { const updated = [...resume.education]; updated[i] = { ...updated[i], startDate: e.target.value }; setResume(prev => ({ ...prev, education: updated })); }} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <input placeholder="End Year (e.g. 2022)" value={edu.endDate} onChange={(e) => { const updated = [...resume.education]; updated[i] = { ...updated[i], endDate: e.target.value }; setResume(prev => ({ ...prev, education: updated })); }} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setResume(prev => ({ ...prev, education: [...prev.education, { id: Date.now().toString(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' }] }))}
                    className="w-full py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Education
                  </button>
                </div>
              )}

              {activeSection === 'skills' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map(skill => (
                      <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-medium">
                        {skill}
                        <button onClick={() => setResume(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))} className="text-blue-400 hover:text-red-500 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const input = (e.target as HTMLFormElement).elements.namedItem('skill') as HTMLInputElement;
                    const val = input.value.trim();
                    if (val && !resume.skills.includes(val)) {
                      setResume(prev => ({ ...prev, skills: [...prev.skills, val] }));
                      input.value = '';
                    }
                  }}>
                    <input
                      name="skill"
                      placeholder="Type a skill and press Enter..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </form>
                </div>
              )}

              {activeSection === 'certifications' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Certifications</h3>
                  {resume.certifications.map((cert, i) => (
                    <div key={cert.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{cert.name || 'New Certification'}</span>
                        <button onClick={() => setResume(prev => ({ ...prev, certifications: prev.certifications.filter((_, idx) => idx !== i) }))} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Certification Name" value={cert.name} onChange={(e) => { const updated = [...resume.certifications]; updated[i] = { ...updated[i], name: e.target.value }; setResume(prev => ({ ...prev, certifications: updated })); }} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <input placeholder="Issuer" value={cert.issuer} onChange={(e) => { const updated = [...resume.certifications]; updated[i] = { ...updated[i], issuer: e.target.value }; setResume(prev => ({ ...prev, certifications: updated })); }} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setResume(prev => ({ ...prev, certifications: [...prev.certifications, { id: Date.now().toString(), name: '', issuer: '', date: '', verified: false }] }))}
                    className="w-full py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Certification
                  </button>
                </div>
              )}

              {activeSection === 'projects' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Projects</h3>
                  {resume.projects.map((proj, i) => (
                    <div key={proj.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{proj.name || 'New Project'}</span>
                        <button onClick={() => setResume(prev => ({ ...prev, projects: prev.projects.filter((_, idx) => idx !== i) }))} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Project Name</label>
                          <input
                            placeholder="e.g., E-Commerce Platform"
                            value={proj.name}
                            onChange={(e) => { const updated = [...resume.projects]; updated[i] = { ...updated[i], name: e.target.value }; setResume(prev => ({ ...prev, projects: updated })); }}
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
                          <textarea
                            placeholder="Brief description of the project and your contributions..."
                            value={proj.description}
                            onChange={(e) => { const updated = [...resume.projects]; updated[i] = { ...updated[i], description: e.target.value }; setResume(prev => ({ ...prev, projects: updated })); }}
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 h-20 resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">URL</label>
                            <input
                              placeholder="https://github.com/user/project"
                              value={proj.url}
                              onChange={(e) => { const updated = [...resume.projects]; updated[i] = { ...updated[i], url: e.target.value }; setResume(prev => ({ ...prev, projects: updated })); }}
                              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Technologies (comma-separated)</label>
                            <input
                              placeholder="e.g., React, Node.js, PostgreSQL"
                              value={proj.technologies.join(', ')}
                              onChange={(e) => { const updated = [...resume.projects]; updated[i] = { ...updated[i], technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }; setResume(prev => ({ ...prev, projects: updated })); }}
                              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setResume(prev => ({ ...prev, projects: [...prev.projects, { id: Date.now().toString(), name: '', description: '', url: '', technologies: [] as string[] }] }))}
                    className="w-full py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Resume Tab (Preview + Export + Upload + Templates) ────────────────── */}
      {activeTab === 'preview' && (
        <div>
          {/* Last saved indicator */}
          <div className="flex items-center justify-end mb-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {lastSaved && <span>{saving ? 'Saving...' : `Last saved ${lastSaved}`}</span>}
            </p>
          </div>

          {/* Side-by-side: Resume preview (left) + Actions sidebar (right) */}
          <div className="flex gap-4">
          <div className="flex-1 min-w-0" ref={previewRef}>
        {/* ── Resume preview via iframe for native scrolling ── */}
        {resumeSource === 'uploaded' && ownResumeUrl ? (
          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white" style={{ height: '80vh' }}>
            <iframe
              src={ownResumeUrl}
              className="w-full h-full"
              title="Uploaded Resume Preview"
              style={{ border: 'none' }}
            />
          </div>
        ) : previewHtml ? (
          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800" style={{ height: '80vh' }}>
            <iframe
              ref={previewIframeRef}
              srcDoc={previewHtml}
              className="w-full h-full"
              title="Resume Preview"
              style={{ border: 'none', background: '#e5e7eb' }}
              sandbox="allow-same-origin"
            />
          </div>
        ) : previewLoading ? (
          <div className="flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" style={{ height: '80vh' }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Generating preview...</p>
            </div>
          </div>
        ) : (
          <div className="resume-a4-wrapper">
          <div className="resume-a4-page" style={{ transform: `scale(${previewScale})` }}>
        {resume.template === 'modern' ? (
          /* ── MODERN: Two-column sidebar layout ── */
          <div className="bg-white overflow-hidden" style={{ width: '100%' }}>
            <div className="flex" style={{ minHeight: 0, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
              {/* Sidebar */}
              <div className="w-[30%] bg-[#f0f4f8] p-8 flex flex-col">
                <h1 className="text-base font-bold mb-2.5" style={{ color: '#2563eb' }}>{resume.contact.name || 'Your Name'}</h1>
                <h2 className="text-[10px] font-bold uppercase tracking-[1.5px] pb-1 mb-1.5 mt-3" style={{ color: '#2563eb', borderBottom: '1px solid #d0d8e4' }}>Contact</h2>
                <div className="space-y-1 text-[11px] text-gray-700">
                  {resume.contact.email && <div className="break-all">{resume.contact.email}</div>}
                  {resume.contact.phone && <div>{resume.contact.phone}</div>}
                  {resume.contact.location && <div>{resume.contact.location}</div>}
                  {resume.contact.linkedin && <div className="break-all">{resume.contact.linkedin}</div>}
                  {resume.contact.portfolio && <div className="break-all text-[10px]">{resume.contact.portfolio.replace(/^https?:\/\//, '').replace(/\/$/, '')}</div>}
                </div>
                {resume.skills.length > 0 && (
                  <>
                    <h2 className="text-[10px] font-bold uppercase tracking-[1.5px] pb-1 mb-1.5 mt-4" style={{ color: '#2563eb', borderBottom: '1px solid #d0d8e4' }}>Skills</h2>
                    <div className="flex flex-wrap gap-1">
                      {resume.skills.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#2563eb15', border: '1px solid #2563eb30', color: '#2563eb' }}>{s}</span>
                      ))}
                    </div>
                  </>
                )}
                {resume.education.length > 0 && (
                  <>
                    <h2 className="text-[10px] font-bold uppercase tracking-[1.5px] pb-1 mb-1.5 mt-4" style={{ color: '#2563eb', borderBottom: '1px solid #d0d8e4' }}>Education</h2>
                    {resume.education.map(edu => (
                      <div key={edu.id} className="mb-2 text-[11px]">
                        <div className="font-semibold text-gray-800">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                        <div className="text-gray-500">{edu.institution}</div>
                        {edu.endDate && <div className="text-[10px] text-gray-400">{edu.endDate}</div>}
                      </div>
                    ))}
                  </>
                )}
                {resume.certifications.length > 0 && (
                  <>
                    <h2 className="text-[10px] font-bold uppercase tracking-[1.5px] pb-1 mb-1.5 mt-4" style={{ color: '#2563eb', borderBottom: '1px solid #d0d8e4' }}>Certifications</h2>
                    {resume.certifications.map(cert => (
                      <div key={cert.id} className="mb-1.5 text-[11px]">
                        <div className="font-semibold text-gray-800">{cert.name}</div>
                        {cert.issuer && <div className="text-gray-500">{cert.issuer}</div>}
                      </div>
                    ))}
                  </>
                )}
              </div>
              {/* Main content */}
              <div className="w-[70%] p-8 flex flex-col">
                {resume.summary && (
                  <div className="mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-[1.5px] pb-1 mb-2" style={{ color: '#2563eb', borderBottom: '2px solid #2563eb' }}>Professional Summary</h2>
                    <p className="text-[12.5px] text-gray-600 leading-relaxed">{resume.summary}</p>
                  </div>
                )}
                {resume.experience.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-[1.5px] pb-1 mb-2" style={{ color: '#2563eb', borderBottom: '2px solid #2563eb' }}>Work Experience</h2>
                    <div className="space-y-3">
                      {resume.experience.map(exp => (
                        <div key={exp.id}>
                          <div className="flex justify-between items-baseline">
                            <div><span className="text-[13px] font-semibold text-gray-900">{exp.role}</span> <span className="text-[12px] text-gray-500">| {exp.company}</span></div>
                            <span className="text-[11px] text-gray-400 flex-shrink-0 ml-3">{exp.startDate}{(exp.startDate || exp.endDate) ? ' – ' : ''}{exp.endDate || (exp.startDate ? 'Present' : '')}</span>
                          </div>
                          {exp.location && <div className="text-[11px] text-gray-400">{exp.location}</div>}
                          {exp.bullets && exp.bullets.filter(Boolean).length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {exp.bullets.filter(Boolean).map((b, bi) => (
                                <li key={bi} className="text-[12px] text-gray-700 flex items-start gap-1.5 leading-snug">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#2563eb]" />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {resume.projects && resume.projects.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-[1.5px] pb-1 mb-2" style={{ color: '#2563eb', borderBottom: '2px solid #2563eb' }}>Projects</h2>
                    <div className="space-y-2">
                      {resume.projects.map(proj => (
                        <div key={proj.id}>
                          <div className="flex justify-between items-baseline">
                            <span className="text-[12px] font-semibold text-gray-900">{proj.name}</span>
                            {proj.url && <a href={proj.url} className="text-[10px]" style={{ color: '#2563eb' }}>{proj.url}</a>}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{proj.description}</p>
                          {proj.technologies.length > 0 && <p className="text-[10px] text-gray-400 mt-0.5">{proj.technologies.join(' · ')}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : resume.template === 'classic' ? (
          /* ── CLASSIC: Centered header, serif, traditional ── */
          <div className="bg-white overflow-hidden" style={{ width: '100%' }}>
            <div className="px-12 py-10" style={{ minHeight: 0, fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <div className="text-center pb-3.5 mb-5" style={{ borderBottom: '2px solid #1e293b' }}>
                <h1 className="text-[22px] font-bold uppercase tracking-wide" style={{ color: '#1e293b' }}>{resume.contact.name || 'Your Name'}</h1>
                <div className="text-[11px] text-gray-500 mt-2 flex justify-center flex-wrap gap-x-1">
                  {[resume.contact.email, resume.contact.phone, resume.contact.location, resume.contact.linkedin, resume.contact.portfolio].filter(Boolean).map((item, i, arr) => (
                    <span key={i}>{item}{i < arr.length - 1 ? <span className="mx-1">&bull;</span> : ''}</span>
                  ))}
                </div>
              </div>
              {resume.summary && (
                <div className="mb-4">
                  <h2 className="text-[11px] font-bold uppercase tracking-[2px] pb-1 mb-2" style={{ color: '#1e293b', borderBottom: '1px solid #d1d5db' }}>Professional Summary</h2>
                  <p className="text-[12px] text-gray-600 leading-[1.7]">{resume.summary}</p>
                </div>
              )}
              {resume.experience.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-[11px] font-bold uppercase tracking-[2px] pb-1 mb-2" style={{ color: '#1e293b', borderBottom: '1px solid #d1d5db' }}>Work Experience</h2>
                  <div className="space-y-3">
                    {resume.experience.map(exp => (
                      <div key={exp.id}>
                        <div className="flex justify-between items-baseline">
                          <div><span className="text-[13px] font-bold text-gray-900">{exp.role}</span> <span className="text-[12px] text-gray-600">| {exp.company}{exp.location ? `, ${exp.location}` : ''}</span></div>
                          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-3">{exp.startDate}{(exp.startDate || exp.endDate) ? ' – ' : ''}{exp.endDate || (exp.startDate ? 'Present' : '')}</span>
                        </div>
                        {exp.bullets && exp.bullets.filter(Boolean).length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {exp.bullets.filter(Boolean).map((b, bi) => (
                              <li key={bi} className="text-[12px] text-gray-700 flex items-start gap-1.5 leading-snug">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#1e293b]" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {resume.education.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-[11px] font-bold uppercase tracking-[2px] pb-1 mb-2" style={{ color: '#1e293b', borderBottom: '1px solid #d1d5db' }}>Education</h2>
                  {resume.education.map(edu => (
                    <div key={edu.id} className="mb-2">
                      <div className="flex justify-between items-baseline">
                        <div><span className="text-[13px] font-bold text-gray-900">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</span></div>
                        {edu.endDate && <span className="text-[11px] text-gray-400">{edu.endDate}</span>}
                      </div>
                      <div className="text-[12px] text-gray-600">{edu.institution}{edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
              {resume.skills.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-[11px] font-bold uppercase tracking-[2px] pb-1 mb-2" style={{ color: '#1e293b', borderBottom: '1px solid #d1d5db' }}>Skills</h2>
                  <p className="text-[11px] text-gray-700 leading-relaxed">{resume.skills.join('  \u2022  ')}</p>
                </div>
              )}
              {resume.certifications.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-[11px] font-bold uppercase tracking-[2px] pb-1 mb-2" style={{ color: '#1e293b', borderBottom: '1px solid #d1d5db' }}>Certifications</h2>
                  {resume.certifications.map(cert => (
                    <div key={cert.id} className="text-[12px] text-gray-700 mb-1">
                      <span className="font-semibold text-gray-900">{cert.name}</span>{cert.issuer ? ` - ${cert.issuer}` : ''}
                    </div>
                  ))}
                </div>
              )}
              {resume.projects && resume.projects.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-[11px] font-bold uppercase tracking-[2px] pb-1 mb-2" style={{ color: '#1e293b', borderBottom: '1px solid #d1d5db' }}>Projects</h2>
                  <div className="space-y-2">
                    {resume.projects.map(proj => (
                      <div key={proj.id}>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[12px] font-bold text-gray-900">{proj.name}</span>
                          {proj.url && <a href={proj.url} className="text-[10px]" style={{ color: '#1e293b' }}>{proj.url}</a>}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{proj.description}</p>
                        {proj.technologies.length > 0 && <p className="text-[10px] text-gray-400 mt-0.5">{proj.technologies.join(' · ')}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : resume.template === 'minimal' ? (
          /* ── MINIMAL: Clean whitespace, thin dividers ── */
          <div className="bg-white overflow-hidden" style={{ width: '100%' }}>
            <div className="px-[52px] py-12" style={{ minHeight: 0, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
              <div className="mb-6">
                <h1 className="text-[26px] font-light text-gray-900 tracking-tight">{resume.contact.name || 'Your Name'}</h1>
                <div className="text-[11px] text-gray-400 mt-1.5">
                  {[resume.contact.email, resume.contact.phone, resume.contact.location, resume.contact.linkedin, resume.contact.portfolio].filter(Boolean).join('  |  ')}
                </div>
              </div>
              {resume.summary && (
                <div className="mb-5">
                  <h2 className="text-[10px] font-semibold uppercase tracking-[2px] text-gray-500 mb-1.5">Summary</h2>
                  <div className="h-px bg-gray-200 mb-2.5" />
                  <p className="text-[12px] text-gray-500 leading-[1.7] font-light">{resume.summary}</p>
                </div>
              )}
              {resume.experience.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-[10px] font-semibold uppercase tracking-[2px] text-gray-500 mb-1.5">Experience</h2>
                  <div className="h-px bg-gray-200 mb-2.5" />
                  <div className="space-y-3">
                    {resume.experience.map(exp => (
                      <div key={exp.id}>
                        <div className="flex justify-between items-baseline">
                          <div><span className="text-[13px] font-semibold text-gray-900">{exp.role}</span> <span className="text-[12px] text-gray-400">| {exp.company}</span></div>
                          <span className="text-[11px] text-gray-300 flex-shrink-0 ml-3">{exp.startDate}{(exp.startDate || exp.endDate) ? ' – ' : ''}{exp.endDate || (exp.startDate ? 'Present' : '')}</span>
                        </div>
                        {exp.bullets && exp.bullets.filter(Boolean).length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {exp.bullets.filter(Boolean).map((b, bi) => (
                              <li key={bi} className="text-[12px] text-gray-500 flex items-start gap-1.5 leading-snug font-light">
                                <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0 bg-gray-300" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {resume.education.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-[10px] font-semibold uppercase tracking-[2px] text-gray-500 mb-1.5">Education</h2>
                  <div className="h-px bg-gray-200 mb-2.5" />
                  {resume.education.map(edu => (
                    <div key={edu.id} className="mb-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[13px] font-semibold text-gray-900">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</span>
                        {edu.endDate && <span className="text-[11px] text-gray-300">{edu.endDate}</span>}
                      </div>
                      <div className="text-[12px] text-gray-400">{edu.institution}{edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
              {resume.skills.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-[10px] font-semibold uppercase tracking-[2px] text-gray-500 mb-1.5">Skills</h2>
                  <div className="h-px bg-gray-200 mb-2.5" />
                  <p className="text-[12px] text-gray-500 leading-[1.8] font-light">{resume.skills.join('  •  ')}</p>
                </div>
              )}
              {resume.certifications.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-[10px] font-semibold uppercase tracking-[2px] text-gray-500 mb-1.5">Certifications</h2>
                  <div className="h-px bg-gray-200 mb-2.5" />
                  {resume.certifications.map(cert => (
                    <div key={cert.id} className="text-[12px] text-gray-500 mb-1 font-light">
                      <span className="font-medium text-gray-700">{cert.name}</span>{cert.issuer ? ` - ${cert.issuer}` : ''}
                    </div>
                  ))}
                </div>
              )}
              {resume.projects && resume.projects.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-[10px] font-semibold uppercase tracking-[2px] text-gray-500 mb-1.5">Projects</h2>
                  <div className="h-px bg-gray-200 mb-2.5" />
                  <div className="space-y-2">
                    {resume.projects.map(proj => (
                      <div key={proj.id}>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[12px] font-semibold text-gray-900">{proj.name}</span>
                          {proj.url && <a href={proj.url} className="text-[10px] text-gray-400">{proj.url}</a>}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug font-light">{proj.description}</p>
                        {proj.technologies.length > 0 && <p className="text-[10px] text-gray-300 mt-0.5">{proj.technologies.join(' · ')}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── CREATIVE: Gradient banner header, accent bars ── */
          <div className="bg-white overflow-hidden" style={{ width: '100%' }}>
            <div style={{ minHeight: 0, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
              {/* Gradient header banner */}
              <div className="px-10 py-5" style={{ background: 'linear-gradient(135deg, #a855f7, #00d4ff, #00ff88)' }}>
                <h1 className="text-2xl font-extrabold text-white">{resume.contact.name || 'Your Name'}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-white/80">
                  {resume.contact.email && <span>{resume.contact.email}</span>}
                  {resume.contact.phone && <span>{resume.contact.phone}</span>}
                  {resume.contact.location && <span>{resume.contact.location}</span>}
                  {resume.contact.linkedin && <span>{resume.contact.linkedin}</span>}
                  {resume.contact.portfolio && <span>{resume.contact.portfolio}</span>}
                </div>
              </div>
              <div className="px-10 py-7">
                {/* Skills as compact text */}
                {resume.skills.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-[10px] font-bold uppercase tracking-[2px] text-[#7c3aed] mb-2 flex items-center gap-2">Skills<span className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #7c3aed40, transparent)' }} /></h2>
                    <p className="text-[11px] text-gray-600 leading-relaxed">{resume.skills.join('  \u2022  ')}</p>
                  </div>
                )}
                {resume.summary && (
                  <div className="mb-4">
                    <h2 className="text-[10px] font-bold uppercase tracking-[2px] text-[#7c3aed] mb-2 flex items-center gap-2">About<span className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #7c3aed40, transparent)' }} /></h2>
                    <p className="text-[12px] text-gray-600 leading-[1.7]">{resume.summary}</p>
                  </div>
                )}
                {resume.experience.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-[10px] font-bold uppercase tracking-[2px] text-[#7c3aed] mb-2 flex items-center gap-2">Experience<span className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #7c3aed40, transparent)' }} /></h2>
                    <div className="space-y-3">
                      {resume.experience.map(exp => (
                        <div key={exp.id}>
                          <div className="flex justify-between items-baseline">
                            <div><span className="text-[13px] font-bold text-gray-900">{exp.role}</span></div>
                            <span className="text-[11px] text-gray-400 flex-shrink-0 ml-3">{exp.startDate}{(exp.startDate || exp.endDate) ? ' – ' : ''}{exp.endDate || (exp.startDate ? 'Present' : '')}</span>
                          </div>
                          <div className="text-[12px] text-gray-500">{exp.company}{exp.location ? ` • ${exp.location}` : ''}</div>
                          {exp.bullets && exp.bullets.filter(Boolean).length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {exp.bullets.filter(Boolean).map((b, bi) => (
                                <li key={bi} className="text-[12px] text-gray-700 flex items-start gap-1.5 leading-snug">
                                  <span className="mt-0.5 w-[3px] min-h-[14px] rounded-sm flex-shrink-0" style={{ background: 'linear-gradient(180deg, #7c3aed, #3b82f6)' }} />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {resume.education.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-[10px] font-bold uppercase tracking-[2px] text-[#7c3aed] mb-2 flex items-center gap-2">Education<span className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #7c3aed40, transparent)' }} /></h2>
                    {resume.education.map(edu => (
                      <div key={edu.id} className="mb-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[13px] font-bold text-gray-900">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</span>
                          {edu.endDate && <span className="text-[11px] text-gray-400">{edu.endDate}</span>}
                        </div>
                        <div className="text-[12px] text-gray-500">{edu.institution}{edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</div>
                      </div>
                    ))}
                  </div>
                )}
                {resume.certifications.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-[10px] font-bold uppercase tracking-[2px] text-[#7c3aed] mb-2 flex items-center gap-2">Certifications<span className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #7c3aed40, transparent)' }} /></h2>
                    {resume.certifications.map(cert => (
                      <div key={cert.id} className="text-[12px] text-gray-700 mb-1">
                        <span className="font-semibold text-gray-900">{cert.name}</span>{cert.issuer ? ` - ${cert.issuer}` : ''}
                      </div>
                    ))}
                  </div>
                )}
                {resume.projects && resume.projects.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-[10px] font-bold uppercase tracking-[2px] text-[#7c3aed] mb-2 flex items-center gap-2">Projects<span className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #7c3aed40, transparent)' }} /></h2>
                    <div className="space-y-2">
                      {resume.projects.map(proj => (
                        <div key={proj.id}>
                          <div className="flex justify-between items-baseline">
                            <span className="text-[12px] font-semibold text-gray-900">{proj.name}</span>
                            {proj.url && <a href={proj.url} className="text-[10px]" style={{ color: '#7c3aed' }}>{proj.url}</a>}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{proj.description}</p>
                          {proj.technologies.length > 0 && <p className="text-[10px] text-gray-400 mt-0.5">{proj.technologies.join(' · ')}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
          </div>{/* end resume-a4-page */}
        </div>{/* end resume-a4-wrapper */}
        )}
          </div>{/* end flex-1 resume preview column */}

          {/* ── Right sidebar: Actions ── */}
          <div className="w-64 flex-shrink-0 space-y-4">
            {/* ── Verified state: Badge → Export → Edit ── */}
            {isVerified ? (<>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">Resume Verified</span>
                </div>
                <p className="text-[11px] text-green-600/70 dark:text-green-400/60">Ready for job applications</p>
              </div>

              {/* Export PDF */}
              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export PDF
              </button>

              {/* Edit Resume */}
              <button
                onClick={() => {
                  setIsVerified(false);
                  setActiveTab('editor');
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" />
                Edit Resume
              </button>
            </>) : (<>
              {/* ── Editing state: ATS Score + Export → Upload → Start Over ── */}
              {/* Always-visible ATS Score indicator */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content Fill</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{getContentFillPercentage(resume as any)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${getContentFillPercentage(resume as any)}%`,
                      backgroundColor: getContentFillPercentage(resume as any) >= 70 ? '#22c55e' : getContentFillPercentage(resume as any) >= 40 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  {calculatePageCount(resume as any) === 1 ? '1 page' : '2 pages'} estimated
                </p>
              </div>

              {/* Export PDF */}
              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export PDF
              </button>

              {/* Upload Resume */}
              <label className="cursor-pointer w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={handleResumeUpload}
                  disabled={uploadingResume}
                />
                {uploadingResume ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {uploadingResume ? 'Parsing...' : 'Upload Resume'}
              </label>

              {/* Uploaded file info + resume source toggle */}
              {uploadedFileName && (
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-2">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Uploaded File</p>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{uploadedFileName}</span>
                  </div>
                  {ownResumeUrl && (
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => setResumeSource('3box')}
                        className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                          resumeSource === '3box'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        3BOX Resume
                      </button>
                      <button
                        onClick={() => setResumeSource('uploaded')}
                        className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                          resumeSource === 'uploaded'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        My Resume
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Start Over */}
              <button
                onClick={async () => {
                  if (!confirm('Are you sure you want to start over? This will permanently clear all resume data and cannot be undone.')) return;
                  try {
                    const res = await fetch('/api/user/resume', { method: 'DELETE' });
                    if (!res.ok) throw new Error('Delete failed');
                    // Only clear local state after successful DB delete
                    setResume({ ...emptyResume });
                    setResumeId(null as any);
                    setIsVerified(false);
                    localStorage.removeItem(RESUME_STORAGE_KEY);
                    setUploadedFileName(null);
                    setIsFirstTime(true);
                    userHasEdited.current = false;
                    showToast('Resume data cleared.', 'success');
                  } catch {
                    showToast('Failed to clear resume. Please try again.', 'error');
                  }
                }}
                className="w-full px-4 py-2 text-sm font-medium text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Start Over
              </button>
            </>)}

            {/* Template Selector — hidden when resume is verified */}
            {!isVerified && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Template</h4>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((t) => {
                  const isSelected = resume.template === t.id;
                  const accents: Record<string, { border: string; bg: string; text: string }> = {
                    modern: { border: 'border-cyan-400 dark:border-cyan-400/60', bg: 'bg-cyan-50 dark:bg-cyan-400/10', text: 'text-cyan-600 dark:text-cyan-400' },
                    classic: { border: 'border-amber-400 dark:border-amber-400/60', bg: 'bg-amber-50 dark:bg-amber-400/10', text: 'text-amber-600 dark:text-amber-400' },
                    minimal: { border: 'border-gray-400 dark:border-white/40', bg: 'bg-gray-50 dark:bg-white/5', text: 'text-gray-600 dark:text-white/70' },
                    creative: { border: 'border-purple-400 dark:border-purple-400/60', bg: 'bg-purple-50 dark:bg-purple-400/10', text: 'text-purple-600 dark:text-purple-400' },
                  };
                  const a = accents[t.id] || accents.modern;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setResume(prev => ({ ...prev, template: t.id }))}
                      className={cn(
                        'relative group rounded-lg overflow-hidden transition-all duration-200',
                        isSelected
                          ? `border-2 ${a.border} shadow-sm`
                          : 'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                      )}
                    >
                      <div className={cn('h-20', isSelected ? a.bg : 'bg-gray-50 dark:bg-gray-800/50 group-hover:bg-gray-100 dark:group-hover:bg-gray-800', 'transition-all p-1')}>
                        <TemplatePreviewMini template={t.id as 'modern' | 'classic' | 'minimal' | 'creative'} />
                      </div>
                      {isSelected && (
                        <div className={cn('absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center', a.bg, 'border', a.border)}>
                          <svg className={cn('w-2.5 h-2.5', a.text)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className={cn('py-1.5 px-1 text-center', isSelected ? a.bg : '')}>
                        <div className={cn('text-[10px] font-semibold', isSelected ? a.text : 'text-gray-600 dark:text-gray-400')}>{t.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            )}
          </div>
          </div>{/* end flex row */}
        </div>
      )}

      {activeTab === 'ats' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ATS Compatibility Check</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Analyze your resume against ATS systems and get actionable feedback.</p>
              </div>
              <button
                onClick={handleATSCheck}
                disabled={atsLoading || !resume.contact.name}
                className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {atsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {atsLoading ? 'Analyzing...' : 'Run ATS Check'}
              </button>
            </div>

            {!atsResult && !atsLoading && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Click &quot;Run ATS Check&quot; to analyze your resume compatibility.</p>
              </div>
            )}

            {atsResult && (
              <div className="space-y-6">
                {/* Score overview */}
                <div className="flex items-center gap-6 p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div className="flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4"
                    style={{
                      borderColor: atsResult.score >= 80 ? '#22c55e' : atsResult.score >= 60 ? '#eab308' : '#ef4444',
                      color: atsResult.score >= 80 ? '#22c55e' : atsResult.score >= 60 ? '#eab308' : '#ef4444',
                    }}
                  >
                    {atsResult.score}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">Grade: {atsResult.grade}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {atsResult.score >= 80 ? 'Your resume is well-optimized for ATS systems.' : atsResult.score >= 60 ? 'Good start, but there are areas to improve.' : 'Significant improvements needed for ATS compatibility.'}
                    </p>
                  </div>
                </div>

                {/* Category breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(atsResult.feedback || []).map((item: any, i: number) => (
                    <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.category}</span>
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
                          item.status === 'good' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                          : item.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                        )}>
                          {item.score}/{item.maxScore}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${(item.score / item.maxScore) * 100}%`,
                            backgroundColor: item.status === 'good' ? '#22c55e' : item.status === 'warning' ? '#eab308' : '#ef4444',
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.message}</p>
                    </div>
                  ))}
                </div>

                {/* Suggestions */}
                {atsResult.suggestions && atsResult.suggestions.length > 0 && (
                  <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20">
                    <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Improvement Suggestions
                    </h4>
                    <ul className="space-y-2">
                      {atsResult.suggestions.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-blue-600 dark:text-blue-300 flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'cover-letter' && (
        <div className="space-y-6">
          {/* Generic Cover Letter — Auto-generated */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Generic Cover Letter</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Auto-generated based on your resume, ready to use for any application.</p>
              </div>
              <button
                onClick={handleGenericCoverLetter}
                disabled={genericCLLoading || !resume.contact.name}
                className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors flex items-center gap-1.5"
              >
                {genericCLLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {genericCLLoading ? 'Generating...' : 'Regenerate'}
              </button>
            </div>

            {genericCLLoading && !genericCoverLetter && (
              <div className="flex items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Generating your cover letter...
              </div>
            )}

            {genericCoverLetter && (
              <div className="space-y-3">
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => { navigator.clipboard.writeText(genericCoverLetter); showToast('Copied to clipboard!', 'success'); }}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                  >
                    <ClipboardCopy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
                <div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{genericCoverLetter}</div>
                </div>
              </div>
            )}
          </div>

          {/* JD-Based Cover Letter */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Targeted Cover Letter</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Paste a job description to generate a cover letter tailored to a specific role.</p>

            <div className="space-y-4">
              <textarea
                value={coverLetterJobDesc}
                onChange={(e) => setCoverLetterJobDesc(e.target.value)}
                placeholder="Paste the job description here..."
                rows={5}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 resize-none"
              />
              <button
                onClick={handleJDCoverLetter}
                disabled={jdCLLoading || !resume.contact.name || !coverLetterJobDesc.trim()}
                className="px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {jdCLLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {jdCLLoading ? 'Generating...' : 'Generate Targeted Letter'}
              </button>
            </div>

            {jdCoverLetter && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Targeted Cover Letter</h4>
                  <button
                    onClick={() => { navigator.clipboard.writeText(jdCoverLetter); showToast('Copied to clipboard!', 'success'); }}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                  >
                    <ClipboardCopy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
                <div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{jdCoverLetter}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'linkedin' && (
        <div className="space-y-6">
          {/* LinkedIn Verified Badge — shown when all checklist items are complete */}
          {Object.values(linkedinChecklist).every(Boolean) ? (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-700 dark:text-green-400">LinkedIn Profile Verified</h3>
                <p className="text-xs text-green-600/70 dark:text-green-400/60">All checklist items completed. Your LinkedIn profile is fully optimized!</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">LinkedIn Not Verified</h3>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/60">Complete all checklist items below to verify your LinkedIn profile.</p>
              </div>
            </div>
          )}

          {/* LinkedIn Suggestions */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                  <Linkedin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">LinkedIn Optimization</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">AI-generated suggestions to make your LinkedIn profile stand out.</p>
                </div>
              </div>
              <button
                onClick={handleLinkedinSuggestions}
                disabled={linkedinLoading || !resume.contact.name}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {linkedinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {linkedinLoading ? 'Analyzing...' : 'Generate Suggestions'}
              </button>
            </div>

            {!linkedinSuggestions && !linkedinLoading && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <Linkedin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Click &quot;Generate Suggestions&quot; to get AI-powered LinkedIn optimization tips.</p>
              </div>
            )}

            {linkedinSuggestions && (
              <div className="space-y-5 mt-4">
                {/* Headline suggestion */}
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Suggested Headline</h4>
                    <button
                      onClick={() => { navigator.clipboard.writeText(linkedinSuggestions.headline || ''); showToast('Headline copied!', 'success'); }}
                      className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <ClipboardCopy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{linkedinSuggestions.headline}</p>
                </div>

                {/* About section suggestion */}
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400">Suggested About Section</h4>
                    <button
                      onClick={() => { navigator.clipboard.writeText(linkedinSuggestions.about || ''); showToast('About section copied!', 'success'); }}
                      className="text-xs text-purple-500 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1"
                    >
                      <ClipboardCopy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <p className="text-sm text-purple-800 dark:text-purple-300 whitespace-pre-wrap leading-relaxed">{linkedinSuggestions.about}</p>
                </div>
              </div>
            )}
          </div>

          {/* LinkedIn Profile Checklist */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">LinkedIn Profile Checklist</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Make sure your LinkedIn profile is fully optimized. Check off each item as you complete it.</p>

            <div className="space-y-3">
              {[
                { key: 'headline', label: 'Update your headline as per the suggestion above', desc: 'Use the AI-generated headline that highlights your role and key skills' },
                { key: 'photo', label: 'Upload a professional profile photo and cover banner', desc: 'Profiles with photos get 21x more views and 9x more connection requests' },
                { key: 'about', label: 'Enhance the About section as per the suggestion above', desc: 'Copy the AI-generated About section and personalize it on LinkedIn' },
                { key: 'openToWork', label: 'Enable "Open to Work" status', desc: 'Let recruiters know you\'re actively looking for opportunities' },
                { key: 'experience', label: 'Update Experience and Education sections in line with your latest CV', desc: 'Ensure your LinkedIn matches your resume - consistency matters to recruiters' },
                { key: 'skills', label: 'Add key skills from your resume', desc: resume.skills?.length ? `Suggested: ${resume.skills.slice(0, 6).join(', ')}` : 'Add your top technical and professional skills' },
                { key: 'location', label: 'Update your location', desc: 'Make sure your location matches where you\'re seeking opportunities' },
                { key: 'uploadCV', label: 'Upload your latest CV to LinkedIn, CV Library, Indeed, and Naukri', desc: 'Maximize visibility across multiple job platforms' },
              ].map(item => (
                <label key={item.key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={linkedinChecklist[item.key] || false}
                      onChange={(e) => setLinkedinChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500/20 bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      'text-sm font-medium transition-all',
                      linkedinChecklist[item.key]
                        ? 'text-gray-400 dark:text-gray-500 line-through'
                        : 'text-gray-900 dark:text-white',
                    )}>
                      {item.label}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  {linkedinChecklist[item.key] && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  )}
                </label>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Profile Completion</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {Object.values(linkedinChecklist).filter(Boolean).length}/{Object.keys(linkedinChecklist).length} completed
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                  style={{ width: `${(Object.values(linkedinChecklist).filter(Boolean).length / Object.keys(linkedinChecklist).length) * 100}%` }}
                />
              </div>
              {Object.values(linkedinChecklist).every(Boolean) && (
                <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Your LinkedIn profile is fully optimized!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio tab removed, use /dashboard/portfolio instead */}
      </>)}
    </div>
  );
}

/* ── Compact template mini-previews for the Preview tab selector ── */
function TemplatePreviewMini({ template }: { template: 'modern' | 'classic' | 'minimal' | 'creative' }) {
  if (template === 'modern') {
    return (
      <div className="w-full h-full flex rounded-sm overflow-hidden">
        <div className="w-[30%] bg-[#0f172a] p-1.5 flex flex-col gap-1">
          <div className="w-4 h-4 mx-auto rounded-full bg-cyan-400/30 border border-cyan-400/40" />
          <div className="h-1 w-8 mx-auto rounded-full bg-cyan-400/40" />
          <div className="space-y-0.5 mt-1">
            <div className="h-0.5 w-full rounded-full bg-white/15" />
            <div className="h-0.5 w-3/4 rounded-full bg-white/15" />
          </div>
          <div className="h-0.5 w-6 rounded-full bg-cyan-400/30 mt-1" />
          <div className="flex flex-wrap gap-0.5">
            <div className="h-1.5 w-4 rounded-sm bg-cyan-400/15 border border-cyan-400/20" />
            <div className="h-1.5 w-5 rounded-sm bg-cyan-400/15 border border-cyan-400/20" />
            <div className="h-1.5 w-3 rounded-sm bg-cyan-400/15 border border-cyan-400/20" />
          </div>
        </div>
        <div className="w-[70%] bg-white p-1.5 flex flex-col gap-1">
          <div className="h-0.5 w-8 rounded-full bg-cyan-600/40" />
          <div className="space-y-0.5">
            <div className="h-0.5 w-full rounded-full bg-gray-300" />
            <div className="h-0.5 w-5/6 rounded-full bg-gray-200" />
            <div className="h-0.5 w-3/4 rounded-full bg-gray-200" />
          </div>
          <div className="h-0.5 w-6 rounded-full bg-cyan-600/40 mt-0.5" />
          <div className="space-y-0.5">
            <div className="h-0.5 w-full rounded-full bg-gray-200" />
            <div className="h-0.5 w-2/3 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }
  if (template === 'classic') {
    return (
      <div className="w-full h-full flex flex-col rounded-sm overflow-hidden bg-white p-2">
        <div className="flex flex-col items-center mb-1.5">
          <div className="h-1.5 w-16 rounded-full bg-gray-800 mb-0.5" />
          <div className="h-0.5 w-10 rounded-full bg-gray-300" />
        </div>
        <div className="h-px w-full bg-gray-800 mb-1" />
        <div className="flex justify-center gap-1.5 mb-1.5">
          <div className="h-0.5 w-6 rounded-full bg-gray-300" />
          <div className="h-0.5 w-0.5 rounded-full bg-gray-400" />
          <div className="h-0.5 w-8 rounded-full bg-gray-300" />
          <div className="h-0.5 w-0.5 rounded-full bg-gray-400" />
          <div className="h-0.5 w-6 rounded-full bg-gray-300" />
        </div>
        <div className="h-1 w-10 rounded-full bg-gray-700 mb-0.5" />
        <div className="h-px w-full bg-gray-200 mb-1" />
        <div className="space-y-0.5 mb-1.5">
          <div className="flex justify-between">
            <div className="h-0.5 w-12 rounded-full bg-gray-400" />
            <div className="h-0.5 w-6 rounded-full bg-gray-200" />
          </div>
          <div className="h-0.5 w-full rounded-full bg-gray-200" />
          <div className="h-0.5 w-5/6 rounded-full bg-gray-200" />
        </div>
        <div className="h-1 w-8 rounded-full bg-gray-700 mb-0.5" />
        <div className="h-px w-full bg-gray-200 mb-1" />
        <div className="space-y-0.5">
          <div className="h-0.5 w-full rounded-full bg-gray-200" />
          <div className="h-0.5 w-2/3 rounded-full bg-gray-200" />
        </div>
      </div>
    );
  }
  if (template === 'minimal') {
    return (
      <div className="w-full h-full flex flex-col rounded-sm overflow-hidden bg-white px-3 py-2">
        <div className="h-2 w-20 rounded-full bg-gray-200 mb-0.5" />
        <div className="h-0.5 w-12 rounded-full bg-gray-100 mb-2" />
        <div className="flex gap-2 mb-2">
          <div className="h-0.5 w-8 rounded-full bg-gray-100" />
          <div className="h-0.5 w-10 rounded-full bg-gray-100" />
        </div>
        <div className="h-0.5 w-8 rounded-full bg-gray-300 mb-1" />
        <div className="space-y-0.5 mb-2">
          <div className="h-0.5 w-16 rounded-full bg-gray-200" />
          <div className="h-0.5 w-full rounded-full bg-gray-100" />
          <div className="h-0.5 w-5/6 rounded-full bg-gray-100" />
        </div>
        <div className="h-0.5 w-8 rounded-full bg-gray-300 mb-1" />
        <div className="space-y-0.5">
          <div className="h-0.5 w-14 rounded-full bg-gray-200" />
          <div className="h-0.5 w-3/4 rounded-full bg-gray-100" />
        </div>
      </div>
    );
  }
  // creative
  return (
    <div className="w-full h-full flex flex-col rounded-sm overflow-hidden">
      <div className="h-10 w-full bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 p-1.5 flex flex-col justify-end">
        <div className="h-1.5 w-14 rounded-full bg-white/50 mb-0.5" />
        <div className="h-0.5 w-10 rounded-full bg-white/30" />
      </div>
      <div className="flex-1 bg-white p-1.5 flex flex-col gap-1">
        <div className="flex gap-1">
          <div className="h-1.5 w-6 rounded-full bg-purple-100 border border-purple-200" />
          <div className="h-1.5 w-7 rounded-full bg-cyan-100 border border-cyan-200" />
          <div className="h-1.5 w-5 rounded-full bg-emerald-100 border border-emerald-200" />
        </div>
        <div className="flex gap-1">
          <div className="w-0.5 rounded-full bg-gradient-to-b from-purple-500 to-blue-400 flex-shrink-0" />
          <div className="space-y-0.5 flex-1">
            <div className="h-0.5 w-full rounded-full bg-gray-200" />
            <div className="h-0.5 w-4/5 rounded-full bg-gray-200" />
          </div>
        </div>
        <div className="flex gap-1 mt-0.5">
          <div className="w-1/2 space-y-0.5">
            <div className="h-0.5 w-8 rounded-full bg-blue-300" />
            <div className="h-0.5 w-full rounded-full bg-gray-100" />
            <div className="h-0.5 w-3/4 rounded-full bg-gray-100" />
          </div>
          <div className="w-1/2 space-y-0.5">
            <div className="h-0.5 w-6 rounded-full bg-purple-300" />
            <div className="flex flex-wrap gap-0.5">
              <div className="h-1 w-4 rounded-full bg-purple-50 border border-purple-100" />
              <div className="h-1 w-5 rounded-full bg-purple-50 border border-purple-100" />
            </div>
          </div>
        </div>
        <div className="mt-auto h-0.5 w-full rounded-full bg-gradient-to-r from-purple-200 via-blue-200 to-emerald-200" />
      </div>
    </div>
  );
}

function AgenticResumePage() {
  const { data: session } = useSession();
  const userPlan = ((session?.user as any)?.plan ?? 'FREE').toUpperCase() as PlanTier;
  const forgeLocked = !isAgentAvailable('forge', userPlan);
  const [showEditor, setShowEditor] = useState(false);
  const [forgeKey, setForgeKey] = useState(0); // Used to re-render ForgeAutoGenerate
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [resume, setResume] = useState(emptyResume);
  const [activeSection, setActiveSection] = useState('contact');
  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState<string | null>(null); // tracks which AI operation is running
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // AI Write Resume wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardForm, setWizardForm] = useState({
    targetRole: '',
    yearsExperience: '1-3',
    achievements: '',
    tone: 'Professional',
  });
  const [wizardGenerating, setWizardGenerating] = useState(false);
  const [wizardError, setWizardError] = useState('');
  const [wizardResult, setWizardResult] = useState<any>(null);

  // Tailor state
  const [tailorJobDesc, setTailorJobDesc] = useState('');
  const [tailoring, setTailoring] = useState(false);

  // Cover letter state
  const [coverLetterModal, setCoverLetterModal] = useState(false);
  const [coverLetterJobDesc, setCoverLetterJobDesc] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);

  // Write-through localStorage cache
  useEffect(() => {
    if (resumeLoaded) {
      localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(resume));
    }
  }, [resume, resumeLoaded]);

  // Pre-fill wizard targetRole from localStorage
  useEffect(() => {
    try {
      const savedRole = localStorage.getItem('3box_target_role');
      if (savedRole) {
        setWizardForm(prev => ({ ...prev, targetRole: savedRole }));
      }
    } catch {}
  }, []);

  const isFree = userPlan === 'FREE';

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const checkAILimit = useCallback((): boolean => {
    if (!isFree) return true;
    const uses = getAIUses();
    if (uses >= AI_FREE_LIMIT) {
      showToast(`Free Forge limit reached (${AI_FREE_LIMIT}/${AI_FREE_LIMIT}). Upgrade to continue.`, 'error');
      return false;
    }
    return true;
  }, [isFree, showToast]);

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
          showToast('Free Forge limit reached. Upgrade to continue.', 'error');
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

      if (isFree) incrementAIUses();
      showToast('Resume enhanced by Forge!', 'success');
      notifyAgentCompleted('forge', 'Forge enhanced your resume', '/dashboard/resume');
    } catch (error) {
      console.error('AI Enhance error:', error);
      showToast('Forge enhancement failed. Please try again.', 'error');
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
          showToast('Free Forge limit reached. Upgrade to continue.', 'error');
          return;
        }
        throw new Error('Failed to generate summary');
      }
      const data = await res.json();

      setResume((prev) => ({ ...prev, summary: data.enhanced || prev.summary }));
      if (isFree) incrementAIUses();
      showToast('Forge-generated summary applied!', 'success');
      notifyAgentCompleted('forge', 'Forge wrote your professional summary', '/dashboard/resume');
    } catch (error) {
      console.error('AI Write Summary error:', error);
      showToast('Forge failed to generate summary. Try again.', 'error');
    } finally {
      setAiLoading(null);
    }
  };

  // ── Auto-fill Contact from Profile ──────────────
  const handleAIRewriteContact = async () => {
    try {
      setAiLoading('contact');
      // Try localStorage first
      let profile: any = null;
      try {
        const stored = localStorage.getItem('3box_onboarding_profile');
        if (stored) profile = JSON.parse(stored);
      } catch {}

      // Fallback: fetch from API
      if (!profile) {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          const snap = data.careerTwin?.skillSnapshot as any;
          profile = snap?._profile || {};
          profile.fullName = data.name || profile.fullName || '';
          profile.email = data.email || profile.email || '';
        }
      }

      if (!profile) {
        showToast('No profile data found. Complete onboarding first.', 'error');
        return;
      }

      setResume((prev) => ({
        ...prev,
        contact: {
          ...prev.contact,
          name: profile.fullName || prev.contact.name,
          email: profile.email || prev.contact.email,
          phone: profile.phone || prev.contact.phone,
          location: profile.location || prev.contact.location,
          linkedin: profile.linkedin || prev.contact.linkedin,
          portfolio: prev.contact.portfolio,
        },
      }));
      showToast('Contact info auto-filled from your profile!', 'success');
    } catch (error) {
      console.error('Auto-fill contact error:', error);
      showToast('Failed to auto-fill. Try again.', 'error');
    } finally {
      setAiLoading(null);
    }
  };

  // ── AI Enhance Education Entry ──────────────────
  const handleAIEnhanceEducation = async (eduId: string) => {
    if (!checkAILimit()) return;
    setAiLoading(`edu-${eduId}`);

    try {
      const edu = resume.education.find(e => e.id === eduId);
      if (!edu) return;

      const content = `${edu.degree} ${edu.field ? `in ${edu.field}` : ''} at ${edu.institution}. ${edu.startDate} - ${edu.endDate}. ${edu.gpa ? `GPA: ${edu.gpa}` : ''}`;
      const res = await fetch('/api/ai/resume/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'education', content }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (errData?.code === 'PLAN_LIMIT_REACHED') {
          showToast('Free Forge limit reached. Upgrade to continue.', 'error');
          return;
        }
        throw new Error('Enhance failed');
      }

      const data = await res.json();
      const enhanced = data.enhanced || '';

      // Parse enhanced text to extract improved fields
      if (enhanced) {
        // Try to extract degree/field improvements from the AI response
        const lines = enhanced.split('\n').filter(Boolean);
        if (lines.length > 0) {
          const improvedDegree = lines[0]?.replace(/^[-•*]\s*/, '').trim();
          if (improvedDegree) {
            setResume((prev) => ({
              ...prev,
              education: prev.education.map((e) =>
                e.id === eduId ? { ...e, degree: improvedDegree } : e
              ),
            }));
          }
        }
        if (isFree) incrementAIUses();
        showToast(`Enhanced education entry!`, 'success');
      }
    } catch (error) {
      console.error('Enhance education error:', error);
      showToast('Failed to enhance. Try again.', 'error');
    } finally {
      setAiLoading(null);
    }
  };

  // ── AI Suggest Skills ──────────────────────────
  const handleAISuggestSkills = async () => {
    if (!checkAILimit()) return;
    setAiLoading('skills');

    try {
      const context = `Current skills: ${resume.skills.join(', ')}. Experience: ${resume.experience.map(e => `${e.role} at ${e.company}`).join('. ')}. Summary: ${resume.summary || ''}`;
      const res = await fetch('/api/ai/resume/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'skills', content: context }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (errData?.code === 'PLAN_LIMIT_REACHED') {
          showToast('Free Forge limit reached. Upgrade to continue.', 'error');
          return;
        }
        throw new Error('Suggest skills failed');
      }

      const data = await res.json();
      const enhanced = data.enhanced || '';
      const suggestedSkills = enhanced
        .split(/[,\n]/)
        .map((s: string) => s.replace(/^[-•*]\s*/, '').trim())
        .filter((s: string) => s && !resume.skills.includes(s));

      if (suggestedSkills.length > 0) {
        setResume((prev) => ({
          ...prev,
          skills: [...prev.skills, ...suggestedSkills.slice(0, 10)],
        }));
        if (isFree) incrementAIUses();
        showToast(`Added ${Math.min(suggestedSkills.length, 10)} suggested skills!`, 'success');
      } else {
        showToast('No new skills suggested - your skill set looks comprehensive!', 'success');
      }
    } catch (error) {
      console.error('Suggest skills error:', error);
      showToast('Failed to suggest skills. Try again.', 'error');
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
          showToast('Free Forge limit reached. Upgrade to continue.', 'error');
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

      if (isFree) incrementAIUses();
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
  const handleGenerateCoverLetter = async (generic: boolean = false) => {
    if (!generic && !coverLetterJobDesc.trim()) {
      showToast('Please paste a job description first.', 'error');
      return;
    }
    if (!checkAILimit()) return;
    setCoverLetterLoading(true);

    try {
      const body: any = {
        resume: {
          contact: resume.contact,
          summary: resume.summary,
          experience: resume.experience,
          skills: resume.skills,
          education: resume.education,
        },
      };
      // Only include jobDescription when not generating a generic cover letter
      if (!generic && coverLetterJobDesc.trim()) {
        body.jobDescription = coverLetterJobDesc;
      }

      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to generate cover letter');
      const data = await res.json();
      setCoverLetter(data.coverLetter || '');
      if (isFree) incrementAIUses();
      showToast(generic ? 'Generic cover letter generated!' : 'Cover letter generated!', 'success');
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
    if (isFree) {
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

  // ── AI Write Resume Handler ───────────────────
  const handleWizardGenerate = async () => {
    if (!wizardForm.targetRole.trim()) {
      setWizardError('Please enter a target role');
      return;
    }
    if (!checkAILimit()) return;
    setWizardGenerating(true);
    setWizardError('');
    setWizardStep(2);

    try {
      const res = await fetch('/api/ai/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wizardForm),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData?.code === 'PLAN_LIMIT_REACHED') {
          setWizardError('Token limit reached. Upgrade your plan for more.');
          setWizardStep(1);
          return;
        }
        throw new Error(errData.error || 'Failed to generate resume');
      }

      const data = await res.json();
      setWizardResult(data.resume);
      if (isFree) incrementAIUses();
      setWizardStep(3);
    } catch (err: any) {
      console.error('[AI Resume Wizard]', err);
      setWizardError(err.message || 'Generation failed. Please try again.');
      setWizardStep(1);
    } finally {
      setWizardGenerating(false);
    }
  };

  const handleWizardAccept = () => {
    if (!wizardResult) return;
    setResume(prev => ({
      ...prev,
      contact: {
        name: wizardResult.contact?.name || prev.contact.name,
        email: wizardResult.contact?.email || prev.contact.email,
        phone: wizardResult.contact?.phone || prev.contact.phone,
        location: wizardResult.contact?.location || prev.contact.location,
        linkedin: wizardResult.contact?.linkedin || prev.contact.linkedin,
        portfolio: wizardResult.contact?.portfolio || prev.contact.portfolio,
      },
      summary: wizardResult.summary || prev.summary,
      experience: Array.isArray(wizardResult.experience) ? wizardResult.experience : prev.experience,
      education: Array.isArray(wizardResult.education) ? wizardResult.education : prev.education,
      skills: Array.isArray(wizardResult.skills) ? wizardResult.skills : prev.skills,
      skillDescriptions: wizardResult.skillDescriptions || prev.skillDescriptions,
      certifications: Array.isArray(wizardResult.certifications) ? wizardResult.certifications : prev.certifications,
      projects: Array.isArray(wizardResult.projects) ? wizardResult.projects : prev.projects,
    }));
    setWizardOpen(false);
    setWizardStep(1);
    setWizardResult(null);
    showToast('Forge-generated resume applied! Review and edit as needed.', 'success');
  };

  if (forgeLocked) return <AgentLockedPage agentId="forge" />;

  return (
    <div className="max-w-6xl mx-auto">
      <AgentPageHeader agentId="forge" onRunNow={() => { setWizardOpen(true); setWizardStep(1); setWizardError(''); }} />
      <AgentConfigPanel agentId="forge" variant="collapsible" />

      {/* ── Forge Auto-Generate + Approval Layer ── */}
      {!showEditor && (
        <ForgeAutoGenerate
          key={forgeKey}
          onEnterEditor={() => setShowEditor(true)}
          onStatusChange={() => setForgeKey(prev => prev + 1)}
        />
      )}

      {showEditor && (
        <button
          onClick={() => setShowEditor(false)}
          className="mb-4 text-xs text-white/30 hover:text-white/50 flex items-center gap-1"
        >
          ← Back to Forge Dashboard
        </button>
      )}

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
                  <FileText className="w-5 h-5 text-orange-400" />
                  Generate Cover Letter
                </h3>
                <button onClick={() => setCoverLetterModal(false)} className="p-1.5 rounded-lg hover:bg-white/5">
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>

              {!coverLetter ? (
                <>
                  <p className="text-sm text-white/40 mb-4">
                    Generate a generic cover letter based on your resume, or paste a job description for a tailored one.
                  </p>

                  {/* Generic Cover Letter Button */}
                  <button
                    onClick={() => handleGenerateCoverLetter(true)}
                    disabled={coverLetterLoading}
                    className="btn-secondary w-full flex items-center justify-center gap-2 mb-4"
                  >
                    {coverLetterLoading && !coverLetterJobDesc.trim() ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Forge is writing your generic cover letter...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Generic Cover Letter
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-white/30">or tailor to a job</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <label className="block text-xs text-white/50 mb-1.5">
                    Optionally paste a job description for a tailored cover letter
                  </label>
                  <textarea
                    value={coverLetterJobDesc}
                    onChange={(e) => setCoverLetterJobDesc(e.target.value)}
                    className="input-field h-32 resize-none mb-4"
                    placeholder="Paste the job description here..."
                  />
                  <button
                    onClick={() => handleGenerateCoverLetter(false)}
                    disabled={coverLetterLoading || !coverLetterJobDesc.trim()}
                    className="btn-primary flex items-center gap-2"
                  >
                    {coverLetterLoading && coverLetterJobDesc.trim() ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Forge is writing your tailored cover letter...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Generate Tailored Cover Letter
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

              {isFree && (
                <p className="text-xs text-white/30 mt-4">
                  Free plan: {Math.max(0, AI_FREE_LIMIT - getAIUses())} Forge uses remaining
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Write Resume Wizard Modal ──────────────────── */}
      <AnimatePresence>
        {wizardOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => { if (!wizardGenerating) { setWizardOpen(false); setWizardStep(1); setWizardError(''); } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto glass border border-white/10 rounded-2xl p-6"
            >
              {/* Wizard Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-400" />
                  Forge Resume Writer
                </h3>
                {!wizardGenerating && (
                  <button onClick={() => { setWizardOpen(false); setWizardStep(1); setWizardError(''); }} className="p-1.5 rounded-lg hover:bg-white/5">
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                )}
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      wizardStep === s ? 'bg-orange-500 text-white' :
                      wizardStep > s ? 'bg-amber-400/20 text-amber-400' :
                      'bg-white/5 text-white/30'
                    }`}>
                      {wizardStep > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                    </div>
                    {s < 3 && <div className={`w-12 h-px ${wizardStep > s ? 'bg-amber-400/40' : 'bg-white/10'}`} />}
                  </div>
                ))}
                <span className="text-xs text-white/30 ml-2">
                  {wizardStep === 1 ? 'Quick Questions' : wizardStep === 2 ? 'Generating...' : 'Review'}
                </span>
              </div>

              {/* Step 1: Quick Questions */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  {wizardError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                      {wizardError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Target Job/Role *</label>
                    <input
                      value={wizardForm.targetRole}
                      onChange={(e) => setWizardForm(prev => ({ ...prev, targetRole: e.target.value }))}
                      className="input-field"
                      placeholder="e.g., Senior Full Stack Developer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Years of Experience</label>
                    <select
                      value={wizardForm.yearsExperience}
                      onChange={(e) => setWizardForm(prev => ({ ...prev, yearsExperience: e.target.value }))}
                      className="input-field"
                    >
                      <option value="0-1">0-1 years (Entry Level)</option>
                      <option value="1-3">1-3 years (Junior)</option>
                      <option value="3-5">3-5 years (Mid-Level)</option>
                      <option value="5-10">5-10 years (Senior)</option>
                      <option value="10+">10+ years (Lead/Principal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Key Achievements</label>
                    <textarea
                      value={wizardForm.achievements}
                      onChange={(e) => setWizardForm(prev => ({ ...prev, achievements: e.target.value }))}
                      className="input-field h-24 resize-none"
                      placeholder="What are your top 2-3 career highlights? e.g., Led migration to microservices, reduced latency by 40%..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Preferred Tone</label>
                    <select
                      value={wizardForm.tone}
                      onChange={(e) => setWizardForm(prev => ({ ...prev, tone: e.target.value }))}
                      className="input-field"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Technical">Technical</option>
                      <option value="Creative">Creative</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>

                  <button
                    onClick={handleWizardGenerate}
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <Sparkles className="w-4 h-4" /> Deploy Forge
                  </button>

                  <p className="text-xs text-white/20 text-center">
                    Forge will use your profile data to craft a personalized, ATS-optimized resume
                  </p>
                </div>
              )}

              {/* Step 2: Generating */}
              {wizardStep === 2 && (
                <div className="py-6">
                  <AgentLoader agentId="forge" message={`Agent Forge is crafting your ${wizardForm.targetRole} resume`} size="lg" />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs text-orange-400 text-center mt-2"
                  >
                    This usually takes 10-20 seconds
                  </motion.div>
                </div>
              )}

              {/* Step 3: Review */}
              {wizardStep === 3 && wizardResult && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-orange-400/5 border border-amber-400/20 text-sm text-orange-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Resume generated successfully! Review below and accept to apply it.
                  </div>

                  {/* Preview Summary */}
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                    <div className="p-3 rounded-xl bg-white/5">
                      <h4 className="text-xs text-white/40 mb-1">Contact</h4>
                      <p className="text-sm">{wizardResult.contact?.name} • {wizardResult.contact?.email}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <h4 className="text-xs text-white/40 mb-1">Summary</h4>
                      <p className="text-sm text-white/70">{wizardResult.summary}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <h4 className="text-xs text-white/40 mb-1">Experience ({wizardResult.experience?.length || 0} roles)</h4>
                      {wizardResult.experience?.map((exp: any, i: number) => (
                        <div key={i} className="mt-2">
                          <p className="text-sm font-medium">{exp.role} at {exp.company}</p>
                          <p className="text-xs text-white/30">{exp.startDate} - {exp.endDate}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <h4 className="text-xs text-white/40 mb-1">Skills ({wizardResult.skills?.length || 0})</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {wizardResult.skills?.map((s: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleWizardAccept}
                      className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept & Apply
                    </button>
                    <button
                      onClick={() => { setWizardStep(1); setWizardResult(null); }}
                      className="btn-secondary flex-1 py-2.5 flex items-center justify-center gap-2 text-sm"
                    >
                      <Wand2 className="w-4 h-4" /> Regenerate
                    </button>
                  </div>

                  <p className="text-xs text-white/20 text-center">
                    You can edit any section after accepting
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Editor Section (only shown when user enters editor) ── */}
      {showEditor && (<>
      {/* ── Paywall Banner (FREE plan) ─────────────────────── */}
      {isFree && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-orange-400/30 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(245,158,11,0.12) 100%)',
          }}
        >
          <div className="px-5 py-5 sm:px-6 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Upgrade to export your resume as PDF
                </h3>
                <p className="text-sm text-white/50 mt-0.5">
                  Free users can edit and preview. Upgrade to Pro to export PDF.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all"
            >
              <Crown className="w-4 h-4" />
              Upgrade Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Human Expert Resume Review Banner ─────────────── */}
      <HumanExpertBanner userPlan={userPlan} />

      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
              <FileText className="w-7 h-7 text-orange-400" /> Resume Builder
            </h1>
            <p className="text-white/40">ATS-optimized resumes crafted by Forge</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setWizardOpen(true); setWizardStep(1); setWizardError(''); }}
              className="btn-primary text-sm flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500"
            >
              <Sparkles className="w-4 h-4" />
              Write with Forge
            </button>
            <button
              onClick={handleAIEnhance}
              className="btn-secondary text-sm flex items-center gap-2"
              disabled={generating || aiLoading !== null}
            >
              {aiLoading === 'enhance' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Forge is enhancing...
                </>
              ) : (
                <>
                  <Wand2 className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                  Enhance with Forge
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
                  isFree
                    ? 'btn-secondary opacity-80 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                {isFree ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>

              {isFree && (
                <span className="text-xs text-white/40 hidden sm:inline">
                  Exported with 3BOX AI watermark
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
                  { id: 'projects', icon: FolderKanban, label: 'Projects' },
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

                {/* AI uses counter for FREE plan */}
                {isFree && (
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <p className="text-xs text-white/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Forge uses: {getAIUses()}/{AI_FREE_LIMIT} free
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Form */}
            <div className="lg:col-span-2 space-y-6">
              {activeSection === 'contact' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Contact Information</h3>
                    <button
                      onClick={handleAIRewriteContact}
                      disabled={aiLoading !== null}
                      className="badge-neon text-xs flex items-center gap-1"
                    >
                      {aiLoading === 'contact' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Filling...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3 h-3" /> Auto-fill from Profile
                        </>
                      )}
                    </button>
                  </div>
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
                          Forge is writing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3 h-3" /> Write with Forge
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
                          <p className="text-xs text-white/30">{exp.startDate} - {exp.endDate}</p>
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
                                    showToast('Free Forge limit reached. Upgrade to continue.', 'error');
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
                                  if (isFree) incrementAIUses();
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
                            className="p-1.5 rounded-lg hover:bg-white/5 text-orange-400/60 hover:text-orange-400 transition-colors"
                            title="Enhance with Forge"
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
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Skills</h3>
                    <button
                      onClick={handleAISuggestSkills}
                      disabled={aiLoading !== null}
                      className="badge-neon text-xs flex items-center gap-1"
                    >
                      {aiLoading === 'skills' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Suggesting...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3 h-3" /> Suggest with Forge
                        </>
                      )}
                    </button>
                  </div>
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

              {activeSection === 'tailor' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <h3 className="font-semibold mb-2">Tailor to Job Description</h3>
                  <p className="text-sm text-white/40 mb-4">Paste a job description and Forge will optimize your resume for it.</p>
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
                        Forge is tailoring your resume...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" /> Optimize with Forge
                      </>
                    )}
                  </button>
                  {isFree && (
                    <p className="text-xs text-white/30 mt-3">
                      Free plan: {Math.max(0, AI_FREE_LIMIT - getAIUses())} Forge uses remaining
                    </p>
                  )}
                </motion.div>
              )}

              {/* ── Education Section ── */}
              {activeSection === 'education' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {resume.education.map((edu) => (
                    <div key={edu.id} className="card">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-sm">{edu.degree} {edu.field && `in ${edu.field}`}</h4>
                          <p className="text-xs text-white/40">{edu.institution}</p>
                          <p className="text-xs text-white/30">{edu.startDate} - {edu.endDate}{edu.gpa && ` | GPA: ${edu.gpa}`}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAIEnhanceEducation(edu.id)}
                            disabled={aiLoading !== null}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-orange-400/60 hover:text-orange-400 transition-colors"
                            title="Enhance with Forge"
                          >
                            {aiLoading === `edu-${edu.id}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Wand2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              const updated = resume.education.filter(e => e.id !== edu.id);
                              setResume({ ...resume, education: updated });
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/5"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400/60" />
                          </button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Institution</label>
                          <input
                            value={edu.institution}
                            onChange={(e) => setResume({ ...resume, education: resume.education.map(ed => ed.id === edu.id ? { ...ed, institution: e.target.value } : ed) })}
                            className="input-field text-sm"
                            placeholder="University name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Degree</label>
                          <input
                            value={edu.degree}
                            onChange={(e) => setResume({ ...resume, education: resume.education.map(ed => ed.id === edu.id ? { ...ed, degree: e.target.value } : ed) })}
                            className="input-field text-sm"
                            placeholder="e.g., Bachelor of Science"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Field of Study</label>
                          <input
                            value={edu.field}
                            onChange={(e) => setResume({ ...resume, education: resume.education.map(ed => ed.id === edu.id ? { ...ed, field: e.target.value } : ed) })}
                            className="input-field text-sm"
                            placeholder="e.g., Computer Science"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">GPA</label>
                          <input
                            value={edu.gpa}
                            onChange={(e) => setResume({ ...resume, education: resume.education.map(ed => ed.id === edu.id ? { ...ed, gpa: e.target.value } : ed) })}
                            className="input-field text-sm"
                            placeholder="e.g., 3.8"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Start Date</label>
                          <input
                            value={edu.startDate}
                            onChange={(e) => setResume({ ...resume, education: resume.education.map(ed => ed.id === edu.id ? { ...ed, startDate: e.target.value } : ed) })}
                            className="input-field text-sm"
                            placeholder="e.g., Sep 2018"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">End Date</label>
                          <input
                            value={edu.endDate}
                            onChange={(e) => setResume({ ...resume, education: resume.education.map(ed => ed.id === edu.id ? { ...ed, endDate: e.target.value } : ed) })}
                            className="input-field text-sm"
                            placeholder="e.g., May 2022"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newEdu = { id: Date.now().toString(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' };
                      setResume({ ...resume, education: [...resume.education, newEdu] });
                    }}
                    className="w-full py-3 border border-dashed border-white/10 rounded-xl text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Education
                  </button>
                  <button
                    onClick={async () => {
                      if (!checkAILimit()) return;
                      setAiLoading('education');
                      try {
                        const sectionContent = resume.education.map(e => `${e.degree} ${e.field} at ${e.institution}`).join('\n');
                        const res = await fetch('/api/ai/resume/enhance', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            section: 'experience',
                            content: sectionContent || `Generate education content for a professional with skills: ${resume.skills.join(', ')}`,
                          }),
                        });
                        if (!res.ok) {
                          const errData = await res.json().catch(() => null);
                          if (errData?.code === 'PLAN_LIMIT_REACHED') {
                            showToast('Free Forge limit reached. Upgrade to continue.', 'error');
                            return;
                          }
                          throw new Error('Generation failed');
                        }
                        if (isFree) incrementAIUses();
                        showToast('Forge generated education content!', 'success');
                      } catch (error) {
                        console.error('AI Generate error:', error);
                        showToast('Forge generation failed. Try again.', 'error');
                      } finally {
                        setAiLoading(null);
                      }
                    }}
                    disabled={aiLoading !== null}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    {aiLoading === 'education' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Forge is generating...</>
                    ) : (
                      <><Wand2 className="w-4 h-4" /> Generate with Forge</>
                    )}
                  </button>
                </motion.div>
              )}

              {/* ── Certifications Section ── */}
              {activeSection === 'certifications' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {resume.certifications.map((cert) => (
                    <div key={cert.id} className="card">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-sm">{cert.name || 'New Certification'}</h4>
                          <p className="text-xs text-white/40">{cert.issuer}{cert.date && ` | ${cert.date}`}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const updated = resume.certifications.filter(c => c.id !== cert.id);
                              setResume({ ...resume, certifications: updated });
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/5"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400/60" />
                          </button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Certification Name</label>
                          <input
                            value={cert.name}
                            onChange={(e) => setResume({ ...resume, certifications: resume.certifications.map(c => c.id === cert.id ? { ...c, name: e.target.value } : c) })}
                            className="input-field text-sm"
                            placeholder="e.g., AWS Solutions Architect"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Issuer</label>
                          <input
                            value={cert.issuer}
                            onChange={(e) => setResume({ ...resume, certifications: resume.certifications.map(c => c.id === cert.id ? { ...c, issuer: e.target.value } : c) })}
                            className="input-field text-sm"
                            placeholder="e.g., Amazon Web Services"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Date</label>
                          <input
                            value={cert.date}
                            onChange={(e) => setResume({ ...resume, certifications: resume.certifications.map(c => c.id === cert.id ? { ...c, date: e.target.value } : c) })}
                            className="input-field text-sm"
                            placeholder="e.g., Jan 2024"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newCert = { id: Date.now().toString(), name: '', issuer: '', date: '', verified: false };
                      setResume({ ...resume, certifications: [...resume.certifications, newCert] });
                    }}
                    className="w-full py-3 border border-dashed border-white/10 rounded-xl text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Certification
                  </button>
                  <button
                    onClick={async () => {
                      if (!checkAILimit()) return;
                      setAiLoading('certifications');
                      try {
                        const sectionContent = resume.certifications.map(c => `${c.name} - ${c.issuer} (${c.date})`).join('\n');
                        const res = await fetch('/api/ai/resume/enhance', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            section: 'experience',
                            content: sectionContent || `Generate certification recommendations for a professional with skills: ${resume.skills.join(', ')}`,
                          }),
                        });
                        if (!res.ok) {
                          const errData = await res.json().catch(() => null);
                          if (errData?.code === 'PLAN_LIMIT_REACHED') {
                            showToast('Free Forge limit reached. Upgrade to continue.', 'error');
                            return;
                          }
                          throw new Error('Generation failed');
                        }
                        if (isFree) incrementAIUses();
                        showToast('Forge generated certification content!', 'success');
                      } catch (error) {
                        console.error('AI Generate error:', error);
                        showToast('Forge generation failed. Try again.', 'error');
                      } finally {
                        setAiLoading(null);
                      }
                    }}
                    disabled={aiLoading !== null}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    {aiLoading === 'certifications' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Forge is generating...</>
                    ) : (
                      <><Wand2 className="w-4 h-4" /> Generate with Forge</>
                    )}
                  </button>
                </motion.div>
              )}

              {/* ── Projects Section ── */}
              {activeSection === 'projects' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {resume.projects.map((proj) => (
                    <div key={proj.id} className="card">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-sm">{proj.name || 'New Project'}</h4>
                          <p className="text-xs text-white/40 line-clamp-1">{proj.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const updated = resume.projects.filter(p => p.id !== proj.id);
                              setResume({ ...resume, projects: updated });
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/5"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400/60" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Project Name</label>
                          <input
                            value={proj.name}
                            onChange={(e) => setResume({ ...resume, projects: resume.projects.map(p => p.id === proj.id ? { ...p, name: e.target.value } : p) })}
                            className="input-field text-sm"
                            placeholder="e.g., E-Commerce Platform"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Description</label>
                          <textarea
                            value={proj.description}
                            onChange={(e) => setResume({ ...resume, projects: resume.projects.map(p => p.id === proj.id ? { ...p, description: e.target.value } : p) })}
                            className="input-field text-sm h-20 resize-none"
                            placeholder="Brief description of the project and your contributions..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">URL</label>
                          <input
                            value={proj.url}
                            onChange={(e) => setResume({ ...resume, projects: resume.projects.map(p => p.id === proj.id ? { ...p, url: e.target.value } : p) })}
                            className="input-field text-sm"
                            placeholder="https://github.com/user/project"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">Technologies (comma-separated)</label>
                          <input
                            value={proj.technologies.join(', ')}
                            onChange={(e) => setResume({ ...resume, projects: resume.projects.map(p => p.id === proj.id ? { ...p, technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : p) })}
                            className="input-field text-sm"
                            placeholder="e.g., React, Node.js, PostgreSQL"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newProj = { id: Date.now().toString(), name: '', description: '', url: '', technologies: [] as string[] };
                      setResume({ ...resume, projects: [...resume.projects, newProj] });
                    }}
                    className="w-full py-3 border border-dashed border-white/10 rounded-xl text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Project
                  </button>
                  <button
                    onClick={async () => {
                      if (!checkAILimit()) return;
                      setAiLoading('projects');
                      try {
                        const sectionContent = resume.projects.map(p => `${p.name}: ${p.description}`).join('\n');
                        const res = await fetch('/api/ai/resume/enhance', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            section: 'experience',
                            content: sectionContent || `Generate project ideas for a professional with skills: ${resume.skills.join(', ')}`,
                          }),
                        });
                        if (!res.ok) {
                          const errData = await res.json().catch(() => null);
                          if (errData?.code === 'PLAN_LIMIT_REACHED') {
                            showToast('Free Forge limit reached. Upgrade to continue.', 'error');
                            return;
                          }
                          throw new Error('Generation failed');
                        }
                        if (isFree) incrementAIUses();
                        showToast('Forge generated projects content!', 'success');
                      } catch (error) {
                        console.error('AI Generate error:', error);
                        showToast('Forge generation failed. Try again.', 'error');
                      } finally {
                        setAiLoading(null);
                      }
                    }}
                    disabled={aiLoading !== null}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    {aiLoading === 'projects' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Forge is generating...</>
                    ) : (
                      <><Wand2 className="w-4 h-4" /> Generate with Forge</>
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
            {/* ── Template Selector Strip ── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/60">Choose Template</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {templates.map((t) => {
                  const isSelected = resume.template === t.id;
                  const accents: Record<string, { border: string; bg: string; text: string; glow: string }> = {
                    modern: { border: 'border-cyan-400/60', bg: 'bg-cyan-400/10', text: 'text-cyan-400', glow: 'shadow-[0_0_20px_rgba(0,212,255,0.15)]' },
                    classic: { border: 'border-amber-400/60', bg: 'bg-amber-400/10', text: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]' },
                    minimal: { border: 'border-white/40', bg: 'bg-white/5', text: 'text-white/70', glow: 'shadow-[0_0_20px_rgba(255,255,255,0.08)]' },
                    creative: { border: 'border-purple-400/60', bg: 'bg-purple-400/10', text: 'text-purple-400', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]' },
                  };
                  const accent = accents[t.id] || accents.modern;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setResume({...resume, template: t.id})}
                      className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
                        isSelected
                          ? `border-2 ${accent.border} ${accent.glow}`
                          : 'border border-white/10 hover:border-white/25'
                      }`}
                    >
                      {/* Mini preview */}
                      <div className={`h-28 sm:h-32 ${isSelected ? accent.bg : 'bg-white/[0.03] group-hover:bg-white/[0.05]'} transition-all p-1.5`}>
                        <TemplatePreviewMini template={t.id as 'modern' | 'classic' | 'minimal' | 'creative'} />
                      </div>
                      {/* Selected indicator */}
                      {isSelected && (
                        <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full ${accent.bg} border ${accent.border} flex items-center justify-center`}>
                          <svg className={`w-3 h-3 ${accent.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {/* Label */}
                      <div className={`py-2 px-2 text-center ${isSelected ? accent.bg : ''}`}>
                        <div className={`text-xs font-semibold ${isSelected ? accent.text : 'text-white/70 group-hover:text-white'}`}>{t.name}</div>
                        <div className="text-[10px] text-white/30 mt-0.5">{t.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {resume.template === 'modern' ? (
              /* ── Modern Template: Sidebar layout ── */
              <div className="rounded-2xl overflow-hidden max-w-3xl mx-auto shadow-2xl flex min-h-[800px]">
                {/* Sidebar */}
                <div className="w-[35%] bg-[#0f172a] text-white p-6 flex flex-col">
                  <div className="w-16 h-16 rounded-full bg-cyan-400/20 border-2 border-cyan-400/40 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-cyan-400">{resume.contact.name?.charAt(0) || 'U'}</span>
                  </div>
                  <h1 className="text-lg font-bold text-center text-white mb-1">{resume.contact.name}</h1>
                  <p className="text-xs text-cyan-400/80 text-center mb-4">{resume.title || 'Professional'}</p>

                  <div className="space-y-2 mb-6 text-xs">
                    {resume.contact.email && <div className="flex items-center gap-2 text-gray-300"><Mail className="w-3 h-3 text-cyan-400/60" /> {resume.contact.email}</div>}
                    {resume.contact.phone && <div className="flex items-center gap-2 text-gray-300"><Phone className="w-3 h-3 text-cyan-400/60" /> {resume.contact.phone}</div>}
                    {resume.contact.location && <div className="flex items-center gap-2 text-gray-300"><MapPin className="w-3 h-3 text-cyan-400/60" /> {resume.contact.location}</div>}
                    {resume.contact.linkedin && <div className="flex items-center gap-2 text-gray-300"><Linkedin className="w-3 h-3 text-cyan-400/60" /> {resume.contact.linkedin}</div>}
                    {resume.contact.portfolio && <div className="flex items-center gap-2 text-gray-300"><Globe className="w-3 h-3 text-cyan-400/60" /> {resume.contact.portfolio}</div>}
                  </div>

                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/70 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {resume.skills.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300/80 border border-cyan-400/20">{s}</span>
                    ))}
                  </div>

                  {resume.certifications.length > 0 && (
                    <>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/70 mb-2">Certifications</h3>
                      <div className="space-y-1.5">
                        {resume.certifications.map(cert => (
                          <div key={cert.id} className="text-xs text-gray-300">
                            <div className="font-medium">{cert.name}</div>
                            <div className="text-[10px] text-gray-500">{cert.issuer}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Main Content */}
                <div className="w-[65%] bg-white p-6 text-gray-900">
                  <div className="mb-5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-600 mb-2 border-b border-cyan-100 pb-1">Professional Summary</h2>
                    <p className="text-sm text-gray-600 leading-relaxed">{resume.summary}</p>
                  </div>

                  <div className="mb-5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-600 mb-2 border-b border-cyan-100 pb-1">Experience</h2>
                    {resume.experience.map(exp => (
                      <div key={exp.id} className="mb-4">
                        <div className="flex justify-between items-baseline">
                          <div><span className="font-semibold text-sm">{exp.role}</span> <span className="text-sm text-gray-400">| {exp.company}</span></div>
                          <span className="text-xs text-gray-400">{exp.startDate} – {exp.endDate}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">{exp.location}</p>
                        <ul className="space-y-1">{exp.bullets.map((b, i) => <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="text-cyan-400 mt-0.5">•</span> {b}</li>)}</ul>
                      </div>
                    ))}
                  </div>

                  <div className="mb-5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-600 mb-2 border-b border-cyan-100 pb-1">Education</h2>
                    {resume.education.map(edu => (
                      <div key={edu.id} className="flex justify-between items-baseline mb-2">
                        <div><span className="font-semibold text-sm">{edu.degree} {edu.field}</span> <span className="text-sm text-gray-400">| {edu.institution}</span>{edu.gpa && <span className="text-xs text-gray-400 ml-2">GPA: {edu.gpa}</span>}</div>
                        <span className="text-xs text-gray-400">{edu.startDate} – {edu.endDate}</span>
                      </div>
                    ))}
                  </div>

                  {resume.projects.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-600 mb-2 border-b border-cyan-100 pb-1">Projects</h2>
                      {resume.projects.map(p => (
                        <div key={p.id} className="mb-2">
                          <span className="font-semibold text-sm">{p.name}</span>
                          <p className="text-xs text-gray-500">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : resume.template === 'classic' ? (
              /* ── Classic Template: Traditional centered layout ── */
              <div className="bg-white text-gray-900 rounded-2xl p-8 sm:p-10 max-w-3xl mx-auto shadow-2xl">
                <div className="text-center mb-4 pb-4 border-b-2 border-gray-800">
                  <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">{resume.contact.name}</h1>
                  <div className="flex items-center justify-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                    {resume.contact.email && <span>{resume.contact.email}</span>}
                    {resume.contact.email && resume.contact.phone && <span className="text-gray-300">|</span>}
                    {resume.contact.phone && <span>{resume.contact.phone}</span>}
                    {resume.contact.phone && resume.contact.location && <span className="text-gray-300">|</span>}
                    {resume.contact.location && <span>{resume.contact.location}</span>}
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-1 text-xs text-blue-700">
                    {resume.contact.linkedin && <span>{resume.contact.linkedin}</span>}
                    {resume.contact.linkedin && resume.contact.portfolio && <span className="text-gray-300">|</span>}
                    {resume.contact.portfolio && <span>{resume.contact.portfolio}</span>}
                  </div>
                </div>
                {resume.summary && <div className="mb-5"><h2 className="text-xs font-bold uppercase tracking-widest text-gray-800 mb-1 border-b border-gray-300 pb-1">Professional Summary</h2><p className="text-sm text-gray-600 leading-relaxed mt-2">{resume.summary}</p></div>}
                {resume.experience.length > 0 && <div className="mb-5"><h2 className="text-xs font-bold uppercase tracking-widest text-gray-800 mb-1 border-b border-gray-300 pb-1">Experience</h2>{resume.experience.map(exp => (<div key={exp.id} className="mb-4 mt-2"><div className="flex justify-between items-baseline"><div><span className="font-bold text-sm">{exp.role}</span><span className="text-sm text-gray-500">, {exp.company}</span></div><span className="text-xs text-gray-400 italic">{exp.startDate} – {exp.endDate}</span></div><p className="text-xs text-gray-400 italic">{exp.location}</p><ul className="mt-1 space-y-0.5">{exp.bullets.map((b, i) => <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span>{b}</li>)}</ul></div>))}</div>}
                {resume.education.length > 0 && <div className="mb-5"><h2 className="text-xs font-bold uppercase tracking-widest text-gray-800 mb-1 border-b border-gray-300 pb-1">Education</h2>{resume.education.map(edu => (<div key={edu.id} className="flex justify-between items-baseline mt-2 mb-1"><div><span className="font-bold text-sm">{edu.degree} in {edu.field}</span><span className="text-sm text-gray-500">, {edu.institution}</span>{edu.gpa && <span className="text-xs text-gray-400 ml-2">(GPA: {edu.gpa})</span>}</div><span className="text-xs text-gray-400 italic">{edu.startDate} – {edu.endDate}</span></div>))}</div>}
                {resume.skills.length > 0 && <div className="mb-5"><h2 className="text-xs font-bold uppercase tracking-widest text-gray-800 mb-1 border-b border-gray-300 pb-1">Skills</h2><p className="text-sm text-gray-600 mt-2">{resume.skills.join(' • ')}</p></div>}
                {resume.certifications.length > 0 && <div className="mb-5"><h2 className="text-xs font-bold uppercase tracking-widest text-gray-800 mb-1 border-b border-gray-300 pb-1">Certifications</h2>{resume.certifications.map(cert => (<div key={cert.id} className="flex items-center gap-2 text-sm text-gray-600 mt-1">{cert.verified && <CheckCircle2 className="w-3 h-3 text-green-600" />}<span className="font-medium">{cert.name}</span><span className="text-gray-400">- {cert.issuer} ({cert.date})</span></div>))}</div>}
                {resume.projects.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-widest text-gray-800 mb-1 border-b border-gray-300 pb-1">Projects</h2>{resume.projects.map(p => (<div key={p.id} className="mb-2 mt-2"><span className="font-bold text-sm">{p.name}</span><p className="text-sm text-gray-500">{p.description}</p>{p.technologies.length > 0 && <p className="text-xs text-gray-400 mt-0.5">{p.technologies.join(' · ')}</p>}</div>))}</div>}
              </div>
            ) : resume.template === 'minimal' ? (
              /* ── Minimal Template: Clean, lots of whitespace ── */
              <div className="bg-white text-gray-900 rounded-2xl p-10 sm:p-14 max-w-3xl mx-auto shadow-2xl">
                <h1 className="text-3xl font-light text-gray-900 mb-0.5">{resume.contact.name}</h1>
                <p className="text-sm text-gray-400 mb-6">{resume.title || ''}</p>
                <div className="flex gap-6 mb-8 text-xs text-gray-400">
                  {resume.contact.email && <span>{resume.contact.email}</span>}
                  {resume.contact.phone && <span>{resume.contact.phone}</span>}
                  {resume.contact.location && <span>{resume.contact.location}</span>}
                </div>
                {resume.summary && <div className="mb-8"><h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400 mb-3">Summary</h2><p className="text-sm text-gray-600 leading-relaxed">{resume.summary}</p></div>}
                {resume.experience.length > 0 && <div className="mb-8"><h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400 mb-3">Experience</h2>{resume.experience.map(exp => (<div key={exp.id} className="mb-5"><div className="text-sm font-medium text-gray-800">{exp.role} <span className="font-normal text-gray-400">at {exp.company}</span></div><div className="text-xs text-gray-400 mb-2">{exp.startDate} – {exp.endDate} · {exp.location}</div><ul className="space-y-1">{exp.bullets.map((b, i) => <li key={i} className="text-sm text-gray-500 pl-3 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">{b}</li>)}</ul></div>))}</div>}
                {resume.education.length > 0 && <div className="mb-8"><h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400 mb-3">Education</h2>{resume.education.map(edu => (<div key={edu.id} className="mb-2"><div className="text-sm font-medium text-gray-800">{edu.degree} {edu.field}</div><div className="text-xs text-gray-400">{edu.institution} · {edu.startDate} – {edu.endDate}{edu.gpa && ` · GPA: ${edu.gpa}`}</div></div>))}</div>}
                {resume.skills.length > 0 && <div className="mb-8"><h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400 mb-3">Skills</h2><p className="text-sm text-gray-500">{resume.skills.join(' · ')}</p></div>}
                {resume.certifications.length > 0 && <div className="mb-8"><h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400 mb-3">Certifications</h2>{resume.certifications.map(cert => (<div key={cert.id} className="text-sm text-gray-500 mb-1">{cert.name} - {cert.issuer}</div>))}</div>}
                {resume.projects.length > 0 && <div><h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400 mb-3">Projects</h2>{resume.projects.map(p => (<div key={p.id} className="mb-2"><div className="text-sm font-medium text-gray-800">{p.name}</div><p className="text-sm text-gray-500">{p.description}</p>{p.technologies.length > 0 && <p className="text-xs text-gray-300 mt-0.5">{p.technologies.join(' · ')}</p>}</div>))}</div>}
              </div>
            ) : (
              /* ── Creative Template: Gradient header, colorful ── */
              <div className="rounded-2xl overflow-hidden max-w-3xl mx-auto shadow-2xl">
                <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 p-8 text-white">
                  <h1 className="text-3xl font-bold mb-1">{resume.contact.name}</h1>
                  <p className="text-white/80 text-sm mb-4">{resume.title || 'Professional'}</p>
                  <div className="flex flex-wrap gap-3">
                    {resume.contact.email && <span className="text-xs bg-white/20 rounded-full px-3 py-1">{resume.contact.email}</span>}
                    {resume.contact.phone && <span className="text-xs bg-white/20 rounded-full px-3 py-1">{resume.contact.phone}</span>}
                    {resume.contact.location && <span className="text-xs bg-white/20 rounded-full px-3 py-1">{resume.contact.location}</span>}
                    {resume.contact.linkedin && <span className="text-xs bg-white/20 rounded-full px-3 py-1">{resume.contact.linkedin}</span>}
                  </div>
                </div>
                <div className="bg-white p-8 text-gray-900">
                  {resume.summary && <div className="mb-6 flex gap-3"><div className="w-1 rounded-full bg-gradient-to-b from-purple-500 to-blue-400 flex-shrink-0" /><div><h2 className="text-xs font-bold uppercase text-purple-600 mb-1">About</h2><p className="text-sm text-gray-600 leading-relaxed">{resume.summary}</p></div></div>}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="md:col-span-3">
                      {resume.experience.length > 0 && <div className="mb-6"><h2 className="text-xs font-bold uppercase text-blue-600 mb-3">Experience</h2>{resume.experience.map(exp => (<div key={exp.id} className="mb-4 pl-3 border-l-2 border-blue-100"><div className="font-semibold text-sm">{exp.role}</div><div className="text-xs text-gray-400">{exp.company} · {exp.startDate} – {exp.endDate}</div><ul className="mt-1 space-y-0.5">{exp.bullets.map((b, i) => <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5"><span className="text-blue-400 mt-0.5">▸</span>{b}</li>)}</ul></div>))}</div>}
                      {resume.education.length > 0 && <div><h2 className="text-xs font-bold uppercase text-blue-600 mb-3">Education</h2>{resume.education.map(edu => (<div key={edu.id} className="mb-2 pl-3 border-l-2 border-blue-100"><div className="font-semibold text-sm">{edu.degree} {edu.field}</div><div className="text-xs text-gray-400">{edu.institution} · {edu.startDate} – {edu.endDate}</div></div>))}</div>}
                    </div>
                    <div className="md:col-span-2">
                      {resume.skills.length > 0 && <div className="mb-6"><h2 className="text-xs font-bold uppercase text-purple-600 mb-3">Skills</h2><div className="flex flex-wrap gap-1.5">{resume.skills.map(s => (<span key={s} className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">{s}</span>))}</div></div>}
                      {resume.certifications.length > 0 && <div className="mb-6"><h2 className="text-xs font-bold uppercase text-emerald-600 mb-3">Certifications</h2>{resume.certifications.map(cert => (<div key={cert.id} className="mb-1.5 text-xs text-gray-600"><span className="font-medium">{cert.name}</span><div className="text-gray-400">{cert.issuer}</div></div>))}</div>}
                      {resume.projects.length > 0 && <div><h2 className="text-xs font-bold uppercase text-blue-600 mb-3">Projects</h2>{resume.projects.map(p => (<div key={p.id} className="mb-2 text-xs"><span className="font-medium text-gray-800">{p.name}</span><p className="text-gray-500">{p.description}</p></div>))}</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </>)}
    </div>
  );
}

export default function ResumePage() {
  const { isAutopilot, isAgentic } = useDashboardMode();
  if (isAutopilot) return <AutopilotResume />;
  if (isAgentic) return <AgenticWorkspace agentId="forge" />;
  return <AgenticResumePage />;
}
