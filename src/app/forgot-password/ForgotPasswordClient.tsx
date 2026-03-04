'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/brand/Logo';

type Step = 'email' | 'code' | 'newPassword' | 'done';

export default function ForgotPasswordClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP state
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // New password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStep('code');
        setOtpTimer(60);
        setOtpCode(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
      }
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

    // When all 6 digits entered, move to password step
    if (newCode.every((d) => d !== '') && newCode.join('').length === 6) {
      setStep('newPassword');
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
      setStep('newPassword');
    }
  };

  const handleResendCode = async () => {
    if (otpTimer > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setOtpTimer(60);
        setOtpCode(['', '', '', '', '', '']);
        setError('');
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: otpCode.join(''),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        if (data.error?.includes('expired') || data.error?.includes('Invalid')) {
          setStep('code');
          setOtpCode(['', '', '', '', '', '']);
        }
        return;
      }

      setStep('done');
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface bg-grid relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-neon-purple/8 via-transparent to-transparent rounded-full blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md mx-4">
        <Link href="/" className="flex items-center justify-center mb-8">
          <Logo size="sm" />
        </Link>

        <div className="glass p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Enter Email */}
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="text-2xl font-bold text-center mb-2">Reset password</h1>
                <p className="text-sm text-white/40 text-center mb-8">Enter your email and we&apos;ll send you a verification code.</p>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
                )}

                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" required />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Verification Code'}
                  </button>
                </form>

                <p className="text-sm text-white/40 text-center mt-6">
                  <Link href="/login" className="text-neon-blue hover:underline flex items-center justify-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> Back to login
                  </Link>
                </p>
              </motion.div>
            )}

            {/* Step 2: Enter OTP Code */}
            {step === 'code' && (
              <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="text-center">
                  <ShieldCheck className="w-12 h-12 text-neon-blue mx-auto mb-3" />
                  <h1 className="text-2xl font-bold mb-2">Enter verification code</h1>
                  <p className="text-sm text-white/40">
                    We sent a 6-digit code to<br />
                    <strong className="text-white">{email}</strong>
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
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

                <div className="text-center space-y-3">
                  <button
                    onClick={handleResendCode}
                    disabled={otpTimer > 0 || loading}
                    className="text-sm text-neon-blue hover:underline disabled:text-white/20 disabled:no-underline"
                  >
                    {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend code'}
                  </button>
                  <br />
                  <button onClick={() => { setStep('email'); setError(''); }} className="text-sm text-white/40 hover:text-white/60">
                    Use a different email
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: New Password */}
            {step === 'newPassword' && (
              <motion.div key="newPassword" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="text-2xl font-bold text-center mb-2">Set new password</h1>
                <p className="text-sm text-white/40 text-center mb-8">Choose a strong password for your account.</p>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">New Password</label>
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

                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field pl-10"
                        placeholder="Confirm your password"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Reset Password'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 4: Done */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-neon-green mx-auto" />
                <h1 className="text-2xl font-bold">Password reset!</h1>
                <p className="text-sm text-white/40">Your password has been successfully changed. You can now sign in with your new password.</p>
                <Link href="/login" className="btn-primary inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Sign in
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
