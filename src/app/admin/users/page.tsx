'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

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
                  <td className="py-8 px-4 text-center text-white/30" colSpan={10}>
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
                        <span className="text-[10px] text-neon-purple bg-neon-purple/10 px-1.5 py-0.5 rounded-full">
                          Internal
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
                      {u.aiCreditsUsed}/{u.aiCreditsLimit === -1 ? '∞' : u.aiCreditsLimit}
                    </td>
                    <td className="py-3 px-3 text-center text-white/60">{u._count.assessments}</td>
                    <td className="py-3 px-3 text-center text-white/60">{u._count.resumes}</td>
                    <td className="py-3 px-3 text-center text-white/60">{u._count.careerPlans}</td>
                    <td className="py-3 px-3 text-center text-white/60">{u._count.jobApplications}</td>
                    <td className="py-3 px-3 text-white/40 text-xs">
                      {u.referralCode || '-'}
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
    </div>
  );
}
