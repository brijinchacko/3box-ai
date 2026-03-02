'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const COACH_NAME = 'Nova';

const greetings = [
  `Hey! I'm ${COACH_NAME}, your AI career coach. How can I help you today?`,
  `Ready to level up your career? I'm here to guide you!`,
  `What would you like to work on? Assessment, learning, resume, or job search?`,
];

export default function FloatingCoach() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: greetings[0],
      timestamp: new Date(),
    },
  ]);
  const [typing, setTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Simulate AI response (in production: call /api/ai/coach)
    await new Promise((r) => setTimeout(r, 1500));

    const responses: Record<string, string> = {
      default: `Great question! Based on your progress toward AI Engineer, I'd recommend focusing on your MLOps skills next. Your current score is 45% — completing the MLOps Fundamentals module will significantly boost your market readiness. Want me to create a study plan?`,
    };

    const query = input.toLowerCase();
    let response = responses.default;

    if (query.includes('resume')) {
      response = `Your resume is looking good! A few suggestions: 1) Add more quantified achievements to your experience bullets. 2) Consider adding your recent ML pipeline project. 3) The ATS score could improve — try tailoring it for specific job descriptions. Want me to help optimize it?`;
    } else if (query.includes('job') || query.includes('apply')) {
      response = `Based on your skills, I found 4 strong matches this week. Scale AI (92% match) and Stripe (87% match) are the top ones. Your hire probability is currently 68% — completing the system design module could push it to ~80%. Shall I show you the full list?`;
    } else if (query.includes('learn') || query.includes('study')) {
      response = `You're making great progress on the Deep Learning module (65% complete). Next up is the Transformer Deep Dive — it's AI-adaptive, so it'll adjust to your pace. I'd suggest spending 2 hours daily to finish by end of week. Want me to set learning reminders?`;
    } else if (query.includes('assess')) {
      response = `Your last assessment showed strong Python (88%) and ML (75%) scores. The biggest gaps are in MLOps (45%) and System Design (55%). A reassessment could help track your improvement. Want to start one now?`;
    }

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setTyping(false);
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
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple shadow-lg shadow-neon-blue/25 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Bot className="w-6 h-6 text-white" />
            {/* Pulse */}
            <span className="absolute inset-0 rounded-full bg-neon-blue/30 animate-ping" />
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{COACH_NAME}</div>
                  <div className="text-[10px] text-neon-green flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green" /> Online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
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
                  {['Help with resume', 'Find jobs', 'Study plan', 'Reassess skills'].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/5 transition-all"
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
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm placeholder:text-white/20 focus:outline-none focus:border-neon-blue/30"
                      placeholder={`Ask ${COACH_NAME} anything...`}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim()}
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
