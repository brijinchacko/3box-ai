'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const footerLinks = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Assessment', href: '/signup' },
    { label: 'Resume Builder', href: '/signup' },
    { label: 'Job Matching', href: '/signup' },
  ],
  'Free Tools': [
    { label: 'ATS Resume Checker', href: '/tools/ats-checker' },
    { label: 'Salary Estimator', href: '/tools/salary-estimator' },
    { label: 'All Tools', href: '/tools' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/about#careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Referral Program', href: '/dashboard/settings?tab=referral' },
    { label: 'Press', href: '/about#press' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/security#privacy' },
    { label: 'Terms of Service', href: '/security#terms' },
    { label: 'Security', href: '/security' },
    { label: 'GDPR', href: '/security#gdpr' },
  ],
  Support: [
    { label: 'Help Center', href: '/about#support' },
    { label: 'Contact', href: '/about#contact' },
    { label: 'Status', href: '/about#status' },
    { label: 'API Docs', href: '/about#api' },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <footer className="border-t border-white/5 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/assets/brand/logo-white.png" alt="NXTED AI" width={120} height={34} className="h-7 w-auto" />
            </Link>
            <p className="text-sm text-white/40 mb-4">
              Your AI-powered career operating system. An OFORO AI product.
            </p>
            <p className="text-xs text-white/20">
              &copy; {new Date().getFullYear()} OFORO AI. All rights reserved.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-white/60 mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/30 hover:text-white/70 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <div className="max-w-md">
            <h3 className="text-sm font-semibold text-white/60 mb-2">
              Stay in the loop
            </h3>
            <p className="text-sm text-white/30 mb-4">
              Career tips, product updates, and industry insights. No spam.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary text-sm px-5 py-2 whitespace-nowrap disabled:opacity-50"
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {status === 'success' && (
              <p className="text-sm text-green-400 mt-2">Thanks for subscribing!</p>
            )}
            {status === 'error' && (
              <p className="text-sm text-red-400 mt-2">Something went wrong. Try again.</p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
