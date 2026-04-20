'use client';

import { useState, useEffect } from 'react';
import {
  Activity, CheckCircle2, AlertTriangle, XCircle, Server,
  Cpu, HardDrive, Clock, Users, Zap, Eye, FileWarning,
  RefreshCw, Database, Globe, Shield, Mail, CreditCard,
  TrendingUp, Wifi, AlertCircle,
} from 'lucide-react';

interface StatusData {
  overallStatus: 'operational' | 'degraded' | 'down';
  responseTime: number;
  timestamp: string;
  services: { name: string; status: string; latency?: number; message?: string }[];
  system: {
    uptimeSec: number;
    uptimeFormatted: string;
    nodeVersion: string;
    platform: string;
    cpus: number;
    loadAvg: { m1: number; m5: number; m15: number };
    memory: {
      heapUsedMB: number; heapTotalMB: number; rssMB: number;
      systemTotalMB: number; systemFreeMB: number; systemUsagePct: number;
    };
  };
  traffic: {
    pageViewsLast24h: number;
    pageViewsLastHour: number;
    activeSessionsLastHour: number;
    agentActivityLast24h: number;
    pastDueSubs: number;
    rejectedApps: number;
    errorRate: number;
    signupsLast24h: number;
    applicationsLast24h: number;
  };
  recentIssues: {
    pastDueSubs: any[];
    rejectedApps: any[];
    urgentTickets: any[];
  };
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    operational: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2, label: 'Operational' },
    degraded: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertTriangle, label: 'Degraded' },
    down: { color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle, label: 'Down' },
  };
  const c = config[status] || config.operational;
  const Icon = c.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.color}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </div>
  );
}

function serviceIcon(name: string) {
  if (name.includes('Database')) return Database;
  if (name.includes('Auth')) return Shield;
  if (name.includes('AI')) return Zap;
  if (name.includes('Payment')) return CreditCard;
  if (name.includes('Email')) return Mail;
  if (name.includes('Google') || name.includes('LinkedIn')) return Globe;
  if (name.includes('Analytics')) return TrendingUp;
  if (name.includes('Job')) return Activity;
  return Wifi;
}

function StatCard({
  icon: Icon, label, value, sub, color = 'text-neon-blue',
}: {
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

export default function StatusDashboard() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/status');
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchData();
    }, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Site Status</h1>
        <div className="glass p-6 animate-pulse">
          <div className="h-6 w-32 bg-white/10 rounded mb-4" />
          <div className="h-4 w-full bg-white/10 rounded mb-2" />
          <div className="h-4 w-3/4 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass p-6 text-center">
        <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-white/60">{error || 'Failed to load status data'}</p>
        <button onClick={handleRefresh} className="mt-4 text-sm text-neon-blue hover:underline">Retry</button>
      </div>
    );
  }

  const overallConfig: Record<string, { bg: string; border: string; text: string; label: string; sub: string }> = {
    operational: {
      bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400',
      label: 'All Systems Operational', sub: 'Every service is running normally.',
    },
    degraded: {
      bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400',
      label: 'Partial Service Degradation', sub: 'Some services are experiencing issues.',
    },
    down: {
      bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400',
      label: 'Major Outage', sub: 'Critical services are down.',
    },
  };
  const oc = overallConfig[data.overallStatus];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Site Status</h1>
          <p className="text-white/40 text-sm mt-1">
            Live health monitoring and system metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-white/60">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-white/5 border-white/10"
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`rounded-2xl p-6 border ${oc.bg} ${oc.border}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-white/5 ${oc.text}`}>
            {data.overallStatus === 'operational' ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : data.overallStatus === 'degraded' ? (
              <AlertTriangle className="w-8 h-8" />
            ) : (
              <XCircle className="w-8 h-8" />
            )}
          </div>
          <div className="flex-1">
            <h2 className={`text-xl font-bold ${oc.text}`}>{oc.label}</h2>
            <p className="text-sm text-white/60 mt-1">{oc.sub}</p>
            <p className="text-xs text-white/30 mt-1">
              API response: {data.responseTime}ms · Last checked: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Server Uptime"
          value={data.system.uptimeFormatted}
          sub={`Node ${data.system.nodeVersion}`}
          color="text-emerald-400"
        />
        <StatCard
          icon={Cpu}
          label="System Load (1m)"
          value={data.system.loadAvg.m1.toFixed(2)}
          sub={`${data.system.cpus} CPUs · ${data.system.loadAvg.m5.toFixed(2)} 5m avg`}
          color="text-neon-blue"
        />
        <StatCard
          icon={HardDrive}
          label="System Memory"
          value={`${data.system.memory.systemUsagePct}%`}
          sub={`${Math.round((data.system.memory.systemTotalMB - data.system.memory.systemFreeMB) / 1024)}GB of ${Math.round(data.system.memory.systemTotalMB / 1024)}GB`}
          color={data.system.memory.systemUsagePct > 85 ? 'text-red-400' : 'text-neon-blue'}
        />
        <StatCard
          icon={Server}
          label="App Heap Memory"
          value={`${data.system.memory.heapUsedMB}MB`}
          sub={`${data.system.memory.rssMB}MB RSS · ${data.system.memory.heapTotalMB}MB total`}
          color="text-neon-purple"
        />
      </div>

      {/* Services Grid */}
      <div className="glass p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-neon-blue" />
          Service Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.services.map((service, i) => {
            const Icon = serviceIcon(service.name);
            const borderColor = service.status === 'operational'
              ? 'border-emerald-500/20'
              : service.status === 'degraded'
              ? 'border-amber-500/20'
              : 'border-red-500/20';
            return (
              <div
                key={i}
                className={`p-4 rounded-xl bg-white/[0.02] border ${borderColor}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-white/60" />
                    <span className="text-sm font-medium text-white/80">{service.name}</span>
                  </div>
                  <StatusBadge status={service.status} />
                </div>
                <div className="text-xs text-white/40">
                  {service.latency !== undefined && `${service.latency}ms`}
                  {service.message && <span>{service.latency ? ' · ' : ''}{service.message}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Traffic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Active Sessions (1h)"
          value={data.traffic.activeSessionsLastHour}
          sub={`${data.traffic.pageViewsLastHour} views in last hour`}
          color="text-emerald-400"
        />
        <StatCard
          icon={Eye}
          label="Page Views (24h)"
          value={data.traffic.pageViewsLast24h.toLocaleString()}
          sub={`${data.traffic.signupsLast24h} signups`}
          color="text-neon-blue"
        />
        <StatCard
          icon={Zap}
          label="Agent Runs (24h)"
          value={data.traffic.agentActivityLast24h}
          sub={`${data.traffic.applicationsLast24h} applications`}
          color="text-neon-purple"
        />
        <StatCard
          icon={AlertCircle}
          label="Issue Rate (24h)"
          value={`${data.traffic.errorRate}%`}
          sub={`${data.traffic.rejectedApps} rejections · ${data.traffic.pastDueSubs} past-due subs`}
          color={data.traffic.errorRate > 5 ? 'text-red-400' : 'text-white/60'}
        />
      </div>

      {/* Recent Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Past-due Subscriptions */}
        <div className="glass p-6">
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            Past-due Subscriptions
            <span className="text-xs text-white/40 ml-auto">{data.recentIssues.pastDueSubs.length}</span>
          </h3>
          {data.recentIssues.pastDueSubs.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-4">None ✓</p>
          ) : (
            <div className="space-y-2">
              {data.recentIssues.pastDueSubs.map((s: any) => (
                <div key={s.id} className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <div className="text-sm font-medium text-white/80 truncate">{s.user?.email}</div>
                  <div className="text-[11px] text-white/40">{s.plan} · Expired {new Date(s.currentPeriodEnd).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Rejections */}
        <div className="glass p-6">
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-red-400" />
            Rejected Applications (24h)
            <span className="text-xs text-white/40 ml-auto">{data.recentIssues.rejectedApps.length}</span>
          </h3>
          {data.recentIssues.rejectedApps.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-4">None ✓</p>
          ) : (
            <div className="space-y-2">
              {data.recentIssues.rejectedApps.map((a: any) => (
                <div key={a.id} className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                  <div className="text-sm font-medium text-white/80 truncate">{a.jobTitle}</div>
                  <div className="text-[11px] text-white/40 truncate">{a.company} · {a.user?.email}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Urgent Tickets */}
        <div className="glass p-6">
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            High-priority Tickets
            <span className="text-xs text-white/40 ml-auto">{data.recentIssues.urgentTickets.length}</span>
          </h3>
          {data.recentIssues.urgentTickets.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-4">None ✓</p>
          ) : (
            <div className="space-y-2">
              {data.recentIssues.urgentTickets.map((t: any) => (
                <div key={t.id} className="p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <div className="text-sm font-medium text-white/80 truncate">{t.subject}</div>
                  <div className="text-[11px] text-white/40 truncate">{t.user?.email} · {new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-white/30 text-center">
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </p>
    </div>
  );
}
