'use client';

import Link from 'next/link';
import { Linkedin, Youtube, Facebook, Instagram, Twitter, Github } from 'lucide-react';
import Logo from '@/components/brand/Logo';

const socialLinks = [
  { icon: Linkedin, href: 'https://www.linkedin.com/company/3box-ai/', label: 'LinkedIn' },
  { icon: Youtube, href: 'https://youtube.com/channel/UCt1LnfzqtMRcfSPwAV3J1ZQ/', label: 'YouTube' },
  { icon: Facebook, href: 'https://www.facebook.com/61586302726912', label: 'Facebook' },
  { icon: Instagram, href: 'https://www.instagram.com/3box.ai', label: 'Instagram' },
  { icon: Twitter, href: 'https://x.com/oforoai', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/oforo-ai', label: 'GitHub' },
];

const footerLinks = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Assessment', href: '/signup' },
    { label: 'Resume Builder', href: '/tools/resume-builder' },
    { label: 'Job Matching', href: '/signup' },
  ],
  'Free Tools': [
    { label: 'ATS Resume Checker', href: '/tools/ats-checker' },
    { label: 'Resume Builder', href: '/tools/resume-builder' },
    { label: 'Salary Estimator', href: '/tools/salary-estimator' },
    { label: 'All Tools', href: '/tools' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Case Studies', href: '/case-studies' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Compare', href: '/compare' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Security', href: '/security' },
    { label: 'GDPR', href: '/gdpr' },
  ],
  Support: [
    { label: 'Help Center', href: '/help' },
    { label: 'System Status', href: '/status' },
    { label: 'Contact', href: '/contact' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Logo size="sm" />
            </Link>
            <p className="text-sm text-white/40 mb-4">
              Your AI-powered career operating system. An OFORO AI product.
            </p>
            <div className="flex items-center gap-3 mb-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/30 hover:text-white/70 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
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
                    {link.href.includes('#') ? (
                      <a
                        href={link.href}
                        className="text-sm text-white/30 hover:text-white/70 transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-white/30 hover:text-white/70 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
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
