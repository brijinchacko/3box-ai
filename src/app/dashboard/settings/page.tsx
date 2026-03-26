'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, User, CreditCard, Bot, Bell, Shield, Gift,
  Save, Zap, Camera, LogOut, Trash2, Copy, Check, Send,
  ExternalLink, Users, Award, Mail, Loader2
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProfileData {
  name: string;
  email: string;
  plan: string;
  targetRole: string;
  location: string;
  image: string | null;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  weeklyAppsUsed?: number;
  weeklyAppsLimit?: number;
}

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  rewardedReferrals: number;
}

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'referral', label: 'Refer & Earn', icon: Gift },
  { id: 'coach', label: 'AI Coach', icon: Bot },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Shield },
] as const;

type TabId = (typeof TABS)[number]['id'];

/* ------------------------------------------------------------------ */
/*  Helper: initials from name                                         */
/* ------------------------------------------------------------------ */

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/* ── SMTP Config Section for non-Google/Outlook users ── */
function SmtpConfigSection() {
  const [showSmtp, setShowSmtp] = useState(false);
  const [smtp, setSmtp] = useState({ host: '', port: '587', email: '', password: '', fromName: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [smtpConnected, setSmtpConnected] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);

  useEffect(() => {
    fetch('/api/user/smtp-config')
      .then(r => r.json())
      .then(data => {
        if (data.configured) {
          setSmtpConnected(true);
          setSmtp({
            host: data.host || '',
            port: data.port || '587',
            email: data.email || '',
            password: '', // Don't expose
            fromName: data.fromName || '',
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSmtp = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtp),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setSmtpConnected(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setSaving(false);
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    try {
      const res = await fetch('/api/user/smtp-config/test', { method: 'POST' });
      const data = await res.json();
      alert(data.success ? 'Test email sent successfully! Check your inbox.' : `Failed: ${data.error}`);
    } catch {
      alert('Test failed. Please check your settings.');
    }
    setTestingSmtp(false);
  };

  const handleDisconnectSmtp = async () => {
    const res = await fetch('/api/user/smtp-config', { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setSmtpConnected(false);
      setSmtp({ host: '', port: '587', email: '', password: '', fromName: '' });
    }
  };

  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[.02]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <div className="font-medium text-sm">Custom Email (SMTP)</div>
            <div className="text-xs text-gray-400 dark:text-white/30">
              {smtpConnected ? (
                <span className="text-green-400">{smtp.email || 'Configured'}</span>
              ) : (
                'For Yahoo, iCloud, company email, etc.'
              )}
            </div>
          </div>
        </div>
        {smtpConnected ? (
          <div className="flex gap-2">
            <button
              onClick={handleTestSmtp}
              disabled={testingSmtp}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 text-xs hover:bg-gray-200 dark:bg-white/10 transition-colors"
            >
              {testingSmtp ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Test'}
            </button>
            <button
              onClick={handleDisconnectSmtp}
              className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSmtp(!showSmtp)}
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 text-xs hover:bg-gray-200 dark:bg-white/10 transition-colors"
          >
            {showSmtp ? 'Close' : 'Configure'}
          </button>
        )}
      </div>

      {(showSmtp || smtpConnected) && (
        <div className="mt-4 space-y-3 border-t border-gray-100 dark:border-white/5 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-white/40 mb-1">SMTP Host</label>
              <input
                value={smtp.host}
                onChange={e => setSmtp({ ...smtp, host: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-gray-900 dark:text-white placeholder:text-gray-300 dark:text-white/20 focus:border-neon-blue/50 focus:outline-none"
                placeholder="smtp.mail.yahoo.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-white/40 mb-1">Port</label>
              <input
                value={smtp.port}
                onChange={e => setSmtp({ ...smtp, port: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-gray-900 dark:text-white placeholder:text-gray-300 dark:text-white/20 focus:border-neon-blue/50 focus:outline-none"
                placeholder="587"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-white/40 mb-1">Email Address</label>
            <input
              value={smtp.email}
              onChange={e => setSmtp({ ...smtp, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-gray-900 dark:text-white placeholder:text-gray-300 dark:text-white/20 focus:border-neon-blue/50 focus:outline-none"
              placeholder="you@yahoo.com"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-white/40 mb-1">App Password</label>
            <input
              type="password"
              value={smtp.password}
              onChange={e => setSmtp({ ...smtp, password: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-gray-900 dark:text-white placeholder:text-gray-300 dark:text-white/20 focus:border-neon-blue/50 focus:outline-none"
              placeholder={smtpConnected ? '••••••••' : 'App-specific password'}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-white/40 mb-1">Display Name (optional)</label>
            <input
              value={smtp.fromName}
              onChange={e => setSmtp({ ...smtp, fromName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-gray-900 dark:text-white placeholder:text-gray-300 dark:text-white/20 focus:border-neon-blue/50 focus:outline-none"
              placeholder="John Doe"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-300 dark:text-white/20">Use an app-specific password, not your main password. Your credentials are encrypted.</p>
            <button
              onClick={handleSaveSmtp}
              disabled={saving || !smtp.host || !smtp.email || (!smtpConnected && !smtp.password)}
              className="px-4 py-2 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-medium hover:bg-neon-blue/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
              {saved ? 'Saved!' : 'Save SMTP'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Resolve initial tab from URL ?tab= param
  const tabParam = searchParams.get('tab') as TabId | null;
  const initialTab: TabId = TABS.some((t) => t.id === tabParam) ? tabParam! : 'profile';

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // ----- Profile state -----
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', targetRole: '', location: '' });
  const [profileSaved, setProfileSaved] = useState(false);

  // ----- Avatar upload state -----
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // ----- Referral state -----
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // ----- Connected Email state -----
  const [emailConnections, setEmailConnections] = useState<{
    gmail?: { email: string; isPrimary: boolean };
    outlook?: { email: string; isPrimary: boolean };
  }>({});
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailDisconnecting, setEmailDisconnecting] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  // Handle email connection callback params from URL
  useEffect(() => {
    const error = searchParams.get('error');
    const connected = searchParams.get('email_connected');
    const email = searchParams.get('email');
    if (error) {
      setEmailError(decodeURIComponent(error));
      setActiveTab('email');
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings?tab=email');
    }
    if (connected) {
      setEmailSuccess(`${email || 'Email'} connected successfully!`);
      setActiveTab('email');
      fetchEmailConnections();
      window.history.replaceState({}, '', '/dashboard/settings?tab=email');
    }
  }, [searchParams]);

  // ----- Coach state -----
  const [coachPersonality, setCoachPersonality] = useState('friendly');
  const [coachSaved, setCoachSaved] = useState(false);

  // ----- Notifications state -----
  const [notifications, setNotifications] = useState<Record<string, boolean>>({});

  // ----- Privacy state -----
  const [comingSoonMsg, setComingSoonMsg] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ----- Billing state -----
  const [portalLoading, setPortalLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Data fetching                                                    */
  /* ---------------------------------------------------------------- */

  // Fetch profile
  useEffect(() => {
    setProfileLoading(true);
    fetch('/api/user/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProfileData | null) => {
        if (data) {
          setProfile(data);
          setProfileForm({
            name: data.name || '',
            targetRole: data.targetRole || '',
            location: data.location || '',
          });
          if (data.image) setAvatarUrl(data.image);
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  // Load coach settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('3box_coach_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.personality) setCoachPersonality(parsed.personality);
      }
    } catch { /* ignore */ }
  }, []);

  // Load notification preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('3box_notification_prefs');
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        // Default: essential notifications on, optional ones off
        setNotifications({
          'New job matches': true,
          'Learning reminders': false,
          'Application updates': true,
          'Weekly progress digest': true,
          'Coach tips': false,
        });
      }
    } catch { /* ignore */ }
  }, []);

  // Fetch referral data when tab switches to referral
  const fetchReferral = useCallback(() => {
    setReferralLoading(true);
    fetch('/api/referral')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ReferralData | null) => {
        if (data) setReferral(data);
      })
      .catch(() => {})
      .finally(() => setReferralLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'referral' && !referral) {
      fetchReferral();
    }
  }, [activeTab, referral, fetchReferral]);

  // Fetch email connections when tab switches to email
  const fetchEmailConnections = useCallback(async () => {
    setEmailLoading(true);
    try {
      const [gmailRes, outlookRes] = await Promise.all([
        fetch('/api/auth/gmail/status'),
        fetch('/api/auth/outlook/status'),
      ]);
      const gmail = gmailRes.ok ? await gmailRes.json() : null;
      const outlook = outlookRes.ok ? await outlookRes.json() : null;
      setEmailConnections({
        gmail: gmail?.connected ? { email: gmail.email, isPrimary: gmail.isPrimary } : undefined,
        outlook: outlook?.connected ? { email: outlook.email, isPrimary: outlook.isPrimary } : undefined,
      });
    } catch { /* ignore */ }
    setEmailLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'email') fetchEmailConnections();
  }, [activeTab, fetchEmailConnections]);

  const disconnectEmail = async (provider: 'gmail' | 'outlook') => {
    setEmailDisconnecting(provider);
    try {
      await fetch(`/api/auth/${provider}/disconnect`, { method: 'POST' });
      setEmailConnections((prev) => ({ ...prev, [provider]: undefined }));
    } catch { /* ignore */ }
    setEmailDisconnecting(null);
  };

  /* ---------------------------------------------------------------- */
  /*  Actions                                                          */
  /* ---------------------------------------------------------------- */

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch {
      // Silently fail
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so the same file can be re-selected
    e.target.value = '';

    // Validate client-side
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file.');
      setTimeout(() => setAvatarError(''), 4000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5 MB.');
      setTimeout(() => setAvatarError(''), 4000);
      return;
    }

    setAvatarUploading(true);
    setAvatarError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }

      const { url } = await res.json();
      setAvatarUrl(url);
      setProfile((prev) => (prev ? { ...prev, image: url } : prev));
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to upload avatar.');
      setTimeout(() => setAvatarError(''), 4000);
    } finally {
      setAvatarUploading(false);
    }
  };

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portal' }),
      });
      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      }
    } catch {
      // Silently fail
    } finally {
      setPortalLoading(false);
    }
  };

  const redeemCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const res = await fetch('/api/coupon/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setCouponMsg({ type: 'success', text: data.message || `Upgraded to ${data.plan}!` });
        setCouponCode('');
        // Refresh profile to reflect new plan
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setCouponMsg({ type: 'error', text: data.error || 'Failed to redeem coupon' });
      }
    } catch {
      setCouponMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setCouponLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteSending(true);
    setInviteSent(false);
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invite', email: inviteEmail.trim() }),
      });
      if (res.ok) {
        setInviteSent(true);
        setInviteEmail('');
        fetchReferral(); // refresh stats
        setTimeout(() => setInviteSent(false), 3000);
      }
    } catch {
      // Silently fail
    } finally {
      setInviteSending(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referral?.referralLink) return;
    try {
      await navigator.clipboard.writeText(referral.referralLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = referral.referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const saveCoachSettings = () => {
    localStorage.setItem('3box_coach_settings', JSON.stringify({ name: 'Cortex', personality: coachPersonality }));
    setCoachSaved(true);
    setTimeout(() => setCoachSaved(false), 2000);
  };

  const toggleNotification = (label: string) => {
    const updated = { ...notifications, [label]: !notifications[label] };
    setNotifications(updated);
    localStorage.setItem('3box_notification_prefs', JSON.stringify(updated));
  };

  const showComingSoon = (feature: string) => {
    setComingSoonMsg(`${feature}, coming soon!`);
    setTimeout(() => setComingSoonMsg(''), 2000);
  };

  /* ---------------------------------------------------------------- */
  /*  Derived values                                                   */
  /* ---------------------------------------------------------------- */

  const rawPlan = (profile?.plan || (session?.user as any)?.plan || 'FREE').toUpperCase();
  const PLAN_NORMALIZE: Record<string, string> = { BASIC: 'FREE', STARTER: 'PRO', ULTRA: 'MAX' };
  const userPlan = PLAN_NORMALIZE[rawPlan] || rawPlan;
  const userName = profile?.name || session?.user?.name || 'User';
  const userEmail = profile?.email || session?.user?.email || '';
  const creditsUsed = profile?.aiCreditsUsed ?? (session?.user as any)?.aiCreditsUsed ?? 0;
  const creditsLimit = profile?.aiCreditsLimit ?? (session?.user as any)?.aiCreditsLimit ?? 10;
  const creditPercent = creditsLimit > 0 ? Math.min(Math.round((creditsUsed / creditsLimit) * 100), 100) : 0;

  // Application limits (v1.7.0 — replaces token system)
  const weeklyAppsUsed = profile?.weeklyAppsUsed ?? 0;
  const weeklyAppsLimit = userPlan === 'FREE' ? 5 : userPlan === 'PRO' ? 20 : 50;
  const appsPercent = weeklyAppsLimit > 0 ? Math.min(Math.round((weeklyAppsUsed / weeklyAppsLimit) * 100), 100) : 0;

  const planLabel: Record<string, string> = {
    FREE: 'Free',
    PRO: 'Pro',
    MAX: 'Max',
  };

  const planFeatures: Record<string, string[]> = {
    FREE: [
      '5 job applications per week',
      'All 6 AI agents',
      'Unlimited AI operations',
      'Resume builder + PDF export',
      'Interview prep',
      'Skill gap analysis',
      'AI career coach (Cortex)',
    ],
    PRO: [
      '20 job applications per day',
      'All 6 AI agents',
      'Unlimited AI operations',
      'All resume templates',
      'Job matching + fit reports',
      'Interview prep + mock interviews',
      'Priority AI processing',
    ],
    MAX: [
      '50 job applications per day',
      'All 6 AI agents',
      'Unlimited AI operations',
      'Priority AI processing',
      'Skill gap analysis + learning',
      'Quality assurance + verification',
      'Everything in Pro',
    ],
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="max-w-4xl mx-auto">
      {/* Coming Soon Toast */}
      <AnimatePresence>
        {comingSoonMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 px-4 py-2 rounded-xl bg-white dark:bg-surface border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/70 shadow-lg"
          >
            {comingSoonMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <Settings className="w-7 h-7 text-gray-500 dark:text-white/60" /> Settings
        </h1>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* =============== PROFILE TAB =============== */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card">
                <h3 className="font-semibold mb-6">Profile Information</h3>

                {profileLoading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-white/10" />
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-gray-200 dark:bg-white/10 rounded" />
                        <div className="h-4 w-48 bg-gray-100 dark:bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 bg-gray-100 dark:bg-white/5 rounded-xl" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-6 mb-6">
                      {/* Hidden file input for avatar upload */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />

                      <div
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-2xl font-bold relative cursor-pointer group"
                        onClick={() => !avatarUploading && fileInputRef.current?.click()}
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={userName}
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          getInitials(userName)
                        )}

                        {/* Upload overlay on hover */}
                        {!avatarUploading && (
                          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-5 h-5 text-gray-700 dark:text-white/80" />
                          </div>
                        )}

                        {/* Loading spinner overlay */}
                        {avatarUploading && (
                          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-gray-900 dark:text-white animate-spin" />
                          </div>
                        )}

                        <button
                          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white dark:bg-surface border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-200 dark:bg-white/10 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!avatarUploading) fileInputRef.current?.click();
                          }}
                        >
                          {avatarUploading ? (
                            <Loader2 className="w-3.5 h-3.5 text-gray-500 dark:text-white/60 animate-spin" />
                          ) : (
                            <Camera className="w-3.5 h-3.5 text-gray-500 dark:text-white/60" />
                          )}
                        </button>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{userName}</div>
                        <div className="text-sm text-gray-500 dark:text-white/40">{userEmail}</div>
                        <div className="mt-1 badge bg-neon-blue/10 text-neon-blue text-xs">
                          <Zap className="w-3 h-3 mr-1" /> {planLabel[userPlan] || userPlan} Plan
                        </div>
                        {avatarError && (
                          <div className="mt-1 text-xs text-red-400">{avatarError}</div>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-white/40 mb-1">Full Name</label>
                        <input
                          className="input-field"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-white/40 mb-1">Email</label>
                        <input className="input-field" value={userEmail} disabled />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-white/40 mb-1">Target Role</label>
                        <input
                          className="input-field"
                          value={profileForm.targetRole}
                          onChange={(e) => setProfileForm((f) => ({ ...f, targetRole: e.target.value }))}
                          placeholder="e.g. AI Engineer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-white/40 mb-1">Location</label>
                        <input
                          className="input-field"
                          value={profileForm.location}
                          onChange={(e) => setProfileForm((f) => ({ ...f, location: e.target.value }))}
                          placeholder="e.g. San Francisco, CA"
                        />
                      </div>
                    </div>

                    <button
                      onClick={saveProfile}
                      disabled={profileSaving}
                      className="btn-primary text-sm mt-6 flex items-center gap-2"
                    >
                      {profileSaved ? (
                        <>
                          <Check className="w-4 h-4" /> Saved!
                        </>
                      ) : profileSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Save Changes
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* =============== CONNECTED EMAIL TAB =============== */}
          {activeTab === 'email' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card text-left">
                <h3 className="font-semibold mb-2 text-left">Connected Email Accounts</h3>
                <p className="text-sm text-gray-500 dark:text-white/40 mb-6 text-left">
                  Connect your Gmail so job applications are sent from your personal email, boosting response rates.
                </p>

                {/* Warning: applications go from our email if not connected */}
                {!emailConnections.gmail && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm text-left">
                    If you don&apos;t connect your Gmail, job applications will be sent from our system email address. For better response rates from employers, we strongly recommend connecting your personal Gmail.
                  </div>
                )}

                {emailError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2 text-left">
                    <span className="shrink-0 mt-0.5">!</span>
                    <span>{emailError}</span>
                    <button onClick={() => setEmailError(null)} className="ml-auto shrink-0 text-red-400/60 hover:text-red-400">x</button>
                  </div>
                )}
                {emailSuccess && (
                  <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-start gap-2 text-left">
                    <span className="shrink-0 mt-0.5">OK</span>
                    <span>{emailSuccess}</span>
                    <button onClick={() => setEmailSuccess(null)} className="ml-auto shrink-0 text-green-400/60 hover:text-green-400">x</button>
                  </div>
                )}

                {emailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-white/40" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Gmail */}
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[.02] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill="#EA4335"/></svg>
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-sm">Gmail</div>
                          {emailConnections.gmail ? (
                            <div className="text-xs text-green-400">{emailConnections.gmail.email}</div>
                          ) : (
                            <div className="text-xs text-gray-400 dark:text-white/30">Not connected</div>
                          )}
                        </div>
                      </div>
                      {emailConnections.gmail ? (
                        <button
                          onClick={() => disconnectEmail('gmail')}
                          disabled={emailDisconnecting === 'gmail'}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-colors disabled:opacity-50 shrink-0"
                        >
                          {emailDisconnecting === 'gmail' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Disconnect'}
                        </button>
                      ) : userPlan === 'FREE' ? (
                        <a
                          href="/pricing"
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-purple/30 text-neon-purple text-xs hover:from-neon-blue/30 hover:to-neon-purple/30 transition-colors shrink-0"
                        >
                          Upgrade to PRO
                        </a>
                      ) : (
                        <a
                          href="/api/auth/gmail/connect"
                          className="px-3 py-1.5 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs hover:bg-neon-blue/20 transition-colors shrink-0"
                        >
                          Connect Gmail
                        </a>
                      )}
                    </div>

                    {userPlan === 'FREE' && (
                      <div className="p-4 rounded-xl border border-neon-purple/20 bg-neon-purple/5">
                        <p className="text-xs text-gray-500 dark:text-white/60 mb-2">Applications sent from your personal email have 3x higher response rates.</p>
                        <a href="/pricing" className="text-xs text-neon-purple hover:underline">Upgrade to PRO to connect your email</a>
                      </div>
                    )}

                    {/* Outlook, Coming Soon */}
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[.02] flex items-center justify-between opacity-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.3L19.4 7.5 12 11.7 4.6 7.5 12 4.3zM4 9l7.5 4v7.5L4 16.5V9zm9.5 11.5V13L21 9v7.5l-7.5 4z" fill="#0078D4"/></svg>
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-sm">Outlook / Microsoft</div>
                          <div className="text-xs text-gray-400 dark:text-white/30">Coming soon</div>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/30 text-xs shrink-0">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                )}

                {/* Info box */}
                <div className="mt-6 p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/10 text-left">
                  <h4 className="text-xs font-semibold text-neon-blue mb-2">Why Connect Your Email?</h4>
                  <ul className="text-xs text-gray-500 dark:text-white/40 space-y-1.5 list-disc pl-4">
                    <li>Applications sent from your personal email have 3x higher response rates</li>
                    <li>Employers see your name, not a generic company address</li>
                    <li>We only use the &quot;send email&quot; permission. We never read your inbox</li>
                    <li>You can disconnect at any time</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* =============== BILLING TAB =============== */}
          {activeTab === 'billing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card">
                <h3 className="font-semibold mb-6">Current Plan</h3>
                <div className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/20 flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-neon-blue" />
                    <div>
                      <div className="font-semibold">{planLabel[userPlan] || userPlan} Plan</div>
                      <div className="text-sm text-gray-500 dark:text-white/40">
                        {userPlan === 'FREE'
                          ? 'Free forever'
                          : userPlan === 'PRO'
                            ? '$29/month'
                            : '$59/month'}
                      </div>
                    </div>
                  </div>
                  {userPlan !== 'MAX' && (
                    <a href="/pricing" className="btn-secondary text-sm">
                      {userPlan === 'FREE' ? 'Upgrade' : 'Upgrade to Max'}
                    </a>
                  )}
                </div>

                {/* Application Usage */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-white/40">Applications Used</span>
                    <span>
                      {weeklyAppsUsed} / {weeklyAppsLimit} {userPlan === 'FREE' ? 'this week' : 'today'}
                    </span>
                  </div>
                  <div className="skill-bar h-2">
                    <div
                      className={`skill-bar-fill ${appsPercent > 80 ? 'bg-red-400' : 'bg-neon-blue'}`}
                      style={{ width: `${appsPercent}%` }}
                    />
                  </div>
                </div>

                {/* Plan Features */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-3">Plan Includes</h4>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {(planFeatures[userPlan] || planFeatures.FREE).map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50">
                        <div className="w-1 h-1 rounded-full bg-neon-green flex-shrink-0" />
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>

                {userPlan !== 'FREE' && (
                  <button
                    onClick={openBillingPortal}
                    disabled={portalLoading}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {portalLoading ? 'Opening...' : 'Manage Billing on Stripe'}
                  </button>
                )}
              </div>

              {/* Coupon Redemption */}
              <div className="card mt-6">
                <h3 className="font-semibold mb-2">Have a Coupon Code?</h3>
                <p className="text-sm text-gray-500 dark:text-white/40 mb-4">Enter your coupon code to upgrade your plan.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="input-field flex-1 font-mono"
                    placeholder="Enter coupon code"
                  />
                  <button
                    onClick={redeemCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="btn-primary text-sm flex items-center gap-2 whitespace-nowrap disabled:opacity-30"
                  >
                    {couponLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Redeem'
                    )}
                  </button>
                </div>
                {couponMsg && (
                  <div className={`mt-3 p-3 rounded-xl text-sm ${
                    couponMsg.type === 'success'
                      ? 'bg-neon-green/10 border border-neon-green/20 text-neon-green'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    {couponMsg.text}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* =============== REFERRAL TAB =============== */}
          {activeTab === 'referral' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Header Card */}
              <div className="card mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-blue/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-neon-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Refer & Earn</h3>
                    <p className="text-sm text-gray-500 dark:text-white/40">
                      Both you and your friend get +5 extra applications this week when they sign up!
                    </p>
                  </div>
                </div>
              </div>

              {referralLoading ? (
                <div className="card animate-pulse space-y-4">
                  <div className="h-5 w-40 bg-gray-200 dark:bg-white/10 rounded" />
                  <div className="h-12 bg-gray-100 dark:bg-white/5 rounded-xl" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-gray-100 dark:bg-white/5 rounded-xl" />
                    <div className="h-20 bg-gray-100 dark:bg-white/5 rounded-xl" />
                  </div>
                </div>
              ) : referral ? (
                <>
                  {/* Referral Link */}
                  <div className="card mb-6">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-white/60 mb-3">Your Referral Link</h4>
                    <div className="flex gap-2">
                      <input
                        className="input-field flex-1 text-sm"
                        value={referral.referralLink}
                        readOnly
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        onClick={copyReferralLink}
                        className="btn-secondary text-sm flex items-center gap-2 whitespace-nowrap"
                      >
                        {linkCopied ? (
                          <>
                            <Check className="w-4 h-4 text-neon-green" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="card flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-neon-blue/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-neon-blue" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{referral.totalReferrals}</div>
                        <div className="text-sm text-gray-500 dark:text-white/40">Friends Invited</div>
                      </div>
                    </div>
                    <div className="card flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center">
                        <Award className="w-6 h-6 text-neon-green" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{referral.rewardedReferrals}</div>
                        <div className="text-sm text-gray-500 dark:text-white/40">Rewards Earned</div>
                      </div>
                    </div>
                  </div>

                  {/* Invite Form */}
                  <div className="card">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-white/60 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Invite by Email
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        className="input-field flex-1 text-sm"
                        placeholder="friend@email.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
                      />
                      <button
                        onClick={sendInvite}
                        disabled={inviteSending || !inviteEmail.trim()}
                        className="btn-primary text-sm flex items-center gap-2 whitespace-nowrap"
                      >
                        {inviteSent ? (
                          <>
                            <Check className="w-4 h-4" /> Sent!
                          </>
                        ) : inviteSending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" /> Send Invite
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="card text-center py-8 text-gray-500 dark:text-white/40 text-sm">
                  Unable to load referral data. Please try again later.
                </div>
              )}
            </motion.div>
          )}

          {/* =============== COACH TAB =============== */}
          {activeTab === 'coach' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card">
                <h3 className="font-semibold mb-6">AI Coach Customization</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-white/60 mb-3">Personality</label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { id: 'friendly', label: 'Friendly', desc: 'Warm, encouraging, supportive' },
                        { id: 'professional', label: 'Professional', desc: 'Formal, concise, business-like' },
                        { id: 'motivational', label: 'Motivational', desc: 'Energetic, pushing boundaries' },
                        { id: 'technical', label: 'Technical', desc: 'Detailed, precise, analytical' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setCoachPersonality(p.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            coachPersonality === p.id
                              ? 'border-neon-blue/50 bg-neon-blue/5'
                              : 'border-gray-200 dark:border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="text-sm font-medium">{p.label}</div>
                          <div className="text-xs text-gray-500 dark:text-white/40 mt-1">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={saveCoachSettings} className="btn-primary text-sm flex items-center gap-2">
                    {coachSaved ? (
                      <><Check className="w-4 h-4" /> Saved!</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save Coach Settings</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* =============== NOTIFICATIONS TAB =============== */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card">
                <h3 className="font-semibold mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { label: 'New job matches', desc: 'Get notified when AI finds matching jobs' },
                    { label: 'Learning reminders', desc: 'Daily reminders to continue learning' },
                    { label: 'Application updates', desc: 'Status changes on your applications' },
                    { label: 'Weekly progress digest', desc: 'Summary of your career progress' },
                    { label: 'Coach tips', desc: 'AI coach tips and insights' },
                  ].map((n) => (
                    <div key={n.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
                      <div>
                        <div className="text-sm font-medium">{n.label}</div>
                        <div className="text-xs text-gray-500 dark:text-white/40">{n.desc}</div>
                      </div>
                      <button
                        onClick={() => toggleNotification(n.label)}
                        className={`w-10 h-6 rounded-full relative transition-colors ${notifications[n.label] ? 'bg-neon-blue/30' : 'bg-gray-200 dark:bg-white/10'}`}
                      >
                        <div className={`w-4 h-4 rounded-full absolute top-1 transition-all ${notifications[n.label] ? 'right-1 bg-neon-blue' : 'left-1 bg-gray-300 dark:bg-white/40'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* =============== PRIVACY TAB =============== */}
          {activeTab === 'privacy' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Change Password */}
              <div className="card">
                <h3 className="font-semibold mb-4">Change Password</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (newPassword !== confirmPassword) {
                    setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
                    return;
                  }
                  setPasswordLoading(true);
                  setPasswordMsg(null);
                  try {
                    const res = await fetch('/api/user/change-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ currentPassword, newPassword }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setPasswordMsg({ type: 'success', text: 'Password changed successfully' });
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    } else {
                      setPasswordMsg({ type: 'error', text: data.error || 'Failed to change password' });
                    }
                  } catch {
                    setPasswordMsg({ type: 'error', text: 'Something went wrong' });
                  } finally {
                    setPasswordLoading(false);
                  }
                }} className="space-y-3">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-field w-full"
                    required
                  />
                  <input
                    type="password"
                    placeholder="New password (min 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field w-full"
                    minLength={8}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field w-full"
                    required
                  />
                  {passwordMsg && (
                    <p className={`text-sm ${passwordMsg.type === 'success' ? 'text-neon-green' : 'text-red-400'}`}>
                      {passwordMsg.text}
                    </p>
                  )}
                  <button type="submit" disabled={passwordLoading} className="btn-primary text-sm">
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>

              {/* Data Export */}
              <div className="card">
                <h3 className="font-semibold mb-2">Download My Data</h3>
                <p className="text-sm text-gray-500 dark:text-white/40 mb-4">
                  Export all your data including profile, assessments, career plans, resumes, and more as a JSON file.
                </p>
                <button
                  onClick={async () => {
                    setExportLoading(true);
                    try {
                      const res = await fetch('/api/user/export-data');
                      if (res.ok) {
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `3box-data-export-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    } catch {} finally {
                      setExportLoading(false);
                    }
                  }}
                  disabled={exportLoading}
                  className="btn-secondary text-sm"
                >
                  {exportLoading ? 'Preparing download...' : 'Download My Data'}
                </button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="card">
                <h3 className="font-semibold mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500 dark:text-white/40 mb-3">
                  Add an extra layer of security to your account with two-factor authentication.
                </p>
                <button className="btn-secondary text-sm opacity-50 cursor-not-allowed" disabled>
                  Enable 2FA (Coming Soon)
                </button>
              </div>

              {/* Sign Out & Delete */}
              <div className="card">
                <h3 className="font-semibold mb-4">Account Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-sm text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>

                  <div className="pt-3 border-t border-gray-100 dark:border-white/5">
                    <p className="text-xs text-gray-400 dark:text-white/30 mb-2">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    {!showDeleteModal ? (
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="text-sm text-red-400 hover:text-red-300 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Account
                      </button>
                    ) : (
                      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                        <p className="text-sm text-red-400 font-medium">
                          Are you sure? Type DELETE to confirm:
                        </p>
                        <input
                          type="text"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder="Type DELETE"
                          className="input-field w-full border-red-500/20"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (deleteConfirm !== 'DELETE') return;
                              setDeleteLoading(true);
                              try {
                                const res = await fetch('/api/user/delete-account', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ confirmation: 'DELETE' }),
                                });
                                if (res.ok) {
                                  signOut({ callbackUrl: '/' });
                                }
                              } catch {} finally {
                                setDeleteLoading(false);
                              }
                            }}
                            disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                            className="px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
                          </button>
                          <button
                            onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                            className="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/60 hover:bg-gray-200 dark:bg-white/10"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
