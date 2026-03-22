'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, ChevronRight, ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Logo from '@/components/brand/Logo';
import AgentAvatar from '@/components/brand/AgentAvatar';
import { AGENT_LIST, COORDINATOR } from '@/lib/agents/registry';
import type { AgentId } from '@/lib/agents/registry';
import { TOOL_CATEGORIES, getToolsByCategory } from '@/lib/tools/toolsConfig';

// ─── Simple nav links (no mega-menu) ────────────────────
const SIMPLE_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/case-studies', label: 'Case Studies' },
];

// ─── Animation variants ─────────────────────────────────
const megaMenuVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
  },
  exit: {
    opacity: 0, y: -6, scale: 0.98,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

const accordionVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto', opacity: 1,
    transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] },
  },
};

// ═══════════════════════════════════════════════════════
//  AGENTS MEGA-MENU
// ═══════════════════════════════════════════════════════
function AgentsMegaMenu({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      variants={megaMenuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute left-0 right-0 top-full mt-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2">
        <div className="rounded-2xl border border-white/10 bg-surface/95 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden">
          <div className="grid grid-cols-12 gap-0">
            {/* ── Left: Cortex Hero Card ── */}
            <div className="col-span-4 p-6 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent border-r border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <AgentAvatar agentId="cortex" size={40} />
                <div>
                  <h3 className="text-white font-semibold text-sm">{COORDINATOR.displayName}</h3>
                  <p className="text-xs text-white/50">{COORDINATOR.role}</p>
                </div>
              </div>
              <p className="text-white/60 text-xs leading-relaxed mb-4">
                The master orchestrator that commands six specialist agents.
                Your entire career team, powered by one ninja brain.
              </p>
              <Link
                href="/agents"
                onClick={onClose}
                className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Meet the Team <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* ── Right: 6 Agent Grid ── */}
            <div className="col-span-8 p-5">
              <div className="grid grid-cols-2 gap-1">
                {AGENT_LIST.map((agent) => {
                  return (
                    <Link
                      key={agent.id}
                      href={`/agents#${agent.id}`}
                      onClick={onClose}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="shrink-0">
                        <AgentAvatar agentId={agent.id as AgentId} size={32} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                            {agent.name}
                          </span>
                          <span className="text-[10px] text-white/40 font-normal">
                            {agent.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/40 truncate">
                          {agent.shortDescription}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-white/5 px-6 py-3 flex items-center justify-between">
            <span className="text-xs text-white/40">6 AI Agents + Cortex Orchestrator</span>
            <Link
              href="/agents"
              onClick={onClose}
              className="text-xs font-medium text-neon-blue hover:text-white transition-colors flex items-center gap-1"
            >
              View All Agents <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
//  TOOLS MEGA-MENU
// ═══════════════════════════════════════════════════════
function ToolsMegaMenu({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      variants={megaMenuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute left-0 right-0 top-full mt-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2">
        <div className="rounded-2xl border border-white/10 bg-surface/95 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* ── 4-Column Category Grid ── */}
          <div className="grid grid-cols-4 gap-0 divide-x divide-white/5">
            {TOOL_CATEGORIES.map((cat) => {
              const tools = getToolsByCategory(cat.key);
              return (
                <div key={cat.key} className="p-5">
                  <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                    {cat.label}
                  </h4>
                  <div className="space-y-0.5">
                    {tools.map((tool) => {
                      const ToolIcon = tool.icon;
                      return (
                        <Link
                          key={tool.slug}
                          href={tool.href}
                          onClick={onClose}
                          className="group flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <ToolIcon className={`w-3.5 h-3.5 shrink-0 ${tool.iconColor} opacity-60 group-hover:opacity-100 transition-opacity`} />
                          <span className="text-[13px] text-white/70 group-hover:text-white transition-colors truncate">
                            {tool.title.replace('AI ', '').replace('Free ', '')}
                          </span>
                          {tool.isNew && (
                            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-neon-green/15 text-neon-green tracking-wide">
                              NEW
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-white/5 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-neon-green" />
              <span className="text-xs text-white/50">
                All 17 tools are <span className="text-neon-green font-medium">included</span>, no signup required
              </span>
            </div>
            <Link
              href="/tools"
              onClick={onClose}
              className="text-xs font-medium text-neon-green hover:text-white transition-colors flex items-center gap-1"
            >
              View All Tools <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
//  MOBILE ACCORDION SECTION
// ═══════════════════════════════════════════════════════
function MobileAccordion({
  label, isOpen, onToggle, children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white"
      >
        <span className="text-sm">{label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={accordionVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className="px-2 pb-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  MAIN NAVBAR
// ═══════════════════════════════════════════════════════
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'agents' | 'tools' | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<'agents' | 'tools' | null>(null);
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [scrolled, setScrolled] = useState(true); // Start solid to prevent layout flash
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isHomePage) { setScrolled(true); return; }
    const onScroll = () => setScrolled(window.scrollY > 80);
    // Run immediately — if user is at top of homepage, go transparent after mount
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHomePage]);

  // Close mega-menu on route change
  useEffect(() => {
    setActiveMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  // Debounced hover handlers for mega-menu
  const handleMenuEnter = useCallback((menu: 'agents' | 'tools') => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setActiveMenu(menu);
  }, []);

  const handleMenuLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  }, []);

  const closeMegaMenu = useCallback(() => {
    setActiveMenu(null);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-white/5' : 'border-b border-transparent'
      }`}
      onMouseLeave={handleMenuLeave}
    >
      <div className={`absolute inset-0 backdrop-blur-xl transition-all duration-300 ${
        scrolled ? 'bg-surface/80' : 'bg-transparent'
      }`} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
          >
            <Logo size="md" />
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-1">
            {/* AI Agents — mega-menu trigger */}
            <div
              onMouseEnter={() => handleMenuEnter('agents')}
              className="relative"
            >
              <Link
                href="/agents"
                className={`btn-ghost text-sm flex items-center gap-1 ${
                  pathname === '/agents' || activeMenu === 'agents' ? 'text-white' : ''
                }`}
              >
                AI Agents
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    activeMenu === 'agents' ? 'rotate-180' : ''
                  }`}
                />
              </Link>
            </div>

            {/* AI Tools — mega-menu trigger */}
            <div
              onMouseEnter={() => handleMenuEnter('tools')}
              className="relative"
            >
              <Link
                href="/tools"
                className={`btn-ghost text-sm flex items-center gap-1 ${
                  pathname === '/resume' || activeMenu === 'tools' ? 'text-white' : ''
                }`}
              >
                AI Tools
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    activeMenu === 'tools' ? 'rotate-180' : ''
                  }`}
                />
              </Link>
            </div>

            {/* Simple links */}
            {SIMPLE_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => setActiveMenu(null)}
                className={`btn-ghost text-sm ${
                  pathname === link.href ? 'text-white' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── CTA ── */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <Link href="/dashboard" className="btn-primary text-sm flex items-center gap-1">
                Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link href="/get-started" className="btn-primary text-sm flex items-center gap-1">
                  Get Started <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile Toggle ── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ═══ Desktop Mega-Menus ═══ */}
      <AnimatePresence>
        {activeMenu === 'agents' && (
          <div onMouseEnter={() => handleMenuEnter('agents')} onMouseLeave={handleMenuLeave}>
            <AgentsMegaMenu onClose={closeMegaMenu} />
          </div>
        )}
        {activeMenu === 'tools' && (
          <div onMouseEnter={() => handleMenuEnter('tools')} onMouseLeave={handleMenuLeave}>
            <ToolsMegaMenu onClose={closeMegaMenu} />
          </div>
        )}
      </AnimatePresence>

      {/* ═══ Mobile Menu ═══ */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-surface/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
              {/* ── AI Agents Accordion ── */}
              <MobileAccordion
                label="AI Agents"
                isOpen={mobileAccordion === 'agents'}
                onToggle={() => setMobileAccordion(mobileAccordion === 'agents' ? null : 'agents')}
              >
                {/* Cortex mini-card */}
                <Link
                  href="/agents"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 mb-1"
                >
                  <AgentAvatar agentId="cortex" size={28} />
                  <div>
                    <span className="text-sm font-medium text-white">{COORDINATOR.displayName}</span>
                    <p className="text-[11px] text-white/50">{COORDINATOR.role}</p>
                  </div>
                </Link>

                {/* Agent list */}
                {AGENT_LIST.map((agent) => {
                  return (
                    <Link
                      key={agent.id}
                      href={`/agents#${agent.id}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <AgentAvatar agentId={agent.id as AgentId} size={24} />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/80">{agent.name}</span>
                        <span className="text-[11px] text-white/40">{agent.role}</span>
                      </div>
                    </Link>
                  );
                })}
                <Link
                  href="/agents"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-1 px-3 py-2 text-xs text-neon-blue hover:text-white transition-colors"
                >
                  View All Agents <ChevronRight className="w-3 h-3" />
                </Link>
              </MobileAccordion>

              {/* ── AI Tools Accordion ── */}
              <MobileAccordion
                label="AI Tools"
                isOpen={mobileAccordion === 'tools'}
                onToggle={() => setMobileAccordion(mobileAccordion === 'tools' ? null : 'tools')}
              >
                {TOOL_CATEGORIES.map((cat) => {
                  const tools = getToolsByCategory(cat.key);
                  return (
                    <div key={cat.key} className="mb-3">
                      <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-3 py-1">
                        {cat.label}
                      </h4>
                      {tools.map((tool) => {
                        const ToolIcon = tool.icon;
                        return (
                          <Link
                            key={tool.slug}
                            href={tool.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <ToolIcon className={`w-3.5 h-3.5 ${tool.iconColor} opacity-60`} />
                            <span className="text-sm text-white/70">
                              {tool.title.replace('AI ', '').replace('Free ', '')}
                            </span>
                            {tool.isNew && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-neon-green/15 text-neon-green">
                                NEW
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
                <Link
                  href="/tools"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-1 px-3 py-2 text-xs text-neon-green hover:text-white transition-colors"
                >
                  View All Tools <ChevronRight className="w-3 h-3" />
                </Link>
              </MobileAccordion>

              {/* ── Simple Links ── */}
              {SIMPLE_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors ${
                    pathname === link.href ? 'text-white bg-white/5' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* ── CTA ── */}
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
                      Get Started
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
