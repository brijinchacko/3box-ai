'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Chrome, KeyRound, ShieldCheck, Linkedin } from 'lucide-react';
import Logo from '@/components/brand/Logo';

type AuthMode = 'password' | 'otp';
type OtpStep = 'email' | 'code';

const ERROR_MESSAGES: Record<string, string> = {
  OAuthCallback: 'Google sign-in failed. Please try again or use email login.',
  OAuthSignin: 'Could not start Google sign-in. Please try email login instead.',
  OAuthAccountNotLinked: 'This email is already registered. Please sign in with your password or OTP.',
  CredentialsSignin: 'Invalid email or password.',
  default: 'Something went wrong. Please try again.',
};

export default function LoginPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  const [mode, setMode] = useState<AuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [linkedinEnabled, setLinkedinEnabled] = useState(false);

  // OTP state
  const [otpStep, setOtpStep] = useState<OtpStep>('email');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle URL error params from NextAuth redirects
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(ERROR_MESSAGES[urlError] || ERROR_MESSAGES.default);
      // Clean up the URL without reloading
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        url.searchParams.delete('callbackUrl');
        window.history.replaceState({}, '', url.pathname);
      }
    }
  }, [searchParams]);

  // Check if Google auth is available
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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const csrf = await fetch('/api/auth/csrf').then(r => r.json());
      const res = await fetch('/api/auth/callback/credentials', {
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

      const data = await res.json();
      const hasError = data.url && new URL(data.url, window.location.origin).searchParams.get('error');

      if (!res.ok || hasError) {
        setError('Invalid email or password');
      } else {
        window.location.href = '/dashboard';
      }
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'login' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send code');
        return;
      }

      setOtpStep('code');
      setOtpTimer(60);
      setOtpCode(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError('Something went wrong');
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
      verifyOtp(newCode.join(''));
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
      verifyOtp(pasted);
    }
  };

  const verifyOtp = async (code: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, type: 'login' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid code');
        setOtpCode(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        return;
      }

      // Sign in via NextAuth using a special OTP credential
      const csrf = await fetch('/api/auth/csrf').then(r => r.json());
      const signInRes = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Auth-Return-Redirect': '1',
        },
        body: new URLSearchParams({
          email,
          password: `otp:${code}`,
          csrfToken: csrf.csrfToken,
          callbackUrl: '/dashboard',
          json: 'true',
        }),
      });

      if (!signInRes.ok) {
        setError('Verification succeeded but sign-in failed. Please try again.');
        setOtpCode(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        return;
      }

      window.location.href = '/dashboard';
    } catch {
      setError('Something went wrong');
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
        body: JSON.stringify({ email, type: 'login' }),
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

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleLinkedInSignIn = () => {
    signIn('linkedin', { callbackUrl: '/dashboard' });
  };

  // Show blank screen while checking auth or redirecting (prevents flash)
  if (status === 'loading' || status === 'authenticated') {
    return <div className="min-h-screen bg-surface" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface bg-grid relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-neon-blue/8 via-transparent to-transparent rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md mx-4"
      >
        <Link href="/" className="flex items-center justify-center mb-8">
          <Logo size="sm" />
        </Link>

        <div className="glass p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Welcome back</h1>
          <p className="text-sm text-white/40 text-center mb-6">Sign in to continue your career journey</p>

          {/* Auth Mode Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('password'); setError(''); setOtpStep('email'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'password'
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Password
            </button>
            <button
              onClick={() => { setMode('otp'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'otp'
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> Email Code
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {mode === 'password' ? (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handlePasswordLogin}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-white/60">Password</label>
                    <Link href="/forgot-password" className="text-xs text-neon-blue hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder="Enter your password"
                      required
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
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Sign In <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {otpStep === 'email' ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input-field pl-10"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>
                    <p className="text-xs text-white/30">We&apos;ll send a 6-digit code to your email. No password needed.</p>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Send Login Code <Mail className="w-4 h-4" /></>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <ShieldCheck className="w-8 h-8 text-neon-blue mx-auto mb-2" />
                      <p className="text-sm text-white/60">
                        Enter the 6-digit code sent to<br />
                        <strong className="text-white">{email}</strong>
                      </p>
                    </div>

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
                        <div className="w-5 h-5 border-2 border-white/30 border-t-neon-blue rounded-full animate-spin" />
                      </div>
                    )}

                    <div className="text-center">
                      <button
                        onClick={handleResendOtp}
                        disabled={otpTimer > 0 || loading}
                        className="text-sm text-neon-blue hover:underline disabled:text-white/20 disabled:no-underline"
                      >
                        {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend code'}
                      </button>
                    </div>

                    <button
                      onClick={() => { setOtpStep('email'); setError(''); }}
                      className="w-full text-sm text-white/40 hover:text-white/60 text-center"
                    >
                      Use a different email
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={!googleEnabled}
              className={`btn-secondary flex-1 flex items-center justify-center gap-2 ${!googleEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={!googleEnabled ? 'Google sign-in is not configured yet' : undefined}
            >
              <Chrome className="w-4 h-4" /> Google
              {!googleEnabled && <span className="text-[10px] text-white/30 ml-1">(Soon)</span>}
            </button>
            <button
              onClick={handleLinkedInSignIn}
              disabled={!linkedinEnabled}
              className={`btn-secondary flex-1 flex items-center justify-center gap-2 ${!linkedinEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={!linkedinEnabled ? 'LinkedIn sign-in is not configured yet' : undefined}
            >
              <Linkedin className="w-4 h-4" /> LinkedIn
              {!linkedinEnabled && <span className="text-[10px] text-white/30 ml-1">(Soon)</span>}
            </button>
          </div>

          <p className="text-sm text-white/40 text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-neon-blue hover:underline">Sign up free</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
