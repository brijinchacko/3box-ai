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
import AgentPageHeader from '@/components/dashboard/AgentPageHeader';
import AgentLockedPage from '@/components/dashboard/AgentLockedPage';
import AgentLoader from '@/components/brand/AgentLoader';
import ForgeAutoGenerate from '@/components/forge/ForgeAutoGenerate';
import { isAgentAvailable, type PlanTier } from '@/lib/agents/permissions';
import { notifyAgentCompleted } from '@/lib/notifications/toast';

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
  const hasAccess = userPlan === 'PRO' || userPlan === 'ULTRA';

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
            : 'Pro & Ultra plans include professional resume review by real recruiters'}
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

export default function ResumePage() {
  const { data: session } = useSession();
  const userPlan = ((session?.user as any)?.plan ?? 'BASIC').toUpperCase() as PlanTier;
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
          // Extract phone & linkedin from careerTwin skillSnapshot profile if available
          const profileData = data.careerTwin?.skillSnapshot?._profile || {};
          setResume(prev => ({
            ...prev,
            title: data.targetRole ? `${data.targetRole} Resume` : 'My Resume',
            contact: {
              ...prev.contact,
              name: data.name || '',
              email: data.email || '',
              location: data.location || '',
              phone: profileData.phone || data.phone || '',
              linkedin: profileData.linkedin || data.linkedin || '',
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

  // Pre-fill wizard targetRole from localStorage
  useEffect(() => {
    try {
      const savedRole = localStorage.getItem('3box_target_role');
      if (savedRole) {
        setWizardForm(prev => ({ ...prev, targetRole: savedRole }));
      }
    } catch {}
  }, []);

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
      showToast(`Free Forge limit reached (${AI_FREE_LIMIT}/${AI_FREE_LIMIT}). Upgrade to continue.`, 'error');
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

      if (isBasic) incrementAIUses();
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
      if (isBasic) incrementAIUses();
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

      const content = `${edu.degree} ${edu.field ? `in ${edu.field}` : ''} at ${edu.institution}. ${edu.startDate} — ${edu.endDate}. ${edu.gpa ? `GPA: ${edu.gpa}` : ''}`;
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
        if (isBasic) incrementAIUses();
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
        if (isBasic) incrementAIUses();
        showToast(`Added ${Math.min(suggestedSkills.length, 10)} suggested skills!`, 'success');
      } else {
        showToast('No new skills suggested — your skill set looks comprehensive!', 'success');
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
      if (isBasic) incrementAIUses();
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
      if (isBasic) incrementAIUses();
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

              {isBasic && (
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
                          <p className="text-xs text-white/30">{exp.startDate} — {exp.endDate}</p>
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
      {/* ── Paywall Banner (BASIC plan) ─────────────────────── */}
      {isBasic && (
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
                  Free users can edit and preview. Upgrade to Starter ($12/mo) to export PDF.
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

              {activeSection === 'template' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <h3 className="font-semibold mb-2">Choose Template</h3>
                  <p className="text-xs text-white/40 mb-4">Select a template style for your resume preview and export</p>
                  <div className="grid grid-cols-2 gap-4 justify-items-center">
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
                  {isBasic && (
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
                          <p className="text-xs text-white/30">{edu.startDate} — {edu.endDate}{edu.gpa && ` | GPA: ${edu.gpa}`}</p>
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
                        if (isBasic) incrementAIUses();
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
                        if (isBasic) incrementAIUses();
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
                        if (isBasic) incrementAIUses();
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
                          <div><span className="font-semibold text-sm">{exp.role}</span> <span className="text-sm text-gray-400">— {exp.company}</span></div>
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
                        <div><span className="font-semibold text-sm">{edu.degree} {edu.field}</span> <span className="text-sm text-gray-400">— {edu.institution}</span>{edu.gpa && <span className="text-xs text-gray-400 ml-2">GPA: {edu.gpa}</span>}</div>
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
                {resume.certifications.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-widest text-gray-800 mb-1 border-b border-gray-300 pb-1">Certifications</h2>{resume.certifications.map(cert => (<div key={cert.id} className="flex items-center gap-2 text-sm text-gray-600 mt-1">{cert.verified && <CheckCircle2 className="w-3 h-3 text-green-600" />}<span className="font-medium">{cert.name}</span><span className="text-gray-400">— {cert.issuer} ({cert.date})</span></div>))}</div>}
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
                {resume.certifications.length > 0 && <div><h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400 mb-3">Certifications</h2>{resume.certifications.map(cert => (<div key={cert.id} className="text-sm text-gray-500 mb-1">{cert.name} — {cert.issuer}</div>))}</div>}
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
