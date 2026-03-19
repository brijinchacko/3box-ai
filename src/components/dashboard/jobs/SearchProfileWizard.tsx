'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  FileText,
  Zap,
  Check,
  X,
  AlertCircle,
  Loader2,
  Globe,
  Shield,
  ShieldCheck,
  Target,
  RefreshCw,
  Pencil,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditProfileData {
  id: string;
  jobTitle: string;
  location?: string;
  remote?: boolean;
  experienceLevel?: string;
  boards?: string;
  includeKeywords?: string;
  excludeKeywords?: string;
  excludeCompanies?: string;
  matchTolerance?: number;
  autoSearch?: boolean;
  autoApply?: boolean;
}

interface SearchProfileWizardProps {
  onClose: () => void;
  onComplete: () => void;
  editProfile?: EditProfileData;
}

interface ResumeData {
  contact?: { name?: string; email?: string; phone?: string };
  summary?: string;
  experience?: Array<{ company?: string; role?: string; bullets?: string[] }>;
  education?: Array<{ institution?: string; degree?: string }>;
  skills?: string[];
}

const JOB_BOARDS = [
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'indeed', label: 'Indeed', icon: '🔍' },
  { id: 'glassdoor', label: 'Glassdoor', icon: '🏢' },
  { id: 'google', label: 'Google Jobs', icon: '🌐' },
  { id: 'dice', label: 'Dice', icon: '🎲' },
  { id: 'naukri', label: 'Naukri', icon: '📋' },
];

const EXPERIENCE_LEVELS = [
  { value: 'intern', label: 'Intern / Student' },
  { value: 'entry', label: 'Entry Level (0-1 yrs)' },
  { value: 'mid', label: 'Mid Level (1-3 yrs)' },
  { value: 'senior', label: 'Senior (3-5 yrs)' },
  { value: 'lead', label: 'Lead / Staff (5+ yrs)' },
  { value: 'executive', label: 'Director / Executive' },
];

const STEPS = [
  { id: 'profile', label: 'Box 1: Profile', icon: FileText },
  { id: 'hunt', label: 'Box 2: Job Hunt', icon: Search },
  { id: 'apply', label: 'Box 3: Auto-Apply', icon: Zap },
];

export default function SearchProfileWizard({ onClose, onComplete, editProfile }: SearchProfileWizardProps) {
  const isEditing = !!editProfile;
  // In edit mode, skip resume step (step 0) and go straight to job config
  const [step, setStep] = useState(isEditing ? 1 : 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 0: Resume verification
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [resumeLoading, setResumeLoading] = useState(true);
  const [resumeApproved, setResumeApproved] = useState(isEditing);
  const [resumeVerified, setResumeVerified] = useState(isEditing);

  // Step 1: Job Search config — pre-fill from editProfile if editing
  const [jobTitle, setJobTitle] = useState(editProfile?.jobTitle || '');
  const [location, setLocation] = useState(editProfile?.location || '');
  const [remote, setRemote] = useState(editProfile?.remote || false);
  const [experienceLevel, setExperienceLevel] = useState(editProfile?.experienceLevel || '');
  const [includeKeywords, setIncludeKeywords] = useState(editProfile?.includeKeywords || '');
  const [excludeKeywords, setExcludeKeywords] = useState(editProfile?.excludeKeywords || '');
  const [excludeCompanies, setExcludeCompanies] = useState(editProfile?.excludeCompanies || '');
  const [matchTolerance, setMatchTolerance] = useState(editProfile?.matchTolerance || 70);
  const [selectedBoards, setSelectedBoards] = useState<string[]>(
    editProfile?.boards ? editProfile.boards.split(',').filter(Boolean) : ['linkedin', 'indeed'],
  );

  // Step 2: Automation + Email
  const [autoSearch, setAutoSearch] = useState(editProfile?.autoSearch ?? true);
  const [autoApply, setAutoApply] = useState(editProfile?.autoApply ?? false);
  const [emailStatus, setEmailStatus] = useState<'loading' | 'connected' | 'not-connected'>('loading');
  const [emailProvider, setEmailProvider] = useState<string | null>(null);

  // Load resume on mount
  useEffect(() => {
    fetch('/api/user/resume')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.resume) {
          setResume(data.resume);
          // Auto-approve if resume is already verified
          if (data.isFinalized) {
            setResumeApproved(true);
            setResumeVerified(true);
          }
        }
        setResumeLoading(false);
      })
      .catch(() => setResumeLoading(false));
  }, []);

  // Load email status on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/auth/gmail/status').then(r => r.ok ? r.json() : { connected: false }).catch(() => ({ connected: false })),
      fetch('/api/auth/outlook/status').then(r => r.ok ? r.json() : { connected: false }).catch(() => ({ connected: false })),
      fetch('/api/user/smtp-config').then(r => r.ok ? r.json() : { configured: false }).catch(() => ({ configured: false })),
    ]).then(([gmail, outlook, smtp]) => {
      if (gmail.connected) {
        setEmailStatus('connected');
        setEmailProvider('Gmail');
      } else if (outlook.connected) {
        setEmailStatus('connected');
        setEmailProvider('Outlook');
      } else if (smtp.configured) {
        setEmailStatus('connected');
        setEmailProvider('SMTP');
      } else {
        setEmailStatus('not-connected');
      }
    });
  }, []);

  const toggleBoard = (id: string) => {
    setSelectedBoards(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const [verifyingResume, setVerifyingResume] = useState(false);

  const handleApproveResume = async () => {
    if (resumeVerified) {
      setResumeApproved(true);
      return;
    }
    setVerifyingResume(true);
    try {
      const res = await fetch('/api/user/resume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, verify: true }),
      });
      if (res.ok) {
        setResumeApproved(true);
        setResumeVerified(true);
      } else {
        setError('Failed to verify resume. Please ensure your resume has a name and content.');
      }
    } catch {
      setError('Failed to verify resume.');
    } finally {
      setVerifyingResume(false);
    }
  };

  const canProceedStep0 = resumeApproved && resumeVerified;
  const canProceedStep1 = jobTitle.trim().length > 0;
  const canSubmit = canProceedStep0 && canProceedStep1;

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      jobTitle: jobTitle.trim(),
      location: location.trim() || undefined,
      remote,
      experienceLevel: experienceLevel || undefined,
      includeKeywords: includeKeywords.trim() || undefined,
      excludeKeywords: excludeKeywords.trim() || undefined,
      excludeCompanies: excludeCompanies.trim() || undefined,
      matchTolerance,
      boards: selectedBoards.length > 0 ? selectedBoards : undefined,
      autoSearch,
      autoApply,
    };

    try {
      const url = isEditing ? `/api/user/loops/${editProfile!.id}` : '/api/user/loops';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} search profile`);
      }

      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resumeCompleteness = useCallback(() => {
    if (!resume) return 0;
    let score = 0;
    if (resume.contact?.name) score += 20;
    if (resume.contact?.email) score += 10;
    if (resume.summary && resume.summary.length > 20) score += 20;
    if (resume.experience && resume.experience.length > 0) score += 25;
    if (resume.skills && resume.skills.length >= 3) score += 15;
    if (resume.education && resume.education.length > 0) score += 10;
    return Math.min(100, score);
  }, [resume]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl mx-4 max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Your 3BOX</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800/50">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => { if (i < step) setStep(i); }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    i === step
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : i < step
                      ? 'text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                      : 'text-gray-400 dark:text-gray-600',
                  )}
                >
                  {i < step ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <s.icon className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-px', i < step ? 'bg-emerald-300 dark:bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700')} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {/* ═══ STEP 0: PROFILE ═══ */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Review your resume before applying. This resume will be used for all applications in this search profile.
                  </p>
                </div>

                {resumeLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-gray-500">Loading resume...</span>
                  </div>
                ) : !resume ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      No resume found. Please create one before setting up auto-apply.
                    </p>
                    <a
                      href="/dashboard/resume"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Create Resume
                    </a>
                  </div>
                ) : (
                  <>
                    {/* Verified badge or warning */}
                    {resumeVerified ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Resume Verified — Ready for applications</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span className="text-xs text-amber-700 dark:text-amber-400">
                          Resume not verified yet. You can approve it below, or{' '}
                          <a href="/dashboard/resume" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-amber-800 dark:hover:text-amber-300">
                            verify it in the Resume Editor
                          </a>{' '}
                          for best results.
                        </span>
                      </div>
                    )}

                    {/* Completeness indicator */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Resume Completeness</span>
                        <span className={cn(
                          'text-sm font-bold',
                          resumeCompleteness() >= 80 ? 'text-emerald-600' : resumeCompleteness() >= 50 ? 'text-amber-600' : 'text-red-600',
                        )}>
                          {resumeCompleteness()}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            resumeCompleteness() >= 80 ? 'bg-emerald-500' : resumeCompleteness() >= 50 ? 'bg-amber-500' : 'bg-red-500',
                          )}
                          style={{ width: `${resumeCompleteness()}%` }}
                        />
                      </div>
                      {resumeCompleteness() < 60 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Your resume needs more details for best results
                        </p>
                      )}
                    </div>

                    {/* Resume preview */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
                      {/* Contact */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Contact</h4>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{resume.contact?.name || 'Not set'}</p>
                        <p className="text-xs text-gray-500">{resume.contact?.email}</p>
                      </div>

                      {/* Summary */}
                      {resume.summary && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Summary</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">{resume.summary}</p>
                        </div>
                      )}

                      {/* Experience */}
                      {resume.experience && resume.experience.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Experience ({resume.experience.length})
                          </h4>
                          {resume.experience.slice(0, 2).map((exp, i) => (
                            <div key={i} className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium text-gray-800 dark:text-gray-200">{exp.role}</span>
                              {exp.company && <span> at {exp.company}</span>}
                            </div>
                          ))}
                          {resume.experience.length > 2 && (
                            <p className="text-xs text-gray-400">+{resume.experience.length - 2} more</p>
                          )}
                        </div>
                      )}

                      {/* Skills */}
                      {resume.skills && resume.skills.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {resume.skills.slice(0, 8).map((skill, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                {skill}
                              </span>
                            ))}
                            {resume.skills.length > 8 && (
                              <span className="text-xs text-gray-400">+{resume.skills.length - 8}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Approve / Edit actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleApproveResume}
                        disabled={verifyingResume || (resumeApproved && resumeVerified)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                          resumeApproved && resumeVerified
                            ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700',
                        )}
                      >
                        {verifyingResume ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                        ) : resumeApproved && resumeVerified ? (
                          <><ShieldCheck className="w-4 h-4" /> Resume Verified</>
                        ) : (
                          <><Shield className="w-4 h-4" /> Verify &amp; Approve Resume</>
                        )}
                      </button>
                      <a
                        href="/dashboard/resume"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit Resume
                      </a>
                    </div>

                    {!resumeApproved && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        You must approve your resume to continue
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* ═══ STEP 1: JOB HUNT ═══ */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Configure what jobs you want to find and apply to automatically.
                  </p>
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Software Engineer, Product Manager"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Location + Remote */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Remote</label>
                    <button
                      onClick={() => setRemote(!remote)}
                      className={cn(
                        'w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                        remote
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300',
                      )}
                    >
                      <Globe className="w-4 h-4" />
                      {remote ? 'Remote preferred' : 'Any work type'}
                    </button>
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Any level</option>
                    {EXPERIENCE_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>

                {/* Job Boards */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Job Boards</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Select which job boards to search. We&apos;ll aggregate results from all selected sources.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {JOB_BOARDS.map(board => (
                      <button
                        key={board.id}
                        type="button"
                        onClick={() => toggleBoard(board.id)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left',
                          selectedBoards.includes(board.id)
                            ? 'border-blue-300 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600',
                        )}
                      >
                        <span className="text-base">{board.icon}</span>
                        <span>{board.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Match Tolerance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Minimum Match Score: {matchTolerance}%
                  </label>
                  <input
                    type="range"
                    min={30}
                    max={95}
                    step={5}
                    value={matchTolerance}
                    onChange={(e) => setMatchTolerance(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>More results</span>
                    <span>Higher quality</span>
                  </div>
                </div>

                {/* Advanced filters (collapsible) */}
                <details className="group">
                  <summary className="text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                    <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                    Advanced filters
                  </summary>
                  <div className="mt-3 space-y-4 pl-1">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Include Keywords</label>
                      <input
                        type="text"
                        value={includeKeywords}
                        onChange={(e) => setIncludeKeywords(e.target.value)}
                        placeholder="React, TypeScript, Node.js"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Exclude Keywords</label>
                      <input
                        type="text"
                        value={excludeKeywords}
                        onChange={(e) => setExcludeKeywords(e.target.value)}
                        placeholder="Senior, Lead, Manager"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Exclude Companies</label>
                      <input
                        type="text"
                        value={excludeCompanies}
                        onChange={(e) => setExcludeCompanies(e.target.value)}
                        placeholder="Acme Corp, Bad Company Inc"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </details>
              </motion.div>
            )}

            {/* ═══ STEP 2: AUTO-APPLY ═══ */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Configure how the automation works. You can change these settings anytime.
                  </p>
                </div>

                {/* Summary of search */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Search Summary</h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p><span className="font-medium text-gray-800 dark:text-gray-200">Role:</span> {jobTitle}</p>
                    {location && <p><span className="font-medium text-gray-800 dark:text-gray-200">Location:</span> {location}</p>}
                    {remote && <p><span className="font-medium text-gray-800 dark:text-gray-200">Remote:</span> Preferred</p>}
                    <p><span className="font-medium text-gray-800 dark:text-gray-200">Min match:</span> {matchTolerance}%</p>
                    {selectedBoards.length > 0 && (
                      <p><span className="font-medium text-gray-800 dark:text-gray-200">Sources:</span> {selectedBoards.map(b => JOB_BOARDS.find(jb => jb.id === b)?.label || b).join(', ')}</p>
                    )}
                  </div>
                </div>

                {/* Email connection status */}
                {emailStatus === 'connected' ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                    <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      Email connected ({emailProvider})
                    </span>
                  </div>
                ) : emailStatus === 'not-connected' ? (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          No personal email connected. Applications will be sent from{' '}
                          <strong>nishinth.m@wartens.com</strong>.{' '}
                          <a
                            href="/dashboard/settings"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-medium hover:text-amber-800 dark:hover:text-amber-300"
                          >
                            Connect your email in Settings
                          </a>{' '}
                          for better response rates.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Auto-search toggle */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-Search</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Scout searches job boards automatically</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAutoSearch(!autoSearch)}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors relative',
                        autoSearch ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600',
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded-full bg-white absolute top-1 transition-all',
                        autoSearch ? 'left-6' : 'left-1',
                      )} />
                    </button>
                  </div>
                </div>

                {/* Auto-apply toggle */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                        <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-Apply</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Archer applies to matching jobs with human-like timing</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAutoApply(!autoApply)}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors relative',
                        autoApply ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600',
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded-full bg-white absolute top-1 transition-all',
                        autoApply ? 'left-6' : 'left-1',
                      )} />
                    </button>
                  </div>
                  {autoApply && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-1.5">
                        <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        Applications are sent with human-like timing (15-45s intervals, natural pauses) to avoid bot detection.
                      </p>
                    </div>
                  )}
                  {autoApply && !resumeVerified && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        Your resume isn&apos;t verified yet. Verify it in the Resume Editor for the best auto-apply results.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 mt-4">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    Once activated, your 3BOX will automatically search and apply for matching jobs based on your plan limits.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-3">
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={step === 0 ? onClose : handleBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={(step === 0 && !canProceedStep0) || (step === 1 && !canProceedStep1)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                ((step === 0 && !canProceedStep0) || (step === 1 && !canProceedStep1))
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700',
              )}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                (!canSubmit || submitting)
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90',
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditing ? 'Saving...' : 'Activating...'}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {isEditing ? 'Save Changes' : 'Activate Your 3BOX'}
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
