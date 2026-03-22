'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Eye, Users, Globe, CreditCard, Brain, FileText,
  TrendingUp, RefreshCw, Clock, CheckCircle2, AlertTriangle,
  XCircle, Monitor, Smartphone, Tablet, MapPin, Search,
  DollarSign, BarChart3, Shield, Mail, Wifi, ArrowUp,
  ArrowDown, Server, BookOpen, Zap, Gift,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────
interface HealthData {
  status: string;
  uptime: number;
  services: { name: string; status: string; latency?: number; message?: string }[];
  responseTime: number;
}

interface MonitoringData {
  range: string;
  traffic: {
    totalPageViews: number;
    uniqueSessions: number;
    pagesByPath: { path: string; views: number }[];
    byCountry: { country: string; views: number }[];
    byDevice: { device: string; count: number }[];
    byBrowser: { browser: string; count: number }[];
    byOS: { os: string; count: number }[];
    topReferrers: { referrer: string; count: number }[];
    daily: { date: string; count: number }[];
  };
  users: {
    total: number;
    new: number;
    activeToday: number;
    onboarded: number;
    onboardingPct: number;
    planDistribution: Record<string, number>;
    dailySignups: { date: string; count: number }[];
    byLocation: { country: string; sessions: number; views: number }[];
  };
  payments: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    subscriptionsByPlan: Record<string, number>;
    revenue: { total: number; transactions: number };
    recentSubscriptions: any[];
    creditPurchases: any[];
  };
  platform: {
    assessments: number;
    resumes: number;
    careerPlans: number;
    jobApplications: number;
    totalAiCreditsUsed: number;
    referrals: number;
    emails: Record<string, number>;
  };
  seo: {
    publishedPosts: number;
    totalBlogViews: number;
    newsletterSubscribers: number;
    topPosts: any[];
    checklist: Record<string, boolean>;
  };
}

const ranges = [
  { key: '1d', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'all', label: 'All Time' },
];

const tabs = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'traffic', label: 'Live Traffic', icon: Eye },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'seo', label: 'SEO & Content', icon: Search },
  { key: 'health', label: 'Site Health', icon: Activity },
];

// ─── Helpers ───────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'text-neon-blue', trend }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="glass p-5 hover:bg-white/[0.02] transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-white/5 ${color}`}><Icon className="w-5 h-5" /></div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-white/40 mt-1">{label}</div>
      {sub && <div className="text-xs text-white/30 mt-0.5">{sub}</div>}
    </div>
  );
}

function BarChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      <div className="text-sm text-white/40 mb-3">{label}</div>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-24 text-xs text-white/50 truncate text-right">{item.label}</div>
            <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-blue/60 to-neon-purple/60 rounded-full flex items-center justify-end pr-2 text-[10px] font-mono text-white/70"
                style={{ width: `${Math.max((item.value / max) * 100, 8)}%` }}
              >
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimeChart({ data, color = 'bg-neon-blue/50' }: { data: { date: string; count: number }[]; color?: string }) {
  if (!data || data.length === 0) return <div className="text-white/20 text-sm py-8 text-center">No data yet</div>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <div className="flex items-end gap-[2px] h-28">
        {data.map((d, i) => {
          const height = Math.max((d.count / max) * 100, 3);
          return (
            <div
              key={i}
              className={`flex-1 ${color} hover:opacity-80 rounded-t transition-all cursor-pointer group relative`}
              style={{ height: `${height}%` }}
            >
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block text-[10px] bg-surface-50 px-1.5 py-0.5 rounded border border-white/10 whitespace-nowrap z-10">
                {d.count}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-white/20">
        <span>{data.length > 0 ? new Date(data[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
        <span>{data.length > 0 ? new Date(data[data.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
      </div>
    </div>
  );
}

function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const deviceIcons: Record<string, any> = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };

const statusColors: Record<string, { color: string; bg: string }> = {
  operational: { color: 'text-emerald-400', bg: 'bg-emerald-400' },
  degraded: { color: 'text-amber-400', bg: 'bg-amber-400' },
  down: { color: 'text-red-400', bg: 'bg-red-400' },
};

const planColors: Record<string, string> = {
  FREE: 'text-white/40', PRO: 'text-neon-blue', MAX: 'text-neon-purple',
};

// ─── Main Component ────────────────────────────
export default function MonitoringDashboard() {
  const [tab, setTab] = useState('overview');
  const [range, setRange] = useState('7d');
  const [data, setData] = useState<MonitoringData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const [monRes, healthRes] = await Promise.all([
        fetch(`/api/admin/monitoring?range=${range}`, { cache: 'no-store' }),
        fetch('/api/health', { cache: 'no-store' }),
      ]);

      if (!monRes.ok) {
        const err = await monRes.json();
        throw new Error(err.error || 'Access denied');
      }

      setData(await monRes.json());
      setHealth(await healthRes.json());
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 60s
  useEffect(() => {
    const iv = setInterval(() => fetchData(), 60000);
    return () => clearInterval(iv);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Monitoring Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Monitoring Dashboard</h1>
        <div className="glass p-10 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-white/60">{error}</p>
          <p className="text-white/30 text-sm mt-2">You need admin access to view this page.</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-neon-blue" />
            Monitoring Dashboard
          </h1>
          <p className="text-white/40 text-sm mt-1">Real-time analytics & system health</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Range Picker */}
          <div className="flex bg-white/5 rounded-lg p-0.5">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  range === r.key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Health Banner */}
          {health && (
            <div className={`glass p-4 flex items-center justify-between border ${
              health.status === 'operational' ? 'border-emerald-400/20 bg-emerald-400/5' :
              health.status === 'partial_outage' ? 'border-amber-400/20 bg-amber-400/5' :
              'border-red-400/20 bg-red-400/5'
            }`}>
              <div className="flex items-center gap-3">
                {health.status === 'operational' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : health.status === 'partial_outage' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="font-medium">
                  {health.status === 'operational' ? 'All Systems Operational' :
                   health.status === 'partial_outage' ? 'Partial Outage' : 'Major Outage'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span>Uptime: {formatUptime(health.uptime)}</span>
                <span>{health.responseTime}ms</span>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Eye} label="Page Views" value={data.traffic.totalPageViews.toLocaleString()} color="text-neon-blue" />
            <StatCard icon={Users} label="Total Users" value={data.users.total.toLocaleString()} sub={`+${data.users.new} new`} color="text-neon-green" />
            <StatCard icon={CreditCard} label="Active Subs" value={data.payments.activeSubscriptions} color="text-neon-purple" />
            <StatCard icon={DollarSign} label="Revenue" value={`$${data.payments.revenue.total.toLocaleString()}`} sub={`${data.payments.revenue.transactions} transactions`} color="text-emerald-400" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Globe} label="Unique Sessions" value={data.traffic.uniqueSessions.toLocaleString()} color="text-cyan-400" />
            <StatCard icon={Users} label="Active Today" value={data.users.activeToday} color="text-yellow-400" />
            <StatCard icon={Brain} label="AI Credits Used" value={data.platform.totalAiCreditsUsed.toLocaleString()} color="text-orange-400" />
            <StatCard icon={FileText} label="Resumes Created" value={data.platform.resumes} color="text-pink-400" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4">Daily Traffic</h3>
              <TimeChart data={data.traffic.daily} />
            </div>
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4">Daily Signups</h3>
              <TimeChart data={data.users.dailySignups} color="bg-neon-green/50" />
            </div>
          </div>

          {/* Quick Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4">Top Pages</h3>
              <div className="space-y-2">
                {data.traffic.pagesByPath.slice(0, 8).map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-white/60 truncate flex-1 mr-4">{p.path}</span>
                    <span className="text-white/40 font-mono">{p.views}</span>
                  </div>
                ))}
                {data.traffic.pagesByPath.length === 0 && <div className="text-white/20 text-sm">No traffic data yet</div>}
              </div>
            </div>

            {/* Traffic Sources */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4">Traffic Sources</h3>
              <div className="space-y-2">
                {data.traffic.topReferrers.slice(0, 8).map((r, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-white/60 truncate flex-1 mr-4">{r.referrer || 'Direct'}</span>
                    <span className="text-white/40 font-mono">{r.count}</span>
                  </div>
                ))}
                {data.traffic.topReferrers.length === 0 && <div className="text-white/20 text-sm">No referrer data yet</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TRAFFIC TAB ─── */}
      {tab === 'traffic' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Eye} label="Total Views" value={data.traffic.totalPageViews.toLocaleString()} color="text-neon-blue" />
            <StatCard icon={Users} label="Unique Sessions" value={data.traffic.uniqueSessions.toLocaleString()} color="text-neon-green" />
            <StatCard icon={Globe} label="Countries" value={data.traffic.byCountry.length} color="text-cyan-400" />
            <StatCard icon={TrendingUp} label="Avg Views/Day" value={data.traffic.daily.length > 0 ? Math.round(data.traffic.totalPageViews / Math.max(data.traffic.daily.length, 1)) : 0} color="text-neon-purple" />
          </div>

          <div className="glass p-6">
            <h3 className="text-sm font-semibold mb-4">Traffic Over Time</h3>
            <TimeChart data={data.traffic.daily} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Country */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-neon-blue" /> Visitors by Country</h3>
              <BarChart data={data.traffic.byCountry.slice(0, 10).map((c) => ({ label: c.country || 'Unknown', value: c.views }))} label="" />
              {data.traffic.byCountry.length === 0 && <div className="text-white/20 text-sm">No location data yet</div>}
            </div>

            {/* By Device */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4">Device Breakdown</h3>
              <div className="space-y-4 mt-2">
                {data.traffic.byDevice.map((d, i) => {
                  const Icon = deviceIcons[d.device] || Monitor;
                  const total = data.traffic.byDevice.reduce((a, b) => a + b.count, 0) || 1;
                  const pct = Math.round((d.count / total) * 100);
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <Icon className="w-5 h-5 text-white/40" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-white/60">{d.device}</span>
                          <span className="text-white/40">{pct}% ({d.count})</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-neon-blue/50 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {data.traffic.byDevice.length === 0 && <div className="text-white/20 text-sm">No device data yet</div>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Browser */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4">Browser</h3>
              <BarChart data={data.traffic.byBrowser.map((b) => ({ label: b.browser, value: b.count }))} label="" />
              {data.traffic.byBrowser.length === 0 && <div className="text-white/20 text-sm">No data</div>}
            </div>

            {/* OS */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4">Operating System</h3>
              <BarChart data={data.traffic.byOS.map((o) => ({ label: o.os, value: o.count }))} label="" />
              {data.traffic.byOS.length === 0 && <div className="text-white/20 text-sm">No data</div>}
            </div>
          </div>

          {/* Top Pages & Referrers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4">Top Pages</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.traffic.pagesByPath.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-white/5">
                    <span className="text-white/60 truncate flex-1 mr-4 font-mono text-xs">{p.path}</span>
                    <span className="text-white/40 font-mono text-xs">{p.views}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4">Top Referrers</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.traffic.topReferrers.map((r, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-white/5">
                    <span className="text-white/60 truncate flex-1 mr-4 text-xs">{r.referrer || 'Direct'}</span>
                    <span className="text-white/40 font-mono text-xs">{r.count}</span>
                  </div>
                ))}
                {data.traffic.topReferrers.length === 0 && <div className="text-white/20 text-sm">No referrer data</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── USERS TAB ─── */}
      {tab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Users" value={data.users.total.toLocaleString()} color="text-neon-blue" />
            <StatCard icon={Users} label="New Users" value={data.users.new} sub={`in ${range}`} color="text-neon-green" />
            <StatCard icon={Zap} label="Active Today" value={data.users.activeToday} color="text-yellow-400" />
            <StatCard icon={CheckCircle2} label="Onboarding Rate" value={`${data.users.onboardingPct}%`} sub={`${data.users.onboarded} onboarded`} color="text-emerald-400" />
          </div>

          <div className="glass p-6">
            <h3 className="text-sm font-semibold mb-4">Daily Signups</h3>
            <TimeChart data={data.users.dailySignups} color="bg-neon-green/50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Distribution */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4">Plan Distribution</h3>
              <div className="space-y-3">
                {Object.entries(data.users.planDistribution).map(([plan, count]) => {
                  const total = Object.values(data.users.planDistribution).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={plan}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={planColors[plan] || 'text-white/60'}>{plan}</span>
                        <span className="text-white/40">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          plan === 'MAX' ? 'bg-neon-purple' : plan === 'PRO' ? 'bg-neon-blue' : plan === 'FREE' ? 'bg-neon-green' : 'bg-white/20'
                        }`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Users by Location */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-neon-blue" /> Active Users by Location</h3>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {data.users.byLocation.map((loc: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-white/5">
                    <span className="text-white/60">{loc.country || 'Unknown'}</span>
                    <div className="flex gap-4 text-xs text-white/40">
                      <span>{loc.sessions} sessions</span>
                      <span>{loc.views} views</span>
                    </div>
                  </div>
                ))}
                {data.users.byLocation.length === 0 && <div className="text-white/20 text-sm">No location data yet</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PAYMENTS TAB ─── */}
      {tab === 'payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="Total Revenue" value={`$${data.payments.revenue.total.toLocaleString()}`} color="text-emerald-400" />
            <StatCard icon={CreditCard} label="Active Subs" value={data.payments.activeSubscriptions} color="text-neon-blue" />
            <StatCard icon={CreditCard} label="New Subs" value={data.payments.totalSubscriptions} sub={`in ${range}`} color="text-neon-green" />
            <StatCard icon={Zap} label="Credit Purchases" value={data.payments.revenue.transactions} color="text-yellow-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subs by Plan */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4">Active Subscriptions by Plan</h3>
              <div className="space-y-3">
                {Object.entries(data.payments.subscriptionsByPlan).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${planColors[plan] || 'text-white/60'}`}>{plan}</span>
                    <span className="text-white/40 font-mono">{count}</span>
                  </div>
                ))}
                {Object.keys(data.payments.subscriptionsByPlan).length === 0 && <div className="text-white/20 text-sm">No active subscriptions</div>}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4">Recent Subscriptions</h3>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {data.payments.recentSubscriptions.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-white/5">
                    <div>
                      <span className="text-white/60">{s.user}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${planColors[s.plan] || ''} bg-white/5`}>{s.plan}</span>
                    </div>
                    <span className="text-xs text-white/30">{new Date(s.date).toLocaleDateString()}</span>
                  </div>
                ))}
                {data.payments.recentSubscriptions.length === 0 && <div className="text-white/20 text-sm">No recent subscriptions</div>}
              </div>
            </div>
          </div>

          {/* Credit Purchases */}
          <div className="glass p-6">
            <h3 className="text-sm font-semibold mb-4">Recent Credit Purchases</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40">
                    <th className="text-left py-2 px-2">User</th>
                    <th className="text-right py-2 px-2">Credits</th>
                    <th className="text-right py-2 px-2">Amount</th>
                    <th className="text-right py-2 px-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.creditPurchases.map((c: any, i: number) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2 px-2 text-white/60">{c.user}</td>
                      <td className="py-2 px-2 text-right text-neon-green">{c.credits}</td>
                      <td className="py-2 px-2 text-right text-white/40">${c.amount}</td>
                      <td className="py-2 px-2 text-right text-white/30 text-xs">{new Date(c.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {data.payments.creditPurchases.length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-white/20">No purchases yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SEO TAB ─── */}
      {tab === 'seo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={BookOpen} label="Published Posts" value={data.seo.publishedPosts} color="text-neon-blue" />
            <StatCard icon={Eye} label="Blog Views" value={data.seo.totalBlogViews.toLocaleString()} color="text-neon-green" />
            <StatCard icon={Mail} label="Newsletter Subs" value={data.seo.newsletterSubscribers} color="text-neon-purple" />
            <StatCard icon={Gift} label="Referrals" value={data.platform.referrals} color="text-pink-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Posts */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4">Top Blog Posts</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.seo.topPosts.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-start text-sm py-2 border-b border-white/5">
                    <div className="flex-1 mr-4">
                      <div className="text-white/60 line-clamp-1">{p.title}</div>
                      <div className="text-[10px] text-white/30 mt-0.5">{p.category} &middot; {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : 'Draft'}</div>
                    </div>
                    <span className="text-white/40 font-mono text-xs flex items-center gap-1"><Eye className="w-3 h-3" />{p.views}</span>
                  </div>
                ))}
                {data.seo.topPosts.length === 0 && <div className="text-white/20 text-sm">No published posts</div>}
              </div>
            </div>

            {/* SEO Checklist */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold mb-4">SEO Checklist</h3>
              <div className="space-y-3">
                {Object.entries(data.seo.checklist).map(([item, status]) => (
                  <div key={item} className="flex items-center gap-3">
                    {status ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className="text-sm text-white/60 capitalize">{item.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Activity */}
          <div className="glass p-6">
            <h3 className="text-sm font-semibold mb-4">Platform Activity ({range})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Assessments', value: data.platform.assessments, icon: Brain, color: 'text-blue-400' },
                { label: 'Career Plans', value: data.platform.careerPlans, icon: TrendingUp, color: 'text-emerald-400' },
                { label: 'Resumes', value: data.platform.resumes, icon: FileText, color: 'text-orange-400' },
                { label: 'Job Apps', value: data.platform.jobApplications, icon: Globe, color: 'text-cyan-400' },
                { label: 'AI Credits', value: data.platform.totalAiCreditsUsed, icon: Zap, color: 'text-yellow-400' },
                { label: 'Referrals', value: data.platform.referrals, icon: Gift, color: 'text-pink-400' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="text-center p-3 bg-white/[0.02] rounded-lg">
                    <Icon className={`w-5 h-5 ${item.color} mx-auto mb-1`} />
                    <div className="text-lg font-bold">{item.value}</div>
                    <div className="text-[10px] text-white/40">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── HEALTH TAB ─── */}
      {tab === 'health' && health && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className={`glass p-8 text-center border ${
            health.status === 'operational' ? 'border-emerald-400/20 bg-emerald-400/5' :
            health.status === 'partial_outage' ? 'border-amber-400/20 bg-amber-400/5' :
            'border-red-400/20 bg-red-400/5'
          }`}>
            {health.status === 'operational' ? (
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            )}
            <h2 className={`text-2xl font-bold ${
              health.status === 'operational' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {health.status === 'operational' ? 'All Systems Operational' : 'Some Services Degraded'}
            </h2>
            <p className="text-white/40 text-sm mt-2">
              Response time: {health.responseTime}ms &middot; Uptime: {formatUptime(health.uptime)}
            </p>
          </div>

          {/* Services */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Services</h3>
            {health.services.map((service) => {
              const sc = statusColors[service.status] || statusColors.operational;
              return (
                <div key={service.name} className="glass p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${sc.bg}`} />
                    <div>
                      <div className="font-medium">{service.name}</div>
                      {service.message && <div className="text-xs text-white/30">{service.message}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {service.latency !== undefined && (
                      <span className="text-xs text-white/30 font-mono">{service.latency}ms</span>
                    )}
                    <span className={`text-sm font-medium capitalize ${sc.color}`}>{service.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Email Stats */}
          <div className="glass p-6">
            <h3 className="text-sm font-semibold mb-4">Email Delivery</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(data.platform.emails).map(([status, count]) => (
                <div key={status} className="text-center p-3 bg-white/[0.02] rounded-lg">
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-xs text-white/40 capitalize">{status}</div>
                </div>
              ))}
              {Object.keys(data.platform.emails).length === 0 && (
                <div className="col-span-3 text-center text-white/20 text-sm py-4">No emails sent yet</div>
              )}
            </div>
          </div>

          {/* Server Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass p-5 text-center">
              <Server className="w-6 h-6 text-neon-blue mx-auto mb-2" />
              <div className="text-sm font-medium">VPS Server</div>
              <div className="text-xs text-white/40 mt-1">Hostinger &middot; US East</div>
            </div>
            <div className="glass p-5 text-center">
              <Shield className="w-6 h-6 text-neon-green mx-auto mb-2" />
              <div className="text-sm font-medium">SSL/TLS</div>
              <div className="text-xs text-white/40 mt-1">Let&apos;s Encrypt (Auto-renew)</div>
            </div>
            <div className="glass p-5 text-center">
              <Wifi className="w-6 h-6 text-neon-purple mx-auto mb-2" />
              <div className="text-sm font-medium">CDN / Proxy</div>
              <div className="text-xs text-white/40 mt-1">Nginx Reverse Proxy</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
