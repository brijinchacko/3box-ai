'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Briefcase, DollarSign, Rocket, XCircle, Minimize2, Zap, AlertTriangle } from 'lucide-react';
import AgentAvatar from '@/components/brand/AgentAvatar';
import AgentLoader from '@/components/brand/AgentLoader';
import { getInsightsForRole, type JobInsight } from '@/lib/data/jobMarketInsights';
import { useTokens } from '@/hooks/useTokens';
// Token system removed — AI operations are now unlimited
const TOKEN_COSTS = { scout_search_per_platform: 0 } as const;
const estimateScoutCost = (_count: number) => 0;
import { notifyAgentStarted, notifyAgentError } from '@/lib/notifications/toast';

interface ScoutMissionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (result: ScoutMissionResult) => void;
  onBackground?: () => void;
}

export interface ScoutMissionResult {
  runId: string;
  jobs: any[];
  summary: {
    totalFound: number;
    totalFiltered: number;
    scamJobsFiltered: number;
    sources: string[];
  };
}

const PLATFORMS = [
  { id: 'jsearch', label: 'JSearch', icon: '🔍' },
  { id: 'adzuna', label: 'Adzuna', icon: '📋' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'indeed', label: 'Indeed', icon: '📌' },
  { id: 'naukri', label: 'Naukri', icon: '🇮🇳' },
  { id: 'google_jobs', label: 'Google Jobs', icon: '🌐' },
];

const WORK_MODES = [
  { id: 'any', label: 'Any' },
  { id: 'remote', label: 'Remote' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'onsite', label: 'On-site' },
] as const;

const EXP_LEVELS = ['Entry Level', 'Mid Level', 'Senior', 'Lead', 'Manager', 'Director'];

export default function ScoutMissionModal({ open, onClose, onComplete, onBackground }: ScoutMissionModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(PLATFORMS.map(p => p.id));
  const [targetRole, setTargetRole] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState<'remote' | 'hybrid' | 'onsite' | 'any'>('any');
  const [salary, setSalary] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { remaining, canAfford, refresh: refreshTokens } = useTokens();

  const estimatedCost = estimateScoutCost(selectedPlatforms.length);
  const hasEnoughTokens = canAfford(estimatedCost);

  // Pre-fill from localStorage
  useEffect(() => {
    if (open) {
      const savedRole = localStorage.getItem('3box_target_role');
      const savedLocation = localStorage.getItem('3box_user_location');
      if (savedRole && !targetRole) setTargetRole(savedRole);
      if (savedLocation && !location) setLocation(savedLocation);
    }
  }, [open]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAllPlatforms = () => setSelectedPlatforms(PLATFORMS.map(p => p.id));
  const deselectAllPlatforms = () => setSelectedPlatforms([]);

  const handleDeploy = async () => {
    if (!targetRole.trim()) {
      setError('Target role is required');
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError('Select at least one platform');
      return;
    }

    setError(null);
    setIsDeploying(true);
    notifyAgentStarted('scout', `Hunting for ${targetRole.trim()} positions...`);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/agents/scout/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          targetRole: targetRole.trim(),
          location: location.trim(),
          workMode,
          salaryExpectation: salary.trim() || undefined,
          experienceLevel: experienceLevel || undefined,
          limit: 40,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.code === 'INSUFFICIENT_TOKENS') {
          refreshTokens();
          throw new Error(`Insufficient tokens — need ${data.required}, you have ${data.remaining}. Buy more tokens to continue.`);
        }
        throw new Error(data.error || 'Scout mission failed');
      }

      const result = await res.json();
      abortRef.current = null;
      refreshTokens(); // Update token counter
      onComplete(result);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled — don't show error
        return;
      }
      const errMsg = err.message || 'Something went wrong';
      setError(errMsg);
      setIsDeploying(false);
      abortRef.current = null;
      notifyAgentError('scout', errMsg);
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsDeploying(false);
    // Mark server-side record as cancelled
    fetch('/api/agents/scout/cancel', { method: 'POST' }).catch(() => {});
  };

  const handleBackground = () => {
    // Don't abort — let the fetch continue in-flight
    // The server will complete the run, useScoutStatus polling will detect it
    abortRef.current = null;
    setIsDeploying(false);
    onBackground?.();
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={() => !isDeploying && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg glass border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* Deploying State */}
          {isDeploying ? (
            <div className="p-8">
              <AgentLoader agentId="scout" message="Agent Scout is hunting across the web" size="lg" />
              <div className="mt-6 space-y-4">
                <DeployingInsights targetRole={targetRole} platforms={selectedPlatforms} />
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all border border-white/5 hover:border-red-500/20"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel Mission
                  </button>
                  <button
                    onClick={handleBackground}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue transition-all border border-neon-blue/20"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    Work in Background
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 p-5 border-b border-white/5">
                <AgentAvatar agentId="scout" size={40} pulse />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">Mission Briefing</h3>
                  <p className="text-xs text-white/40">Tell Scout what to hunt for</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Platforms */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                      Search Platforms
                    </label>
                    <button
                      onClick={selectedPlatforms.length === PLATFORMS.length ? deselectAllPlatforms : selectAllPlatforms}
                      className="text-[10px] text-neon-blue hover:text-neon-blue/80"
                    >
                      {selectedPlatforms.length === PLATFORMS.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {PLATFORMS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                          selectedPlatforms.includes(p.id)
                            ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue'
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                        }`}
                      >
                        <span>{p.icon}</span>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Role */}
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                    Target Role *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      className="input-field pl-10"
                      placeholder="Full Stack Developer, React Engineer..."
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      className="input-field pl-10"
                      placeholder="Bangalore, India"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                {/* Work Mode */}
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                    Work Mode
                  </label>
                  <div className="flex gap-2">
                    {WORK_MODES.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setWorkMode(m.id)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                          workMode === m.id
                            ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue'
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Salary + Experience row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                      Salary Range
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        className="input-field pl-10"
                        placeholder="12-18 LPA (optional)"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                      Experience Level
                    </label>
                    <select
                      className="input-field text-sm"
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                    >
                      <option value="">Any Level</option>
                      {EXP_LEVELS.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Token Estimation */}
                <div className={`p-3 rounded-xl border ${hasEnoughTokens ? 'bg-neon-blue/5 border-neon-blue/15' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className={`w-3.5 h-3.5 ${hasEnoughTokens ? 'text-neon-blue' : 'text-red-400'}`} />
                    <span className={`text-xs font-semibold ${hasEnoughTokens ? 'text-neon-blue' : 'text-red-400'}`}>
                      Estimated Cost: {estimatedCost} tokens
                    </span>
                  </div>
                  <p className="text-[11px] text-white/40 pl-5.5">
                    {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''} x {TOKEN_COSTS.scout_search_per_platform} tokens each
                    {' '}&middot;{' '}
                    <span className={hasEnoughTokens ? 'text-white/50' : 'text-red-400'}>
                      {remaining === Infinity ? 'Unlimited' : `${remaining} tokens remaining`}
                    </span>
                  </p>
                  {!hasEnoughTokens && (
                    <a
                      href="/pricing"
                      className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-medium text-neon-blue hover:underline"
                    >
                      <Zap className="w-3 h-3" />
                      Buy More Tokens
                    </a>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    {error}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-5 border-t border-white/5">
                <button
                  onClick={onClose}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={!hasEnoughTokens}
                  className={`text-sm px-5 py-2.5 flex items-center gap-2 ${
                    hasEnoughTokens
                      ? 'btn-primary'
                      : 'rounded-xl bg-white/5 text-white/25 cursor-not-allowed border border-white/10'
                  }`}
                >
                  <Rocket className="w-4 h-4" />
                  {hasEnoughTokens ? 'Deploy Scout' : 'Insufficient Tokens'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Animated job market insights while Scout is running */
function DeployingInsights({ targetRole, platforms }: { targetRole: string; platforms: string[] }) {
  const [insightIndex, setInsightIndex] = useState(0);
  const insights = getInsightsForRole(targetRole);
  const platformNames = PLATFORMS.filter(p => platforms.includes(p.id)).map(p => p.label);

  useEffect(() => {
    const timer = setInterval(() => {
      setInsightIndex(prev => (prev + 1) % insights.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [insights.length]);

  const insight = insights[insightIndex];

  return (
    <div className="space-y-4">
      {/* Insight card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={insightIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="p-3 rounded-xl bg-white/[0.03] border border-white/5"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{insight.icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">{insight.category}</span>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">{insight.text}</p>
        </motion.div>
      </AnimatePresence>

      {/* Platform pills */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {platformNames.map((name, i) => (
          <motion.span
            key={name}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.5 }}
            className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40"
          >
            {name}
          </motion.span>
        ))}
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1">
        {insights.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === insightIndex ? 'bg-neon-blue w-4' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
