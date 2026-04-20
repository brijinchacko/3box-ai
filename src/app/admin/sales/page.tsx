'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Users, CreditCard,
  RefreshCw, ArrowUp, ArrowDown, AlertTriangle, Calendar,
  Zap, UserCheck, ShoppingCart, Activity, Target,
} from 'lucide-react';

interface SalesData {
  mrr: number;
  arr: number;
  churnRate: number;
  conversionRate: number;
  growthRate: number;
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  pastDueSubscriptions: number;
  thisMonth: {
    newSubs: number;
    canceledSubs: number;
    creditRevenue: number;
    creditTransactions: number;
    newUsers: number;
  };
  lifetime: {
    creditRevenue: number;
    creditTransactions: number;
  };
  activeByPlan: Record<string, { monthly: number; yearly: number; total: number; mrr: number }>;
  subStatusBreakdown: Record<string, number>;
  dailyRevenue: { date: string; revenue: number; transactions: number }[];
  dailySubs: { date: string; count: number }[];
  recentEvents: any[];
  funnel: { visitors: number; signups: number; trials: number; paid: number };
  comparison: { newSubsThisMonth: number; newSubsLastMonth: number };
}

function formatCurrency(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function MetricCard({
  icon: Icon, label, value, sub, color = 'text-neon-blue', trend,
}: {
  icon: any; label: string; value: string | number; sub?: string;
  color?: string; trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
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

export default function SalesDashboard() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/sales');
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Sales & Revenue</h1>
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

  if (error || !data) {
    return (
      <div className="glass p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-white/60">{error || 'Failed to load sales data'}</p>
        <button onClick={handleRefresh} className="mt-4 text-sm text-neon-blue hover:underline">Retry</button>
      </div>
    );
  }

  const growthPositive = data.growthRate >= 0;
  const churnPositive = data.churnRate <= 5; // healthy churn is under 5%
  const fundingKnown = data.funnel.signups > 0;
  const funnelConv = fundingKnown ? (data.funnel.paid / data.funnel.signups) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales & Revenue</h1>
          <p className="text-white/40 text-sm mt-1">
            Live commerce metrics, MRR, churn, and subscription health
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Core Revenue Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign}
          label="Monthly Recurring Revenue"
          value={formatCurrency(data.mrr)}
          sub={`ARR: ${formatCurrency(data.arr)}`}
          color="text-emerald-400"
        />
        <MetricCard
          icon={TrendingUp}
          label="Growth Rate (MoM)"
          value={`${data.growthRate >= 0 ? '+' : ''}${data.growthRate.toFixed(1)}%`}
          sub={`${data.thisMonth.newSubs} new vs ${data.comparison.newSubsLastMonth} last month`}
          color={growthPositive ? 'text-neon-green' : 'text-red-400'}
          trend={{ value: `${data.growthRate >= 0 ? '+' : ''}${data.growthRate.toFixed(1)}%`, positive: growthPositive }}
        />
        <MetricCard
          icon={Target}
          label="Conversion Rate"
          value={`${data.conversionRate.toFixed(1)}%`}
          sub={`${data.paidUsers} paid / ${data.totalUsers} total users`}
          color="text-neon-purple"
        />
        <MetricCard
          icon={TrendingDown}
          label="Churn Rate"
          value={`${data.churnRate.toFixed(2)}%`}
          sub={`${data.thisMonth.canceledSubs} canceled this month`}
          color={churnPositive ? 'text-white/60' : 'text-red-400'}
          trend={{ value: `${data.churnRate.toFixed(1)}%`, positive: churnPositive }}
        />
      </div>

      {/* Subscription Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={CreditCard}
          label="Active Subscriptions"
          value={data.activeSubscriptions}
          sub={`${data.pastDueSubscriptions} past due`}
          color="text-neon-blue"
        />
        <MetricCard
          icon={Users}
          label="Total Users"
          value={data.totalUsers.toLocaleString()}
          sub={`${data.thisMonth.newUsers} new this month`}
          color="text-neon-blue"
        />
        <MetricCard
          icon={Zap}
          label="Credit Revenue (MTD)"
          value={formatCurrency(data.thisMonth.creditRevenue)}
          sub={`${data.thisMonth.creditTransactions} transactions`}
          color="text-yellow-400"
        />
        <MetricCard
          icon={ShoppingCart}
          label="Lifetime Revenue"
          value={formatCurrency(data.lifetime.creditRevenue)}
          sub={`${data.lifetime.creditTransactions} total purchases`}
          color="text-orange-400"
        />
      </div>

      {/* Plan Breakdown + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-neon-purple" />
            Active Subscriptions by Plan
          </h2>
          {Object.keys(data.activeByPlan).length === 0 ? (
            <p className="text-white/40 text-sm text-center py-4">No active subscriptions</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(data.activeByPlan).map(([plan, stats]) => {
                const colors: Record<string, string> = {
                  PRO: 'from-neon-blue/20 to-neon-blue/5 border-neon-blue/20',
                  MAX: 'from-neon-purple/20 to-neon-purple/5 border-neon-purple/20',
                };
                return (
                  <div
                    key={plan}
                    className={`p-4 rounded-xl bg-gradient-to-br border ${colors[plan] || 'from-white/5 to-white/[0.02] border-white/10'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xl font-bold">{plan}</div>
                        <div className="text-xs text-white/40">{stats.total} active</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-emerald-400">{formatCurrency(stats.mrr)}</div>
                        <div className="text-xs text-white/40">MRR</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between text-white/60">
                        <span>Monthly</span>
                        <span className="font-medium">{stats.monthly}</span>
                      </div>
                      <div className="flex justify-between text-white/60">
                        <span>Yearly</span>
                        <span className="font-medium">{stats.yearly}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-neon-blue" />
            Subscription Status Breakdown
          </h2>
          {Object.keys(data.subStatusBreakdown).length === 0 ? (
            <p className="text-white/40 text-sm text-center py-4">No subscriptions yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.subStatusBreakdown).map(([status, count]) => {
                const colors: Record<string, string> = {
                  ACTIVE: 'bg-emerald-500',
                  TRIALING: 'bg-neon-blue',
                  PAST_DUE: 'bg-amber-500',
                  CANCELED: 'bg-white/20',
                  INCOMPLETE: 'bg-red-500',
                  UNPAID: 'bg-red-500',
                };
                const total = Object.values(data.subStatusBreakdown).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/60">{status}</span>
                      <span className="text-white/40">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[status] || 'bg-white/20'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="glass p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-neon-green" />
          Conversion Funnel (This Month)
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Total Users (Lifetime)', value: data.funnel.visitors, color: 'bg-white/20' },
            { label: 'New Signups', value: data.funnel.signups, color: 'bg-neon-blue' },
            { label: 'Subscription Started', value: data.funnel.trials, color: 'bg-neon-purple' },
            { label: 'Paid Conversions', value: data.funnel.paid, color: 'bg-emerald-500' },
          ].map((stage, i, arr) => {
            const maxVal = arr[0].value || 1;
            const pct = Math.max((stage.value / maxVal) * 100, 2);
            return (
              <div key={stage.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/60">{stage.label}</span>
                  <span className="text-white font-medium">{stage.value.toLocaleString()}</span>
                </div>
                <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
                  <div className={`h-full rounded-lg ${stage.color} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        {fundingKnown && (
          <p className="text-xs text-white/30 mt-4">
            Signup → Paid conversion: <span className="text-emerald-400 font-medium">{funnelConv.toFixed(2)}%</span>
          </p>
        )}
      </div>

      {/* Daily Revenue Chart */}
      {data.dailyRevenue.length > 0 && (
        <div className="glass p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neon-blue" />
            Daily Revenue (Last 30 Days)
          </h2>
          <div className="flex items-end gap-1 h-40">
            {data.dailyRevenue.map((d: any, i: number) => {
              const maxRev = Math.max(...data.dailyRevenue.map((x: any) => x.revenue), 1);
              const height = Math.max((d.revenue / maxRev) * 100, 2);
              return (
                <div
                  key={i}
                  className="flex-1 bg-emerald-500/40 hover:bg-emerald-500/60 rounded-t transition-colors cursor-pointer group relative"
                  style={{ height: `${height}%` }}
                  title={`${new Date(d.date).toLocaleDateString()}: ${formatCurrency(d.revenue)} (${d.transactions} tx)`}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block text-xs bg-surface-50 px-2 py-1 rounded whitespace-nowrap border border-white/10 z-10">
                    {formatCurrency(d.revenue)}<br/>
                    <span className="text-white/40">{d.transactions} tx</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/30">
            <span>{data.dailyRevenue.length > 0 ? new Date(data.dailyRevenue[0].date).toLocaleDateString() : ''}</span>
            <span>Today</span>
          </div>
        </div>
      )}

      {/* Recent Revenue Events */}
      <div className="glass p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-neon-blue" />
          Recent Revenue Events
        </h2>
        {data.recentEvents.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-4">No recent transactions</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {data.recentEvents.map((ev: any) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors border border-white/5"
              >
                <div className={`p-2 rounded-lg ${ev.type === 'subscription' ? 'bg-neon-purple/10 text-neon-purple' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {ev.type === 'subscription' ? <CreditCard className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white/80 truncate">
                      {ev.user?.name || ev.user?.email || 'Unknown user'}
                    </p>
                    {ev.type === 'subscription' && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        ev.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400'
                          : ev.status === 'CANCELED' ? 'bg-white/10 text-white/40'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {ev.status}
                      </span>
                    )}
                    {ev.cancelAtPeriodEnd && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                        Cancelling
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/30 truncate">
                    {ev.type === 'subscription'
                      ? `${ev.plan} ${ev.interval === 'year' ? 'Annual' : 'Monthly'}`
                      : `${ev.credits} credits purchase`}
                    {' · '}
                    {new Date(ev.date).toLocaleString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-emerald-400">
                    {formatCurrency(ev.amount)}
                  </div>
                  {ev.type === 'subscription' && ev.interval === 'year' && (
                    <div className="text-[10px] text-white/30">/ year</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
