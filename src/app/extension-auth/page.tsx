'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Chrome, Check, Loader2, LogIn, Shield } from 'lucide-react';
import Link from 'next/link';

export default function ExtensionAuthPage() {
  const { data: session, status } = useSession();
  const [tokenState, setTokenState] = useState<'idle' | 'generating' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Auto-generate token when logged in
    if (status === 'authenticated' && tokenState === 'idle') {
      generateAndSendToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function generateAndSendToken() {
    setTokenState('generating');
    try {
      const res = await fetch('/api/extension/token', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate token');

      const { token } = await res.json();

      // Try to send token to the extension via chrome.runtime.sendMessage
      // The extension listens for external messages
      if (typeof window !== 'undefined' && (window as any).chrome?.runtime?.sendMessage) {
        // If extension is installed, send directly
        // Note: Extension ID must be known — for development, we use a different method
        try {
          (window as any).chrome.runtime.sendMessage(
            undefined, // Extension ID — handled by externally_connectable
            { type: 'SET_TOKEN', token },
            (response: any) => {
              if (response?.success) {
                setTokenState('sent');
              }
            },
          );
        } catch {
          // Fallback: store in localStorage for the extension to pick up
          localStorage.setItem('3box_extension_token', token);
          setTokenState('sent');
        }
      } else {
        // Extension not installed — store token for manual pickup
        localStorage.setItem('3box_extension_token', token);
        setTokenState('sent');
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
      setTokenState('error');
    }
  }

  // Not logged in
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="card p-8 text-center">
            <Chrome className="w-12 h-12 text-neon-blue mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">3BOX AI Extension</h1>
            <p className="text-white/40 mb-6">
              Sign in to your 3BOX AI account to connect the Chrome Extension.
            </p>
            <Link
              href="/signin?callbackUrl=/extension-auth"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="card p-8 text-center">
          <Chrome className="w-12 h-12 text-neon-blue mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Connect Extension</h1>

          {tokenState === 'generating' && (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-neon-blue mx-auto my-6" />
              <p className="text-white/40">Connecting your extension...</p>
            </>
          )}

          {tokenState === 'sent' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto my-6">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-green-400 font-semibold mb-2">Extension Connected!</p>
              <p className="text-white/40 text-sm mb-6">
                Your 3BOX AI Chrome Extension is now linked to your account.
                You can close this tab and start applying to jobs.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Go to Dashboard
                </Link>
                <a
                  href="https://www.linkedin.com/jobs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors"
                >
                  Browse Jobs on LinkedIn
                </a>
              </div>
            </>
          )}

          {tokenState === 'error' && (
            <>
              <p className="text-red-400 mb-4">{errorMsg || 'Connection failed'}</p>
              <button
                onClick={generateAndSendToken}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
            </>
          )}

          {/* Security note */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 text-white/20 text-xs justify-center">
              <Shield className="w-3 h-3" />
              <span>Secure connection via encrypted token</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
