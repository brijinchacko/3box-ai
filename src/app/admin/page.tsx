'use client';

import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, Brain, FileText, Mail,
  CreditCard, Gift, Zap, Eye, BookOpen,
  UserPlus, Activity,
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
        <p className="text-white/40 text-sm mt-1">NXTED AI platform analytics</p>
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
                BASIC: 'bg-white/20',
                STARTER: 'bg-neon-green',
                PRO: 'bg-neon-blue',
                ULTRA: 'bg-neon-purple',
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
                  BASIC: 'text-white/40 bg-white/5',
                  STARTER: 'text-neon-green bg-neon-green/10',
                  PRO: 'text-neon-blue bg-neon-blue/10',
                  ULTRA: 'text-neon-purple bg-neon-purple/10',
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
    </div>
  );
}
