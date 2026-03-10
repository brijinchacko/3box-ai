'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Logo from '@/components/brand/Logo';
import AgentAvatar from '@/components/brand/AgentAvatar';
import CortexAvatar from '@/components/brand/CortexAvatar';
import { TOOL_CATEGORIES, ALL_TOOLS } from '@/lib/tools/toolsConfig';
import { AGENT_LIST, COORDINATOR } from '@/lib/agents/registry';

const navLinks = [
  { href: '/agents', label: 'AI Agents', hasMegaMenu: 'agents' as const },
  { href: '/tools', label: 'AI Tools', hasMegaMenu: 'tools' as const },
  { href: '/pricing', label: 'Pricing' },
  { href: '/case-studies', label: 'Case Studies' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [mobileAgentsOpen, setMobileAgentsOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const agentMenuRef = useRef<HTMLDivElement>(null);
  const megaMenuTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!isHomePage) { setScrolled(true); return; }
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHomePage]);

  // Close mega menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node) &&
        agentMenuRef.current && !agentMenuRef.current.contains(e.target as Node)
      ) {
        setActiveMegaMenu(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const openMegaMenu = (key: string) => {
    clearTimeout(megaMenuTimer.current);
    setActiveMegaMenu(key);
  };

  const closeMegaMenu = () => {
    megaMenuTimer.current = setTimeout(() => setActiveMegaMenu(null), 150);
  };

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
          {/* Logo — left-aligned when scrolled, centered when at top on homepage */}
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

          {/* Invisible spacer to keep layout when logo is centered */}
          {!scrolled && isHomePage && <div className="w-[120px]" />}

          {/* Desktop Nav — visible on scroll */}
          <div className={`hidden md:flex items-center gap-1 transition-all duration-300 ${
            scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}>
            {navLinks.map((link) =>
              link.hasMegaMenu === 'agents' ? (
                <div
                  key={link.href}
                  ref={agentMenuRef}
                  className="relative"
                  onMouseEnter={() => openMegaMenu('agents')}
                  onMouseLeave={closeMegaMenu}
                >
                  <Link
                    href={link.href}
                    className="btn-ghost text-sm flex items-center gap-1"
                  >
                    {link.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMegaMenu === 'agents' ? 'rotate-180' : ''}`} />
                  </Link>

                  {/* Invisible hover bridge (always rendered when menu is open) */}
                  {activeMegaMenu === 'agents' && (
                    <div className="absolute top-full left-0 w-full h-6" />
                  )}
                  {/* Agents Mega Menu */}
                  <AnimatePresence>
                    {activeMegaMenu === 'agents' && (
                      <motion.div
                        key="agents-menu"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[400px] p-5 rounded-2xl bg-surface/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/40"
                      >
                        {/* Cortex */}
                        <Link
                          href="/agents/cortex"
                          onClick={() => setActiveMegaMenu(null)}
                          className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-white/[0.05] transition-colors group/item mb-2"
                        >
                          <CortexAvatar size={28} />
                          <div>
                            <span className="text-sm font-semibold text-white/80 group-hover/item:text-white">Agent Cortex</span>
                            <p className="text-[11px] text-white/30">AI Coordinator</p>
                          </div>
                        </Link>

                        <div className="border-t border-white/[0.06] pt-2 mt-1">
                          <h4 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2 px-1">Specialist Agents</h4>
                          <div className="space-y-0.5">
                            {AGENT_LIST.map((agent) => (
                              <Link
                                key={agent.id}
                                href={`/agents/${agent.id}`}
                                onClick={() => setActiveMegaMenu(null)}
                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-colors group/item"
                              >
                                <AgentAvatar agentId={agent.id} size={24} />
                                <div className="min-w-0 flex-1">
                                  <span className="text-sm text-white/80 group-hover/item:text-white">{agent.displayName}</span>
                                </div>
                                <span className="text-[10px] text-white/25">{agent.role}</span>
                              </Link>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/[0.06]">
                          <Link
                            href="/agents"
                            onClick={() => setActiveMegaMenu(null)}
                            className="flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-white/[0.04] transition-colors text-sm text-white/50 hover:text-white/80"
                          >
                            <Sparkles className="w-4 h-4" />
                            Meet All Agents
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : link.hasMegaMenu === 'tools' ? (
                <div
                  key={link.href}
                  ref={megaMenuRef}
                  className="relative"
                  onMouseEnter={() => openMegaMenu('tools')}
                  onMouseLeave={closeMegaMenu}
                >
                  <Link
                    href={link.href}
                    className="btn-ghost text-sm flex items-center gap-1"
                  >
                    {link.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMegaMenu === 'tools' ? 'rotate-180' : ''}`} />
                  </Link>

                  {/* Invisible hover bridge (always rendered when menu is open) */}
                  {activeMegaMenu === 'tools' && (
                    <div className="absolute top-full left-0 w-full h-6" />
                  )}
                  {/* Tools Mega Menu */}
                  <AnimatePresence>
                    {activeMegaMenu === 'tools' && (
                      <motion.div
                        key="tools-menu"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[720px] p-5 rounded-2xl bg-surface/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/40"
                      >
                        <div className="grid grid-cols-2 gap-5">
                          {TOOL_CATEGORIES.map((cat) => {
                            const tools = ALL_TOOLS.filter(t => t.category === cat.key);
                            return (
                              <div key={cat.key}>
                                <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2.5 px-1">
                                  {cat.label}
                                </h4>
                                <div className="space-y-0.5">
                                  {tools.map((tool) => (
                                    <Link
                                      key={tool.slug}
                                      href={tool.href}
                                      onClick={() => setActiveMegaMenu(null)}
                                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-colors group/item"
                                    >
                                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center shrink-0`}>
                                        <tool.icon className={`w-3.5 h-3.5 ${tool.iconColor}`} />
                                      </div>
                                      <div className="min-w-0">
                                        <span className="text-sm text-white/80 group-hover/item:text-white transition-colors flex items-center gap-1.5">
                                          {tool.title}
                                          {tool.isNew && (
                                            <span className="text-[10px] font-semibold text-neon-blue bg-neon-blue/10 px-1.5 py-0.5 rounded-full leading-none">
                                              NEW
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/[0.06]">
                          <Link
                            href="/tools"
                            onClick={() => setActiveMegaMenu(null)}
                            className="flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-white/[0.04] transition-colors text-sm text-white/50 hover:text-white/80"
                          >
                            <Sparkles className="w-4 h-4" />
                            View All {ALL_TOOLS.length} AI Tools
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : link.href.includes('#') ? (
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
                <Link href="/get-started" className="btn-primary text-sm flex items-center gap-1">
                  Get Started Free <ChevronRight className="w-4 h-4" />
                </Link>
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
                link.hasMegaMenu === 'agents' ? (
                  <div key={link.href}>
                    <button
                      onClick={() => setMobileAgentsOpen(!mobileAgentsOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                    >
                      <span>{link.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${mobileAgentsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {mobileAgentsOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pb-2 space-y-0.5">
                            <Link
                              href="/agents/cortex"
                              onClick={() => { setMobileOpen(false); setMobileAgentsOpen(false); }}
                              className="flex items-center gap-2.5 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              <CortexAvatar size={20} />
                              <span className="text-sm text-white/60">Agent Cortex</span>
                              <span className="text-[9px] text-white/25 ml-auto">Coordinator</span>
                            </Link>
                            {AGENT_LIST.map((agent) => (
                              <Link
                                key={agent.id}
                                href={`/agents/${agent.id}`}
                                onClick={() => { setMobileOpen(false); setMobileAgentsOpen(false); }}
                                className="flex items-center gap-2.5 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                              >
                                <AgentAvatar agentId={agent.id} size={20} />
                                <span className="text-sm text-white/60">{agent.displayName}</span>
                                <span className="text-[9px] text-white/25 ml-auto">{agent.role}</span>
                              </Link>
                            ))}
                            <Link
                              href="/agents"
                              onClick={() => { setMobileOpen(false); setMobileAgentsOpen(false); }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-neon-blue/70"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Meet All Agents
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : link.hasMegaMenu === 'tools' ? (
                  <div key={link.href}>
                    <button
                      onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                    >
                      <span>{link.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${mobileToolsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {mobileToolsOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pb-2 space-y-3">
                            {TOOL_CATEGORIES.map((cat) => {
                              const tools = ALL_TOOLS.filter(t => t.category === cat.key);
                              return (
                                <div key={cat.key}>
                                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider px-4 mb-1">
                                    {cat.label}
                                  </p>
                                  {tools.map((tool) => (
                                    <Link
                                      key={tool.slug}
                                      href={tool.href}
                                      onClick={() => { setMobileOpen(false); setMobileToolsOpen(false); }}
                                      className="flex items-center gap-2.5 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                                    >
                                      <tool.icon className={`w-3.5 h-3.5 ${tool.iconColor}`} />
                                      <span className="text-sm text-white/60">{tool.title}</span>
                                      {tool.isNew && (
                                        <span className="text-[9px] font-semibold text-neon-blue bg-neon-blue/10 px-1 py-0.5 rounded-full leading-none">
                                          NEW
                                        </span>
                                      )}
                                    </Link>
                                  ))}
                                </div>
                              );
                            })}
                            <Link
                              href="/tools"
                              onClick={() => { setMobileOpen(false); setMobileToolsOpen(false); }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-neon-blue/70"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              View All Tools
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : link.href.includes('#') ? (
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
