'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Chrome, CheckCircle2, ShieldCheck, Linkedin } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { getOnboardingProfile } from '@/lib/onboarding/onboardingData';

type SignupStep = 'form' | 'verify';

const benefits = [
  'Free skill assessment',
  'AI-powered career plan',
  'Resume builder access',
  'Personalized AI coach',
];

export default function SignupPageClient() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  const [step, setStep] = useState<SignupStep>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasOnboardingData, setHasOnboardingData] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(true);
  const [linkedinEnabled, setLinkedinEnabled] = useState(true);

  // OTP state
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Pre-fill from unified onboarding profile
  useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const profile = getOnboardingProfile();
        if (profile) {
          if (profile.fullName) setName(profile.fullName);
          if (profile.targetRole) {
            setTargetRole(profile.targetRole);
            setHasOnboardingData(true);
          }
        }
      } catch {}
    }
  });

  // Check OAuth availability
  useEffect(() => {
    fetch('/api/auth/providers').then(r => r.json()).then(d => {
      setGoogleEnabled(!!d.google);
      setLinkedinEnabled(!!d.linkedin);
    }).catch(() => { setGoogleEnabled(false); setLinkedinEnabled(false); });
  }, []);

  // Timer for resend
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      // Send OTP for email verification
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'signup' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send verification code');
        return;
      }

      setStep('verify');
      setOtpTimer(60);
      setOtpCode(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
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
      const digits = pasted.split('');
      setOtpCode(digits);
      otpRefs.current[5]?.focus();
      verifyAndCreateAccount(pasted);
    }
  };

  const verifyAndCreateAccount = async (code: string) => {
    setLoading(true);
    setError('');

    try {
      const body: Record<string, string> = { email, code, type: 'signup', name, password };
      if (ref) body.ref = ref;

      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setOtpCode(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        return;
      }

      // Sign in via direct fetch (bypasses next-auth/react signIn quirks)
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
        setError('Account created but sign-in failed. Please try logging in.');
      } else {
        await saveOnboardingFromLocalStorage();
        window.location.href = '/dashboard';
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setError('');
    setLoading(true);
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
        const data = await res.json();
        setError(data.error || 'Failed to resend');
      }
    } catch {
      setError('Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  const saveOnboardingFromLocalStorage = async () => {
    try {
      // Check /get-started wizard data first (sessionStorage)
      const wizardStr = sessionStorage.getItem('3box_onboarding_data');
      const profileStr = wizardStr || localStorage.getItem('3box_onboarding_profile');
      if (!profileStr) return;
      const profile = JSON.parse(profileStr);
      if (!profile.targetRole) return;

      // Clean up sessionStorage after reading
      if (wizardStr) sessionStorage.removeItem('3box_onboarding_data');

      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: profile.targetRole,
          interests: profile.skills?.slice(0, 5) || [],
          profile: {
            fullName: profile.fullName || name,
            phone: profile.phone || '',
            location: profile.location || '',
            linkedin: profile.linkedin || '',
            experienceLevel: profile.experienceLevel || '',
            currentStatus: profile.currentStatus || '',
            experiences: profile.experiences || [],
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
    signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleLinkedInSignUp = () => {
    signIn('linkedin', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left: Benefits Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-surface-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-radial from-neon-purple/10 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative p-12 max-w-lg">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-4xl font-bold mb-4">
              {hasOnboardingData ? (
                <>Your career profile is<br /><span className="gradient-text">ready to go</span></>
              ) : (
                <>Start your career<br /><span className="gradient-text">transformation</span></>
              )}
            </h2>
            <p className="text-white/40 mb-8">
              {hasOnboardingData
                ? `Create your free account to unlock your personalized ${targetRole} career plan, AI resume, and job matching.`
                : 'Join 3BOX AI and get access to AI-powered career tools that help you land your dream job faster.'}
            </p>
            <div className="space-y-4">
              {(hasOnboardingData
                ? [`AI career plan for ${targetRole}`, 'Resume draft ready to download', 'Personalized skill gap analysis', 'Job matching activated']
                : benefits
              ).map((b, i) => (
                <motion.div
                  key={b}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-neon-green flex-shrink-0" />
                  <span className="text-white/60">{b}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right: Signup Form */}
      <div className="flex-1 flex items-center justify-center p-4 bg-grid relative">
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-radial from-neon-blue/8 via-transparent to-transparent rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md"
        >
          <Link href="/" className="flex items-center justify-center mb-8 lg:hidden">
            <Logo size="sm" />
          </Link>

          <div className="glass p-8">
            <AnimatePresence mode="wait">
              {step === 'form' ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h1 className="text-2xl font-bold text-center mb-2">Create your account</h1>
                  <p className="text-sm text-white/40 text-center mb-8">7-day money-back guarantee on all plans.</p>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={handleGoogleSignUp}
                      disabled={!googleEnabled}
                      className={`btn-secondary flex-1 flex items-center justify-center gap-2 ${!googleEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      title={!googleEnabled ? 'Google sign-up is not configured yet' : undefined}
                    >
                      <Chrome className="w-4 h-4" /> Google
                      {!googleEnabled && <span className="text-[10px] text-white/30 ml-1">(Soon)</span>}
                    </button>
                    <button
                      onClick={handleLinkedInSignUp}
                      disabled={!linkedinEnabled}
                      className={`btn-secondary flex-1 flex items-center justify-center gap-2 ${!linkedinEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      title={!linkedinEnabled ? 'LinkedIn sign-up is not configured yet' : undefined}
                    >
                      <Linkedin className="w-4 h-4" /> LinkedIn
                      {!linkedinEnabled && <span className="text-[10px] text-white/30 ml-1">(Soon)</span>}
                    </button>
                  </div>

                  <div className="my-6 flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-white/30">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-1.5">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field pl-10" placeholder="John Doe" required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-white/60 mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-white/60 mb-1.5">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="input-field pl-10 pr-10"
                          placeholder="Min 8 characters"
                          required
                          minLength={8}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Continue <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </form>

                  <p className="text-xs text-white/30 text-center mt-4">
                    By signing up, you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
                  </p>

                  <p className="text-sm text-white/40 text-center mt-6">
                    Already have an account?{' '}
                    <Link href="/login" className="text-neon-blue hover:underline">Sign in</Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <ShieldCheck className="w-12 h-12 text-neon-blue mx-auto mb-3" />
                    <h1 className="text-2xl font-bold mb-2">Verify your email</h1>
                    <p className="text-sm text-white/40">
                      We sent a 6-digit code to<br />
                      <strong className="text-white">{email}</strong>
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                      {error}
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

                  {loading && (
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
                      disabled={otpTimer > 0 || loading}
                      className="text-sm text-neon-blue hover:underline disabled:text-white/20 disabled:no-underline"
                    >
                      {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend code'}
                    </button>
                    <br />
                    <button
                      onClick={() => { setStep('form'); setError(''); }}
                      className="text-sm text-white/40 hover:text-white/60"
                    >
                      Change email address
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
