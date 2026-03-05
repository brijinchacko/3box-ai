'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, Loader2, AlertTriangle, Settings } from 'lucide-react';

interface Email {
  id: string;
  uid: number;
  from: { name: string; address: string };
  to: string[];
  subject: string;
  date: string;
  preview: string;
  seen: boolean;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function AdminEmailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/email');
      const data = await res.json();
      setConfigured(data.configured !== false);
      setEmails(data.emails || []);
      if (data.error) setError(data.error);
      if (data.message) setError(data.message);
    } catch {
      setError('Failed to fetch emails');
    }
    setLoading(false);
  };

  useEffect(() => { fetchEmails(); }, []);

  const unreadCount = emails.filter((e) => !e.seen).length;

  if (!configured) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Email Inbox</h1>
        <div className="max-w-lg mx-auto mt-12 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
          <Settings className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Email Integration Not Configured</h2>
          <p className="text-sm text-white/40 mb-6">
            Connect an email account via IMAP to view incoming emails here.
          </p>
          <div className="text-left space-y-3 text-sm text-white/50">
            <p className="font-medium text-white/60">Setup steps:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Use any email provider with IMAP support (Gmail, Outlook, etc.)</li>
              <li>Enable IMAP access and generate an app-specific password</li>
              <li>Add these to your <code className="text-xs bg-white/5 px-1 py-0.5 rounded">.env</code> file:</li>
            </ol>
            <div className="p-3 rounded-lg bg-white/[0.03] font-mono text-xs text-white/40 space-y-1">
              <div>IMAP_HOST=&quot;imap.gmail.com&quot;</div>
              <div>IMAP_USER=&quot;your@gmail.com&quot;</div>
              <div>IMAP_PASSWORD=&quot;your-app-password&quot;</div>
            </div>
            <p className="text-xs text-white/30 mt-2">For Gmail: Enable 2FA, then create an App Password at myaccount.google.com/apppasswords</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Email Inbox</h1>
          <p className="text-white/40 text-sm">
            {emails.length} emails{unreadCount > 0 ? ` (${unreadCount} unread)` : ''} — Read-only
          </p>
        </div>
        <button
          onClick={fetchEmails}
          disabled={loading}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No emails found.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {emails.map((email, i) => (
            <motion.div
              key={email.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <button
                onClick={() => setExpanded(expanded === email.id ? null : email.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  !email.seen
                    ? 'bg-white/[0.04] border-white/[0.08]'
                    : 'bg-white/[0.01] border-white/[0.03] hover:border-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {!email.seen && <div className="w-2 h-2 rounded-full bg-neon-blue flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm truncate ${!email.seen ? 'font-semibold' : 'text-white/70'}`}>
                        {email.from.name || email.from.address}
                      </span>
                      <span className="text-[10px] text-white/20 flex-shrink-0">
                        {timeAgo(email.date)}
                      </span>
                    </div>
                    <p className={`text-sm truncate mt-0.5 ${!email.seen ? 'text-white/80' : 'text-white/50'}`}>
                      {email.subject}
                    </p>
                    {expanded !== email.id && email.preview && (
                      <p className="text-xs text-white/25 truncate mt-0.5">{email.preview}</p>
                    )}
                  </div>
                </div>

                {expanded === email.id && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="text-xs text-white/30 space-y-1 mb-3">
                      <div>From: {email.from.name} &lt;{email.from.address}&gt;</div>
                      <div>To: {email.to.join(', ')}</div>
                      <div>Date: {new Date(email.date).toLocaleString()}</div>
                    </div>
                    {email.preview && (
                      <p className="text-sm text-white/50 leading-relaxed">{email.preview}</p>
                    )}
                    <p className="text-xs text-white/20 mt-3">Use Zoho Mail web interface for full email and reply.</p>
                  </div>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
