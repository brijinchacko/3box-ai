'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Loader2, AlertTriangle, Users } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  active: boolean;
  source: string;
  createdAt: string;
}

interface Campaign {
  id: string;
  subject: string;
  status: string;
  sentCount: number;
  sentAt: string | null;
  createdAt: string;
}

const campaignStatusColors: Record<string, string> = {
  draft: 'bg-amber-500/15 text-amber-400',
  sending: 'bg-neon-blue/15 text-neon-blue',
  sent: 'bg-neon-green/15 text-neon-green',
  failed: 'bg-red-500/15 text-red-400',
};

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'subscribers' | 'campaigns' | 'compose'>('subscribers');
  const [composeForm, setComposeForm] = useState({ subject: '', content: '' });
  const [sendResult, setSendResult] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/newsletter')
      .then((r) => r.json())
      .then((data) => {
        setSubscribers(data.subscribers || []);
        setCampaigns(data.campaigns || []);
        setActiveCount(data.activeCount || 0);
        setEmailConfigured(data.emailConfigured || false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeForm.subject || !composeForm.content) return;
    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composeForm),
      });
      const data = await res.json();
      if (data.error) {
        setSendResult(`Error: ${data.error}`);
      } else if (data.message) {
        setSendResult(data.message);
      } else {
        setSendResult(`Sent to ${data.campaign?.sentCount || 0} subscribers.`);
        setComposeForm({ subject: '', content: '' });
      }
    } catch {
      setSendResult('Failed to send campaign.');
    }
    setSending(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Newsletter</h1>
          <p className="text-white/40 text-sm">{activeCount} active subscribers</p>
        </div>
      </div>

      {!emailConfigured && (
        <div className="p-4 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-300 font-medium">Email sending not configured</p>
            <p className="text-xs text-white/40 mt-1">Set RESEND_API_KEY in .env to enable sending. Campaigns will be saved as drafts.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 w-fit mb-6">
        {(['subscribers', 'campaigns', 'compose'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
              tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      ) : tab === 'subscribers' ? (
        <div className="space-y-2">
          {subscribers.length === 0 ? (
            <div className="text-center py-16 text-white/30 text-sm">No subscribers yet.</div>
          ) : (
            subscribers.map((sub, i) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <Mail className="w-4 h-4 text-white/20" />
                <span className="text-sm flex-1">{sub.email}</span>
                <span className="text-[10px] text-white/25">{sub.source}</span>
                <span className={`text-[10px] font-medium ${sub.active ? 'text-neon-green/60' : 'text-red-400/60'}`}>
                  {sub.active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-[10px] text-white/20">
                  {new Date(sub.createdAt).toLocaleDateString()}
                </span>
              </motion.div>
            ))
          )}
        </div>
      ) : tab === 'campaigns' ? (
        <div className="space-y-2">
          {campaigns.length === 0 ? (
            <div className="text-center py-16 text-white/30 text-sm">No campaigns yet.</div>
          ) : (
            campaigns.map((camp, i) => (
              <motion.div
                key={camp.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">{camp.subject}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${campaignStatusColors[camp.status] || ''}`}>
                      {camp.status}
                    </span>
                    <span className="text-[10px] text-white/25 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {camp.sentCount} sent
                    </span>
                    <span className="text-[10px] text-white/20">
                      {new Date(camp.sentAt || camp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <form onSubmit={handleSend} className="max-w-2xl space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Subject</label>
            <input
              type="text"
              value={composeForm.subject}
              onChange={(e) => setComposeForm((f) => ({ ...f, subject: e.target.value }))}
              required
              placeholder="Newsletter subject line..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Content (HTML)</label>
            <textarea
              value={composeForm.content}
              onChange={(e) => setComposeForm((f) => ({ ...f, content: e.target.value }))}
              required
              rows={12}
              placeholder="<h2>Newsletter content...</h2>"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white font-mono placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 resize-y"
            />
          </div>

          {sendResult && (
            <div className={`p-3 rounded-xl text-sm ${sendResult.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-neon-green/10 text-neon-green'}`}>
              {sendResult}
            </div>
          )}

          <button type="submit" disabled={sending} className="btn-primary text-sm flex items-center gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending...' : `Send to ${activeCount} subscribers`}
          </button>
        </form>
      )}
    </div>
  );
}
