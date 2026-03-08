'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Minimize2, Maximize2, Trash2, CheckCircle2, XCircle, ArrowRight, Navigation } from 'lucide-react';
import Link from 'next/link';
import CortexAvatar, { CortexExpression } from '@/components/brand/CortexAvatar';
import NameGreeting from '@/components/ai-coach/NameGreeting';
import { useVisitorName } from '@/hooks/useVisitorName';

interface ActionResult {
  type: string;
  field: string;
  value: string;
  success: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ActionResult[];
}

/* ── Quick actions adapt to context ── */
const DASHBOARD_QUICK_ACTIONS: Record<string, string> = {
  '\uD83E\uDD16 Run agents': 'Run my agent team to find and apply to jobs.',
  '\uD83D\uDCC4 Resume help': 'I need help improving my resume. What should I focus on?',
  '\uD83D\uDD0D Find jobs': 'Help me find jobs that match my skills.',
  '\uD83D\uDCDA Study plan': 'Create a study plan for my career goals.',
};

const PUBLIC_QUICK_ACTIONS: Record<string, string> = {
  '\uD83E\uDD14 What is 3BOX?': 'What is 3BOX AI and how can it help my career?',
  '\uD83E\uDD16 Meet the agents': 'Tell me about the AI agents and what they do.',
  '\uD83D\uDE80 How it works': 'How does 3BOX AI help me get a job?',
  '\u2728 Free features': 'What can I do for free on 3BOX AI?',
};

/* ── Client-side navigation intent detection ── */
const NAV_PATTERNS: { patterns: RegExp[]; path: string; label: string }[] = [
  { patterns: [/\b(open|show|go to|take me to|navigate to)\b.*\b(resume|forge)\b/i, /^resume$/i, /^forge$/i], path: '/dashboard/resume', label: 'Resume Builder' },
  { patterns: [/\b(open|show|go to|take me to|navigate to)\b.*\b(jobs?|scout|job matching|job search)\b/i, /^(jobs?|scout)$/i], path: '/dashboard/jobs', label: 'Job Matching' },
  { patterns: [/\b(open|show|go to|take me to|navigate to)\b.*\b(application|archer|applied)\b/i, /^(applications?|archer)$/i], path: '/dashboard/agents', label: 'Applications' },
  { patterns: [/\b(open|show|go to|take me to|navigate to)\b.*\b(interview|atlas|interview prep)\b/i, /^(interview|atlas)$/i], path: '/dashboard/interview', label: 'Interview Prep' },
  { patterns: [/\b(open|show|go to|take me to|navigate to)\b.*\b(learn|sage|study|skill|course)\b/i, /^(learning|sage|study)$/i], path: '/dashboard/learning', label: 'Learning Paths' },
  { patterns: [/\b(open|show|go to|take me to|navigate to)\b.*\b(quality|sentinel|review)\b/i, /^(quality|sentinel)$/i], path: '/dashboard/quality', label: 'Quality Check' },
  { patterns: [/\b(open|show|go to|take me to|navigate to)\b.*\b(setting|preference|profile)\b/i, /^settings?$/i], path: '/dashboard/settings', label: 'Settings' },
  { patterns: [/\b(open|show|go to|take me to|navigate to)\b.*\b(assess|skill test)\b/i, /^assessment$/i], path: '/dashboard/assessment', label: 'Skill Assessment' },
  { patterns: [/\b(open|show|go to|take me to|navigate to)\b.*\b(career plan|roadmap)\b/i], path: '/dashboard/career-plan', label: 'Career Plan' },
  { patterns: [/\b(open|show|go to|take me to|navigate to)\b.*\b(portfolio)\b/i, /^portfolio$/i], path: '/dashboard/portfolio', label: 'Portfolio' },
  { patterns: [/\b(open|show|go to|take me to|navigate to)\b.*\b(dashboard|home|command center|cortex)\b/i], path: '/dashboard', label: 'Command Center' },
  { patterns: [/\b(open|show|go to|take me to|navigate to)\b.*\b(billing|plan|subscription)\b/i], path: '/dashboard/settings?tab=billing', label: 'Billing' },
];

function detectNavIntent(text: string): { path: string; label: string } | null {
  const lower = text.toLowerCase().trim();
  for (const nav of NAV_PATTERNS) {
    for (const pattern of nav.patterns) {
      if (pattern.test(lower)) {
        return { path: nav.path, label: nav.label };
      }
    }
  }
  return null;
}

export default function FloatingCoach() {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = status === 'authenticated';
  const isDashboard = pathname.startsWith('/dashboard');

  const { firstName } = useVisitorName();
  const [coachName] = useState('Cortex');
  const [open, setOpen] = useState(false);
  const [showNameGreeting, setShowNameGreeting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [cortexExpression, setCortexExpression] = useState<CortexExpression>('normal');
  const chatRef = useRef<HTMLDivElement>(null);

  // Pick context-appropriate quick actions
  const quickActions = isDashboard ? DASHBOARD_QUICK_ACTIONS : PUBLIC_QUICK_ACTIONS;

  const namePrefix = firstName ? `Hey ${firstName}!` : 'Hey!';
  const publicGreeting = `${namePrefix} I'm Cortex, the AI ninja who never sleeps \uD83E\uDD77 Ask me anything about 3BOX AI!`;
  const authGreeting = `${namePrefix} I'm Cortex, your AI coordinator \uD83E\uDDE0 What can I help you with?`;

  const greetings = useMemo(() => {
    if (!isAuthenticated) {
      return [
        publicGreeting,
        `${firstName ? `${firstName}, ` : ''}I'm Cortex — I command a team of 6 AI agents built to get you hired. Want to know more?`,
        `Curious how 3BOX AI works? Ask me anything${firstName ? `, ${firstName}` : ''}!`,
      ];
    }
    return [
      authGreeting,
      `${firstName ? `${firstName}, your` : 'Your'} agent team is ready. What would you like to work on?`,
      `Need help${firstName ? `, ${firstName}` : ''}? I can coordinate your agents or answer questions.`,
    ];
  }, [isAuthenticated, firstName]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: publicGreeting,
      timestamp: new Date(),
    },
  ]);

  // Update greeting when auth changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === '0') {
        return [{ ...prev[0], content: greetings[0] }];
      }
      return prev;
    });
  }, [greetings]);

  // Derive Cortex's expression from state
  useEffect(() => {
    setCortexExpression(typing ? 'thinking' : 'normal');
  }, [typing]);

  // Auto-scroll chat history
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, typing]);

  // Latest assistant message (the "speech" content)
  const latestAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'assistant') || messages[0],
    [messages]
  );

  /* ── Handle navigation actions from AI or client-side detection ── */
  const executeNavigation = useCallback((path: string) => {
    if (isDashboard) {
      router.push(path);
    } else {
      // On public pages, redirect to dashboard
      router.push(path);
    }
  }, [router, isDashboard]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // ── Client-side nav detection (instant, no API call needed for simple navigation) ──
    if (isAuthenticated && isDashboard) {
      const navIntent = detectNavIntent(text.trim());
      if (navIntent) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Opening ${navIntent.label}...`,
          timestamp: new Date(),
          actions: [{ type: 'navigate', field: 'page', value: navIntent.path, success: true }],
        };
        setMessages((prev) => [...prev, aiMsg]);
        setCortexExpression('happy');
        setTimeout(() => {
          executeNavigation(navIntent.path);
          setCortexExpression('normal');
        }, 600);
        return;
      }
    }

    // ── Regular AI chat for non-navigation messages ──
    setTyping(true);

    try {
      const history = [...messages, userMsg]
        .filter((m) => m.id !== '0')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          context: {
            history,
            isPublic: !isAuthenticated,
            page: pathname,
          },
        }),
      });

      if (!res.ok) throw new Error('AI service error');
      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || "Sorry, I couldn't process that. Try again.",
        timestamp: new Date(),
        actions: data.actions || undefined,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Handle navigate actions from AI
      const navAction = data.actions?.find((a: ActionResult) => a.type === 'navigate');
      if (navAction && isAuthenticated) {
        setCortexExpression('happy');
        setTimeout(() => {
          executeNavigation(navAction.value);
          setCortexExpression('normal');
        }, 800);
      } else if (data.actions?.some((a: ActionResult) => a.success)) {
        setCortexExpression('happy');
        setTimeout(() => setCortexExpression('normal'), 2500);
      }
    } catch (error) {
      console.error('[FloatingCoach] Error:', error);

      const fallback = isAuthenticated
        ? "Oops, something went wrong. Try again."
        : "I'm having trouble connecting right now. Sign up free to get the full experience!";

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: fallback, timestamp: new Date() },
      ]);
      setCortexExpression('surprised');
      setTimeout(() => setCortexExpression('normal'), 2000);
    } finally {
      setTyping(false);
    }
  }, [messages, isAuthenticated, isDashboard, pathname, executeNavigation]);

  const handleSend = () => sendMessage(input);

  const handleQuickAction = (label: string) => {
    const message = quickActions[label] || label;
    sendMessage(message);
  };

  const handleClearChat = () => {
    setMessages([
      { id: Date.now().toString(), role: 'assistant', content: greetings[Math.floor(Math.random() * greetings.length)], timestamp: new Date() },
    ]);
    setShowHistory(false);
  };

  /* ── Render action result badges ── */
  const renderAction = (action: ActionResult, i: number) => {
    if (action.type === 'navigate') {
      return (
        <div
          key={i}
          className="mt-1.5 px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1 bg-neon-blue/10 text-neon-blue"
        >
          <Navigation className="w-3 h-3" />
          Navigating...
        </div>
      );
    }
    return (
      <div
        key={i}
        className={`mt-1.5 px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1 ${
          action.success
            ? 'bg-neon-green/10 text-neon-green'
            : 'bg-red-500/10 text-red-400'
        }`}
      >
        {action.success ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {action.success ? `Updated ${action.field}` : `Failed to update ${action.field}`}
      </div>
    );
  };

  const [greetingActive, setGreetingActive] = useState(false);

  return (
    <>
      {/* ── Name Greeting Popup (first-time visitors only) ── */}
      {!open && !isAuthenticated && !isDashboard && (
        <NameGreeting onActiveChange={setGreetingActive} />
      )}

      {/* ── Floating Cortex Avatar (hidden during centered greeting) ── */}
      {!greetingActive && (
      <motion.div
        className="fixed bottom-6 right-6 z-50 cursor-pointer"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          {/* Breathing glow */}
          <div
            className={`absolute -inset-2 rounded-2xl blur-xl transition-colors duration-1000 ${
              open ? 'bg-neon-blue/25' : 'bg-neon-purple/15'
            }`}
            style={{ animation: 'cortex-breathe 3s ease-in-out infinite' }}
          />
          <div className="relative">
            <CortexAvatar size={72} expression={cortexExpression} mirrored />
          </div>
          {/* Online indicator */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-neon-green rounded-full border-2 border-[#0a0a0f]" />
        </div>
      </motion.div>
      )}

      {/* ── Speech Bubble ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="fixed bottom-[7.5rem] right-6 z-50 w-[340px] sm:w-[380px]"
          >
            <div className="relative bg-[#12121e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Triangle tail pointing to Cortex */}
              <div
                className="absolute -bottom-[10px] right-8 w-0 h-0"
                style={{
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderTop: '12px solid rgba(18, 18, 30, 0.95)',
                }}
              />

              {/* ── Header ── */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Cortex</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                  {!isAuthenticated && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neon-blue/10 text-neon-blue font-medium">AI Assistant</span>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    title={showHistory ? 'Show latest' : 'Show history'}
                  >
                    {showHistory ? <Minimize2 className="w-3.5 h-3.5 text-white/35" /> : <Maximize2 className="w-3.5 h-3.5 text-white/35" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClearChat(); }}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    title="Clear chat"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white/35" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5 text-white/35" />
                  </button>
                </div>
              </div>

              {/* ── Message Area ── */}
              {showHistory ? (
                /* Full conversation history */
                <div ref={chatRef} className="max-h-[320px] overflow-y-auto px-4 py-3 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[85%]">
                        <div
                          className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-neon-blue/15 text-white rounded-br-sm'
                              : 'bg-white/[0.04] text-white/80 rounded-bl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.actions?.map((action, i) => renderAction(action, i))}
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div className="flex justify-start">
                      <div className="bg-white/[0.04] px-4 py-3 rounded-xl rounded-bl-sm">
                        <div className="flex gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-neon-blue/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-neon-blue/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-neon-blue/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Latest message only — "Cortex speaking" */
                <div className="px-4 py-4 min-h-[60px]">
                  {typing ? (
                    <div className="flex gap-1.5 items-center h-6">
                      <span className="w-2 h-2 rounded-full bg-neon-blue/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-neon-blue/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-neon-blue/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <>
                      <motion.p
                        key={latestAssistant.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-white/80 leading-relaxed"
                      >
                        {latestAssistant.content}
                      </motion.p>
                      {latestAssistant.actions?.map((action, i) => renderAction(action, i))}
                    </>
                  )}
                </div>
              )}

              {/* ── Quick Actions (only on initial state) ── */}
              {messages.length <= 1 && !typing && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {Object.keys(quickActions).map((q) => (
                    <button
                      key={q}
                      onClick={(e) => { e.stopPropagation(); handleQuickAction(q); }}
                      className="px-2.5 py-1 rounded-lg text-[10px] border border-white/10 text-white/40 hover:text-neon-blue hover:border-neon-blue/30 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* ── CTA for unauthenticated users ── */}
              {!isAuthenticated && messages.length > 1 && !typing && (
                <div className="px-4 pb-2">
                  <Link
                    href="/login"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-white/10 text-sm font-medium text-white hover:from-neon-blue/30 hover:to-neon-purple/30 transition-all"
                  >
                    Get Started Free <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* ── Input Bar ── */}
              <div className="px-3 py-2.5 border-t border-white/5">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={typing}
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm placeholder:text-white/20 focus:outline-none focus:border-neon-blue/30 disabled:opacity-50 transition-colors"
                    placeholder="Ask Cortex..."
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || typing}
                    className="p-2 rounded-xl bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 transition-all disabled:opacity-30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breathing glow animation */}
      <style jsx global>{`
        @keyframes cortex-breathe {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </>
  );
}
