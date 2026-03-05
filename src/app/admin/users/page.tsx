'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Trash2, X, AlertTriangle, Shield, Crown } from 'lucide-react';

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  plan: string;
  createdAt: string;
  updatedAt: string;
  onboardingDone: boolean;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  isOforoInternal: boolean;
  stripeCustomerId: string | null;
  referralCode: string | null;
  referredBy: string | null;
  _count: {
    assessments: number;
    resumes: number;
    careerPlans: number;
    learningPaths: number;
    jobApplications: number;
    auditLogs: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<UserData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Upgrade modal state
  const [upgradeModal, setUpgradeModal] = useState<UserData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeSuccess, setUpgradeSuccess] = useState('');

  const fetchUsers = async () => {
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
    } catch {
      console.error('Failed to fetch users');
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, planFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!deleteModal || deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/admin/users/${deleteModal.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete user');
        return;
      }

      // Success — close modal and refresh
      setDeleteModal(null);
      setDeleteConfirm('');
      fetchUsers();
    } catch {
      setDeleteError('Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (user: UserData) => {
    setDeleteModal(user);
    setDeleteConfirm('');
    setDeleteError('');
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
    setDeleteConfirm('');
    setDeleteError('');
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

      if (!res.ok) {
        setUpgradeError(data.error || 'Failed to upgrade user');
        return;
      }

      setUpgradeSuccess(`Successfully upgraded to ${selectedPlan}`);
      setTimeout(() => {
        setUpgradeModal(null);
        setSelectedPlan('');
        setUpgradeSuccess('');
        fetchUsers();
      }, 1200);
    } catch {
      setUpgradeError('Network error. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const openUpgradeModal = (user: UserData) => {
    setUpgradeModal(user);
    setSelectedPlan(user.plan);
    setUpgradeError('');
    setUpgradeSuccess('');
  };

  const closeUpgradeModal = () => {
    setUpgradeModal(null);
    setSelectedPlan('');
    setUpgradeError('');
    setUpgradeSuccess('');
  };

  const planColors: Record<string, string> = {
    BASIC: 'text-white/40 bg-white/5',
    STARTER: 'text-neon-green bg-neon-green/10',
    PRO: 'text-neon-blue bg-neon-blue/10',
    ULTRA: 'text-neon-purple bg-neon-purple/10',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-white/40 text-sm mt-1">{total} total users</p>
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
          <option value="BASIC">Basic</option>
          <option value="STARTER">Starter</option>
          <option value="PRO">Pro</option>
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
                <th className="text-left py-3 px-3">Joined</th>
                <th className="text-center py-3 px-3">Onboarded</th>
                <th className="text-center py-3 px-3">Credits</th>
                <th className="text-center py-3 px-3">Assessments</th>
                <th className="text-center py-3 px-3">Resumes</th>
                <th className="text-center py-3 px-3">Plans</th>
                <th className="text-center py-3 px-3">Jobs</th>
                <th className="text-left py-3 px-3">Referral</th>
                <th className="text-center py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 px-4" colSpan={11}>
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td className="py-8 px-4 text-center text-white/30" colSpan={11}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <div className="font-medium">{u.name || 'No name'}</div>
                      <div className="text-xs text-white/30">{u.email}</div>
                      {u.isOforoInternal && (
                        <span className="text-[10px] text-neon-purple bg-neon-purple/10 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 mt-0.5">
                          <Shield className="w-2.5 h-2.5" /> Admin
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[u.plan] || ''}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white/40 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={u.onboardingDone ? 'text-neon-green' : 'text-white/20'}>
                        {u.onboardingDone ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-white/60">
                      {u.aiCreditsUsed}/{u.aiCreditsLimit === -1 ? '\u221E' : u.aiCreditsLimit}
                    </td>
                    <td className="py-3 px-3 text-center text-white/60">{u._count.assessments}</td>
                    <td className="py-3 px-3 text-center text-white/60">{u._count.resumes}</td>
                    <td className="py-3 px-3 text-center text-white/60">{u._count.careerPlans}</td>
                    <td className="py-3 px-3 text-center text-white/60">{u._count.jobApplications}</td>
                    <td className="py-3 px-3 text-white/40 text-xs">
                      {u.referralCode || '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {u.isOforoInternal ? (
                        <span className="text-white/10 text-xs">Protected</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openUpgradeModal(u)}
                            className="p-1.5 rounded-lg hover:bg-neon-purple/10 text-white/20 hover:text-neon-purple transition-colors"
                            title={`Change plan for ${u.name || u.email}`}
                          >
                            <Crown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(u)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
                            title={`Delete ${u.name || u.email}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-sm text-white/40">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-ghost text-sm disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-ghost text-sm disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />

          {/* Modal */}
          <div className="relative bg-surface-50 border border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
            {/* Close button */}
            <button
              onClick={closeDeleteModal}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Warning icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>

            <h2 className="text-lg font-bold mb-1">Delete User Account</h2>
            <p className="text-sm text-white/50 mb-4">
              This will permanently delete the user and all their data. This action cannot be undone.
            </p>

            {/* User info */}
            <div className="bg-white/5 rounded-xl p-3 mb-4 space-y-1">
              <div className="text-sm font-medium">{deleteModal.name || 'No name'}</div>
              <div className="text-xs text-white/40">{deleteModal.email}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${planColors[deleteModal.plan] || ''}`}>
                  {deleteModal.plan}
                </span>
                <span className="text-[10px] text-white/30">
                  {deleteModal._count.assessments} assessments, {deleteModal._count.resumes} resumes, {deleteModal._count.jobApplications} applications
                </span>
              </div>
            </div>

            {/* Confirmation input */}
            <div className="mb-4">
              <label className="block text-sm text-white/60 mb-1.5">
                Type <span className="font-mono text-red-400 font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="input-field w-full font-mono"
                placeholder="DELETE"
                autoFocus
              />
            </div>

            {/* Error */}
            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {deleteError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      {upgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeUpgradeModal}
          />
          <div className="relative bg-surface-50 border border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
            <button
              onClick={closeUpgradeModal}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neon-purple/10 mb-4">
              <Crown className="w-6 h-6 text-neon-purple" />
            </div>

            <h2 className="text-lg font-bold mb-1">Change User Plan</h2>
            <p className="text-sm text-white/50 mb-4">
              Upgrade or downgrade user plan. Credits will be reset.
            </p>

            {/* User info */}
            <div className="bg-white/5 rounded-xl p-3 mb-4 space-y-1">
              <div className="text-sm font-medium">{upgradeModal.name || 'No name'}</div>
              <div className="text-xs text-white/40">{upgradeModal.email}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-white/30">Current plan:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${planColors[upgradeModal.plan] || ''}`}>
                  {upgradeModal.plan}
                </span>
              </div>
            </div>

            {/* Plan selector */}
            <div className="mb-4">
              <label className="block text-sm text-white/60 mb-1.5">Select New Plan</label>
              <div className="grid grid-cols-2 gap-2">
                {['BASIC', 'STARTER', 'PRO', 'ULTRA'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPlan(p)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedPlan === p
                        ? 'border-neon-purple/50 bg-neon-purple/10 text-neon-purple'
                        : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/70'
                    }`}
                  >
                    <div className="font-bold">{p}</div>
                    <div className="text-[10px] mt-0.5 opacity-60">
                      {p === 'BASIC' ? '10 credits' : p === 'STARTER' ? '100 credits' : p === 'PRO' ? '500 credits' : 'Unlimited'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Success */}
            {upgradeSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-neon-green/10 border border-neon-green/20 text-sm text-neon-green">
                {upgradeSuccess}
              </div>
            )}

            {/* Error */}
            {upgradeError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {upgradeError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={closeUpgradeModal} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleUpgradeUser}
                disabled={!selectedPlan || selectedPlan === upgradeModal.plan || upgrading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-neon-purple hover:bg-neon-purple/80 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {upgrading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Crown className="w-4 h-4" /> Change Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
