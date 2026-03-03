'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  LayoutDashboard, Brain, Target, BookOpen, FileText,
  Briefcase, FolderOpen, Settings, LogOut, Menu, X, ChevronLeft,
  Crown, Zap, Star, Bell, Search, User
} from 'lucide-react';
import FloatingCoach from '@/components/ai-coach/FloatingCoach';

const sidebarLinks = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/assessment', icon: Brain, label: 'Assessment' },
  { href: '/dashboard/career-plan', icon: Target, label: 'Career Plan' },
  { href: '/dashboard/learning', icon: BookOpen, label: 'Learning Path' },
  { href: '/dashboard/resume', icon: FileText, label: 'Resume Builder' },
  { href: '/dashboard/portfolio', icon: FolderOpen, label: 'Portfolio' },
  { href: '/dashboard/jobs', icon: Briefcase, label: 'Job Matching' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

// Demo user for UI display
const demoUser = {
  name: 'Alex Johnson',
  email: 'alex@example.com',
  plan: 'PRO' as const,
  image: null,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const planBadge = {
    BASIC: { label: 'Basic', color: 'text-white/40 bg-white/5', icon: Star },
    PRO: { label: 'Pro', color: 'text-neon-blue bg-neon-blue/10', icon: Zap },
    ULTRA: { label: 'Ultra', color: 'text-neon-purple bg-neon-purple/10', icon: Crown },
  }[demoUser.plan];

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 border-r border-white/5 bg-surface-50 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2">
            {sidebarOpen ? (
              <Image src="/assets/brand/logo-white.png" alt="NXTED AI" width={130} height={37} className="h-8 w-auto" />
            ) : (
              <Image src="/assets/brand/icon.png" alt="NXTED AI" width={32} height={32} className="w-8 h-8 flex-shrink-0" />
            )}
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40">
            <ChevronLeft className={`w-4 h-4 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 text-white border border-white/10'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <link.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-neon-blue' : ''}`} />
                {sidebarOpen && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User + Plan */}
        <div className="p-3 border-t border-white/5">
          {sidebarOpen && (
            <div className="mb-3 px-3">
              <span className={`badge text-xs ${planBadge.color}`}>
                <planBadge.icon className="w-3 h-3 mr-1" /> {planBadge.label} Plan
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold flex-shrink-0">
              AJ
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{demoUser.name}</div>
                <div className="text-xs text-white/30 truncate">{demoUser.email}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-white/5 bg-surface/90 backdrop-blur-xl flex items-center justify-between px-4">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/5">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/assets/brand/logo-white.png" alt="NXTED AI" width={110} height={31} className="h-7 w-auto" />
        </Link>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold">AJ</div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-surface-50 border-r border-white/5"
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
                <Image src="/assets/brand/logo-white.png" alt="NXTED AI" width={130} height={37} className="h-8 w-auto" />
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
              </div>
              <nav className="py-4 px-3 space-y-1">
                {sidebarLinks.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
                      <link.icon className={`w-5 h-5 ${active ? 'text-neon-blue' : ''}`} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} pt-14 lg:pt-0`}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Floating AI Coach */}
      <FloatingCoach />
    </div>
  );
}
