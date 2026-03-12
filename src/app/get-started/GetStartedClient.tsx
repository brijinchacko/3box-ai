'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import {
  User, Briefcase, Target, Zap, FileText, ArrowRight, ArrowLeft,
  Check, MapPin, Sparkles, Mail, Lock, Eye, EyeOff, ShieldCheck, Chrome, UserPlus,
  Upload, ClipboardPaste, Loader2, X, CheckCircle2, Linkedin,
} from 'lucide-react';
import CortexAvatar from '@/components/brand/CortexAvatar';
import Logo from '@/components/brand/Logo';
import { useStore } from '@/store/useStore';
import { saveOnboardingProfile, getOnboardingProfile } from '@/lib/onboarding/onboardingData';

// ── Constants (matching dashboard onboarding) ──
const experienceLevels = [
  { value: 'fresher', label: 'Fresher / Student', desc: 'No work experience yet' },
  { value: '0-1', label: '0-1 Years', desc: 'Just starting out' },
  { value: '1-3', label: '1-3 Years', desc: 'Early career' },
  { value: '3-5', label: '3-5 Years', desc: 'Mid-level professional' },
  { value: '5-10', label: '5-10 Years', desc: 'Senior professional' },
  { value: '10+', label: '10+ Years', desc: 'Industry veteran' },
];

const currentStatuses = [
  { value: 'student', label: 'Student', icon: '🎓' },
  { value: 'employed', label: 'Working', icon: '💼' },
  { value: 'job-searching', label: 'Job Searching', icon: '🔍' },
  { value: 'career-change', label: 'Switching Careers', icon: '🔄' },
  { value: 'career-break', label: 'Career Break', icon: '☕' },
  { value: 'freelancer', label: 'Freelancer', icon: '🚀' },
];

const suggestedRoles = [
  'Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Product Manager',
  'UX Designer', 'Business Analyst', 'Mobile Developer', 'QA Engineer',
  'Marketing Manager', 'Project Manager', 'Cybersecurity Analyst', 'Cloud Architect',
];

const industries = [
  'Technology', 'Finance / Banking', 'Healthcare', 'E-Commerce', 'EdTech',
  'Consulting', 'Media & Entertainment', 'Manufacturing', 'Government',
  'Startup', 'Telecom', 'Other',
];

const popularSkills = [
  'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'TypeScript',
  'AWS', 'Docker', 'Git', 'HTML/CSS', 'Excel', 'Data Analysis',
  'Communication', 'Problem Solving', 'Leadership', 'Agile', 'Machine Learning',
  'Figma', 'REST APIs',
];

// ── Steps ──
const STEPS = [
  { icon: FileText, label: 'Resume', title: 'Quick start with your resume' },
  { icon: User, label: 'You', title: "Let's get to know you" },
  { icon: Briefcase, label: 'Status', title: 'Where are you right now?' },
  { icon: Target, label: 'Goal', title: 'What do you want?' },
  { icon: Zap, label: 'Skills', title: 'What are you good at?' },
  { icon: FileText, label: 'Bio', title: 'Tell us your story' },
  { icon: UserPlus, label: 'Account', title: 'Create your account' },
];

const cortexMessages = [
  "Hi! Upload your resume to auto-fill everything, or skip to fill manually.",
  "Hi! I'm Cortex. Let's build your career together.",
  'Great! This helps me find the right opportunities.',
  'Nice. I will search for the best roles for you.',
  'Skills are your superpower. Add as many as you can!',
  'Almost done! This bio will power your resume.',
  'Last step! Create your account to activate your agents.',
];

// ── Onboarding Data ──
interface OnboardingData {
  fullName: string;
  location: string;
  currentStatus: string;
  experienceLevel: string;
  targetRole: string;
  industry: string;
  skills: string[];
  bio: string;
}

const initialData: OnboardingData = {
  fullName: '',
  location: '',
  currentStatus: '',
  experienceLevel: '',
  targetRole: '',
  industry: '',
  skills: [],
  bio: '',
};

type SignupSubStep = 'form' | 'verify';

export default function GetStartedClient() {
  const router = useRouter();
  const visitorName = useStore((s) => s.visitorName);
  const setVisitorName = useStore((s) => s.setVisitorName);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    ...initialData,
    fullName: visitorName || '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  // Resume upload state (Step 0)
  const [resumeMode, setResumeMode] = useState<'upload' | 'paste' | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeParsing, setResumeParsing] = useState(false);
  const [resumeParsed, setResumeParsed] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signup state (Step 5)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupSubStep, setSignupSubStep] = useState<SignupSubStep>('form');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(true);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Hydrate from unified onboarding profile on mount
  useEffect(() => {
    const profile = getOnboardingProfile();
    if (profile) {
      setData((d) => ({
        ...d,
        fullName: d.fullName || profile.fullName || '',
        location: d.location || profile.location || '',
        currentStatus: d.currentStatus || profile.currentStatus || '',
        experienceLevel: d.experienceLevel || profile.experienceLevel || '',
        targetRole: d.targetRole || profile.targetRole || '',
        industry: d.industry || profile.industry || '',
        skills: d.skills.length > 0 ? d.skills : (profile.skills || []),
        bio: d.bio || profile.bio || '',
      }));
    }
  }, []);

  // Check OAuth availability
  const [linkedinEnabled, setLinkedinEnabled] = useState(true);
  useEffect(() => {
    fetch('/api/auth/providers').then(r => r.json()).then(d => {
      setGoogleEnabled(!!d.google);
      setLinkedinEnabled(!!d.linkedin);
    }).catch(() => { setGoogleEnabled(false); setLinkedinEnabled(false); });
  }, []);

  // OTP resend timer
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const update = useCallback(
    <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
      setData((d) => ({ ...d, [key]: value }));
    },
    [],
  );

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return true; // Resume step is always skippable
      case 1: return data.fullName.trim().length >= 2;
      case 2: return !!data.currentStatus && !!data.experienceLevel;
      case 3: return !!data.targetRole;
      case 4: return data.skills.length >= 1;
      case 5: return true; // bio is optional
      case 6: return false; // signup step has its own submit flow
      default: return false;
    }
  };

  const next = () => {
    if (!canProceed()) return;
    // Save name to visitor store when completing step 1
    if (step === 1 && data.fullName.trim()) {
      setVisitorName(data.fullName.trim());
    }
    // Save to unified profile on each step
    saveOnboardingProfile(data);
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const back = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  // ── Resume Handlers (Step 0) ──
  const handleFileSelect = (file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    const validExts = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setResumeError('Please upload a PDF, DOCX, or TXT file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeError('File size must be under 10MB.');
      return;
    }
    setSelectedFile(file);
    setResumeError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const parseResume = async (mode: 'file' | 'text') => {
    setResumeParsing(true);
    setResumeError('');
    try {
      let res: Response;
      if (mode === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        res = await fetch('/api/resume/parse', { method: 'POST', body: formData });
      } else {
        res = await fetch('/api/resume/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: resumeText }),
        });
      }
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to parse resume');
      const parsed = result.data;
      // Auto-populate all fields
      setData((prev) => ({
        ...prev,
        fullName: parsed.fullName || prev.fullName,
        location: parsed.location || prev.location,
        targetRole: parsed.targetRole || prev.targetRole,
        currentStatus: parsed.currentStatus || prev.currentStatus,
        experienceLevel: parsed.experienceLevel || prev.experienceLevel,
        skills: parsed.skills?.length ? parsed.skills.slice(0, 15) : prev.skills,
        bio: parsed.bio || prev.bio,
      }));
      if (parsed.fullName) setVisitorName(parsed.fullName);
      setResumeParsed(true);
      // Auto-advance to next step
      setTimeout(() => { setDirection(1); setStep(1); }, 1500);
    } catch (err: any) {
      setResumeError(err.message || 'Failed to parse resume. Try again or skip.');
    } finally {
      setResumeParsing(false);
    }
  };

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (s && !data.skills.includes(s)) {
      update('skills', [...data.skills, s]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    update('skills', data.skills.filter((s) => s !== skill));
  };

  // ── Signup handlers (Step 5) ──
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError('');

    if (password.length < 8) {
      setSignupError('Password must be at least 8 characters');
      setSignupLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'signup' }),
      });
      const result = await res.json();
      if (!res.ok) {
        setSignupError(result.error || 'Failed to send verification code');
        return;
      }
      setSignupSubStep('verify');
      setOtpTimer(60);
      setOtpCode(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setSignupError('Something went wrong. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (newCode.every((d) => d !== '') && newCode.join('').length === 6) {
      verifyAndCreateAccount(newCode.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpCode(pasted.split(''));
      otpRefs.current[5]?.focus();
      verifyAndCreateAccount(pasted);
    }
  };

  const verifyAndCreateAccount = async (code: string) => {
    setSignupLoading(true);
    setSignupError('');
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, type: 'signup', name: data.fullName, password }),
      });
      const result = await res.json();
      if (!res.ok) {
        setSignupError(result.error || 'Verification failed');
        setOtpCode(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        return;
      }
      const csrf = await fetch('/api/auth/csrf').then(r => r.json());
      const signInRes = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Auth-Return-Redirect': '1',
        },
        body: new URLSearchParams({
          email,
          password,
          csrfToken: csrf.csrfToken,
          callbackUrl: '/dashboard',
          json: 'true',
        }),
      });
      if (!signInRes.ok) {
        setSignupError('Account created but sign-in failed. Please try logging in.');
      } else {
        await saveOnboardingToServer();
        window.location.href = '/dashboard';
      }
    } catch {
      setSignupError('Something went wrong. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setSignupError('');
    setSignupLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'signup' }),
      });
      if (res.ok) {
        setOtpTimer(60);
        setOtpCode(['', '', '', '', '', '']);
      } else {
        const result = await res.json();
        setSignupError(result.error || 'Failed to resend');
      }
    } catch {
      setSignupError('Failed to resend');
    } finally {
      setSignupLoading(false);
    }
  };

  const saveOnboardingToServer = async () => {
    try {
      const profile = getOnboardingProfile();
      if (!profile?.targetRole) return;
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: profile.targetRole,
          interests: profile.skills?.slice(0, 5) || [],
          profile: {
            fullName: profile.fullName || data.fullName,
            phone: profile.phone || '',
            location: profile.location || '',
            linkedin: profile.linkedin || '',
            experienceLevel: profile.experienceLevel || '',
            currentStatus: profile.currentStatus || '',
            experiences: [],
            educationLevel: profile.educationLevel || '',
            fieldOfStudy: profile.fieldOfStudy || '',
            institution: profile.institution || '',
            graduationYear: profile.graduationYear || '',
            skills: profile.skills || [],
            bio: profile.bio || '',
          },
        }),
      });
    } catch {}
  };

  const handleGoogleSignUp = () => {
    saveOnboardingProfile(data);
    signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleLinkedInSignUp = () => {
    saveOnboardingProfile(data);
    signIn('linkedin', { callbackUrl: '/dashboard' });
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      {/* Top bar */}
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        <Link href="/login" className="text-sm text-white/40 hover:text-white/60 transition-colors">
          Already have an account? Sign in
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-neon-blue to-neon-purple"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 sm:gap-6 pt-6 px-4">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step
                  ? 'bg-neon-blue text-white'
                  : i === step
                  ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
                  : 'bg-white/5 text-white/20'
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${i === step ? 'text-white/60' : 'text-white/20'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Cortex helper */}
          <motion.div
            key={`cortex-${step}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 mb-8"
          >
            <CortexAvatar size={36} expression={step === 5 ? 'happy' : 'normal'} />
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-white/50">
              {step === 6 && signupSubStep === 'verify'
                ? 'Check your inbox! Enter the code to verify your email.'
                : cortexMessages[step]}
            </div>
          </motion.div>

          {/* Step content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                {STEPS[step].title}
              </h2>
              <p className="text-sm text-white/30 mb-8">
                Step {step + 1} of {STEPS.length}
              </p>

              {/* Step 0: Resume Upload */}
              {step === 0 && (
                <div className="space-y-4">
                  {/* Success state */}
                  {resumeParsed && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-neon-green/10 to-emerald-500/5 border border-neon-green/20 text-center">
                      <CheckCircle2 className="w-10 h-10 text-neon-green mx-auto mb-2" />
                      <h3 className="text-sm font-bold text-white mb-1">Resume Parsed Successfully!</h3>
                      <p className="text-xs text-white/40">Auto-filling your details...</p>
                    </div>
                  )}

                  {/* Parsing state */}
                  {resumeParsing && (
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 border border-neon-blue/10 text-center">
                      <Loader2 className="w-8 h-8 text-neon-blue mx-auto mb-2 animate-spin" />
                      <h3 className="text-sm font-bold text-white mb-1">AI is reading your resume...</h3>
                      <p className="text-xs text-white/40">Extracting name, skills, experience, and more</p>
                    </div>
                  )}

                  {/* Error */}
                  {resumeError && (
                    <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">{resumeError}</div>
                  )}

                  {/* Upload / Paste UI */}
                  {!resumeParsing && !resumeParsed && (
                    <div className="space-y-4">
                      {/* File Upload */}
                      {resumeMode !== 'paste' && (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.doc,.txt"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileSelect(file);
                            }}
                          />
                          <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                              dragOver
                                ? 'border-neon-blue bg-neon-blue/5'
                                : selectedFile
                                  ? 'border-neon-green/30 bg-neon-green/5'
                                  : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                            }`}
                          >
                            {selectedFile ? (
                              <div className="flex items-center justify-center gap-3">
                                <FileText className="w-8 h-8 text-neon-green" />
                                <div className="text-left">
                                  <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
                                  <p className="text-[11px] text-white/40">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                  className="ml-2 p-1 rounded-lg hover:bg-white/10"
                                >
                                  <X className="w-4 h-4 text-white/40" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-neon-blue' : 'text-white/20'}`} />
                                <p className="text-sm font-medium text-white/60 mb-1">
                                  Drop your resume here or <span className="text-neon-blue">click to browse</span>
                                </p>
                                <p className="text-[11px] text-white/30">PDF, DOCX, or TXT (max 10MB)</p>
                              </>
                            )}
                          </div>

                          {selectedFile && (
                            <button
                              onClick={() => parseResume('file')}
                              className="w-full mt-3 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold text-sm hover:opacity-90 transition-all"
                            >
                              <Zap className="w-4 h-4" /> Parse Resume with AI
                            </button>
                          )}
                        </div>
                      )}

                      {/* Divider */}
                      {!resumeMode && (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-white/10" />
                          <span className="text-[11px] text-white/30">or</span>
                          <div className="flex-1 h-px bg-white/10" />
                        </div>
                      )}

                      {/* Paste Text */}
                      {resumeMode !== 'upload' && (
                        <div>
                          {!resumeMode && (
                            <button
                              onClick={() => setResumeMode('paste')}
                              className="w-full p-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white/70"
                            >
                              <ClipboardPaste className="w-4 h-4" /> Paste resume as text
                            </button>
                          )}
                          {resumeMode === 'paste' && (
                            <>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-white/50 flex items-center gap-1.5">
                                  <ClipboardPaste className="w-3.5 h-3.5" /> Paste your resume text
                                </label>
                                <button onClick={() => { setResumeMode(null); setResumeText(''); }} className="text-[11px] text-white/30 hover:text-white/50">Cancel</button>
                              </div>
                              <textarea
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-neon-blue/50 focus:outline-none transition-colors resize-none text-xs"
                                rows={8}
                                placeholder="Paste your entire resume text here..."
                                autoFocus
                              />
                              <button
                                onClick={() => parseResume('text')}
                                disabled={resumeText.trim().length < 30}
                                className="w-full mt-3 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-30"
                              >
                                <Zap className="w-4 h-4" /> Parse Resume with AI
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 1: Name + Location */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-2">
                      Your full name
                    </label>
                    <input
                      type="text"
                      value={data.fullName}
                      onChange={(e) => update('fullName', e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-neon-blue/50 focus:outline-none transition-colors"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-2">
                      <MapPin className="w-3.5 h-3.5 inline mr-1" />
                      Where are you based?
                    </label>
                    <input
                      type="text"
                      value={data.location}
                      onChange={(e) => update('location', e.target.value)}
                      placeholder="e.g. Bengaluru, Mumbai, Delhi..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-neon-blue/50 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Status + Experience */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-3">
                      Current status
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {currentStatuses.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => update('currentStatus', s.value)}
                          className={`px-3 py-3 rounded-xl text-sm font-medium text-left transition-all ${
                            data.currentStatus === s.value
                              ? 'bg-neon-blue/15 border-neon-blue/40 text-neon-blue border'
                              : 'bg-white/5 border border-white/5 text-white/40 hover:bg-white/8 hover:text-white/60'
                          }`}
                        >
                          <span className="text-lg block mb-1">{s.icon}</span>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-3">
                      Experience level
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {experienceLevels.map((e) => (
                        <button
                          key={e.value}
                          onClick={() => update('experienceLevel', e.value)}
                          className={`px-3 py-2.5 rounded-xl text-sm transition-all ${
                            data.experienceLevel === e.value
                              ? 'bg-neon-purple/15 border-neon-purple/40 text-neon-purple border'
                              : 'bg-white/5 border border-white/5 text-white/40 hover:bg-white/8 hover:text-white/60'
                          }`}
                        >
                          <div className="font-medium">{e.label}</div>
                          <div className="text-xs opacity-50">{e.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Target Role + Industry */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-2">
                      What role are you targeting?
                    </label>
                    <input
                      type="text"
                      value={data.targetRole}
                      onChange={(e) => update('targetRole', e.target.value)}
                      placeholder="Type or pick below..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-neon-blue/50 focus:outline-none transition-colors mb-3"
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-2">
                      {suggestedRoles.map((r) => (
                        <button
                          key={r}
                          onClick={() => update('targetRole', r)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                            data.targetRole === r
                              ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                              : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50 border border-white/5'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-3">
                      Preferred industry
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {industries.map((ind) => (
                        <button
                          key={ind}
                          onClick={() => update('industry', ind)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                            data.industry === ind
                              ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                              : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50 border border-white/5'
                          }`}
                        >
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Skills */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-2">
                      Add your skills
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); }
                        }}
                        placeholder="Type a skill and press Enter..."
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-neon-blue/50 focus:outline-none transition-colors"
                        autoFocus
                      />
                      <button
                        onClick={() => addSkill(skillInput)}
                        disabled={!skillInput.trim()}
                        className="px-4 py-3 rounded-xl bg-neon-blue/20 text-neon-blue font-medium text-sm hover:bg-neon-blue/30 transition-colors disabled:opacity-30"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Selected skills */}
                  {data.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {data.skills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon-blue/10 text-neon-blue text-xs font-medium border border-neon-blue/20"
                        >
                          {s}
                          <button onClick={() => removeSkill(s)} className="hover:text-white transition-colors">
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  <div>
                    <div className="text-xs text-white/25 mb-2">Popular skills — tap to add</div>
                    <div className="flex flex-wrap gap-1.5">
                      {popularSkills
                        .filter((s) => !data.skills.includes(s))
                        .map((s) => (
                          <button
                            key={s}
                            onClick={() => addSkill(s)}
                            className="px-2.5 py-1 rounded-full text-xs bg-white/5 text-white/25 hover:bg-white/10 hover:text-white/50 border border-white/5 transition-all"
                          >
                            + {s}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Bio */}
              {step === 5 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-2">
                      Tell us about yourself (optional)
                    </label>
                    <p className="text-xs text-white/20 mb-3">
                      This helps Agent Forge write a better resume and cover letters for you.
                      Write 2-3 sentences about your background, what drives you, and what you
                      are looking for.
                    </p>
                    <textarea
                      value={data.bio}
                      onChange={(e) => update('bio', e.target.value)}
                      placeholder="e.g. I am a B.Tech graduate passionate about building web applications. I have worked on two internship projects using React and Node.js. I am looking for my first full-time role at a product company..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-neon-blue/50 focus:outline-none transition-colors resize-none"
                      autoFocus
                    />
                    <div className="text-xs text-white/15 mt-1 text-right">
                      {data.bio.length} characters
                    </div>
                  </div>

                  {/* Summary preview */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                    <div className="text-xs font-medium text-white/30 mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Your profile summary
                    </div>
                    <div className="space-y-1.5 text-sm text-white/40">
                      {data.fullName && <div><span className="text-white/60 font-medium">{data.fullName}</span>{data.location && ` from ${data.location}`}</div>}
                      {data.currentStatus && <div>Status: {currentStatuses.find(s => s.value === data.currentStatus)?.label}</div>}
                      {data.experienceLevel && <div>Experience: {experienceLevels.find(e => e.value === data.experienceLevel)?.label}</div>}
                      {data.targetRole && <div>Target: {data.targetRole}{data.industry && ` in ${data.industry}`}</div>}
                      {data.skills.length > 0 && <div>Skills: {data.skills.slice(0, 5).join(', ')}{data.skills.length > 5 && ` +${data.skills.length - 5} more`}</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Account / Signup */}
              {step === 6 && (
                <div className="space-y-5">
                  <AnimatePresence mode="wait">
                    {signupSubStep === 'form' ? (
                      <motion.div
                        key="signup-form"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-5"
                      >
                        <p className="text-sm text-white/30">
                          7-day money-back guarantee on all plans.
                        </p>

                        {signupError && (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                            {signupError}
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={handleGoogleSignUp}
                            disabled={!googleEnabled}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/8 hover:text-white transition-all text-sm font-medium ${!googleEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <Chrome className="w-4 h-4" /> Google
                            {!googleEnabled && <span className="text-[10px] text-white/30 ml-1">(Soon)</span>}
                          </button>
                          <button
                            onClick={handleLinkedInSignUp}
                            disabled={!linkedinEnabled}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/8 hover:text-white transition-all text-sm font-medium ${!linkedinEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <Linkedin className="w-4 h-4" /> LinkedIn
                            {!linkedinEnabled && <span className="text-[10px] text-white/30 ml-1">(Soon)</span>}
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-white/10" />
                          <span className="text-xs text-white/30">or</span>
                          <div className="flex-1 h-px bg-white/10" />
                        </div>

                        <form onSubmit={handleSignupSubmit} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-white/50 mb-1.5">
                              Email
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                              <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 pl-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-neon-blue/50 focus:outline-none transition-colors"
                                required
                                autoFocus
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white/50 mb-1.5">
                              Password
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 8 characters"
                                className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-neon-blue/50 focus:outline-none transition-colors"
                                required
                                minLength={8}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={signupLoading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
                          >
                            {signupLoading ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>Create Account <ArrowRight className="w-4 h-4" /></>
                            )}
                          </button>
                        </form>

                        <p className="text-xs text-white/20 text-center">
                          By signing up, you agree to our{' '}
                          <Link href="/terms" className="underline hover:text-white/40">Terms</Link> and{' '}
                          <Link href="/privacy" className="underline hover:text-white/40">Privacy Policy</Link>.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="signup-verify"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                      >
                        <div className="text-center">
                          <ShieldCheck className="w-12 h-12 text-neon-blue mx-auto mb-3" />
                          <p className="text-sm text-white/40">
                            We sent a 6-digit code to<br />
                            <strong className="text-white">{email}</strong>
                          </p>
                        </div>

                        {signupError && (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                            {signupError}
                          </div>
                        )}

                        <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                          {otpCode.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => { otpRefs.current[i] = el; }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              className="w-12 h-14 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 outline-none transition-all"
                            />
                          ))}
                        </div>

                        {signupLoading && (
                          <div className="flex justify-center">
                            <div className="flex items-center gap-2 text-sm text-white/40">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-neon-blue rounded-full animate-spin" />
                              Creating your account...
                            </div>
                          </div>
                        )}

                        <div className="text-center space-y-3">
                          <button
                            onClick={handleResendOtp}
                            disabled={otpTimer > 0 || signupLoading}
                            className="text-sm text-neon-blue hover:underline disabled:text-white/20 disabled:no-underline"
                          >
                            {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend code'}
                          </button>
                          <br />
                          <button
                            onClick={() => { setSignupSubStep('form'); setSignupError(''); }}
                            className="text-sm text-white/40 hover:text-white/60"
                          >
                            Change email address
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            <button
              onClick={() => {
                if (step === 6 && signupSubStep === 'verify') {
                  setSignupSubStep('form');
                  setSignupError('');
                } else {
                  back();
                }
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                step === 0
                  ? 'opacity-0 pointer-events-none'
                  : 'text-white/40 hover:text-white/60 bg-white/5 hover:bg-white/8'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {step < 6 && (
              <button
                onClick={next}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
