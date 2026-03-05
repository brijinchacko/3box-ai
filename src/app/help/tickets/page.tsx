'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus, Loader2, ChevronRight, MessageSquare,
  Ticket, ArrowLeft,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface TicketItem {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
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

export default function UserTicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tickets')
      .then((r) => r.json())
      .then((data) => {
        setTickets(
          (data.tickets || []).map((t: any) => ({
            ...t,
            messageCount: t.messageCount || t._count?.messages || 0,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/help" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 mb-6">
            <ArrowLeft className="w-4 h-4" /> Help Center
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Tickets</h1>
              <p className="text-white/40 text-sm mt-1">Track your support requests.</p>
            </div>
            <Link href="/help/tickets/new" className="btn-primary text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Ticket
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16">
              <Ticket className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white/50">No tickets yet</h3>
              <p className="text-sm text-white/30 mb-6">Submit a ticket and our team will get back to you.</p>
              <Link href="/help/tickets/new" className="btn-primary text-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Submit Your First Ticket
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket, i) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/help/tickets/${ticket.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate group-hover:text-white transition-colors">
                        {ticket.subject}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[ticket.status] || ''}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-white/25">{ticket.category}</span>
                        <span className="text-[10px] text-white/25 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> {ticket.messageCount}
                        </span>
                        <span className="text-[10px] text-white/20">{timeAgo(ticket.updatedAt)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
