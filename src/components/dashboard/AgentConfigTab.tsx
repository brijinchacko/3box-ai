'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { AgentId } from '@/lib/agents/registry';

/* ── Per-agent configuration field definitions ── */
interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'toggle' | 'tags' | 'divider';
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  helpText?: string;
  source?: 'profile' | 'config'; // where to load/save
  warnAbove?: number; // Show warning when value exceeds this
  warnMessage?: string;
}

const AGENT_CONFIG_FIELDS: Record<string, ConfigField[]> = {
  scout: [
    { key: 'targetRole', label: 'Target Role', type: 'text', placeholder: 'e.g., Software Engineer', source: 'profile', helpText: 'Primary role Scout searches for' },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'e.g., San Francisco, CA', source: 'profile', helpText: 'Preferred job location' },
    { key: 'workMode', label: 'Work Mode', type: 'select', source: 'config', options: [
      { value: 'any', label: 'Any' },
      { value: 'remote', label: 'Remote' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'onsite', label: 'On-site' },
    ]},
    { key: 'experienceLevel', label: 'Experience Level', type: 'select', source: 'profile', options: [
      { value: 'entry', label: 'Entry Level' },
      { value: 'mid', label: 'Mid Level' },
      { value: 'senior', label: 'Senior' },
      { value: 'lead', label: 'Lead / Staff' },
      { value: 'executive', label: 'Executive' },
    ]},
    { key: 'minMatchScore', label: 'Min Match Score', type: 'number', min: 20, max: 95, source: 'config', helpText: 'Only show jobs above this match %' },
    { key: '_divider_auto', label: 'Auto-Hunting Settings', type: 'divider' as any, source: 'config' },
    { key: 'scoutInterval', label: 'Hunt Frequency', type: 'select', source: 'config', options: [
      { value: '1', label: 'Every hour' },
      { value: '2', label: 'Every 2 hours' },
      { value: '4', label: 'Every 4 hours' },
      { value: '6', label: 'Every 6 hours' },
      { value: '12', label: 'Every 12 hours' },
      { value: '24', label: 'Once a day' },
    ], helpText: 'How often Scout searches for new jobs' },
    { key: 'scoutJobsPerSearch', label: 'Jobs Per Search', type: 'number', min: 5, max: 50, source: 'config', helpText: 'Number of jobs to find per hunt cycle' },
    { key: 'scoutDailyCap', label: 'Daily Application Limit', type: 'number', min: 5, max: 100, source: 'config', helpText: 'Max applications per day', warnAbove: 80, warnMessage: 'Applying to more than 80–100 jobs/day may be flagged as spam by job platforms. We recommend staying under 50 for best results.' },
    { key: 'excludeCompanies', label: 'Exclude Companies', type: 'tags', placeholder: 'Type & press Enter', source: 'config', helpText: 'Companies to skip' },
    { key: 'excludeKeywords', label: 'Exclude Keywords', type: 'tags', placeholder: 'Type & press Enter', source: 'config', helpText: 'Filter out jobs with these keywords' },
  ],
  forge: [
    { key: 'targetRole', label: 'Target Role', type: 'text', placeholder: 'e.g., Full Stack Developer', source: 'profile', helpText: 'Role Forge optimizes your resume for' },
    { key: 'forgeMode', label: 'Optimization Mode', type: 'select', source: 'config', options: [
      { value: 'on_demand', label: 'On Demand — Manual per job' },
      { value: 'per_job', label: 'Per Job — Auto for each match' },
      { value: 'base_only', label: 'Base Only — Optimize once' },
    ], helpText: 'How Forge handles resume variants' },
  ],
  archer: [
    { key: 'targetRole', label: 'Target Role', type: 'text', placeholder: 'e.g., Backend Engineer', source: 'profile' },
    { key: 'archerMaxPerRun', label: 'Max Applications Per Run', type: 'number', min: 1, max: 100, source: 'config', helpText: 'Limit how many apps Archer sends per batch' },
    { key: 'minMatchScore', label: 'Min Match Score', type: 'number', min: 40, max: 95, source: 'config', helpText: 'Only apply to jobs above this match %' },
    { key: 'preferRemote', label: 'Prefer Remote', type: 'toggle', source: 'config', helpText: 'Prioritize remote positions' },
  ],
  atlas: [
    { key: 'targetRole', label: 'Target Role', type: 'text', placeholder: 'e.g., Product Manager', source: 'profile', helpText: 'Role Atlas preps interviews for' },
    { key: 'interviewFocus', label: 'Focus Areas', type: 'select', source: 'config', options: [
      { value: 'balanced', label: 'Balanced — All types' },
      { value: 'behavioral', label: 'Behavioral' },
      { value: 'technical', label: 'Technical' },
      { value: 'system-design', label: 'System Design' },
      { value: 'case-study', label: 'Case Study' },
    ], helpText: 'What type of questions to focus on' },
  ],
  sage: [
    { key: 'targetRole', label: 'Target Role', type: 'text', placeholder: 'e.g., Data Scientist', source: 'profile', helpText: 'Role Sage analyzes skill gaps for' },
    { key: 'learningStyle', label: 'Learning Style', type: 'select', source: 'config', options: [
      { value: 'structured', label: 'Structured — Course-based' },
      { value: 'hands-on', label: 'Hands-on — Project-based' },
      { value: 'mixed', label: 'Mixed — Both styles' },
    ], helpText: 'How Sage recommends learning' },
  ],
  sentinel: [
    { key: 'qualityThreshold', label: 'Quality Threshold', type: 'number', min: 50, max: 95, source: 'config', helpText: 'Block apps below this quality score' },
    { key: 'autoReject', label: 'Auto-Reject Low Quality', type: 'toggle', source: 'config', helpText: 'Automatically reject apps below threshold' },
  ],
};

interface AgentConfigTabProps {
  agentId: AgentId;
}

export default function AgentConfigTab({ agentId }: AgentConfigTabProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tagInput, setTagInput] = useState<Record<string, string>>({});

  const fields = AGENT_CONFIG_FIELDS[agentId] || [];

  // Load config from both profile and agents/config
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [profileRes, configRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/agents/config'),
        ]);
        const profile = profileRes.ok ? await profileRes.json() : {};
        const config = configRes.ok ? await configRes.json() : {};

        if (cancelled) return;

        const initial: Record<string, any> = {};
        for (const f of fields) {
          if (f.source === 'profile') {
            if (f.key === 'experienceLevel') {
              const snap = profile.careerTwin?.skillSnapshot as any;
              initial[f.key] = snap?._profile?.experienceLevel || '';
            } else {
              initial[f.key] = profile[f.key] || '';
            }
          } else {
            // From agents/config
            if (f.type === 'tags') {
              initial[f.key] = Array.isArray(config[f.key]) ? config[f.key] : [];
            } else if (f.type === 'toggle') {
              initial[f.key] = config[f.key] ?? false;
            } else if (f.type === 'number') {
              initial[f.key] = config[f.key] ?? f.min ?? 60;
            } else {
              initial[f.key] = config[f.key] || (f.options?.[0]?.value ?? '');
            }
          }
        }
        setValues(initial);
      } catch (err) {
        console.error('Failed to load agent config:', err);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [agentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((key: string, val: any) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  }, []);

  const handleTagAdd = useCallback((key: string, newTag: string) => {
    const tag = newTag.trim();
    if (!tag) return;
    setValues(prev => {
      const arr = Array.isArray(prev[key]) ? [...prev[key]] : [];
      if (!arr.includes(tag)) arr.push(tag);
      return { ...prev, [key]: arr };
    });
    setTagInput(prev => ({ ...prev, [key]: '' }));
    setSaved(false);
  }, []);

  const handleTagRemove = useCallback((key: string, tag: string) => {
    setValues(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter((t: string) => t !== tag),
    }));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Split into profile updates and config updates
      const profileUpdate: Record<string, any> = {};
      const configUpdate: Record<string, any> = {};

      for (const f of fields) {
        if (f.source === 'profile') {
          profileUpdate[f.key] = values[f.key];
        } else {
          configUpdate[f.key] = values[f.key];
        }
      }

      const promises: Promise<any>[] = [];

      if (Object.keys(profileUpdate).length > 0) {
        promises.push(
          fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileUpdate),
          })
        );
      }

      if (Object.keys(configUpdate).length > 0) {
        promises.push(
          fetch('/api/agents/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configUpdate),
          })
        );
      }

      await Promise.all(promises);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save config:', err);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-white/30" />
        <span className="ml-2 text-xs text-white/30">Loading configuration...</span>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <p className="text-xs text-white/30 py-4 text-center">No configuration available for this agent.</p>
    );
  }

  return (
    <div className="space-y-3">
      {fields.map(field => {
        if (field.type === 'divider') {
          return (
            <div key={field.key} className="pt-3 pb-1 border-t border-white/5">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">{field.label}</p>
            </div>
          );
        }
        return (
        <div key={field.key}>
          <label className="block text-[11px] font-medium text-white/50 mb-1">
            {field.label}
          </label>

          {/* Text Input */}
          {field.type === 'text' && (
            <input
              type="text"
              value={values[field.key] || ''}
              onChange={e => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white
                         placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
            />
          )}

          {/* Select */}
          {field.type === 'select' && (
            <select
              value={values[field.key] || ''}
              onChange={e => handleChange(field.key, e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white
                         focus:outline-none focus:border-white/20 transition-colors appearance-none cursor-pointer"
            >
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-[#1a1a2e] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {/* Number */}
          {field.type === 'number' && (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={field.min ?? 0}
                max={field.max ?? 100}
                value={values[field.key] ?? field.min ?? 0}
                onChange={e => handleChange(field.key, parseInt(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none bg-white/10 accent-neon-blue cursor-pointer
                           [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-neon-blue"
              />
              <span className="text-xs font-mono text-white/60 w-8 text-right tabular-nums">
                {values[field.key] ?? field.min ?? 0}
              </span>
            </div>
          )}

          {/* Toggle */}
          {field.type === 'toggle' && (
            <button
              onClick={() => handleChange(field.key, !values[field.key])}
              className="flex items-center gap-2"
            >
              <div className={`w-8 h-4 rounded-full transition-colors relative ${
                values[field.key] ? 'bg-neon-green/30' : 'bg-white/10'
              }`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                  values[field.key]
                    ? 'left-[18px] bg-neon-green'
                    : 'left-0.5 bg-white/30'
                }`} />
              </div>
              <span className="text-[10px] text-white/40">
                {values[field.key] ? 'Enabled' : 'Disabled'}
              </span>
            </button>
          )}

          {/* Tags */}
          {field.type === 'tags' && (
            <div>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {(values[field.key] || []).map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
                               bg-white/5 border border-white/10 text-white/50"
                  >
                    {tag}
                    <button
                      onClick={() => handleTagRemove(field.key, tag)}
                      className="text-white/25 hover:text-white/60 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput[field.key] || ''}
                onChange={e => setTagInput(prev => ({ ...prev, [field.key]: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTagAdd(field.key, tagInput[field.key] || '');
                  }
                }}
                placeholder={field.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white
                           placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          )}

          {field.helpText && (
            <p className="text-[9px] text-white/20 mt-0.5">{field.helpText}</p>
          )}

          {/* Spam Warning */}
          {field.warnAbove != null && typeof values[field.key] === 'number' && values[field.key] > field.warnAbove && (
            <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded-lg bg-amber-400/5 border border-amber-400/10">
              <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-[9px] text-amber-400/70 leading-relaxed">{field.warnMessage}</p>
            </div>
          )}
        </div>
        );
      })}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          saved
            ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border border-white/10'
        } disabled:opacity-50`}
      >
        {saving ? (
          <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
        ) : saved ? (
          <><CheckCircle2 className="w-3 h-3" /> Saved</>
        ) : (
          <><Save className="w-3 h-3" /> Save Configuration</>
        )}
      </button>
    </div>
  );
}
