'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Logo from '@/components/brand/Logo';

const navLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/tools', label: 'Tools' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/security', label: 'Security' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHomePage) { setScrolled(true); return; }
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHomePage]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-white/5' : 'border-b border-transparent'
      }`}
    >
      <div className={`absolute inset-0 backdrop-blur-xl transition-all duration-300 ${
        scrolled ? 'bg-surface/80' : 'bg-transparent'
      }`} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo — always visible */}
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size="md" />
          </Link>

          {/* Desktop Nav — visible on scroll */}
          <div className={`hidden md:flex items-center gap-1 transition-all duration-300 ${
            scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}>
            {navLinks.map((link) =>
              link.href.includes('#') ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="btn-ghost text-sm"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="btn-ghost text-sm"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* CTA Buttons — visible on scroll */}
          <div className={`hidden md:flex items-center gap-3 transition-all duration-300 ${
            scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}>
            {session ? (
              <Link href="/dashboard" className="btn-primary text-sm flex items-center gap-1">
                Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm">
                  Sign In
                </Link>
                {isHomePage ? (
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-primary text-sm flex items-center gap-1">
                    Get Started <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <Link href="/" className="btn-primary text-sm flex items-center gap-1">
                    Get Started <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Toggle — visible on scroll */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-lg hover:bg-white/5 transition-all duration-300 ${
              scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-surface/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) =>
                link.href.includes('#') ? (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              )}
              <div className="pt-2 space-y-2">
                {session ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center btn-primary text-sm"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="block w-full text-center btn-secondary text-sm">
                      Sign In
                    </Link>
                    {isHomePage ? (
                      <button onClick={() => { setMobileOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="block w-full text-center btn-primary text-sm">
                        Get Started Free
                      </button>
                    ) : (
                      <Link href="/" className="block w-full text-center btn-primary text-sm">
                        Get Started Free
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
