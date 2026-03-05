'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'nxted_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        // Small delay so it doesn't flash on initial load
        const timer = setTimeout(() => setVisible(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ status: 'accepted', date: new Date().toISOString() }));
    } catch {}
    setVisible(false);
  };

  const handleReject = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ status: 'rejected', date: new Date().toISOString() }));
    } catch {}
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[60] p-4"
        >
          <div className="max-w-4xl mx-auto backdrop-blur-xl bg-surface/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-2xl shadow-black/50">
            <Shield className="w-6 h-6 text-neon-blue flex-shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-sm text-white/60 flex-1">
              We use cookies to enhance your experience and analyze platform usage. By continuing, you agree to our{' '}
              <Link href="/privacy" className="text-neon-blue hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <button
                onClick={handleReject}
                className="btn-ghost text-sm flex-1 sm:flex-none px-4 py-2"
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                className="btn-primary text-sm flex-1 sm:flex-none px-4 py-2"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
