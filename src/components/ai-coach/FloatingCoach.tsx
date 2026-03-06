'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Minimize2, Maximize2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import HoraceAvatar, { HoraceExpression } from '@/components/brand/HoraceAvatar';

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

const QUICK_ACTIONS: Record<string, string> = {
  '\uD83E\uDD16 Run agents': 'Run my agent team to find and apply to jobs.',
  '\uD83D\uDCC4 Resume help': 'I need help improving my resume. What should I focus on?',
  '\uD83D\uDD0D Find jobs': 'Help me find jobs that match my skills.',
  '\uD83D\uDCDA Study plan': 'Create a study plan for my career goals.',
};

export default function FloatingCoach() {
  const [coachName, setCoachName] = useState('Cortex');
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [horaceExpression, setHoraceExpression] = useState<HoraceExpression>('normal');
  const chatRef = useRef<HTMLDivElement>(null);

  const greetings = useMemo(() => [
    `Hey! I'm ${coachName}, your AI coordinator \uD83E\uDDE0 What can I help you with?`,
    `Your agent team is ready. What would you like to work on?`,
    `Need help? I can coordinate your agents or answer questions.`,
  ], [coachName]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hey! I'm Cortex, your AI coordinator \uD83E\uDDE0 What can I help you with?`,
      timestamp: new Date(),
    },
  ]);

  // Fetch coach name on mount
  useEffect(() => {
    fetch('/api/user/coach-settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.name) setCoachName(data.name);
      })
      .catch(() => {}); // silently fail, keep default
  }, []);

  // When coachName changes and messages is still at initial state, update the first message
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === '0') {
        return [{ ...prev[0], content: greetings[0] }];
      }
      return prev;
    });
  }, [coachName, greetings]);

  // Derive Horace's expression from state
  useEffect(() => {
    if (typing) {
      setHoraceExpression('thinking');
    } else {
      setHoraceExpression('normal');
    }
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
    setTyping(true);

    try {
      const history = [...messages, userMsg]
        .filter((m) => m.id !== '0')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), context: { history } }),
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

      // Flash happy expression on successful actions
      if (data.actions?.some((a: ActionResult) => a.success)) {
        setHoraceExpression('happy');
        setTimeout(() => setHoraceExpression('normal'), 2500);
      }
    } catch (error) {
      console.error('[FloatingCoach] Error:', error);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: "Oops, something went wrong. Try again.", timestamp: new Date() },
      ]);
      setHoraceExpression('surprised');
      setTimeout(() => setHoraceExpression('normal'), 2000);
    } finally {
      setTyping(false);
    }
  }, [messages]);

  const handleSend = () => sendMessage(input);

  const handleQuickAction = (label: string) => {
    const message = QUICK_ACTIONS[label] || label;
    sendMessage(message);
  };

  const handleClearChat = () => {
    setMessages([
      { id: Date.now().toString(), role: 'assistant', content: greetings[Math.floor(Math.random() * greetings.length)], timestamp: new Date() },
    ]);
    setShowHistory(false);
  };

  return (
    <>
      {/* ── Floating Horace Avatar (always visible) ── */}
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
            style={{ animation: 'horace-breathe 3s ease-in-out infinite' }}
          />
          <div className="relative">
            <HoraceAvatar size={72} expression={horaceExpression} mirrored />
          </div>
          {/* Online indicator */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-neon-green rounded-full border-2 border-[#0a0a0f]" />
        </div>
      </motion.div>

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
              {/* Triangle tail pointing to Horace */}
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
                  <span className="text-sm font-semibold text-white">{coachName}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
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
                        {/* Action results */}
                        {msg.actions?.map((action, i) => (
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
                        ))}
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
                /* Latest message only — "Horace speaking" */
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
                      {/* Action results for latest message */}
                      {latestAssistant.actions?.map((action, i) => (
                        <div
                          key={i}
                          className={`mt-2 px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1 ${
                            action.success
                              ? 'bg-neon-green/10 text-neon-green'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {action.success ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {action.success ? `Updated ${action.field}` : `Failed to update ${action.field}`}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* ── Quick Actions (only on initial state) ── */}
              {messages.length <= 1 && !typing && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {Object.keys(QUICK_ACTIONS).map((q) => (
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
                    placeholder={`Ask ${coachName}...`}
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
        @keyframes horace-breathe {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </>
  );
}
