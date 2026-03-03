'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Chrome, CheckCircle2 } from 'lucide-react';

const benefits = [
  'Free skill assessment',
  'AI-powered career plan',
  'Resume builder access',
  'Personalized AI coach',
];

export default function SignupPageClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      // In production: POST /api/auth/register then signIn
      await new Promise((r) => setTimeout(r, 1000));
      window.location.href = '/dashboard';
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
              Start your career<br /><span className="gradient-text">transformation</span>
            </h2>
            <p className="text-white/40 mb-8">
              Join NXTED AI and get access to AI-powered career tools that help you land your dream job faster.
            </p>
            <div className="space-y-4">
              {benefits.map((b, i) => (
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
            <Image src="/assets/brand/logo-white.png" alt="NXTED AI" width={160} height={46} className="h-10 w-auto" />
          </Link>

          <div className="glass p-8">
            <h1 className="text-2xl font-bold text-center mb-2">Create your account</h1>
            <p className="text-sm text-white/40 text-center mb-8">Free forever. No credit card required.</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={() => { window.location.href = '/dashboard'; }}
              className="btn-secondary w-full flex items-center justify-center gap-2 mb-6"
            >
              <Chrome className="w-4 h-4" /> Sign up with Google
            </button>

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
                  <>Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="text-xs text-white/30 text-center mt-4">
              By signing up, you agree to our <Link href="/security#terms" className="underline">Terms</Link> and <Link href="/security#privacy" className="underline">Privacy Policy</Link>.
            </p>

            <p className="text-sm text-white/40 text-center mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-neon-blue hover:underline">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
