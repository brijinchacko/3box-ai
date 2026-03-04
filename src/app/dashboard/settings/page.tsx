'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Settings, User, CreditCard, Bot, Bell, Shield, Gift,
  Save, Zap, Camera, LogOut, Trash2, Copy, Check, Send,
  ExternalLink, Users, Award, Mail
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

  // ----- Referral state -----
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // ----- Coach state -----
  const [coachName, setCoachName] = useState('Horace');
  const [coachPersonality, setCoachPersonality] = useState('friendly');

  // ----- Billing state -----
  const [portalLoading, setPortalLoading] = useState(false);

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
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
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

  /* ---------------------------------------------------------------- */
  /*  Actions                                                          */
  /* ---------------------------------------------------------------- */

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
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

  /* ---------------------------------------------------------------- */
  /*  Derived values                                                   */
  /* ---------------------------------------------------------------- */

  const userPlan = profile?.plan || (session?.user as any)?.plan || 'BASIC';
  const userName = profile?.name || session?.user?.name || 'User';
  const userEmail = profile?.email || session?.user?.email || '';
  const creditsUsed = profile?.aiCreditsUsed ?? (session?.user as any)?.aiCreditsUsed ?? 0;
  const creditsLimit = profile?.aiCreditsLimit ?? (session?.user as any)?.aiCreditsLimit ?? 10;
  const creditPercent = creditsLimit > 0 ? Math.min(Math.round((creditsUsed / creditsLimit) * 100), 100) : 0;

  const planLabel: Record<string, string> = {
    BASIC: 'Basic (Free)',
    STARTER: 'Starter',
    PRO: 'Pro',
    ULTRA: 'Ultra',
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <Settings className="w-7 h-7 text-white/60" /> Settings
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
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
                      <div className="w-20 h-20 rounded-full bg-white/10" />
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-white/10 rounded" />
                        <div className="h-4 w-48 bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 bg-white/5 rounded-xl" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-6 mb-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-2xl font-bold relative">
                        {getInitials(userName)}
                        <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center">
                          <Camera className="w-3.5 h-3.5 text-white/60" />
                        </button>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{userName}</div>
                        <div className="text-sm text-white/40">{userEmail}</div>
                        <div className="mt-1 badge bg-neon-blue/10 text-neon-blue text-xs">
                          <Zap className="w-3 h-3 mr-1" /> {planLabel[userPlan] || userPlan} Plan
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Full Name</label>
                        <input
                          className="input-field"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Email</label>
                        <input className="input-field" value={userEmail} disabled />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Target Role</label>
                        <input
                          className="input-field"
                          value={profileForm.targetRole}
                          onChange={(e) => setProfileForm((f) => ({ ...f, targetRole: e.target.value }))}
                          placeholder="e.g. AI Engineer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Location</label>
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
                      <div className="text-sm text-white/40">
                        {userPlan === 'BASIC'
                          ? 'Free forever'
                          : userPlan === 'STARTER'
                            ? '$9/month'
                            : userPlan === 'PRO'
                              ? '$19/month'
                              : '$39/month'}
                      </div>
                    </div>
                  </div>
                  {userPlan !== 'ULTRA' && (
                    <a href="/pricing" className="btn-secondary text-sm">
                      {userPlan === 'BASIC' ? 'Upgrade' : 'Upgrade to Ultra'}
                    </a>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">AI Credits Used</span>
                    <span>
                      {creditsUsed} / {creditsLimit === -1 ? 'Unlimited' : creditsLimit}
                    </span>
                  </div>
                  {creditsLimit > 0 && (
                    <div className="skill-bar h-2">
                      <div
                        className={`skill-bar-fill ${creditPercent > 80 ? 'bg-red-400' : 'bg-neon-blue'}`}
                        style={{ width: `${creditPercent}%` }}
                      />
                    </div>
                  )}
                </div>

                {userPlan !== 'BASIC' && (
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
                    <p className="text-sm text-white/40">
                      For each friend who signs up and upgrades, you both get 1 month of Pro free!
                    </p>
                  </div>
                </div>
              </div>

              {referralLoading ? (
                <div className="card animate-pulse space-y-4">
                  <div className="h-5 w-40 bg-white/10 rounded" />
                  <div className="h-12 bg-white/5 rounded-xl" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-white/5 rounded-xl" />
                    <div className="h-20 bg-white/5 rounded-xl" />
                  </div>
                </div>
              ) : referral ? (
                <>
                  {/* Referral Link */}
                  <div className="card mb-6">
                    <h4 className="text-sm font-medium text-white/60 mb-3">Your Referral Link</h4>
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
                        <div className="text-sm text-white/40">Friends Invited</div>
                      </div>
                    </div>
                    <div className="card flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center">
                        <Award className="w-6 h-6 text-neon-green" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{referral.rewardedReferrals}</div>
                        <div className="text-sm text-white/40">Rewards Earned</div>
                      </div>
                    </div>
                  </div>

                  {/* Invite Form */}
                  <div className="card">
                    <h4 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
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
                <div className="card text-center py-8 text-white/40 text-sm">
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
                    <label className="block text-sm text-white/60 mb-1.5">Coach Name</label>
                    <input
                      className="input-field"
                      value={coachName}
                      onChange={(e) => setCoachName(e.target.value)}
                      placeholder="Name your AI coach"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-3">Personality</label>
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
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="text-sm font-medium">{p.label}</div>
                          <div className="text-xs text-white/40 mt-1">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className="btn-primary text-sm flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Coach Settings
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
                    <div key={n.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                      <div>
                        <div className="text-sm font-medium">{n.label}</div>
                        <div className="text-xs text-white/40">{n.desc}</div>
                      </div>
                      <div className="w-10 h-6 rounded-full bg-neon-blue/30 relative cursor-pointer">
                        <div className="w-4 h-4 rounded-full bg-neon-blue absolute top-1 right-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* =============== PRIVACY TAB =============== */}
          {activeTab === 'privacy' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card">
                <h3 className="font-semibold mb-6">Privacy & Security</h3>
                <div className="space-y-4">
                  <button className="btn-secondary text-sm w-full text-left">Change Password</button>
                  <button className="btn-secondary text-sm w-full text-left">Enable Two-Factor Authentication</button>
                  <button className="btn-secondary text-sm w-full text-left">Download My Data</button>
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="text-sm text-white/60 hover:text-white flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                    <button className="text-sm text-red-400 hover:text-red-300 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete Account
                    </button>
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
