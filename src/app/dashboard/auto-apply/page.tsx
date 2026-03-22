'use client';

import { useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Zap,
  Loader2,
  Crown,
  X,
  Clock,
  Bell,
  AlertTriangle,
  Pause,
  Play,
  Save,
  Settings,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* ── Types ── */
interface AutoApplyConfig {
  enabled: boolean;
  minMatchScore: number;
  excludedCompanies: string[];
  channels: {
    atsApi: boolean;
    coldEmail: boolean;
    portal: boolean;
  };
  schedule: 'aggressive' | 'balanced' | 'relaxed';
  dailyLimit: number | null;
  notifications: boolean;
  digestTime: string; // HH:MM format
}

const DEFAULT_CONFIG: AutoApplyConfig = {
  enabled: false,
  minMatchScore: 80,
  excludedCompanies: [],
  channels: {
    atsApi: true,
    coldEmail: true,
    portal: false,
  },
  schedule: 'balanced',
  dailyLimit: null,
  notifications: true,
  digestTime: '08:00',
};

const SCHEDULE_PRESETS: {
  value: AutoApplyConfig['schedule'];
  label: string;
  description: string;
}[] = [
  {
    value: 'aggressive',
    label: 'Aggressive',
    description: 'Apply to all matches above threshold as soon as discovered. Best for urgent searches.',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Apply in batches, spread throughout the day. Recommended for most users.',
  },
  {
    value: 'relaxed',
    label: 'Relaxed',
    description: 'Apply once daily during off-peak hours. Good for passive job seekers.',
  },
];

/* ═══════════════════════════════════════════════════════
   AUTO-APPLY SETUP PAGE
   ═══════════════════════════════════════════════════════ */
export default function AutoApplySetupPage() {
  const { data: session } = useSession();
  const userPlan = ((session?.user as any)?.plan ?? 'FREE').toUpperCase();
  const isEligible = userPlan === 'PRO' || userPlan === 'MAX';

  const [config, setConfig] = useState<AutoApplyConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [companyInput, setCompanyInput] = useState('');
  const [dailyLimitEnabled, setDailyLimitEnabled] = useState(false);

  /* Fetch current config */
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/agents/auto-apply/setup');
        if (res.ok) {
          const data = await res.json();
          if (data?.config) {
            setConfig(data.config);
            setDailyLimitEnabled(data.config.dailyLimit !== null);
          }
        }
      } catch {}
      setLoading(false);
    }
    fetchConfig();
  }, []);

  /* Save config */
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        ...config,
        dailyLimit: dailyLimitEnabled ? (config.dailyLimit ?? 20) : null,
      };
      const res = await fetch('/api/agents/auto-apply/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) setSaved(true);
    } catch {}
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }, [config, dailyLimitEnabled]);

  /* Enable auto-apply */
  const handleEnable = useCallback(async () => {
    setConfig((prev) => ({ ...prev, enabled: true }));
    setSaving(true);
    try {
      await fetch('/api/agents/auto-apply/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          enabled: true,
          dailyLimit: dailyLimitEnabled ? (config.dailyLimit ?? 20) : null,
        }),
      });
      setSaved(true);
    } catch {}
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }, [config, dailyLimitEnabled]);

  /* Emergency pause */
  const handlePause = useCallback(async () => {
    setPausing(true);
    try {
      await fetch('/api/agents/auto-apply/pause', { method: 'POST' });
      setConfig((prev) => ({ ...prev, enabled: false }));
    } catch {}
    setPausing(false);
  }, []);

  /* Excluded companies tag input */
  const handleCompanyKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && companyInput.trim()) {
      e.preventDefault();
      const company = companyInput.trim();
      if (!config.excludedCompanies.includes(company)) {
        setConfig((prev) => ({
          ...prev,
          excludedCompanies: [...prev.excludedCompanies, company],
        }));
      }
      setCompanyInput('');
    }
  };

  const removeCompany = (company: string) => {
    setConfig((prev) => ({
      ...prev,
      excludedCompanies: prev.excludedCompanies.filter((c) => c !== company),
    }));
  };

  /* ── Upgrade prompt for FREE users ── */
  if (!loading && !isEligible) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Auto-Apply Requires PRO or MAX
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Upgrade your plan to let our AI agents automatically apply to matching jobs while you
            sleep. Set your preferences, review in the morning.
          </p>
          <Link
            href="/dashboard/settings?tab=billing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            View Plans
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auto-Apply</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure how agents apply to jobs on your behalf.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Status Banner */}
      {config.enabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400 flex-1">
            Auto-Apply is active
          </span>
          <button
            onClick={handlePause}
            disabled={pausing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/20"
          >
            {pausing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Pause className="w-3 h-3" />
            )}
            Emergency Pause
          </button>
        </motion.div>
      )}

      {/* ── FORM ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-5"
      >
        {/* 1. Minimum Match Score */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-3">
            Minimum Match Score
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={50}
              max={100}
              value={config.minMatchScore}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, minMatchScore: Number(e.target.value) }))
              }
              className="flex-1 accent-blue-600"
            />
            <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums w-12 text-right">
              {config.minMatchScore}%
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Only auto-apply to jobs with a match score at or above this threshold. Jobs below will
            be queued for your review.
          </p>
        </div>

        {/* 2. Excluded Companies */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-3">
            Excluded Companies
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {config.excludedCompanies.map((company) => (
              <span
                key={company}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {company}
                <button
                  onClick={() => removeCompany(company)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={companyInput}
            onChange={(e) => setCompanyInput(e.target.value)}
            onKeyDown={handleCompanyKeyDown}
            placeholder="Type company name and press Enter"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        {/* 3. Channel Preferences */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-3">
            Application Channels
          </label>
          <div className="space-y-3">
            {[
              {
                key: 'atsApi' as const,
                label: 'ATS API',
                desc: 'Apply directly through applicant tracking system integrations',
              },
              {
                key: 'coldEmail' as const,
                label: 'Cold Email',
                desc: 'Send personalized outreach emails to hiring managers',
              },
              {
                key: 'portal' as const,
                label: 'Job Portal',
                desc: 'Submit applications through company career portals',
              },
            ].map((channel) => (
              <label
                key={channel.key}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={config.channels[channel.key]}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      channels: { ...prev.channels, [channel.key]: e.target.checked },
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {channel.label}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{channel.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 4. Schedule Preset */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-3">
            Application Schedule
          </label>
          <div className="space-y-3">
            {SCHEDULE_PRESETS.map((preset) => (
              <label
                key={preset.value}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  config.schedule === preset.value
                    ? 'border-blue-300 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                )}
              >
                <input
                  type="radio"
                  name="schedule"
                  checked={config.schedule === preset.value}
                  onChange={() =>
                    setConfig((prev) => ({ ...prev, schedule: preset.value }))
                  }
                  className="mt-1 h-4 w-4 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {preset.label}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {preset.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 5. Daily Limit */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-900 dark:text-white">
              Daily Application Limit
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dailyLimitEnabled}
                onChange={(e) => setDailyLimitEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">Enable</span>
            </label>
          </div>
          {dailyLimitEnabled && (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={100}
                value={config.dailyLimit ?? 20}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    dailyLimit: Math.max(1, Math.min(100, Number(e.target.value))),
                  }))
                }
                className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                applications per day
              </span>
            </div>
          )}
        </div>

        {/* 6. Notifications Toggle */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                  Notifications
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified when auto-apply completes or needs attention
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                setConfig((prev) => ({ ...prev, notifications: !prev.notifications }))
              }
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                config.notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600',
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                  config.notifications ? 'left-[22px]' : 'left-0.5',
                )}
              />
            </button>
          </div>
        </div>

        {/* 7. Digest Time Picker */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <label className="text-sm font-semibold text-gray-900 dark:text-white">
              Morning Digest Time
            </label>
          </div>
          <input
            type="time"
            value={config.digestTime}
            onChange={(e) => setConfig((prev) => ({ ...prev, digestTime: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Receive a summary of overnight activity at this time each morning.
          </p>
        </div>
      </motion.div>

      {/* ── Action Buttons ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap items-center gap-3 pt-2"
      >
        {!config.enabled ? (
          <button
            onClick={handleEnable}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Enable Auto-Apply
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
            <button
              onClick={handlePause}
              disabled={pausing}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              {pausing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
              Pause
            </button>
          </>
        )}

        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm text-green-600 dark:text-green-400 font-medium"
          >
            Saved!
          </motion.span>
        )}
      </motion.div>

      {/* Warning note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300/70">
          Auto-apply uses your latest resume and cover letter templates. Make sure they are
          up-to-date before enabling. All applications are logged on your{' '}
          <Link
            href="/dashboard/board"
            className="underline hover:text-amber-800 dark:hover:text-amber-200"
          >
            Job Board
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
