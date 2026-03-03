'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface bg-grid relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-neon-purple/8 via-transparent to-transparent rounded-full blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md mx-4">
        <Link href="/" className="flex items-center justify-center mb-8">
          <Image src="/assets/brand/logo-white.png" alt="NXTED AI" width={160} height={46} className="h-10 w-auto" />
        </Link>

        <div className="glass p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-neon-green mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-sm text-white/40 mb-6">We sent a password reset link to <strong className="text-white/60">{email}</strong></p>
              <Link href="/login" className="btn-primary inline-flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back to login</Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center mb-2">Reset password</h1>
              <p className="text-sm text-white/40 text-center mb-8">Enter your email and we&apos;ll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Send Reset Link'}
                </button>
              </form>
              <p className="text-sm text-white/40 text-center mt-6">
                <Link href="/login" className="text-neon-blue hover:underline flex items-center justify-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to login</Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
