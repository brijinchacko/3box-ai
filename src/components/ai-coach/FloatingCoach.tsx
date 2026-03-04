'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Minimize2, Maximize2, Trash2 } from 'lucide-react';
import HoraceAvatar from '@/components/brand/HoraceAvatar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const COACH_NAME = 'Horace';

const greetings = [
  `Hey! I'm ${COACH_NAME}, your AI career coach. How can I help you today?`,
  `Ready to level up your career? I'm here to guide you!`,
  `What would you like to work on? Assessment, learning, resume, or job search?`,
];

const QUICK_ACTION_MESSAGES: Record<string, string> = {
  'Help with resume': 'I need help improving my resume. What should I focus on?',
  'Find jobs': 'Help me find jobs that match my skills and experience.',
  'Study plan': 'Create a study plan for my career goals.',
  'Reassess skills': "I'd like to reassess my skills. What areas should I focus on?",
};

const initialMessage: Message = {
  id: '0',
  role: 'assistant',
  content: greetings[0],
  timestamp: new Date(),
};

export default function FloatingCoach() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [typing, setTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, typing]);

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
      // Build conversation history for context (exclude initial greeting from history sent to API)
      const history = [...messages, userMsg]
        .filter((m) => m.id !== '0')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          context: { history },
        }),
      });

      if (!res.ok) {
        throw new Error('AI service error');
      }

      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || data.response || "Sorry, I couldn't process that. Try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('[FloatingCoach] Error:', error);

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I couldn't process that. Try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setTyping(false);
    }
  }, [messages]);

  const handleSend = async () => {
    await sendMessage(input);
  };

  const handleQuickAction = (label: string) => {
    const message = QUICK_ACTION_MESSAGES[label] || label;
    sendMessage(message);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: greetings[Math.floor(Math.random() * greetings.length)],
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-110 transition-transform"
          >
            <HoraceAvatar size={56} mirrored />
            {/* Glow pulse */}
            <span className="absolute inset-0 rounded-2xl bg-neon-blue/15 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed z-50 ${
              minimized
                ? 'bottom-6 right-6 w-72'
                : 'bottom-6 right-6 w-[380px] h-[520px] sm:w-[420px] sm:h-[560px]'
            } flex flex-col glass border border-white/10 shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300`}
            style={{ borderRadius: '1.25rem' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.03]">
              <div className="flex items-center gap-2">
                <HoraceAvatar size={32} mirrored />
                <div>
                  <div className="text-sm font-semibold">{COACH_NAME}</div>
                  <div className="text-[10px] text-neon-green flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green" /> Online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  className="p-1.5 rounded-lg hover:bg-white/5"
                  title="Clear chat"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white/40" />
                </button>
                <button onClick={() => setMinimized(!minimized)} className="p-1.5 rounded-lg hover:bg-white/5">
                  {minimized ? <Maximize2 className="w-3.5 h-3.5 text-white/40" /> : <Minimize2 className="w-3.5 h-3.5 text-white/40" />}
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5">
                  <X className="w-3.5 h-3.5 text-white/40" />
                </button>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Messages */}
                <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-neon-blue/20 text-white rounded-br-md'
                            : 'bg-white/5 text-white/80 rounded-bl-md'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-bl-md">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="px-4 py-2 flex gap-2 overflow-x-auto">
                  {Object.keys(QUICK_ACTION_MESSAGES).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQuickAction(q)}
                      disabled={typing}
                      className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/5 transition-all disabled:opacity-30"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-white/5">
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2"
                  >
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={typing}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm placeholder:text-white/20 focus:outline-none focus:border-neon-blue/30 disabled:opacity-50"
                      placeholder={`Ask ${COACH_NAME} anything...`}
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
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
