'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ToggleLeft, ToggleRight, ChevronDown, ChevronRight,
  AlertTriangle, Timer, Zap, Settings2, ExternalLink,
} from 'lucide-react';
import { AgentAvatarMini } from '@/components/brand/AgentAvatar';
import { useTokens } from '@/hooks/useTokens';
import {
  INTERVAL_OPTIONS, humanizeAgo, nextRunLabel,
} from '@/lib/agents/configUtils';
// Token system removed — AI operations are unlimited
const estimateMonthlyTokens = (..._args: any[]) => 0;
const getTokenWarningLevel = (..._args: any[]): { level: 'none'; message: string } => ({ level: 'none', message: '' });
const PLAN_TOKEN_LIMITS: Record<string, number> = { FREE: 999, PRO: 999, MAX: 999 };
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────
interface AgentConfigPanelProps {
  agentId: 'scout' | 'forge' | 'archer';
  /** 'inline' = always expanded (command center), 'collapsible' = toggle on agent pages */
  variant?: 'inline' | 'collapsible';
  /** If parent already loaded config, pass it to avoid double-fetch */
  externalConfig?: AgentScheduleConfig | null;
  /** Callback when config changes (for parent to track dirty state) */
  onConfigChange?: (config: AgentScheduleConfig) => void;
  /** Callback when config saves */
  onConfigSaved?: () => void;
}

export interface AgentScheduleConfig {
  scoutEnabled: boolean;
  scoutInterval: number;
  scoutLastRunAt: string | null;
  forgeEnabled: boolean;
  forgeInterval: number;
  forgeLastRunAt: string | null;
  forgeMode: string;
  archerEnabled: boolean;
  archerInterval: number;
  archerLastRunAt: string | null;
  archerMaxPerRun: number;
}

const AGENT_META: Record<string, { label: string; subtitle: string; }> = {
  scout: { label: 'Scout', subtitle: 'Job Discovery' },
  forge: { label: 'Forge', subtitle: 'Resume Optimization' },
  archer: { label: 'Archer', subtitle: 'Auto-Apply' },
};

const DEFAULT_CONFIG: AgentScheduleConfig = {
  scoutEnabled: false, scoutInterval: 24, scoutLastRunAt: null,
  forgeEnabled: false, forgeInterval: 24, forgeLastRunAt: null, forgeMode: 'on_demand',
  archerEnabled: false, archerInterval: 24, archerLastRunAt: null, archerMaxPerRun: 10,
};

// ─── Component ──────────────────────────────────────────────
export default function AgentConfigPanel({
  agentId,
  variant = 'collapsible',
  externalConfig,
  onConfigChange,
  onConfigSaved,
}: AgentConfigPanelProps) {
  const [config, setConfig] = useState<AgentScheduleConfig>(DEFAULT_CONFIG);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(variant === 'inline');
  const [loaded, setLoaded] = useState(false);
  const [plan, setPlan] = useState<string>('FREE');

  const tokens = useTokens(60000); // poll every 60s

  // ── Fetch config ──
  const fetchConfig = useCallback(async () => {
    try {
      const [configRes, profileRes] = await Promise.all([
        fetch('/api/agents/config'),
        fetch('/api/user/profile'),
      ]);
      if (configRes.ok) {
        const data = await configRes.json();
        const c: AgentScheduleConfig = {
          scoutEnabled: data.scoutEnabled ?? false,
          scoutInterval: data.scoutInterval ?? 24,
          scoutLastRunAt: data.scoutLastRunAt ?? null,
          forgeEnabled: data.forgeEnabled ?? false,
          forgeInterval: data.forgeInterval ?? 24,
          forgeLastRunAt: data.forgeLastRunAt ?? null,
          forgeMode: data.forgeMode ?? 'on_demand',
          archerEnabled: data.archerEnabled ?? false,
          archerInterval: data.archerInterval ?? 24,
          archerLastRunAt: data.archerLastRunAt ?? null,
          archerMaxPerRun: data.archerMaxPerRun ?? 10,
        };
        setConfig(c);
      }
      if (profileRes.ok) {
        const p = await profileRes.json();
        setPlan(p.plan || 'FREE');
      }
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (externalConfig) {
      setConfig(externalConfig);
      setLoaded(true);
    } else {
      fetchConfig();
    }
  }, [externalConfig, fetchConfig]);

  // ── Derived values ──
  const meta = AGENT_META[agentId];
  const enabledKey = `${agentId}Enabled` as keyof AgentScheduleConfig;
  const intervalKey = `${agentId}Interval` as keyof AgentScheduleConfig;
  const lastRunKey = `${agentId}LastRunAt` as keyof AgentScheduleConfig;
  const isEnabled = config[enabledKey] as boolean;
  const interval = config[intervalKey] as number;
  const lastRunAt = config[lastRunKey] as string | null;

  const monthlyEst = isEnabled ? estimateMonthlyTokens(agentId, interval, {
    archerMaxPerRun: config.archerMaxPerRun,
    forgeMode: config.forgeMode,
  }) : 0;

  const warning = isEnabled
    ? getTokenWarningLevel(monthlyEst, plan as any)
    : { level: 'none' as const, message: '' };

  const creditsDepleted = tokens.remaining === 0 && !tokens.loading && tokens.limit > 0;

  // ── Update helpers ──
  const updateField = (field: string, value: any) => {
    setConfig(prev => {
      const next = { ...prev, [field]: value };
      onConfigChange?.(next);
      return next;
    });
    setDirty(true);
  };

  const toggleEnabled = () => {
    updateField(enabledKey, !isEnabled);
  };

  // ── Save ──
  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/agents/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scoutEnabled: config.scoutEnabled,
          scoutInterval: config.scoutInterval,
          forgeEnabled: config.forgeEnabled,
          forgeInterval: config.forgeInterval,
          forgeMode: config.forgeMode,
          archerEnabled: config.archerEnabled,
          archerInterval: config.archerInterval,
          archerMaxPerRun: config.archerMaxPerRun,
        }),
      });
      if (res.ok) {
        setDirty(false);
        onConfigSaved?.();
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  // ── Collapsible wrapper ──
  const content = (
    <div className="space-y-3">
      {/* Credits depleted banner */}
      {creditsDepleted && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            Agents Paused — Token Quota Depleted
          </div>
          <p className="text-xs text-white/40 mt-1">
            Your agents will automatically resume when your tokens reset.{' '}
            <Link href="/pricing" className="text-neon-blue hover:underline">Upgrade for more tokens</Link>
          </p>
        </div>
      )}

      {/* Agent config card */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <AgentAvatarMini agentId={agentId} size={28} />
            <div>
              <span className="text-sm font-semibold text-white">{meta.label}</span>
              <span className="text-xs text-white/30 ml-2">{meta.subtitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEnabled && (
              <div className="text-right">
                <div className="text-[10px] text-white/30">Last: {humanizeAgo(lastRunAt)}</div>
                {(agentId !== 'forge' || config.forgeMode !== 'on_demand') && (
                  <div className="text-[10px] text-neon-green">Next: {nextRunLabel(lastRunAt, interval)}</div>
                )}
              </div>
            )}
            <button onClick={toggleEnabled} className="flex items-center gap-1 text-sm">
              {isEnabled ? (
                <ToggleRight className="w-6 h-6 text-neon-green" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-white/30" />
              )}
            </button>
          </div>
        </div>

        {isEnabled && (
          <div className="space-y-3 mt-2">
            {/* Scout: interval only */}
            {agentId === 'scout' && (
              <div className="flex items-center gap-3">
                <label className="text-xs text-white/40">Search interval:</label>
                <select
                  value={interval}
                  onChange={e => updateField('scoutInterval', Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:border-neon-blue/50 focus:outline-none"
                >
                  {INTERVAL_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Forge: mode + interval */}
            {agentId === 'forge' && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-white/40">Mode:</label>
                  <div className="flex rounded-lg overflow-hidden border border-white/10">
                    {[
                      { value: 'on_demand', label: 'On Demand' },
                      { value: 'base_only', label: 'Base Only' },
                      { value: 'per_job', label: 'Per Job' },
                    ].map(mode => (
                      <button
                        key={mode.value}
                        onClick={() => updateField('forgeMode', mode.value)}
                        className={`px-3 py-1.5 text-xs transition-colors ${
                          config.forgeMode === mode.value
                            ? 'bg-neon-orange/20 text-neon-orange'
                            : 'bg-white/5 text-white/40 hover:text-white/60'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
                {config.forgeMode !== 'on_demand' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-white/40">Interval:</label>
                    <select
                      value={config.forgeInterval}
                      onChange={e => updateField('forgeInterval', Number(e.target.value))}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:border-neon-blue/50 focus:outline-none"
                    >
                      {INTERVAL_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Archer: interval + max per run */}
            {agentId === 'archer' && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-white/40">Apply interval:</label>
                  <select
                    value={config.archerInterval}
                    onChange={e => updateField('archerInterval', Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:border-neon-blue/50 focus:outline-none"
                  >
                    {INTERVAL_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-white/40">Max per run:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={config.archerMaxPerRun}
                    onChange={e => updateField('archerMaxPerRun', Math.max(1, Math.min(100, Number(e.target.value))))}
                    className="w-16 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white text-center focus:border-neon-blue/50 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Token estimate + warning */}
            <div className="flex items-center gap-2 text-[10px] text-white/30">
              <Zap className="w-3 h-3" />
              <span>~{monthlyEst} tokens/month</span>
              <span className="text-white/15">•</span>
              <span>Plan: {PLAN_TOKEN_LIMITS[plan as keyof typeof PLAN_TOKEN_LIMITS] ?? 200}/month</span>
            </div>

            {warning.level !== 'none' && (
              <div className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                warning.level === 'error'
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{warning.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save button */}
      {dirty && (
        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-neon-blue/20 text-neon-blue text-xs font-medium hover:bg-neon-blue/30 transition-colors disabled:opacity-30"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );

  // Inline variant — no wrapper
  if (variant === 'inline') return content;

  // Collapsible variant
  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-white/50 hover:text-white/70 transition-colors mb-2 group"
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <Settings2 className="w-3.5 h-3.5" />
        <span className="font-medium">{meta.label} Schedule Settings</span>
        {isEnabled && (
          <span className="ml-1 px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green text-[9px] font-bold">ON</span>
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
