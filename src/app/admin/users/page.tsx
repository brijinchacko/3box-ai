'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Trash2, X, AlertTriangle, Shield, Crown,
  Eye, Download, Mail, Calendar, CreditCard, Briefcase, Activity, User as UserIcon,
  FileText, Zap, Globe, ArrowUpRight, CheckCircle2, XCircle, Clock, TrendingUp,
  Loader2,
} from 'lucide-react';

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  plan: string;
  createdAt: string;
  updatedAt: string;
  onboardingDone: boolean;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  totalAppsUsed: number;
  dailyAppsUsed: number;
  isOforoInternal: boolean;
  isStudent: boolean;
  stripeCustomerId: string | null;
  referralCode: string | null;
  referredBy: string | null;
  signupSource: string;
  revenue: { total: number; count: number };
  subscriptions: { plan: string; status: string; interval: string }[];
  accounts: { provider: string }[];
  _count: {
    assessments: number;
    resumes: number;
    careerPlans: number;
    learningPaths: number;
    jobApplications: number;
    scoutJobs: number;
    agentActivities: number;
    auditLogs: number;
    searchProfiles: number;
    subscriptions: number;
    creditPurchases: number;
    emailConnections: number;
  };
}

interface UserDetail extends UserData {
  emailVerified: string | null;
  totalRevenue: number;
  appStatusBreakdown: Record<string, number>;
  appMethodBreakdown: Record<string, number>;
  stripeSubId: string | null;
  hasUnlimitedDaily: boolean;
  dailyAppsResetAt: string;
  resumes: { id: string; isFinalized: boolean; approvalStatus: string; version: number; createdAt: string; updatedAt: string }[];
  jobApplications: { id: string; jobTitle: string; company: string; status: string; applicationMethod: string; matchScore: number; appliedAt: string; createdAt: string; source: string }[];
  subscriptions: { id: string; plan: string; status: string; interval: string; currentPeriodStart: string; currentPeriodEnd: string; cancelAtPeriodEnd: boolean; createdAt: string }[];
  creditPurchases: { id: string; credits: number; amountPaid: number; createdAt: string }[];
  agentActivities: { id: string; agent: string; action: string; summary: string; creditsUsed: number; createdAt: string }[];
  scoutJobs: { id: string; title: string; company: string; status: string; matchScore: number; source: string; discoveredAt: string; appliedAt: string }[];
  searchProfiles: { id: string; name: string; roles: any; locations: any; active: boolean; createdAt: string }[];
  autoApplyConfig: { enabled: boolean; automationMode: string; scoutEnabled: boolean; archerEnabled: boolean } | null;
  careerTwin: { targetRoles: any; skillSnapshot: any; marketReadiness: number; hireProb: number } | null;
  emailConnections: { provider: string; emailAddress: string; isActive: boolean; expiresAt: string }[];
  referralsGiven: { id: string; createdAt: string }[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  // Detail drawer
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'applications' | 'activity' | 'billing'>('overview');

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<UserData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Upgrade modal
  const [upgradeModal, setUpgradeModal] = useState<UserData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeSuccess, setUpgradeSuccess] = useState('');

  // Export
  const [exporting, setExporting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '25',
      ...(search && { search }),
      ...(planFilter && { plan: planFilter }),
    });
    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {}
    setLoading(false);
  }, [page, planFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openUserDetail = async (userId: string) => {
    setDetailLoading(true);
    setDetailTab('overview');
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data);
      }
    } catch {}
    setDetailLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!deleteModal || deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/admin/users/${deleteModal.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error || 'Failed'); return; }
      setDeleteModal(null);
      setDeleteConfirm('');
      fetchUsers();
    } catch { setDeleteError('Network error'); } finally { setDeleting(false); }
  };

  const handleUpgradeUser = async () => {
    if (!upgradeModal || !selectedPlan) return;
    setUpgrading(true);
    setUpgradeError('');
    setUpgradeSuccess('');
    try {
      const res = await fetch(`/api/admin/users/${upgradeModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) { setUpgradeError(data.error || 'Failed'); return; }
      setUpgradeSuccess(`Upgraded to ${selectedPlan}`);
      setTimeout(() => { setUpgradeModal(null); setSelectedPlan(''); setUpgradeSuccess(''); fetchUsers(); }, 1200);
    } catch { setUpgradeError('Network error'); } finally { setUpgrading(false); }
  };

  // Export all users as CSV
  const exportReport = async () => {
    setExporting(true);
    try {
      // Fetch all users (up to 1000)
      const res = await fetch(`/api/admin/users?limit=1000&page=1${planFilter ? `&plan=${planFilter}` : ''}${search ? `&search=${search}` : ''}`);
      const data = await res.json();
      const allUsers: UserData[] = data.users || [];

      const headers = [
        'Name', 'Email', 'Plan', 'Signup Source', 'Joined', 'Last Active',
        'Onboarded', 'AI Credits Used', 'Total Apps', 'Daily Apps',
        'Resumes', 'Assessments', 'Career Plans', 'Jobs Discovered',
        'Jobs Applied', 'Search Profiles', 'Agent Activities',
        'Revenue ($)', 'Subscriptions', 'Referral Code', 'Referred By', 'Is Admin',
      ];

      const rows = allUsers.map(u => [
        u.name || '',
        u.email || '',
        u.plan,
        u.signupSource,
        new Date(u.createdAt).toLocaleDateString(),
        new Date(u.updatedAt).toLocaleDateString(),
        u.onboardingDone ? 'Yes' : 'No',
        u.aiCreditsUsed,
        u.totalAppsUsed,
        u.dailyAppsUsed,
        u._count.resumes,
        u._count.assessments,
        u._count.careerPlans,
        u._count.scoutJobs,
        u._count.jobApplications,
        u._count.searchProfiles,
        u._count.agentActivities,
        u.revenue.total.toFixed(2),
        u._count.subscriptions,
        u.referralCode || '',
        u.referredBy || '',
        u.isOforoInternal ? 'Yes' : 'No',
      ]);

      const csv = [headers, ...rows].map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `3box-users-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {} finally { setExporting(false); }
  };

  // Export single user report
  const exportUserReport = () => {
    if (!selectedUser) return;
    const u = selectedUser;

    const lines = [
      `User Report: ${u.name || u.email}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      '=== PROFILE ===',
      `Name: ${u.name || 'N/A'}`,
      `Email: ${u.email || 'N/A'}`,
      `Plan: ${u.plan}`,
      `Signup Source: ${u.signupSource}`,
      `Joined: ${new Date(u.createdAt).toLocaleString()}`,
      `Last Active: ${new Date(u.updatedAt).toLocaleString()}`,
      `Email Verified: ${u.emailVerified ? 'Yes' : 'No'}`,
      `Onboarding: ${u.onboardingDone ? 'Complete' : 'Incomplete'}`,
      `Is Student: ${u.isStudent ? 'Yes' : 'No'}`,
      `Is Admin: ${u.isOforoInternal ? 'Yes' : 'No'}`,
      `Referral Code: ${u.referralCode || 'N/A'}`,
      `Referred By: ${u.referredBy || 'N/A'}`,
      `Referrals Given: ${u.referralsGiven?.length || 0}`,
      '',
      '=== USAGE ===',
      `AI Credits Used: ${u.aiCreditsUsed}/${u.aiCreditsLimit === -1 ? 'Unlimited' : u.aiCreditsLimit}`,
      `Total Applications: ${u.totalAppsUsed}`,
      `Daily Applications: ${u.dailyAppsUsed}`,
      `Resumes: ${u._count.resumes}`,
      `Assessments: ${u._count.assessments}`,
      `Career Plans: ${u._count.careerPlans}`,
      `Jobs Discovered: ${u._count.scoutJobs}`,
      `Jobs Applied: ${u._count.jobApplications}`,
      `Search Profiles: ${u._count.searchProfiles}`,
      `Agent Activities: ${u._count.agentActivities}`,
      '',
      '=== BILLING ===',
      `Total Revenue: $${u.totalRevenue.toFixed(2)}`,
      `Stripe Customer ID: ${u.stripeCustomerId || 'N/A'}`,
    ];

    if (u.subscriptions.length > 0) {
      lines.push('', 'Subscriptions:');
      u.subscriptions.forEach(s => {
        lines.push(`  - ${s.plan} (${s.interval}) — ${s.status} — ${new Date(s.createdAt).toLocaleDateString()}`);
      });
    }
    if (u.creditPurchases.length > 0) {
      lines.push('', 'Credit Purchases:');
      u.creditPurchases.forEach(p => {
        lines.push(`  - ${p.credits} credits — $${(p.amountPaid / 100).toFixed(2)} — ${new Date(p.createdAt).toLocaleDateString()}`);
      });
    }

    lines.push('', '=== APPLICATION STATUS BREAKDOWN ===');
    Object.entries(u.appStatusBreakdown).forEach(([status, count]) => {
      lines.push(`  ${status}: ${count}`);
    });

    lines.push('', '=== APPLICATION METHOD BREAKDOWN ===');
    Object.entries(u.appMethodBreakdown).forEach(([method, count]) => {
      lines.push(`  ${method}: ${count}`);
    });

    if (u.jobApplications.length > 0) {
      lines.push('', '=== RECENT APPLICATIONS ===');
      u.jobApplications.slice(0, 20).forEach(a => {
        lines.push(`  ${a.jobTitle} at ${a.company} — ${a.status} — ${a.applicationMethod || 'N/A'} — ${a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : 'Pending'}`);
      });
    }

    if (u.agentActivities.length > 0) {
      lines.push('', '=== RECENT AGENT ACTIVITY ===');
      u.agentActivities.slice(0, 20).forEach(a => {
        lines.push(`  [${a.agent}] ${a.summary} — ${new Date(a.createdAt).toLocaleString()}`);
      });
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-report-${(u.email || u.id).replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const planColors: Record<string, string> = {
    FREE: 'text-white/40 bg-white/5',
    BASIC: 'text-white/40 bg-white/5',
    STARTER: 'text-neon-green bg-neon-green/10',
    PRO: 'text-neon-blue bg-neon-blue/10',
    MAX: 'text-neon-blue bg-neon-blue/10',
    ULTRA: 'text-neon-purple bg-neon-purple/10',
  };

  const statusColors: Record<string, string> = {
    APPLIED: 'text-green-400',
    EMAILED: 'text-emerald-400',
    QUEUED: 'text-gray-400',
    APPLYING: 'text-purple-400',
    INTERVIEW: 'text-indigo-400',
    OFFER: 'text-yellow-400',
    REJECTED: 'text-red-400',
    SKIPPED: 'text-orange-400',
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString();
  const fmtDateTime = (d: string) => new Date(d).toLocaleString();
  const relTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-white/40 text-sm mt-1">{total} total users</p>
        </div>
        <button
          onClick={exportReport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-sm font-medium hover:bg-neon-purple/20 transition-colors disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="input-field pl-10 w-full"
            />
          </div>
        </form>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="input-field w-auto"
        >
          <option value="">All Plans</option>
          <option value="FREE">Free</option>
          <option value="BASIC">Basic</option>
          <option value="STARTER">Starter</option>
          <option value="PRO">Pro</option>
          <option value="MAX">Max</option>
          <option value="ULTRA">Ultra</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 bg-white/[0.02]">
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-3">Plan</th>
                <th className="text-left py-3 px-3">Source</th>
                <th className="text-left py-3 px-3">Joined</th>
                <th className="text-center py-3 px-3">Credits</th>
                <th className="text-center py-3 px-3">Apps</th>
                <th className="text-center py-3 px-3">Jobs Found</th>
                <th className="text-center py-3 px-3">Resumes</th>
                <th className="text-center py-3 px-3">Revenue</th>
                <th className="text-center py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 px-4" colSpan={10}>
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td className="py-8 px-4 text-center text-white/30" colSpan={10}>No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => openUserDetail(u.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {u.image ? (
                          <img src={u.image} alt="" className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50">
                            {(u.name || u.email || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            {u.name || 'No name'}
                            {u.isOforoInternal && <Shield className="w-3 h-3 text-neon-purple" />}
                          </div>
                          <div className="text-xs text-white/30">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[u.plan] || planColors.FREE}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white/40 text-xs capitalize">{u.signupSource}</td>
                    <td className="py-3 px-3 text-white/40 text-xs whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                    <td className="py-3 px-3 text-center text-white/60 text-xs">
                      {u.aiCreditsUsed}/{u.aiCreditsLimit === -1 ? '\u221E' : u.aiCreditsLimit}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={u.totalAppsUsed > 0 ? 'text-neon-green' : 'text-white/30'}>{u.totalAppsUsed}</span>
                    </td>
                    <td className="py-3 px-3 text-center text-white/60">{u._count.scoutJobs}</td>
                    <td className="py-3 px-3 text-center text-white/60">{u._count.resumes}</td>
                    <td className="py-3 px-3 text-center">
                      {u.revenue.total > 0 ? (
                        <span className="text-neon-green font-medium">${u.revenue.total.toFixed(0)}</span>
                      ) : (
                        <span className="text-white/20">$0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openUserDetail(u.id)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-white/60 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setUpgradeModal(u); setSelectedPlan(u.plan); setUpgradeError(''); setUpgradeSuccess(''); }}
                          className="p-1.5 rounded-lg hover:bg-neon-purple/10 text-white/20 hover:text-neon-purple transition-colors"
                          title="Change plan"
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                        {!u.isOforoInternal && (
                          <button
                            onClick={() => { setDeleteModal(u); setDeleteConfirm(''); setDeleteError(''); }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-sm text-white/40">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-ghost text-sm disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-ghost text-sm disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ USER DETAIL DRAWER ═══ */}
      {(selectedUser || detailLoading) && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-2xl bg-surface-50 border-l border-white/10 overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
              </div>
            ) : selectedUser && (
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {selectedUser.image ? (
                      <img src={selectedUser.image} alt="" className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold text-white/50">
                        {(selectedUser.name || selectedUser.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        {selectedUser.name || 'No name'}
                        {selectedUser.isOforoInternal && <Shield className="w-4 h-4 text-neon-purple" />}
                      </h2>
                      <p className="text-sm text-white/40">{selectedUser.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[selectedUser.plan] || planColors.FREE}`}>
                          {selectedUser.plan}
                        </span>
                        <span className="text-xs text-white/30">via {selectedUser.signupSource}</span>
                        <span className="text-xs text-white/30">Joined {fmtDate(selectedUser.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportUserReport}
                      className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
                      title="Download report"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-lg font-bold text-neon-green">{selectedUser.totalAppsUsed}</p>
                    <p className="text-[10px] text-white/30">Applications</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-lg font-bold text-neon-blue">{selectedUser._count.scoutJobs}</p>
                    <p className="text-[10px] text-white/30">Jobs Found</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-lg font-bold text-neon-purple">{selectedUser.aiCreditsUsed}</p>
                    <p className="text-[10px] text-white/30">Credits Used</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-lg font-bold text-yellow-400">${selectedUser.totalRevenue.toFixed(0)}</p>
                    <p className="text-[10px] text-white/30">Revenue</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5">
                  {(['overview', 'applications', 'activity', 'billing'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setDetailTab(tab)}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors capitalize ${
                        detailTab === tab ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {detailTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Profile Details */}
                    <div className="glass p-4 space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2"><UserIcon className="w-4 h-4 text-white/40" /> Profile</h3>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div><span className="text-white/30">Email Verified:</span> <span className={selectedUser.emailVerified ? 'text-neon-green' : 'text-red-400'}>{selectedUser.emailVerified ? 'Yes' : 'No'}</span></div>
                        <div><span className="text-white/30">Onboarding:</span> <span className={selectedUser.onboardingDone ? 'text-neon-green' : 'text-orange-400'}>{selectedUser.onboardingDone ? 'Complete' : 'Incomplete'}</span></div>
                        <div><span className="text-white/30">Student:</span> {selectedUser.isStudent ? 'Yes' : 'No'}</div>
                        <div><span className="text-white/30">Last Active:</span> {relTime(selectedUser.updatedAt)}</div>
                        <div><span className="text-white/30">Referral Code:</span> {selectedUser.referralCode || 'N/A'}</div>
                        <div><span className="text-white/30">Referred By:</span> {selectedUser.referredBy || 'N/A'}</div>
                        <div><span className="text-white/30">Referrals Given:</span> {selectedUser.referralsGiven?.length || 0}</div>
                        <div><span className="text-white/30">Stripe ID:</span> <span className="font-mono text-[10px]">{selectedUser.stripeCustomerId || 'N/A'}</span></div>
                      </div>
                    </div>

                    {/* Usage Summary */}
                    <div className="glass p-4 space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-white/40" /> Usage</h3>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                          <p className="text-base font-bold">{selectedUser._count.resumes}</p>
                          <p className="text-white/30">Resumes</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                          <p className="text-base font-bold">{selectedUser._count.assessments}</p>
                          <p className="text-white/30">Assessments</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                          <p className="text-base font-bold">{selectedUser._count.careerPlans}</p>
                          <p className="text-white/30">Career Plans</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                          <p className="text-base font-bold">{selectedUser._count.searchProfiles}</p>
                          <p className="text-white/30">Search Profiles</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                          <p className="text-base font-bold">{selectedUser._count.agentActivities}</p>
                          <p className="text-white/30">Agent Actions</p>
                        </div>
                      </div>
                    </div>

                    {/* Application Breakdown */}
                    {Object.keys(selectedUser.appStatusBreakdown).length > 0 && (
                      <div className="glass p-4 space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2"><Briefcase className="w-4 h-4 text-white/40" /> Application Breakdown</h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(selectedUser.appStatusBreakdown).map(([status, count]) => (
                            <span key={status} className={`px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.03] ${statusColors[status] || 'text-white/50'}`}>
                              {status}: {count}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(selectedUser.appMethodBreakdown).map(([method, count]) => (
                            <span key={method} className="px-2.5 py-1 rounded-full text-xs bg-white/5 text-white/40">
                              {method}: {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Email Connections */}
                    {selectedUser.emailConnections.length > 0 && (
                      <div className="glass p-4 space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2"><Mail className="w-4 h-4 text-white/40" /> Connected Emails</h3>
                        {selectedUser.emailConnections.map((ec, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="capitalize">{ec.provider}</span>
                              <span className="text-white/40">{ec.emailAddress}</span>
                            </div>
                            <span className={ec.isActive ? 'text-neon-green' : 'text-red-400'}>{ec.isActive ? 'Active' : 'Expired'}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Auto Apply Config */}
                    {selectedUser.autoApplyConfig && (
                      <div className="glass p-4 space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-white/40" /> Auto Apply Config</h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div><span className="text-white/30">Enabled:</span> <span className={selectedUser.autoApplyConfig.enabled ? 'text-neon-green' : 'text-red-400'}>{selectedUser.autoApplyConfig.enabled ? 'Yes' : 'No'}</span></div>
                          <div><span className="text-white/30">Mode:</span> {selectedUser.autoApplyConfig.automationMode}</div>
                          <div><span className="text-white/30">Scout:</span> <span className={selectedUser.autoApplyConfig.scoutEnabled ? 'text-neon-green' : 'text-white/30'}>{selectedUser.autoApplyConfig.scoutEnabled ? 'On' : 'Off'}</span></div>
                          <div><span className="text-white/30">Archer:</span> <span className={selectedUser.autoApplyConfig.archerEnabled ? 'text-neon-green' : 'text-white/30'}>{selectedUser.autoApplyConfig.archerEnabled ? 'On' : 'Off'}</span></div>
                        </div>
                      </div>
                    )}

                    {/* Career Twin */}
                    {selectedUser.careerTwin && (
                      <div className="glass p-4 space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-white/40" /> Career Twin</h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div><span className="text-white/30">Market Readiness:</span> {selectedUser.careerTwin.marketReadiness ? `${(selectedUser.careerTwin.marketReadiness * 100).toFixed(0)}%` : 'N/A'}</div>
                          <div><span className="text-white/30">Hire Probability:</span> {selectedUser.careerTwin.hireProb ? `${(selectedUser.careerTwin.hireProb * 100).toFixed(0)}%` : 'N/A'}</div>
                          <div className="col-span-2"><span className="text-white/30">Target Roles:</span> {JSON.stringify(selectedUser.careerTwin.targetRoles)?.slice(0, 100) || 'N/A'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'applications' && (
                  <div className="space-y-2">
                    {selectedUser.jobApplications.length === 0 ? (
                      <div className="text-center py-8 text-white/30 text-sm">No applications yet</div>
                    ) : (
                      selectedUser.jobApplications.map(app => (
                        <div key={app.id} className="glass p-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{app.jobTitle}</p>
                            <p className="text-xs text-white/40">{app.company} {app.source ? `via ${app.source}` : ''}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-medium ${statusColors[app.status] || 'text-white/40'}`}>{app.status}</span>
                              {app.applicationMethod && <span className="text-[10px] text-white/20">{app.applicationMethod}</span>}
                              {app.matchScore && <span className="text-[10px] text-neon-blue">{Math.round(app.matchScore)}% match</span>}
                            </div>
                          </div>
                          <div className="text-right text-xs text-white/30">
                            {app.appliedAt ? fmtDate(app.appliedAt) : fmtDate(app.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailTab === 'activity' && (
                  <div className="space-y-2">
                    {selectedUser.agentActivities.length === 0 ? (
                      <div className="text-center py-8 text-white/30 text-sm">No agent activity</div>
                    ) : (
                      selectedUser.agentActivities.map(act => (
                        <div key={act.id} className="glass p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-white/50 capitalize">{act.agent}</span>
                            <span className="text-[10px] text-white/30">{relTime(act.createdAt)}</span>
                          </div>
                          <p className="text-sm text-white/70">{act.summary}</p>
                          {act.creditsUsed > 0 && <p className="text-[10px] text-neon-purple mt-1">{act.creditsUsed} credit{act.creditsUsed > 1 ? 's' : ''}</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailTab === 'billing' && (
                  <div className="space-y-4">
                    {/* Subscriptions */}
                    <div className="glass p-4 space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4 text-white/40" /> Subscriptions</h3>
                      {selectedUser.subscriptions.length === 0 ? (
                        <p className="text-xs text-white/30">No subscriptions</p>
                      ) : (
                        selectedUser.subscriptions.map(sub => (
                          <div key={sub.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.03]">
                            <div>
                              <span className={`font-medium ${planColors[sub.plan] ? planColors[sub.plan].split(' ')[0] : 'text-white'}`}>{sub.plan}</span>
                              <span className="text-white/30 ml-2">({sub.interval})</span>
                            </div>
                            <div className="text-right">
                              <span className={sub.status === 'ACTIVE' ? 'text-neon-green' : 'text-white/30'}>{sub.status}</span>
                              {sub.cancelAtPeriodEnd && <span className="text-orange-400 ml-1">(canceling)</span>}
                              <div className="text-[10px] text-white/20">
                                {fmtDate(sub.currentPeriodStart)} — {fmtDate(sub.currentPeriodEnd)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Credit Purchases */}
                    <div className="glass p-4 space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-white/40" /> Credit Purchases</h3>
                      <div className="text-xs text-white/40 mb-2">Total: <span className="text-neon-green font-medium">${selectedUser.totalRevenue.toFixed(2)}</span></div>
                      {selectedUser.creditPurchases.length === 0 ? (
                        <p className="text-xs text-white/30">No purchases</p>
                      ) : (
                        selectedUser.creditPurchases.map(p => (
                          <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.03]">
                            <span>{p.credits} credits</span>
                            <div className="text-right">
                              <span className="text-neon-green">${(p.amountPaid / 100).toFixed(2)}</span>
                              <span className="text-white/20 ml-2">{fmtDate(p.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteModal(null)} />
          <div className="relative bg-surface-50 border border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
            <button onClick={() => setDeleteModal(null)} className="absolute top-4 right-4 text-white/30 hover:text-white/60">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-lg font-bold mb-1">Delete User Account</h2>
            <p className="text-sm text-white/50 mb-4">This will permanently delete the user and all their data.</p>
            <div className="bg-white/5 rounded-xl p-3 mb-4 space-y-1">
              <div className="text-sm font-medium">{deleteModal.name || 'No name'}</div>
              <div className="text-xs text-white/40">{deleteModal.email}</div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-white/60 mb-1.5">Type <span className="font-mono text-red-400 font-bold">DELETE</span> to confirm</label>
              <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="input-field w-full font-mono" placeholder="DELETE" autoFocus />
            </div>
            {deleteError && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{deleteError}</div>}
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Trash2 className="w-4 h-4" /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {upgradeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setUpgradeModal(null)} />
          <div className="relative bg-surface-50 border border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
            <button onClick={() => setUpgradeModal(null)} className="absolute top-4 right-4 text-white/30 hover:text-white/60"><X className="w-5 h-5" /></button>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neon-purple/10 mb-4"><Crown className="w-6 h-6 text-neon-purple" /></div>
            <h2 className="text-lg font-bold mb-1">Change User Plan</h2>
            <p className="text-sm text-white/50 mb-4">{upgradeModal.name || upgradeModal.email} — currently {upgradeModal.plan}</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['FREE', 'PRO', 'MAX', 'ULTRA'].map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPlan(p)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    selectedPlan === p ? 'border-neon-purple/50 bg-neon-purple/10 text-neon-purple' : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {upgradeSuccess && <div className="mb-4 p-3 rounded-xl bg-neon-green/10 border border-neon-green/20 text-sm text-neon-green">{upgradeSuccess}</div>}
            {upgradeError && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{upgradeError}</div>}
            <div className="flex gap-3">
              <button onClick={() => setUpgradeModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleUpgradeUser}
                disabled={!selectedPlan || selectedPlan === upgradeModal.plan || upgrading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-neon-purple hover:bg-neon-purple/80 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {upgrading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Crown className="w-4 h-4" /> Change Plan</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
