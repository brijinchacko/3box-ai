'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Search, Sparkles, Rocket, Check, ChevronDown,
  FileText, MapPin, Mail, ArrowRight, Share2, ExternalLink, Loader2,
} from 'lucide-react';
import LiveApplicationCounter from './LiveApplicationCounter';

type BurstStep = 'input' | 'scanning' | 'results' | 'verify' | 'done';

interface MatchedJob {
  title: string;
  company: string;
  location: string;
  matchScore: number;
  salaryRange: string | null;
  source: string;
  url: string | null;
  applied?: boolean;
  method?: string;
  coverLetterPreview?: string;
}

const suggestedRoles = [
  'Software Engineer', 'Full Stack Developer', 'Data Scientist', 'UX Designer',
  'Product Manager', 'Business Analyst', 'Marketing Manager', 'Project Manager',
  'Graphic Designer', 'Content Writer', 'Financial Analyst', 'HR Manager',
];

export default function FreeAutoApplyHero() {
  const [step, setStep] = useState<BurstStep>('input');
  const [burstId, setBurstId] = useState('');
  const [email, setEmail] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [showResumeArea, setShowResumeArea] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [jobs, setJobs] = useState<MatchedJob[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<MatchedJob[]>([]);
  const [progress, setProgress] = useState(0);
  const [jobsFound, setJobsFound] = useState(0);
  const [jobsApplied, setJobsApplied] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP state
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpSending, setOtpSending] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // OTP countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [otpTimer]);

  const filteredRoles = targetRole.trim()
    ? suggestedRoles.filter((r) => r.toLowerCase().includes(targetRole.toLowerCase()))
    : suggestedRoles;

  // ── Step 1: Submit resume + role ──
  const handleStart = async () => {
    if (!resumeText.trim() || !targetRole.trim()) {
      setError('Please paste your resume and select a target role.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/free-burst/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '', // email collected later at verify step
          targetRole: targetRole.trim(),
          targetLocation: targetLocation.trim() || undefined,
          resumeText: resumeText.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError('You\'ve already used your free burst. Sign up for unlimited applications!');
        } else if (res.status === 429) {
          setError('Too many attempts. Please try again in 24 hours.');
        } else {
          setError(data.error || 'Something went wrong. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }

      setBurstId(data.burstId);
      setStep('scanning');
      startPolling(data.burstId);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Polling for status updates ──
  const startPolling = useCallback((id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/free-burst/status?burstId=${id}`);
        const data = await res.json();

        setProgress(data.progress || 0);
        setJobsFound(data.jobsFound || 0);
        setJobsApplied(data.jobsApplied || 0);

        if (data.status === 'found' && data.jobs?.length > 0) {
          setJobs(data.jobs);
          setStep('results');
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === 'applying') {
          setAppliedJobs(data.appliedJobs || []);
        } else if (data.status === 'completed') {
          setAppliedJobs(data.appliedJobs || []);
          setStep('done');
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {}
    }, 2000);
  }, []);

  // ── Send OTP ──
  const sendOtp = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setOtpSending(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to send verification code.');
        setOtpSending(false);
        return;
      }
      setOtpSent(true);
      setOtpTimer(60);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  // ── Verify OTP & Apply ──
  const verifyAndApply = async (code?: string) => {
    const finalCode = code || otpCode.join('');
    if (finalCode.length < 6) return;

    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/free-burst/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ burstId, email: email.trim().toLowerCase(), otpCode: finalCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Start applying — go back to polling
      setStep('scanning');
      setProgress(65);
      startPolling(burstId);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── OTP input handlers ──
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...otpCode];
    newCode[index] = digit;
    setOtpCode(newCode);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newCode.every((d) => d) && newCode.join('').length === 6) {
      verifyAndApply(newCode.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      setOtpCode(pasted.split(''));
      verifyAndApply(pasted);
    }
  };

  // ── Share URL ──
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?ref=share` : 'https://3box.ai?ref=share';
  const shareText = `AI just applied to 20 jobs for me in 60 seconds. Try it free:`;

  return (
    <section className="relative py-16 overflow-hidden" id="free-burst" aria-label="Free Auto-Apply">
      <div className="absolute inset-0 bg-grid opacity-10" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-radial from-neon-green/6 via-neon-blue/4 to-transparent rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative max-w-2xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {/* ═══════ STEP 1: Input ═══════ */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-semibold mb-4">
                  <Rocket className="w-3.5 h-3.5" /> Try it now, completely free
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  Get <span className="gradient-text">5 Free Applications/Week</span>
                </h2>
                <p className="text-sm text-white/40">Upload your resume. Pick a role. AI does the rest.</p>
              </div>

              <div className="glass p-6 space-y-4">
                {/* Resume paste area */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowResumeArea(!showResumeArea)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      resumeText.trim()
                        ? 'bg-neon-blue/[0.06] border-neon-blue/20 text-neon-blue'
                        : 'bg-white/[0.02] border-white/10 text-white/50 hover:text-white/70 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {resumeText.trim() ? (
                        <span>Resume loaded ({resumeText.trim().split(/\s+/).length} words)</span>
                      ) : (
                        <span>Paste your resume text</span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showResumeArea ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showResumeArea && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <textarea
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          placeholder="Paste your full resume text here..."
                          rows={6}
                          className="w-full mt-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 resize-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Target role */}
                <div className="relative">
                  <label className="block text-xs text-white/40 mb-1.5 ml-1">Target Role</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => { setTargetRole(e.target.value); setRoleDropdownOpen(true); }}
                    onFocus={() => setRoleDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setRoleDropdownOpen(false), 150)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
                  />
                  {roleDropdownOpen && filteredRoles.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 max-h-48 overflow-y-auto rounded-xl bg-surface-100 border border-white/10 shadow-2xl">
                      {filteredRoles.slice(0, 8).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onMouseDown={() => { setTargetRole(role); setRoleDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location (optional) */}
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 ml-1">Location <span className="text-white/20">(optional)</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="text"
                      value={targetLocation}
                      onChange={(e) => setTargetLocation(e.target.value)}
                      placeholder="e.g. Bangalore, Remote"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-400 px-1">{error}</p>
                )}

                {/* CTA */}
                <button
                  onClick={handleStart}
                  disabled={isSubmitting}
                  className="w-full btn-primary py-3.5 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Scanning jobs...</>
                  ) : (
                    <><Search className="w-4 h-4" /> Find My 20 Free Jobs</>
                  )}
                </button>
              </div>

              <LiveApplicationCounter />
            </motion.div>
          )}

          {/* ═══════ STEP 2: Scanning ═══════ */}
          {step === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="glass p-8 space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center">
                  <Search className="w-8 h-8 text-neon-blue animate-pulse" />
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2">
                    {progress < 60 ? 'Scanning Job Boards...' : 'Applying to Jobs...'}
                  </h3>
                  <p className="text-sm text-white/40">
                    {progress < 60
                      ? 'Searching LinkedIn, Indeed, Naukri, Glassdoor, Google Jobs...'
                      : `Applied to ${jobsApplied} of ${jobsFound} jobs...`
                    }
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-neon-blue to-neon-green rounded-full"
                    initial={{ width: '5%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Platform logos */}
                <div className="flex items-center justify-center gap-4 text-xs text-white/30">
                  {['LinkedIn', 'Indeed', 'Naukri', 'Glassdoor', 'Google Jobs'].map((p, i) => (
                    <motion.span
                      key={p}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: progress > (i + 1) * 10 ? 1 : 0.3 }}
                      className={progress > (i + 1) * 10 ? 'text-neon-blue' : ''}
                    >
                      {p}
                    </motion.span>
                  ))}
                </div>

                {jobsFound > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-lg font-bold text-neon-green"
                  >
                    Found {jobsFound} matching jobs!
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══════ STEP 3: Results ═══════ */}
          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold mb-1">
                  <span className="text-neon-green">{jobs.length}</span> Jobs Matched for {targetRole}
                </h3>
                <p className="text-sm text-white/40">Enter your email to apply to all of them</p>
              </div>

              {/* Job cards grid */}
              <div className="grid gap-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                {jobs.slice(0, 9).map((job, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{job.title}</p>
                      <p className="text-xs text-white/40 truncate">{job.company} &middot; {job.location}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-white/30">{job.source}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        job.matchScore >= 80 ? 'bg-neon-green/10 text-neon-green' :
                        job.matchScore >= 60 ? 'bg-neon-blue/10 text-neon-blue' :
                        'bg-white/5 text-white/40'
                      }`}>
                        {job.matchScore}%
                      </span>
                    </div>
                  </motion.div>
                ))}
                {jobs.length > 9 && (
                  <div className="text-center py-2 text-xs text-white/30">
                    and {jobs.length - 9} more jobs...
                  </div>
                )}
              </div>

              {/* Email gate */}
              <div className="glass p-5 space-y-3">
                <p className="text-sm font-medium text-center">Verify your email to apply to all {jobs.length} jobs</p>

                {!otpSent ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        placeholder="you@email.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
                        onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                      />
                    </div>
                    <button
                      onClick={sendOtp}
                      disabled={otpSending}
                      className="btn-primary px-5 py-3 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {otpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-white/40 text-center">
                      Enter the 6-digit code sent to <span className="text-white/60">{email}</span>
                    </p>
                    <div className="flex justify-center gap-2">
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
                          onPaste={i === 0 ? handleOtpPaste : undefined}
                          className="w-11 h-13 text-center text-lg font-bold bg-white/[0.04] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-blue/40 transition-all"
                        />
                      ))}
                    </div>
                    <div className="text-center">
                      {otpTimer > 0 ? (
                        <p className="text-xs text-white/30">Resend in {otpTimer}s</p>
                      ) : (
                        <button
                          onClick={sendOtp}
                          className="text-xs text-neon-blue hover:text-neon-blue/80 transition-colors"
                        >
                          Resend code
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {error && <p className="text-xs text-red-400 text-center">{error}</p>}
              </div>
            </motion.div>
          )}

          {/* ═══════ STEP 4: Done ═══════ */}
          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="glass p-8 space-y-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="w-20 h-20 mx-auto rounded-full bg-neon-green/10 flex items-center justify-center"
                >
                  <Check className="w-10 h-10 text-neon-green" />
                </motion.div>

                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    {appliedJobs.length || jobsFound} Applications Sent!
                  </h3>
                  <p className="text-sm text-white/40">
                    AI applied to {appliedJobs.length || jobsFound} {targetRole} positions with tailored cover letters.
                  </p>
                </div>

                {/* Applied jobs summary */}
                {appliedJobs.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 text-left">
                    {appliedJobs.slice(0, 5).map((job, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02]">
                        <Check className="w-3.5 h-3.5 text-neon-green flex-shrink-0" />
                        <span className="text-xs text-white/60 truncate">{job.title} at {job.company}</span>
                        <span className="text-[10px] text-white/30 ml-auto flex-shrink-0">{job.method}</span>
                      </div>
                    ))}
                    {appliedJobs.length > 5 && (
                      <p className="text-xs text-white/30 text-center pt-1">+{appliedJobs.length - 5} more</p>
                    )}
                  </div>
                )}

                {/* Share buttons */}
                <div className="space-y-3">
                  <p className="text-xs text-white/30 font-medium uppercase tracking-wider">Share with friends</p>
                  <div className="flex justify-center gap-3">
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-sm font-medium hover:bg-[#25D366]/20 transition-colors"
                    >
                      <Share2 className="w-4 h-4" /> WhatsApp
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A66C2]/10 border border-[#0A66C2]/20 text-[#0A66C2] text-sm font-medium hover:bg-[#0A66C2]/20 transition-colors"
                    >
                      <Share2 className="w-4 h-4" /> LinkedIn
                    </a>
                  </div>
                </div>

                {/* Conversion CTAs */}
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <a
                    href="/signup"
                    className="btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    Track Your Applications <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="/pricing"
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    Unlimited Applications <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
