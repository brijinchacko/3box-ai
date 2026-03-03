'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Chrome } from 'lucide-react';

export default function LoginPageClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In production: signIn('credentials', { email, password, redirect: false })
      // Demo: simulate login
      await new Promise((r) => setTimeout(r, 1000));
      window.location.href = '/dashboard';
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // In production: signIn('google', { callbackUrl: '/dashboard' })
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface bg-grid relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-neon-blue/8 via-transparent to-transparent rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md mx-4"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-8">
          <Image src="/assets/brand/logo-white.png" alt="NXTED AI" width={160} height={46} className="h-10 w-auto" />
        </Link>

        <div className="glass p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Welcome back</h1>
          <p className="text-sm text-white/40 text-center mb-8">Sign in to continue your career journey</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Chrome className="w-4 h-4" /> Google
          </button>

          <p className="text-sm text-white/40 text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-neon-blue hover:underline">Sign up free</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
