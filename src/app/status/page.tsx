'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity, CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Clock, Wifi, Database, Shield, CreditCard,
  Mail, Brain, Server, Globe, ArrowLeft,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

interface ServiceCheck {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  message?: string;
}

interface HealthData {
  status: 'operational' | 'partial_outage' | 'major_outage';
  timestamp: string;
  uptime: number;
  version: string;
  services: ServiceCheck[];
  responseTime: number;
}

interface HistoryEntry {
  time: string;
  status: 'operational' | 'partial_outage' | 'major_outage';
  responseTime: number;
}

const serviceIcons: Record<string, any> = {
  'Database': Database,
  'Authentication': Shield,
  'AI Services': Brain,
  'Payments': CreditCard,
  'Email Service': Mail,
  'Web Server': Server,
};

const statusConfig = {
  operational: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    label: 'Operational',
    dot: 'bg-emerald-400',
  },
  degraded: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    label: 'Degraded',
    dot: 'bg-amber-400',
  },
  down: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
    label: 'Down',
    dot: 'bg-red-400',
  },
  partial_outage: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    label: 'Partial Outage',
    dot: 'bg-amber-400',
  },
  major_outage: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
    label: 'Major Outage',
    dot: 'bg-red-400',
  },
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const data = await res.json();
      setHealth(data);
      setError(null);
      setLastChecked(new Date().toISOString());
      setHistory((prev) => {
        const entry: HistoryEntry = {
          time: new Date().toISOString(),
          status: data.status,
          responseTime: data.responseTime,
        };
        return [...prev, entry].slice(-30); // keep last 30 checks
      });
    } catch (e: any) {
      setError('Failed to reach the health endpoint');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchHealth(), 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth]);

  const overallCfg = health
    ? statusConfig[health.status] || statusConfig.operational
    : statusConfig.operational;
  const OverallIcon = overallCfg.icon;

  return (
    <div className="min-h-screen bg-dark text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-28 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Activity className="w-6 h-6 text-neon-blue" />
          <h1 className="text-3xl font-bold">System Status</h1>
        </div>
        <p className="text-white/40 ml-8 mb-8">Real-time health monitoring for jobTED AI services</p>

        {/* Overall Status Banner */}
        {loading ? (
          <div className="glass p-8 mb-8 animate-pulse">
            <div className="h-8 w-64 bg-white/10 rounded mx-auto" />
          </div>
        ) : error ? (
          <div className="glass p-8 mb-8 border border-red-400/20 bg-red-400/5 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-red-400">Unable to Check Status</h2>
            <p className="text-white/40 text-sm mt-1">{error}</p>
          </div>
        ) : (
          <div className={`glass p-8 mb-8 border ${overallCfg.border} ${overallCfg.bg} text-center`}>
            <OverallIcon className={`w-12 h-12 ${overallCfg.color} mx-auto mb-3`} />
            <h2 className={`text-2xl font-bold ${overallCfg.color}`}>
              {health?.status === 'operational'
                ? 'All Systems Operational'
                : health?.status === 'partial_outage'
                ? 'Partial System Outage'
                : 'Major System Outage'}
            </h2>
            <p className="text-white/40 text-sm mt-2">
              Last checked: {lastChecked ? formatTime(lastChecked) : '...'} &middot;
              Response time: {health?.responseTime || 0}ms
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchHealth(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                autoRefresh
                  ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                  : 'bg-white/5 text-white/40 hover:text-white'
              }`}
            >
              <Wifi className="w-4 h-4" />
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>
          {health && (
            <div className="text-sm text-white/30 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Uptime: {formatUptime(health.uptime)}
            </div>
          )}
        </div>

        {/* Services Grid */}
        {health && (
          <div className="space-y-3 mb-10">
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            {health.services.map((service) => {
              const cfg = statusConfig[service.status];
              const StatusIcon = cfg.icon;
              const ServiceIcon = serviceIcons[service.name] || Globe;
              return (
                <div
                  key={service.name}
                  className={`glass p-4 flex items-center justify-between border ${cfg.border} hover:bg-white/[0.02] transition-all`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${cfg.bg}`}>
                      <ServiceIcon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div>
                      <div className="font-medium">{service.name}</div>
                      {service.message && (
                        <div className="text-xs text-white/30 mt-0.5">{service.message}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {service.latency !== undefined && (
                      <span className="text-xs text-white/30 font-mono">{service.latency}ms</span>
                    )}
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                      <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Response Time Chart */}
        {history.length > 1 && (
          <div className="glass p-6 mb-10">
            <h3 className="text-lg font-semibold mb-4">Response Time (Last {history.length} checks)</h3>
            <div className="flex items-end gap-1 h-24">
              {history.map((entry, i) => {
                const maxTime = Math.max(...history.map((h) => h.responseTime), 1);
                const height = Math.max((entry.responseTime / maxTime) * 100, 4);
                const barColor =
                  entry.status === 'operational'
                    ? 'bg-emerald-400/50 hover:bg-emerald-400/70'
                    : entry.status === 'partial_outage'
                    ? 'bg-amber-400/50 hover:bg-amber-400/70'
                    : 'bg-red-400/50 hover:bg-red-400/70';
                return (
                  <div
                    key={i}
                    className={`flex-1 ${barColor} rounded-t transition-colors cursor-pointer group relative`}
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block text-xs bg-surface-50 px-2 py-1 rounded whitespace-nowrap border border-white/10 z-10">
                      {entry.responseTime}ms
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/30">
              <span>{history.length > 0 ? formatTime(history[0].time) : ''}</span>
              <span>{history.length > 0 ? formatTime(history[history.length - 1].time) : ''}</span>
            </div>
          </div>
        )}

        {/* Incident History */}
        <div className="glass p-6 mb-10">
          <h3 className="text-lg font-semibold mb-4">Recent Incidents</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 pb-4 border-b border-white/5">
              <div className="mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-medium">Database Connection Restored</div>
                <div className="text-xs text-white/30 mt-0.5">March 4, 2026 &middot; Resolved</div>
                <div className="text-xs text-white/40 mt-1">
                  PostgreSQL credentials were reconfigured and the database was provisioned. All services restored.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-medium">Platform Launch</div>
                <div className="text-xs text-white/30 mt-0.5">March 3, 2026 &middot; Deployed</div>
                <div className="text-xs text-white/40 mt-1">
                  jobTED AI deployed to production. All core services operational.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass p-5 text-center">
            <Globe className="w-6 h-6 text-neon-blue mx-auto mb-2" />
            <div className="text-sm font-medium">Region</div>
            <div className="text-xs text-white/40 mt-1">US East (Hostinger VPS)</div>
          </div>
          <div className="glass p-5 text-center">
            <Shield className="w-6 h-6 text-neon-green mx-auto mb-2" />
            <div className="text-sm font-medium">SSL/TLS</div>
            <div className="text-xs text-white/40 mt-1">Let&#39;s Encrypt (Auto-renew)</div>
          </div>
          <div className="glass p-5 text-center">
            <Activity className="w-6 h-6 text-neon-purple mx-auto mb-2" />
            <div className="text-sm font-medium">Monitoring</div>
            <div className="text-xs text-white/40 mt-1">30s auto-refresh intervals</div>
          </div>
        </div>

        {/* Footer link */}
        <div className="text-center mt-10 text-sm text-white/30">
          Need help? Visit our{' '}
          <Link href="/help" className="text-neon-blue hover:underline">
            Help Center
          </Link>{' '}
          or{' '}
          <a href="/contact" className="text-neon-blue hover:underline">
            contact support
          </a>
          .
        </div>
      </div>
    </div>
  );
}
