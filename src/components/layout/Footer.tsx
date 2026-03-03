'use client';

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
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/about#careers' },
    { label: 'Blog', href: '/about#blog' },
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
  return (
    <footer className="border-t border-white/5 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
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
      </div>
    </footer>
  );
}
