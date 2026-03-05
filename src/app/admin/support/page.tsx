'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search, Loader2, ChevronRight,
  MessageSquare, Clock, CheckCircle2, XCircle,
} from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; email: string | null };
  _count: { messages: number };
}

interface Stats {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  total: number;
}

const statusColors: Record<string, string> = {
  open: 'bg-neon-blue/15 text-neon-blue',
  in_progress: 'bg-amber-500/15 text-amber-400',
  resolved: 'bg-neon-green/15 text-neon-green',
  closed: 'bg-white/10 text-white/40',
};

const priorityColors: Record<string, string> = {
  low: 'text-white/30',
  medium: 'text-amber-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
};

const statCards = [
  { key: 'open', label: 'Open', icon: MessageSquare, color: 'text-neon-blue' },
  { key: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-amber-400' },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2, color: 'text-neon-green' },
  { key: 'closed', label: 'Closed', icon: XCircle, color: 'text-white/40' },
];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({ open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/tickets?${params}`);
      const data = await res.json();
      setTickets(data.tickets || []);
      if (data.stats) setStats(data.stats);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Support Tickets</h1>
      <p className="text-white/40 text-sm mb-6">{stats.total} total tickets</p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${card.color}`} />
                <span className="text-xs text-white/40">{card.label}</span>
              </div>
              <span className="text-xl font-bold">{stats[card.key as keyof Stats]}</span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </form>
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5">
          {['', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {s ? s.replace('_', ' ') : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">No tickets found.</div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                href={`/admin/support/${ticket.id}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate group-hover:text-white transition-colors">
                    {ticket.subject}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[ticket.status] || ''}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] font-medium ${priorityColors[ticket.priority] || ''}`}>
                      {ticket.priority}
                    </span>
                    <span className="text-[10px] text-white/25">{ticket.category}</span>
                    <span className="text-[10px] text-white/20">{ticket.user.email}</span>
                    <span className="text-[10px] text-white/20">
                      {ticket._count.messages} msg{ticket._count.messages !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
