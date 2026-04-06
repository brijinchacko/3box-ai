'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, TrendingUp, Brain, FileText, Mail,
  CreditCard, Gift, Zap, Eye, BookOpen,
  UserPlus, Activity, Bug, MessageSquare, Send,
  Target, Clock, AlertCircle, CheckCircle2,
} from 'lucide-react';

interface StatsData {
  overview: {
    totalUsers: number;
    newUsersThisMonth: number;
    newUsersThisWeek: number;
    totalAssessments: number;
    totalCareerPlans: number;
    totalResumes: number;
    totalAiCreditsUsed: number;
  };
  plans: Record<string, number>;
  subscriptions: { total: number; active: number };
  content: { blogPosts: number; totalBlogViews: number; newsletterSubs: number };
  referrals: number;
  recentUsers: any[];
  dailySignups: { date: string; count: number }[];
  tickets: { open: number; in_progress: number; resolved: number; closed: number; total: number };
  recentTickets: any[];
  recentActivity: any[];
  applications: { total: number; byStatus: Record<string, number>; byMethod: Record<string, number> };
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-neon-blue' }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-white/40 mt-1">{label}</div>
      {sub && <div className="text-xs text-white/30 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass p-5 animate-pulse">
              <div className="h-4 w-20 bg-white/10 rounded mb-3" />
              <div className="h-8 w-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return <div className="text-white/40">Failed to load stats.</div>;

  const { overview, plans, subscriptions, content, referrals, recentUsers, dailySignups } = stats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-white/40 text-sm mt-1">3BOX AI platform analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={overview.totalUsers} sub={`+${overview.newUsersThisWeek} this week`} />
        <StatCard icon={UserPlus} label="New This Month" value={overview.newUsersThisMonth} color="text-neon-green" />
        <StatCard icon={CreditCard} label="Active Subscriptions" value={subscriptions.active} sub={`of ${subscriptions.total} total`} color="text-neon-purple" />
        <StatCard icon={Zap} label="AI Credits Used" value={overview.totalAiCreditsUsed.toLocaleString()} color="text-yellow-400" />
      </div>

      {/* Platform Usage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Brain} label="Assessments" value={overview.totalAssessments} color="text-blue-400" />
        <StatCard icon={TrendingUp} label="Career Plans" value={overview.totalCareerPlans} color="text-emerald-400" />
        <StatCard icon={FileText} label="Resumes" value={overview.totalResumes} color="text-orange-400" />
        <StatCard icon={Gift} label="Referrals" value={referrals} color="text-pink-400" />
      </div>

      {/* Plan Distribution & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <div className="glass p-6">
          <h2 className="text-lg font-semibold mb-4">Plan Distribution</h2>
          <div className="space-y-3">
            {Object.entries(plans).map(([plan, count]) => {
              const total = Object.values(plans).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const colors: Record<string, string> = {
                FREE: 'bg-white/20',
                PRO: 'bg-neon-blue',
                MAX: 'bg-neon-purple',
              };
              return (
                <div key={plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/60">{plan}</span>
                    <span className="text-white/40">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[plan] || 'bg-white/20'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Stats */}
        <div className="glass p-6">
          <h2 className="text-lg font-semibold mb-4">Content & Marketing</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-neon-blue" />
                <span className="text-white/60">Published Blog Posts</span>
              </div>
              <span className="font-medium">{content.blogPosts}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-neon-green" />
                <span className="text-white/60">Total Blog Views</span>
              </div>
              <span className="font-medium">{content.totalBlogViews.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-neon-purple" />
                <span className="text-white/60">Newsletter Subscribers</span>
              </div>
              <span className="font-medium">{content.newsletterSubs}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Signups Chart */}
      {dailySignups && dailySignups.length > 0 && (
        <div className="glass p-6">
          <h2 className="text-lg font-semibold mb-4">Daily Signups (Last 30 Days)</h2>
          <div className="flex items-end gap-1 h-32">
            {dailySignups.map((d: any, i: number) => {
              const maxCount = Math.max(...dailySignups.map((x: any) => x.count), 1);
              const height = Math.max((d.count / maxCount) * 100, 4);
              return (
                <div
                  key={i}
                  className="flex-1 bg-neon-blue/40 hover:bg-neon-blue/60 rounded-t transition-colors cursor-pointer group relative"
                  style={{ height: `${height}%` }}
                  title={`${new Date(d.date).toLocaleDateString()}: ${d.count} signups`}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-xs bg-surface-50 px-2 py-1 rounded whitespace-nowrap border border-white/10">
                    {d.count}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/30">
            <span>{dailySignups.length > 0 ? new Date(dailySignups[0].date).toLocaleDateString() : ''}</span>
            <span>Today</span>
          </div>
        </div>
      )}

      {/* Recent Users */}
      <div className="glass p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="text-left py-3 px-2">User</th>
                <th className="text-left py-3 px-2">Plan</th>
                <th className="text-left py-3 px-2">Joined</th>
                <th className="text-center py-3 px-2">Onboarded</th>
                <th className="text-center py-3 px-2">AI Credits</th>
                <th className="text-center py-3 px-2">Assessments</th>
                <th className="text-center py-3 px-2">Resumes</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => {
                const planColors: Record<string, string> = {
                  FREE: 'text-white/40 bg-white/5',
                  PRO: 'text-neon-blue bg-neon-blue/10',
                  MAX: 'text-neon-purple bg-neon-purple/10',
                };
                return (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-2">
                      <div className="font-medium">{u.name || 'No name'}</div>
                      <div className="text-xs text-white/30">{u.email}</div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[u.plan] || ''}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-white/40">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={u.onboardingDone ? 'text-neon-green' : 'text-white/20'}>
                        {u.onboardingDone ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-white/60">
                      {u.aiCreditsUsed}/{u.aiCreditsLimit === -1 ? '∞' : u.aiCreditsLimit}
                    </td>
                    <td className="py-3 px-2 text-center text-white/60">{u._count.assessments}</td>
                    <td className="py-3 px-2 text-center text-white/60">{u._count.resumes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bug Reports & Application Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bug Reports Summary */}
        <div className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Bug className="w-5 h-5 text-red-400" /> Bug Reports</h2>
            <Link href="/admin/support" className="text-xs text-neon-blue hover:underline">View All →</Link>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Open', count: stats.tickets?.open || 0, color: 'text-red-400' },
              { label: 'In Progress', count: stats.tickets?.in_progress || 0, color: 'text-amber-400' },
              { label: 'Resolved', count: stats.tickets?.resolved || 0, color: 'text-neon-green' },
              { label: 'Total', count: stats.tickets?.total || 0, color: 'text-white/60' },
            ].map(s => (
              <div key={s.label} className="text-center p-2 rounded-lg bg-white/5">
                <div className={`text-xl font-bold ${s.color}`}>{s.count}</div>
                <div className="text-[10px] text-white/30">{s.label}</div>
              </div>
            ))}
          </div>
          {(stats.recentTickets || []).length > 0 ? (
            <div className="space-y-2">
              {stats.recentTickets.slice(0, 5).map((t: any) => {
                const statusColors: Record<string, string> = { open: 'bg-red-500/15 text-red-400', in_progress: 'bg-amber-500/15 text-amber-400', resolved: 'bg-green-500/15 text-green-400', closed: 'bg-white/10 text-white/40' };
                const priorityIcons: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };
                return (
                  <Link key={t.id} href={`/admin/support/${t.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-sm">{priorityIcons[t.priority] || '⚪'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">{t.subject}</p>
                      <p className="text-[11px] text-white/30">{t.user?.name || t.user?.email || 'Unknown'} · {new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[t.status] || ''}`}>{t.status}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-white/30 text-center py-4">No tickets yet</p>
          )}
        </div>

        {/* Application Stats */}
        <div className="glass p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Send className="w-5 h-5 text-green-400" /> Applications</h2>
          <div className="text-3xl font-bold text-neon-green mb-4">{stats.applications?.total || 0} <span className="text-sm font-normal text-white/30">total applications</span></div>
          {stats.applications?.byStatus && Object.keys(stats.applications.byStatus).length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">By Status</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.applications.byStatus).map(([status, count]) => (
                  <span key={status} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/60">{status}: <strong className="text-white/80">{count as number}</strong></span>
                ))}
              </div>
            </div>
          )}
          {stats.applications?.byMethod && Object.keys(stats.applications.byMethod).length > 0 && (
            <div>
              <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">By Channel</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.applications.byMethod).map(([method, count]) => (
                  <span key={method} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/60">{method}: <strong className="text-white/80">{count as number}</strong></span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Log (All Users) */}
      <div className="glass p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Activity className="w-5 h-5 text-neon-blue" /> User Activity Log</h2>
        {(stats.recentActivity || []).length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {stats.recentActivity.map((a: any) => {
              const agentColors: Record<string, string> = { scout: 'text-blue-400', forge: 'text-orange-400', archer: 'text-green-400', atlas: 'text-purple-400', sage: 'text-teal-400', sentinel: 'text-rose-400', cortex: 'text-cyan-400', live_search: 'text-blue-300' };
              return (
                <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <div className={`text-xs font-semibold uppercase mt-0.5 w-16 shrink-0 ${agentColors[a.agent] || 'text-white/40'}`}>{a.agent}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 truncate">{a.summary}</p>
                    <p className="text-[11px] text-white/30">{a.user?.name || a.user?.email || 'System'} · {new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] text-white/20 shrink-0">{a.action}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-white/30 text-center py-4">No activity yet</p>
        )}
      </div>
    </div>
  );
}
