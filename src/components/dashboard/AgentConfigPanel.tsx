'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ToggleLeft, ToggleRight, ChevronDown, ChevronRight,
  Settings2,
} from 'lucide-react';
import { AgentAvatarMini } from '@/components/brand/AgentAvatar';

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

  // ── Fetch config ──
  const fetchConfig = useCallback(async () => {
    try {
      const configRes = await fetch('/api/agents/config');
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
  const isEnabled = config[enabledKey] as boolean;

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
      {/* Agent config card */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AgentAvatarMini agentId={agentId} size={28} />
            <div>
              <span className="text-sm font-semibold text-white">{meta.label}</span>
              <span className="text-xs text-white/30 ml-2">{meta.subtitle}</span>
            </div>
          </div>
          <button onClick={toggleEnabled} className="flex items-center gap-1 text-sm">
            {isEnabled ? (
              <ToggleRight className="w-6 h-6 text-neon-green" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-white/30" />
            )}
          </button>
        </div>
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
        <span className="font-medium">{meta.label} {isEnabled ? 'enabled' : 'disabled'}</span>
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
