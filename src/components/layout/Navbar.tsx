'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Logo from '@/components/brand/Logo';

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
          {/* Logo */}
          <Link
            href="/"
            className={`flex items-center gap-2 group transition-all duration-500 ease-out ${
              !scrolled && isHomePage
                ? 'absolute left-1/2 -translate-x-1/2 scale-125'
                : ''
            }`}
          >
            <Logo size="md" />
          </Link>

          {/* Invisible spacer when logo is centered */}
          {!scrolled && isHomePage && <div className="w-[120px]" />}

          {/* Desktop Nav */}
          <div className={`hidden md:flex items-center gap-1 transition-all duration-300 ${
            scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}>
            <Link href="/pricing" className="btn-ghost text-sm">Pricing</Link>
          </div>

          {/* CTA */}
          <div className={`hidden md:flex items-center gap-3 transition-all duration-300 ${
            scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}>
            {session ? (
              <Link href="/dashboard" className="btn-primary text-sm flex items-center gap-1">
                Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link href="/get-started" className="btn-primary text-sm flex items-center gap-1">
                  Get Started Free <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
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
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors"
              >
                Pricing
              </Link>
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
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="block w-full text-center btn-secondary text-sm">
                      Sign In
                    </Link>
                    <Link href="/get-started" onClick={() => setMobileOpen(false)} className="block w-full text-center btn-primary text-sm">
                      Get Started Free
                    </Link>
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
