'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Send, User, Shield, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface Message {
  id: string;
  senderId: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  messages: Message[];
}

const statusColors: Record<string, string> = {
  open: 'bg-neon-blue/15 text-neon-blue',
  in_progress: 'bg-amber-500/15 text-amber-400',
  resolved: 'bg-neon-green/15 text-neon-green',
  closed: 'bg-white/10 text-white/40',
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json();
      setTicket(data.ticket);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchTicket(); }, [id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/tickets/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply }),
      });
      setReply('');
      fetchTicket();
    } catch {}
    setSending(false);
  };

  const isClosed = ticket?.status === 'closed' || ticket?.status === 'resolved';

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/help/tickets" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 mb-6">
            <ArrowLeft className="w-4 h-4" /> My Tickets
          </Link>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
            </div>
          ) : !ticket ? (
            <div className="text-center py-20 text-white/30 text-sm">Ticket not found.</div>
          ) : (
            <>
              {/* Header */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
                <h1 className="text-lg font-bold mb-2">{ticket.subject}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[ticket.status] || ''}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-white/30">{ticket.category}</span>
                  <span className="text-xs text-white/30">{ticket.priority}</span>
                  <span className="text-xs text-white/20">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {isClosed && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-neon-green/5 border border-neon-green/10">
                  <CheckCircle2 className="w-4 h-4 text-neon-green" />
                  <span className="text-sm text-neon-green/80">This ticket has been {ticket.status}.</span>
                </div>
              )}

              {/* Messages */}
              <div className="space-y-3 mb-6">
                {ticket.messages.map((msg, i) => {
                  const isAdmin = msg.senderRole === 'admin';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-4 rounded-xl border ${
                        isAdmin
                          ? 'bg-neon-purple/[0.04] border-neon-purple/10'
                          : 'bg-white/[0.02] border-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {isAdmin ? (
                          <Shield className="w-3.5 h-3.5 text-neon-purple" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-white/40" />
                        )}
                        <span className={`text-xs font-medium ${isAdmin ? 'text-neon-purple' : 'text-white/50'}`}>
                          {isAdmin ? 'Support Team' : 'You'}
                        </span>
                        <span className="text-[10px] text-white/20">{timeAgo(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm text-white/70 whitespace-pre-wrap">{msg.content}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Reply form */}
              {!isClosed && (
                <form onSubmit={handleReply} className="space-y-3">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? 'Sending...' : 'Send Reply'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
