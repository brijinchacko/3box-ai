'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Send, User, Shield } from 'lucide-react';

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
  user: { name: string | null; email: string | null; image: string | null };
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

export default function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/admin/tickets/${id}`);
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
      await fetch(`/api/admin/tickets/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply }),
      });
      setReply('');
      fetchTicket();
    } catch {}
    setSending(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await fetch(`/api/admin/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTicket();
    } catch {}
    setUpdatingStatus(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return <div className="text-center py-20 text-white/30 text-sm">Ticket not found.</div>;
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/support"
        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Support
      </Link>

      {/* Header */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
        <h1 className="text-lg font-bold mb-3">{ticket.subject}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[ticket.status] || ''}`}>
            {ticket.status.replace('_', ' ')}
          </span>
          <span className="text-xs text-white/30">{ticket.category}</span>
          <span className="text-xs text-white/30">{ticket.priority}</span>
          <span className="text-xs text-white/20">from {ticket.user.email}</span>
          <span className="text-xs text-white/20">{new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Status controls */}
        <div className="flex gap-2 mt-4">
          {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
            <button
              key={s}
              disabled={ticket.status === s || updatingStatus}
              onClick={() => handleStatusChange(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                ticket.status === s
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
              } disabled:opacity-50`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3 mb-6">
        {ticket.messages.map((msg) => {
          const isAdmin = msg.senderRole === 'admin';
          return (
            <div
              key={msg.id}
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
                  {isAdmin ? 'Admin' : ticket.user.name || ticket.user.email || 'User'}
                </span>
                <span className="text-[10px] text-white/20">{timeAgo(msg.createdAt)}</span>
              </div>
              <p className="text-sm text-white/70 whitespace-pre-wrap">{msg.content}</p>
            </div>
          );
        })}
      </div>

      {/* Reply form */}
      {ticket.status !== 'closed' && (
        <form onSubmit={handleReply} className="space-y-3">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-purple/40 resize-none"
          />
          <button type="submit" disabled={sending || !reply.trim()} className="btn-primary text-sm flex items-center gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending...' : 'Reply'}
          </button>
        </form>
      )}
    </div>
  );
}
