'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Target, Calendar, ListTodo, Rocket,
  ChevronDown, ChevronRight, Plus, Loader2, Check,
  AlertCircle, Clock, Zap, Globe, Youtube, Users,
  DollarSign, FileText, Search, Filter, BarChart3,
  RefreshCw, Database, ExternalLink, Edit3, X,
  CheckCircle2, Circle, ArrowUpCircle, Minus,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────── */

interface MarketingTask {
  id: string;
  phaseId: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  assignee: string | null;
  dueDate: string | null;
  completedAt: string | null;
}

interface MarketingPhase {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  tasks: MarketingTask[];
}

interface MarketingKPI {
  id: string;
  name: string;
  category: string;
  target: number;
  current: number;
  unit: string;
  period: string;
  month: number;
  year: number;
}

interface ContentItem {
  id: string;
  title: string;
  targetKeyword: string | null;
  keywordDifficulty: number | null;
  category: string;
  status: string;
  scheduledDate: string | null;
  publishedDate: string | null;
  publishedUrl: string | null;
  author: string | null;
  notes: string | null;
}

interface Stats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  publishedContent: number;
  totalContent: number;
  overallProgress: number;
}

/* ─── Helpers ───────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-white/10 text-white/50',
  in_progress: 'bg-neon-blue/20 text-neon-blue',
  completed: 'bg-neon-green/20 text-neon-green',
  pending: 'bg-white/10 text-white/50',
  blocked: 'bg-red-500/20 text-red-400',
  planned: 'bg-white/10 text-white/50',
  writing: 'bg-yellow-500/20 text-yellow-400',
  review: 'bg-neon-purple/20 text-neon-purple',
  published: 'bg-neon-green/20 text-neon-green',
  scheduled: 'bg-neon-blue/20 text-neon-blue',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-white/30',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  seo: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  content: 'bg-neon-blue/20 text-neon-blue border-neon-blue/30',
  youtube: 'bg-red-500/20 text-red-400 border-red-500/30',
  social: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30',
  partnerships: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  technical: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  blog: 'bg-neon-blue/20 text-neon-blue border-neon-blue/30',
  landing_page: 'bg-neon-green/20 text-neon-green border-neon-green/30',
  comparison: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  video: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const CATEGORY_ICONS: Record<string, any> = {
  seo: Search,
  content: FileText,
  youtube: Youtube,
  social: Users,
  partnerships: Globe,
  technical: Zap,
};

function formatDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getProgressColor(pct: number): string {
  if (pct >= 70) return 'bg-neon-green';
  if (pct >= 30) return 'bg-yellow-400';
  return 'bg-red-400';
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ─── Component ─────────────────────────────────── */

export default function MarketingDashboard() {
  const [phases, setPhases] = useState<MarketingPhase[]>([]);
  const [kpis, setKpis] = useState<MarketingKPI[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // UI state
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'kpis' | 'content' | 'tasks'>('overview');
  const [kpiMonth, setKpiMonth] = useState(new Date().getMonth() + 1);
  const [kpiYear, setKpiYear] = useState(new Date().getFullYear());
  const [contentFilter, setContentFilter] = useState<{ status: string; category: string }>({ status: '', category: '' });
  const [taskFilter, setTaskFilter] = useState<{ status: string; category: string }>({ status: '', category: '' });

  // Inline edit state
  const [editingKpi, setEditingKpi] = useState<string | null>(null);
  const [editingKpiValue, setEditingKpiValue] = useState<string>('');

  // Add content modal
  const [showAddContent, setShowAddContent] = useState(false);
  const [newContent, setNewContent] = useState({ title: '', targetKeyword: '', keywordDifficulty: 0, category: 'blog', scheduledDate: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/marketing');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setPhases(data.phases || []);
      setKpis(data.kpis || []);
      setContentItems(data.contentItems || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchKpis = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/marketing/kpis?month=${kpiMonth}&year=${kpiYear}`);
      if (!res.ok) return;
      const data = await res.json();
      setKpis(data.kpis || []);
    } catch (err) {
      console.error(err);
    }
  }, [kpiMonth, kpiYear]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (activeTab === 'kpis') fetchKpis(); }, [activeTab, fetchKpis]);

  /* ─── Actions ───────────────────────────────── */

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch('/api/admin/marketing/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSeedResult(`Seeded ${data.seeded.phases} phases, ${data.seeded.tasks} tasks, ${data.seeded.kpis} KPIs, ${data.seeded.contentItems} content items`);
        fetchData();
      } else {
        setSeedResult(data.error || 'Seed failed');
      }
    } catch {
      setSeedResult('Network error');
    } finally {
      setSeeding(false);
    }
  };

  const updatePhaseStatus = async (phaseId: string, newStatus: string) => {
    try {
      await fetch('/api/admin/marketing/phases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: phaseId, status: newStatus }),
      });
      setPhases((prev) =>
        prev.map((p) => (p.id === phaseId ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const updatePhaseProgress = async (phaseId: string, progress: number) => {
    try {
      await fetch('/api/admin/marketing/phases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: phaseId, progress }),
      });
      setPhases((prev) =>
        prev.map((p) => (p.id === phaseId ? { ...p, progress } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await fetch('/api/admin/marketing/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      setPhases((prev) =>
        prev.map((p) => ({
          ...p,
          tasks: p.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : null }
              : t
          ),
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const updateKpiValue = async (kpiId: string, current: number) => {
    try {
      await fetch('/api/admin/marketing/kpis', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: kpiId, current }),
      });
      setKpis((prev) =>
        prev.map((k) => (k.id === kpiId ? { ...k, current } : k))
      );
      setEditingKpi(null);
    } catch (err) {
      console.error(err);
    }
  };

  const updateContentStatus = async (itemId: string, newStatus: string) => {
    try {
      await fetch('/api/admin/marketing/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, status: newStatus }),
      });
      setContentItems((prev) =>
        prev.map((c) => (c.id === itemId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const addContentItem = async () => {
    if (!newContent.title) return;
    try {
      const res = await fetch('/api/admin/marketing/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContent),
      });
      if (res.ok) {
        const data = await res.json();
        setContentItems((prev) => [...prev, data.item]);
        setNewContent({ title: '', targetKeyword: '', keywordDifficulty: 0, category: 'blog', scheduledDate: '' });
        setShowAddContent(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteContentItem = async (itemId: string) => {
    try {
      await fetch(`/api/admin/marketing/content/${itemId}`, { method: 'DELETE' });
      setContentItems((prev) => prev.filter((c) => c.id !== itemId));
    } catch (err) {
      console.error(err);
    }
  };

  const togglePhase = (id: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ─── Filtered data ─────────────────────────── */

  const filteredContent = contentItems.filter((c) => {
    if (contentFilter.status && c.status !== contentFilter.status) return false;
    if (contentFilter.category && c.category !== contentFilter.category) return false;
    return true;
  });

  const allTasks = phases.flatMap((p) => p.tasks.map((t) => ({ ...t, phaseName: p.name })));
  const filteredTasks = allTasks.filter((t) => {
    if (taskFilter.status && t.status !== taskFilter.status) return false;
    if (taskFilter.category && t.category !== taskFilter.category) return false;
    return true;
  });

  /* ─── Render ────────────────────────────────── */

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Marketing Dashboard</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-neon-blue" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marketing Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Track strategy execution, KPIs, and content pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {phases.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              Seed Strategy Data
            </button>
          )}
        </div>
      </div>

      {seedResult && (
        <div className={`px-4 py-3 rounded-xl text-sm ${seedResult.includes('Seeded') ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {seedResult}
        </div>
      )}

      {/* Quick Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
            <div className="text-xs text-white/40 mb-1">Overall Progress</div>
            <div className="text-xl font-bold text-neon-blue">{stats.overallProgress}%</div>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${getProgressColor(stats.overallProgress)} transition-all`} style={{ width: `${stats.overallProgress}%` }} />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
            <div className="text-xs text-white/40 mb-1">Tasks Completed</div>
            <div className="text-xl font-bold text-neon-green">{stats.completedTasks}<span className="text-sm text-white/30">/{stats.totalTasks}</span></div>
            <div className="text-xs text-white/30 mt-1">{stats.inProgressTasks} in progress</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
            <div className="text-xs text-white/40 mb-1">Content Published</div>
            <div className="text-xl font-bold text-neon-purple">{stats.publishedContent}<span className="text-sm text-white/30">/{stats.totalContent}</span></div>
            <div className="text-xs text-white/30 mt-1">articles in pipeline</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
            <div className="text-xs text-white/40 mb-1">Active Phases</div>
            <div className="text-xl font-bold text-amber-400">{phases.filter((p) => p.status === 'in_progress').length}<span className="text-sm text-white/30">/{phases.length}</span></div>
            <div className="text-xs text-white/30 mt-1">market expansions</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
        {(['overview', 'kpis', 'content', 'tasks'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {tab === 'overview' && <span className="flex items-center justify-center gap-2"><Rocket className="w-4 h-4" />Strategy</span>}
            {tab === 'kpis' && <span className="flex items-center justify-center gap-2"><Target className="w-4 h-4" />KPIs</span>}
            {tab === 'content' && <span className="flex items-center justify-center gap-2"><Calendar className="w-4 h-4" />Content</span>}
            {tab === 'tasks' && <span className="flex items-center justify-center gap-2"><ListTodo className="w-4 h-4" />Tasks</span>}
          </button>
        ))}
      </div>

      {/* ── STRATEGY OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {phases.map((phase, idx) => {
            const isExpanded = expandedPhases.has(phase.id);
            const completedTasks = phase.tasks.filter((t) => t.status === 'completed').length;
            const taskPct = phase.tasks.length > 0 ? Math.round((completedTasks / phase.tasks.length) * 100) : 0;

            return (
              <div
                key={phase.id}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden transition-all"
              >
                {/* Phase Header */}
                <div
                  className="p-5 cursor-pointer hover:bg-white/[0.02] transition-all"
                  onClick={() => togglePhase(phase.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center text-sm font-bold text-neon-blue">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-white">{phase.name}</h3>
                        <select
                          value={phase.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updatePhaseStatus(phase.id, e.target.value)}
                          className={`text-xs px-2 py-0.5 rounded-full border-0 cursor-pointer ${STATUS_COLORS[phase.status] || 'bg-white/10 text-white/50'}`}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <p className="text-xs text-white/40 line-clamp-1">{phase.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex-1 max-w-xs">
                          <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                            <span>{completedTasks}/{phase.tasks.length} tasks</span>
                            <span>{taskPct}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressColor(taskPct)}`}
                              style={{ width: `${taskPct}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-xs text-white/30">
                          {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                        </div>
                        {/* Manual progress override */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={phase.progress}
                            onChange={(e) => updatePhaseProgress(phase.id, parseInt(e.target.value))}
                            className="w-20 h-1 accent-neon-blue"
                          />
                          <span className="text-xs text-white/40 w-8">{phase.progress}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-white/30" /> : <ChevronRight className="w-5 h-5 text-white/30" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Tasks */}
                {isExpanded && (
                  <div className="border-t border-white/[0.06] p-4">
                    <div className="space-y-2">
                      {phase.tasks.map((task) => {
                        const CatIcon = CATEGORY_ICONS[task.category] || FileText;
                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
                          >
                            {/* Status toggle */}
                            <button
                              onClick={() => {
                                const next = task.status === 'completed' ? 'pending' : task.status === 'pending' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'pending';
                                updateTaskStatus(task.id, next);
                              }}
                              className="flex-shrink-0"
                            >
                              {task.status === 'completed' ? (
                                <CheckCircle2 className="w-5 h-5 text-neon-green" />
                              ) : task.status === 'in_progress' ? (
                                <ArrowUpCircle className="w-5 h-5 text-neon-blue" />
                              ) : task.status === 'blocked' ? (
                                <AlertCircle className="w-5 h-5 text-red-400" />
                              ) : (
                                <Circle className="w-5 h-5 text-white/20 group-hover:text-white/40" />
                              )}
                            </button>

                            <span className={`flex-1 text-sm ${task.status === 'completed' ? 'text-white/40 line-through' : 'text-white/80'}`}>
                              {task.title}
                            </span>

                            {/* Category badge */}
                            <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[task.category] || 'bg-white/10 text-white/50 border-white/10'}`}>
                              <CatIcon className="w-3 h-3" />
                              {task.category}
                            </span>

                            {/* Priority dot */}
                            <span className={`text-[10px] font-medium ${PRIORITY_COLORS[task.priority] || 'text-white/30'}`}>
                              {task.priority}
                            </span>

                            {/* Status dropdown */}
                            <select
                              value={task.status}
                              onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                              className="text-[10px] bg-transparent border border-white/10 rounded px-1 py-0.5 text-white/50 focus:outline-none focus:border-neon-blue/50"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="blocked">Blocked</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── KPI TRACKER TAB ── */}
      {activeTab === 'kpis' && (
        <div className="space-y-4">
          {/* Month Selector */}
          <div className="flex items-center gap-3">
            <select
              value={kpiMonth}
              onChange={(e) => setKpiMonth(parseInt(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-blue/50"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={kpiYear}
              onChange={(e) => setKpiYear(parseInt(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-blue/50"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2028}>2028</option>
            </select>
            <span className="text-xs text-white/30">
              Showing {kpis.length} KPIs for {MONTH_NAMES[kpiMonth - 1]} {kpiYear}
            </span>
          </div>

          {kpis.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">
              No KPIs found for this period. Seed data or select a different month.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis.map((kpi) => {
                const pct = kpi.target > 0 ? Math.round((kpi.current / kpi.target) * 100) : 0;
                const isEditing = editingKpi === kpi.id;
                const kpiIcon = kpi.category === 'traffic' ? TrendingUp : kpi.category === 'revenue' ? DollarSign : kpi.category === 'social' ? Users : FileText;
                const Icon = kpiIcon;

                return (
                  <div
                    key={kpi.id}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-neon-blue" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white/80">{kpi.name}</div>
                          <div className="text-[10px] text-white/30">{kpi.category}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (isEditing) {
                            updateKpiValue(kpi.id, parseInt(editingKpiValue) || 0);
                          } else {
                            setEditingKpi(kpi.id);
                            setEditingKpiValue(String(kpi.current));
                          }
                        }}
                        className="text-white/30 hover:text-white/60 transition-colors"
                      >
                        {isEditing ? <Check className="w-4 h-4 text-neon-green" /> : <Edit3 className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-end gap-2 mb-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editingKpiValue}
                          onChange={(e) => setEditingKpiValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateKpiValue(kpi.id, parseInt(editingKpiValue) || 0);
                            if (e.key === 'Escape') setEditingKpi(null);
                          }}
                          autoFocus
                          className="w-24 bg-white/10 border border-neon-blue/50 rounded px-2 py-1 text-lg font-bold text-white focus:outline-none"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {kpi.unit === 'currency' ? '$' : ''}{kpi.current.toLocaleString()}
                        </span>
                      )}
                      <span className="text-sm text-white/30 mb-0.5">
                        / {kpi.unit === 'currency' ? '$' : ''}{kpi.target.toLocaleString()}
                      </span>
                    </div>

                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pct)}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-xs font-medium ${pct >= 70 ? 'text-neon-green' : pct >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {pct}%
                      </span>
                      <span className="text-[10px] text-white/20">{kpi.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CONTENT CALENDAR TAB ── */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={contentFilter.status}
              onChange={(e) => setContentFilter((f) => ({ ...f, status: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-blue/50"
            >
              <option value="">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="writing">Writing</option>
              <option value="review">Review</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
            <select
              value={contentFilter.category}
              onChange={(e) => setContentFilter((f) => ({ ...f, category: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-blue/50"
            >
              <option value="">All Categories</option>
              <option value="blog">Blog</option>
              <option value="landing_page">Landing Page</option>
              <option value="comparison">Comparison</option>
              <option value="video">Video</option>
              <option value="social">Social</option>
            </select>
            <span className="text-xs text-white/30">{filteredContent.length} items</span>
            <div className="flex-1" />
            <button
              onClick={() => setShowAddContent(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Content
            </button>
          </div>

          {/* Add Content Modal */}
          {showAddContent && (
            <div className="p-4 rounded-2xl bg-white/[0.05] border border-neon-blue/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Add Content Item</h4>
                <button onClick={() => setShowAddContent(false)} className="text-white/30 hover:text-white/60">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Title"
                  value={newContent.title}
                  onChange={(e) => setNewContent((c) => ({ ...c, title: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/50"
                />
                <input
                  type="text"
                  placeholder="Target Keyword"
                  value={newContent.targetKeyword}
                  onChange={(e) => setNewContent((c) => ({ ...c, targetKeyword: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/50"
                />
                <input
                  type="number"
                  placeholder="KD Score"
                  value={newContent.keywordDifficulty || ''}
                  onChange={(e) => setNewContent((c) => ({ ...c, keywordDifficulty: parseInt(e.target.value) || 0 }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/50"
                />
                <select
                  value={newContent.category}
                  onChange={(e) => setNewContent((c) => ({ ...c, category: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-blue/50"
                >
                  <option value="blog">Blog</option>
                  <option value="landing_page">Landing Page</option>
                  <option value="comparison">Comparison</option>
                  <option value="video">Video</option>
                  <option value="social">Social</option>
                </select>
                <input
                  type="date"
                  value={newContent.scheduledDate}
                  onChange={(e) => setNewContent((c) => ({ ...c, scheduledDate: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-blue/50"
                />
                <button
                  onClick={addContentItem}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-neon-purple to-neon-blue rounded-lg hover:opacity-90 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Content Table */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Keyword</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-white/40">KD</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-white/40">Category</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-white/40">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-white/40">Scheduled</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-white/40"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContent.map((item) => (
                    <tr key={item.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-white/80 font-medium max-w-xs truncate">{item.title}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white/50 text-xs max-w-[180px] truncate">{item.targetKeyword || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium ${
                          (item.keywordDifficulty || 0) <= 30 ? 'text-neon-green' :
                          (item.keywordDifficulty || 0) <= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {item.keywordDifficulty || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[item.category] || 'bg-white/10 text-white/50 border-white/10'}`}>
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={item.status}
                          onChange={(e) => updateContentStatus(item.id, e.target.value)}
                          className={`text-[10px] font-medium rounded-full px-2 py-0.5 border-0 cursor-pointer ${STATUS_COLORS[item.status] || 'bg-white/10 text-white/50'}`}
                        >
                          <option value="planned">Planned</option>
                          <option value="writing">Writing</option>
                          <option value="review">Review</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="published">Published</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-white/40">
                        {formatDate(item.scheduledDate)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => deleteContentItem(item.id)}
                          className="text-white/20 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredContent.length === 0 && (
              <div className="text-center py-8 text-white/30 text-sm">No content items found</div>
            )}
          </div>
        </div>
      )}

      {/* ── TASK BOARD TAB ── */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={taskFilter.status}
              onChange={(e) => setTaskFilter((f) => ({ ...f, status: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-blue/50"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
            <select
              value={taskFilter.category}
              onChange={(e) => setTaskFilter((f) => ({ ...f, category: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-blue/50"
            >
              <option value="">All Categories</option>
              <option value="seo">SEO</option>
              <option value="content">Content</option>
              <option value="youtube">YouTube</option>
              <option value="social">Social</option>
              <option value="partnerships">Partnerships</option>
              <option value="technical">Technical</option>
            </select>
            <span className="text-xs text-white/30">{filteredTasks.length} tasks</span>
          </div>

          {/* Task Kanban Columns */}
          <div className="grid lg:grid-cols-4 gap-4">
            {['pending', 'in_progress', 'completed', 'blocked'].map((colStatus) => {
              const colTasks = filteredTasks.filter((t) => t.status === colStatus);
              const colLabel = colStatus === 'in_progress' ? 'In Progress' : colStatus.charAt(0).toUpperCase() + colStatus.slice(1);
              const colColor = colStatus === 'pending' ? 'border-white/10' : colStatus === 'in_progress' ? 'border-neon-blue/30' : colStatus === 'completed' ? 'border-neon-green/30' : 'border-red-500/30';

              return (
                <div key={colStatus} className={`rounded-2xl bg-white/[0.02] border ${colColor} p-3`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-white/60">{colLabel}</h4>
                    <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
                  </div>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {colTasks.map((task) => {
                      const CatIcon = CATEGORY_ICONS[task.category] || FileText;
                      return (
                        <div
                          key={task.id}
                          className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <button
                              onClick={() => {
                                const next = task.status === 'completed' ? 'pending' : task.status === 'pending' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'pending';
                                updateTaskStatus(task.id, next);
                              }}
                              className="flex-shrink-0 mt-0.5"
                            >
                              {task.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-neon-green" />
                              ) : task.status === 'in_progress' ? (
                                <ArrowUpCircle className="w-4 h-4 text-neon-blue" />
                              ) : (
                                <Circle className="w-4 h-4 text-white/20" />
                              )}
                            </button>
                            <span className={`text-xs leading-relaxed ${task.status === 'completed' ? 'text-white/40 line-through' : 'text-white/80'}`}>
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[task.category] || 'bg-white/10 text-white/50 border-white/10'}`}>
                              <CatIcon className="w-2.5 h-2.5" />
                              {task.category}
                            </span>
                            <span className={`text-[9px] font-medium ${PRIORITY_COLORS[task.priority]}`}>
                              {task.priority}
                            </span>
                            <span className="text-[9px] text-white/20 ml-auto truncate max-w-[80px]">
                              {(task as any).phaseName?.split(':')[0]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {colTasks.length === 0 && (
                      <div className="text-center py-6 text-white/20 text-xs">Empty</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
