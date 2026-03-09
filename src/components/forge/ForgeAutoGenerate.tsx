'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, FileText, CheckCircle2, X, Loader2,
  Coins, Shield, ArrowRight, RefreshCw, Edit3,
  Briefcase, Code, GraduationCap, User, MapPin,
  Phone, Mail, Linkedin, Copy, ChevronDown, ChevronUp,
  Settings2, ToggleLeft, ToggleRight, AlertTriangle, Eye,
} from 'lucide-react';
import AgentLoader from '@/components/brand/AgentLoader';
import TemplatePreview from '@/components/resume/TemplatePreview';
import { buildResumeHTML } from '@/lib/resume/buildHTML';
import { notifyAgentStarted, notifyAgentCompleted, notifyAgentError } from '@/lib/notifications/toast';

interface ForgeStatus {
  dashboardState: 'no_resume' | 'pending_approval' | 'approved' | 'editing';
  resume: any;
  settings: { perJobResumeRewrite: boolean; perJobAutoApprove: boolean };
  tokens: { used: number; limit: number; remaining: number };
  plan: string;
  hasProfile: boolean;
  onboardingDone: boolean;
  variants: any[];
}

interface ForgeAutoGenerateProps {
  onEnterEditor: () => void;
  onStatusChange: () => void;
}

export default function ForgeAutoGenerate({ onEnterEditor, onStatusChange }: ForgeAutoGenerateProps) {
  const [status, setStatus] = useState<ForgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'classic' | 'minimal' | 'creative'>('modern');
  const [showPreview, setShowPreview] = useState(false);
  const [showLinkedIn, setShowLinkedIn] = useState(true);
  const [showLinkedInApproved, setShowLinkedInApproved] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Forge status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/forge/status?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('[ForgeAutoGenerate] Status fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Auto-Generate from Profile ──
  const handleAutoGenerate = async () => {
    setGenerating(true);
    setGenProgress(0);

    // Notify sidebar that Forge is working
    window.dispatchEvent(new CustomEvent('forge:status', { detail: { working: true } }));
    notifyAgentStarted('forge', 'Building your resume & cover letter...');

    // Simulate progress steps
    const progressInterval = setInterval(() => {
      setGenProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + Math.random() * 15;
      });
    }, 800);

    try {
      // Try to get profile from localStorage first
      let profile = null;
      try {
        const stored = localStorage.getItem('3box_onboarding_profile');
        if (stored) profile = JSON.parse(stored);
      } catch {}

      const res = await fetch('/api/forge/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, template: selectedTemplate }),
      });

      clearInterval(progressInterval);
      setGenProgress(100);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errMsg = err.error || 'Failed to generate resume';
        showToast(errMsg, 'error');
        notifyAgentError('forge', errMsg);
        return;
      }

      showToast('Resume & cover letter generated! Review below.', 'success');
      notifyAgentCompleted('forge', 'Resume & cover letter generated! Review and approve.', '/dashboard/resume');
      // Refresh status to get the new resume
      await fetchStatus();
      onStatusChange();
    } catch (err) {
      clearInterval(progressInterval);
      console.error('[ForgeAutoGenerate] Generation failed:', err);
      showToast('Generation failed. Please try again.', 'error');
      notifyAgentError('forge', 'Resume generation failed. Please try again.');
    } finally {
      setGenerating(false);
      setGenProgress(0);
      // Notify sidebar that Forge stopped working
      window.dispatchEvent(new CustomEvent('forge:status', { detail: { working: false } }));
    }
  };

  // ── Approve / Reject ──
  const handleApprove = async (action: 'approve' | 'reject') => {
    if (!status?.resume?.id) return;
    setApproving(true);

    try {
      const res = await fetch('/api/forge/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: status.resume.id,
          action,
          type: 'both',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errMsg = err.error || 'Failed to process';
        showToast(errMsg, 'error');
        notifyAgentError('forge', errMsg);
        return;
      }

      if (action === 'approve') {
        showToast('Resume approved! Archer can now use it for applications.', 'success');
        notifyAgentCompleted('forge', 'Resume approved! Deploy Archer to start applying.', '/dashboard/applications');
        // Refresh pipeline/GuidedWorkflow
        window.dispatchEvent(new Event('journey:refresh'));
      } else {
        showToast('Resume rejected. You can regenerate or edit manually.', 'success');
        notifyAgentCompleted('forge', 'Resume sent back for changes. Edit or regenerate.', '/dashboard/resume');
      }

      await fetchStatus();
      onStatusChange();
    } catch (err) {
      console.error('[ForgeAutoGenerate] Approval failed:', err);
      showToast('Failed to process. Try again.', 'error');
      notifyAgentError('forge', 'Failed to process approval. Try again.');
    } finally {
      setApproving(false);
    }
  };

  // ── Toggle settings ──
  const handleToggleSetting = async (setting: 'perJobResumeRewrite' | 'perJobAutoApprove', value: boolean) => {
    setSettingsLoading(setting);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoApplyConfig: { [setting]: value } }),
      });

      if (res.ok) {
        setStatus(prev => prev ? {
          ...prev,
          settings: { ...prev.settings, [setting]: value },
        } : prev);
        showToast(`Setting updated`, 'success');
      }
    } catch {
      showToast('Failed to update setting', 'error');
    } finally {
      setSettingsLoading(null);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success');
  };

  // Build actual template HTML for preview
  // NOTE: useMemo must be called before any conditional returns (React Rules of Hooks)
  const resume = status?.resume;
  const previewHtml = useMemo(() => {
    if (!resume?.content) return '';
    try {
      return buildResumeHTML({
        template: (resume.template as 'modern' | 'classic' | 'minimal' | 'creative') || 'modern',
        contact: resume.content.contact || {},
        summary: resume.content.summary || '',
        experience: (resume.content.experience || []).map((exp: any) => ({
          id: exp.id || String(Math.random()),
          company: exp.company || '',
          role: exp.title || exp.role || '',
          location: exp.location || '',
          startDate: exp.startDate || exp.duration?.split('-')[0]?.trim() || '',
          endDate: exp.endDate || exp.duration?.split('-')[1]?.trim() || '',
          current: exp.current || false,
          bullets: exp.bullets || [],
        })),
        education: (resume.content.education || []).map((edu: any) => ({
          id: edu.id || String(Math.random()),
          institution: edu.institution || '',
          degree: edu.degree || '',
          field: edu.field || '',
          startDate: edu.startDate || '',
          endDate: edu.endDate || edu.year || '',
          gpa: edu.gpa || '',
        })),
        skills: resume.content.skills || [],
        certifications: resume.content.certifications || [],
        showWatermark: false,
      });
    } catch {
      return '';
    }
  }, [resume]);

  // Build LinkedIn checklist items based on profile data
  const linkedinChecklist = useMemo(() => {
    if (!resume?.content) return [];
    return [
      `Update headline with relevant keywords${resume.content.linkedinHeadline ? ' (see suggestion above)' : ''}`,
      'Upload a professional profile photo & cover banner',
      `Update your About section${resume.content.linkedinBio ? ' (see suggestion above)' : ''}`,
      'Update Experience & Education sections as per your latest CV',
      `Add skills to your profile${resume.content.linkedinSuggestedSkills?.length ? ` (${resume.content.linkedinSuggestedSkills.length} suggested above)` : ''}`,
      `Update your location${resume.content.contact?.location ? ` to "${resume.content.contact.location}"` : ''}`,
      'Upload your latest CV/Resume to LinkedIn',
    ];
  }, [resume]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!status) return null;

  const { dashboardState, settings, tokens } = status;

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                : 'bg-red-500/20 border border-red-500/30 text-red-300'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STATE: Generating ── */}
      {generating && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6 text-center py-10"
        >
          <AgentLoader agentId="forge" message="Forge is crafting your resume & cover letter" size="lg" />
          <div className="mt-4 max-w-xs mx-auto">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                animate={{ width: `${genProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/30">
              <span>Analyzing profile</span>
              <span>Polishing resume</span>
              <span>Writing cover letter</span>
            </div>
          </div>
          <p className="text-xs text-orange-400/60 mt-3 animate-pulse">This usually takes 15-30 seconds</p>
        </motion.div>
      )}

      {/* ── STATE: No Resume ── */}
      {!generating && dashboardState === 'no_resume' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Let Forge Build Your Resume</h2>
            <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">
              {status.hasProfile
                ? 'Forge will use your onboarding profile to generate a polished, ATS-optimized resume and cover letter.'
                : 'Complete onboarding first so Forge can generate your resume from your profile data.'}
            </p>

            {status.hasProfile ? (
              <div className="space-y-5">
                {/* Template Picker */}
                <div>
                  <h3 className="text-sm font-semibold text-white/60 mb-3 text-center">Choose Your Template</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto justify-items-center">
                    {(['modern', 'classic', 'minimal', 'creative'] as const).map((tpl) => (
                      <TemplatePreview
                        key={tpl}
                        template={tpl}
                        selected={selectedTemplate === tpl}
                        onClick={() => setSelectedTemplate(tpl)}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAutoGenerate}
                  className="btn-primary px-8 py-3 text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-500 flex items-center gap-2 mx-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Resume from Profile
                </button>
                <div className="flex items-center justify-center gap-1 text-xs text-white/30">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>5 tokens (3 resume + 2 cover letter)</span>
                  <span className="mx-1">•</span>
                  <span>{tokens.remaining} tokens remaining</span>
                </div>
                <div className="pt-1">
                  <button
                    onClick={onEnterEditor}
                    className="text-xs text-white/30 hover:text-white/50 underline underline-offset-2"
                  >
                    Skip — I&apos;ll build manually
                  </button>
                </div>
              </div>
            ) : (
              <a
                href="/dashboard/onboarding"
                className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2"
              >
                Complete Onboarding First
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </motion.div>
      )}

      {/* ── STATE: Pending Approval ── */}
      {!generating && dashboardState === 'pending_approval' && resume && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 space-y-4"
        >
          {/* Header */}
          <div className="card border-orange-400/20 bg-gradient-to-r from-orange-500/5 to-amber-500/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-400/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Resume Ready for Review</h3>
                <p className="text-xs text-white/40">Forge generated your resume and cover letter. Review and approve below.</p>
              </div>
              {resume.atsScore && (
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-400">{Math.round(resume.atsScore)}%</div>
                  <div className="text-[10px] text-white/30">ATS Score</div>
                </div>
              )}
            </div>
          </div>

          {/* Resume Preview — Rendered Template */}
          <div className="card">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-orange-400" /> Resume Preview
              <span className="text-[10px] text-white/30 ml-auto">Template: {resume.template || 'modern'}</span>
            </h4>
            {previewHtml ? (
              <div className="rounded-xl overflow-hidden border border-white/10 bg-white" style={{ maxHeight: '700px', overflow: 'auto' }}>
                <iframe
                  key={`preview-${resume?.id}-${resume?.updatedAt}`}
                  srcDoc={previewHtml}
                  title="Resume Preview"
                  className="w-full pointer-events-none"
                  style={{ height: '900px', border: 'none' }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Fallback card-based preview */}
                {resume.content?.contact && (
                  <div className="p-3 rounded-xl bg-white/5">
                    <h5 className="text-xs text-white/40 mb-1">Contact</h5>
                    <div className="flex flex-wrap gap-3 text-sm">
                      {resume.content.contact.name && (
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-white/30" /> {resume.content.contact.name}</span>
                      )}
                      {resume.content.contact.email && (
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-white/30" /> {resume.content.contact.email}</span>
                      )}
                    </div>
                  </div>
                )}
                {resume.content?.summary && (
                  <div className="p-3 rounded-xl bg-white/5">
                    <h5 className="text-xs text-white/40 mb-1">Professional Summary</h5>
                    <p className="text-sm text-white/70 leading-relaxed">{resume.content.summary}</p>
                  </div>
                )}
                {resume.content?.experience?.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/5">
                    <h5 className="text-xs text-white/40 mb-2">Experience ({resume.content.experience.length} roles)</h5>
                    {resume.content.experience.map((exp: any, i: number) => (
                      <div key={i} className="mt-2 first:mt-0">
                        <p className="text-sm font-medium">{exp.title} at {exp.company}</p>
                      </div>
                    ))}
                  </div>
                )}
                {resume.content?.skills?.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/5">
                    <h5 className="text-xs text-white/40 mb-2">Skills</h5>
                    <div className="flex flex-wrap gap-1">
                      {resume.content.skills.map((s: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-orange-400/10 text-orange-300/80">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cover Letter Preview */}
          {resume.coverLetter && (
            <div className="card">
              <button
                onClick={() => setShowCoverLetter(!showCoverLetter)}
                className="w-full flex items-center justify-between"
              >
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" /> Cover Letter
                </h4>
                {showCoverLetter ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
              </button>
              {showCoverLetter && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3"
                >
                  <div className="p-4 rounded-xl bg-white/5 text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                    {resume.coverLetter}
                  </div>
                  <button
                    onClick={() => handleCopyText(resume.coverLetter, 'Cover letter')}
                    className="mt-2 text-xs text-white/30 hover:text-white/50 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy to clipboard
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* LinkedIn Profile Optimization */}
          {(resume.content?.linkedinHeadline || resume.content?.linkedinBio) && (
            <div className="card">
              <button
                onClick={() => setShowLinkedIn(!showLinkedIn)}
                className="w-full flex items-center justify-between"
              >
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-blue-400" /> LinkedIn Profile Optimization
                </h4>
                {showLinkedIn ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
              </button>
              {showLinkedIn && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 space-y-3"
                >
                  {/* LinkedIn Disclaimer Banner */}
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300/80">
                      Unfortunately LinkedIn hate the automation tools — so I can&apos;t check your LinkedIn page. Please update it manually using the suggestions below.
                    </p>
                  </div>

                  {/* LinkedIn Headline */}
                  {resume.content.linkedinHeadline && (
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-xs text-white/40">Suggested Headline</h5>
                        <button
                          onClick={() => handleCopyText(resume.content.linkedinHeadline, 'LinkedIn headline')}
                          className="text-xs text-white/30 hover:text-white/50 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <p className="text-sm text-white/80 font-medium">{resume.content.linkedinHeadline}</p>
                    </div>
                  )}

                  {/* LinkedIn Bio */}
                  {resume.content.linkedinBio && (
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-xs text-white/40">Suggested About Section</h5>
                        <button
                          onClick={() => handleCopyText(resume.content.linkedinBio, 'LinkedIn bio')}
                          className="text-xs text-white/30 hover:text-white/50 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{resume.content.linkedinBio}</p>
                    </div>
                  )}

                  {/* Suggested Skills */}
                  {resume.content.linkedinSuggestedSkills?.length > 0 && (
                    <div className="p-3 rounded-xl bg-white/5">
                      <h5 className="text-xs text-white/40 mb-2">Suggested LinkedIn Skills</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.content.linkedinSuggestedSkills.map((skill: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-300/80">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Profile Checklist */}
                  <div className="p-3 rounded-xl bg-white/5">
                    <h5 className="text-xs text-white/40 mb-2">LinkedIn Profile Checklist</h5>
                    <div className="space-y-2">
                      {linkedinChecklist.map((item: string, i: number) => (
                        <label key={i} className="flex items-start gap-2 text-sm text-white/60 cursor-pointer group">
                          <input type="checkbox" className="mt-1 accent-blue-400 rounded" />
                          <span className="group-hover:text-white/80">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Approve / Reject Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleApprove('approve')}
              disabled={approving}
              className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500"
            >
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Approve Resume & Cover Letter
            </button>
            <button
              onClick={() => handleApprove('reject')}
              disabled={approving}
              className="btn-secondary px-6 py-3 flex items-center justify-center gap-2 text-sm"
            >
              <Edit3 className="w-4 h-4" />
              Request Changes
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoGenerate}
              className="text-xs text-white/30 hover:text-white/50 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Regenerate (5 tokens)
            </button>
            <button
              onClick={onEnterEditor}
              className="text-xs text-white/30 hover:text-white/50 flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit manually instead
            </button>
          </div>
        </motion.div>
      )}

      {/* ── STATE: Approved (Clean Simple View) ── */}
      {!generating && dashboardState === 'approved' && resume && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 space-y-4"
        >
          {/* Status Card */}
          <div className="card border-green-500/20 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{resume.title || 'My Resume'}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                    Archer Ready
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                  {resume.atsScore && (
                    <span>ATS Score: <span className="text-orange-400 font-medium">{Math.round(resume.atsScore)}%</span></span>
                  )}
                  <span>Template: {resume.template || 'modern'}</span>
                  {resume.approvedAt && (
                    <span>Approved: {new Date(resume.approvedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <button
                onClick={onEnterEditor}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Resume
              </button>
            </div>
          </div>

          {/* Resume Preview (Collapsible) */}
          <div className="card">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-full flex items-center justify-between"
            >
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-400" /> Resume Preview
              </h4>
              {showPreview ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
            </button>
            {showPreview && previewHtml && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-3"
              >
                <div className="rounded-xl overflow-hidden border border-white/10 bg-white" style={{ maxHeight: '700px', overflow: 'auto' }}>
                  <iframe
                    srcDoc={previewHtml}
                    title="Resume Preview"
                    className="w-full pointer-events-none"
                    style={{ height: '900px', border: 'none' }}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* LinkedIn Profile Optimization (Approved State) */}
          {(resume.content?.linkedinHeadline || resume.content?.linkedinBio) && (
            <div className="card">
              <button
                onClick={() => setShowLinkedInApproved(!showLinkedInApproved)}
                className="w-full flex items-center justify-between"
              >
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-blue-400" /> LinkedIn Profile Optimization
                </h4>
                {showLinkedInApproved ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
              </button>
              {showLinkedInApproved && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 space-y-3"
                >
                  {/* LinkedIn Disclaimer Banner */}
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300/80">
                      Unfortunately LinkedIn hate the automation tools — so I can&apos;t check your LinkedIn page. Please update it manually using the suggestions below.
                    </p>
                  </div>

                  {/* LinkedIn Headline */}
                  {resume.content.linkedinHeadline && (
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-xs text-white/40">Suggested Headline</h5>
                        <button
                          onClick={() => handleCopyText(resume.content.linkedinHeadline, 'LinkedIn headline')}
                          className="text-xs text-white/30 hover:text-white/50 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <p className="text-sm text-white/80 font-medium">{resume.content.linkedinHeadline}</p>
                    </div>
                  )}

                  {/* LinkedIn Bio */}
                  {resume.content.linkedinBio && (
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-xs text-white/40">Suggested About Section</h5>
                        <button
                          onClick={() => handleCopyText(resume.content.linkedinBio, 'LinkedIn bio')}
                          className="text-xs text-white/30 hover:text-white/50 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{resume.content.linkedinBio}</p>
                    </div>
                  )}

                  {/* Suggested Skills */}
                  {resume.content.linkedinSuggestedSkills?.length > 0 && (
                    <div className="p-3 rounded-xl bg-white/5">
                      <h5 className="text-xs text-white/40 mb-2">Suggested LinkedIn Skills</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.content.linkedinSuggestedSkills.map((skill: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-300/80">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Profile Checklist */}
                  <div className="p-3 rounded-xl bg-white/5">
                    <h5 className="text-xs text-white/40 mb-2">LinkedIn Profile Checklist</h5>
                    <div className="space-y-2">
                      {linkedinChecklist.map((item: string, i: number) => (
                        <label key={i} className="flex items-start gap-2 text-sm text-white/60 cursor-pointer group">
                          <input type="checkbox" className="mt-1 accent-blue-400 rounded" />
                          <span className="group-hover:text-white/80">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Per-Job Rewrite Settings */}
          <div className="card">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-white/40" /> Per-Job Optimization
            </h4>
            <div className="space-y-3">
              {/* Per-Job Rewrite Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="text-sm font-medium">Auto-rewrite resume for each job</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    Forge will tailor your resume to each job&apos;s keywords when Archer applies
                  </p>
                </div>
                <button
                  onClick={() => handleToggleSetting('perJobResumeRewrite', !settings.perJobResumeRewrite)}
                  disabled={settingsLoading === 'perJobResumeRewrite'}
                  className="flex-shrink-0"
                >
                  {settingsLoading === 'perJobResumeRewrite' ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white/30" />
                  ) : settings.perJobResumeRewrite ? (
                    <ToggleRight className="w-8 h-8 text-orange-400" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-white/20" />
                  )}
                </button>
              </div>

              {settings.perJobResumeRewrite && (
                <>
                  {/* Token Warning */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-amber-300/80">
                      Each per-job rewrite costs <span className="font-bold">2 tokens</span>. With {tokens.remaining} tokens remaining, Forge can create ~{Math.floor(tokens.remaining / 2)} variants.
                    </p>
                  </div>

                  {/* Auto-Approve Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div>
                      <p className="text-sm font-medium">Auto-approve per-job variants</p>
                      <p className="text-xs text-white/30 mt-0.5">
                        Skip manual approval for each variant. Archer uses them immediately.
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting('perJobAutoApprove', !settings.perJobAutoApprove)}
                      disabled={settingsLoading === 'perJobAutoApprove'}
                      className="flex-shrink-0"
                    >
                      {settingsLoading === 'perJobAutoApprove' ? (
                        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
                      ) : settings.perJobAutoApprove ? (
                        <ToggleRight className="w-8 h-8 text-orange-400" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-white/20" />
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Per-Job Variants List */}
          {status.variants.length > 0 && (
            <div className="card">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-white/40" /> Per-Job Variants ({status.variants.length})
              </h4>
              <div className="space-y-2">
                {status.variants.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 text-sm">
                    <div>
                      <p className="font-medium">{v.jobTitle}</p>
                      <p className="text-xs text-white/30">{v.company} • {new Date(v.createdAt).toLocaleDateString()}</p>
                    </div>
                    {v.atsScore && (
                      <span className="text-xs text-orange-400 font-medium">{Math.round(v.atsScore)}%</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Token Info */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-xs text-white/30">
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              {tokens.remaining} tokens remaining
            </span>
            <span>{tokens.used} / {tokens.limit} used this month</span>
          </div>
        </motion.div>
      )}

      {/* ── STATE: Editing (rejected, needs rework) ── */}
      {!generating && dashboardState === 'editing' && resume && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6 border-amber-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Resume Needs Updates</h3>
              <p className="text-xs text-white/40">Edit your resume below or regenerate from your profile.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAutoGenerate}
                disabled={generating}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate (5 tokens)
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
