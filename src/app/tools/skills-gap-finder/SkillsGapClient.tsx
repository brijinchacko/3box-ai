'use client';

import { useState } from 'react';
import { Loader2, GitCompareArrows } from 'lucide-react';
import ToolPageLayout from '@/components/tools/ToolPageLayout';
import { useToolSubmit } from '@/hooks/useToolSubmit';

/* ── Result types ───────────────────────────────── */

interface PartialMatch {
  skill: string;
  gap: string;
}

interface PriorityItem {
  skill: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  timeToLearn: string;
}

interface SkillsGapResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  partialMatches: PartialMatch[];
  recommendations: string[];
  priority: PriorityItem[];
}

/* ── Helpers ────────────────────────────────────── */

const importanceBadge: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  important: { bg: 'bg-neon-orange/10', text: 'text-neon-orange', border: 'border-neon-orange/20' },
  'nice-to-have': { bg: 'bg-neon-blue/10', text: 'text-neon-blue', border: 'border-neon-blue/20' },
};

/* ── Component ──────────────────────────────────── */

export default function SkillsGapClient() {
  const [form, setForm] = useState({
    resumeText: '',
    jobDescription: '',
  });

  const { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit } =
    useToolSubmit<SkillsGapResult>({
      serviceKey: 'skills_gap',
      apiEndpoint: '/api/tools/skills-gap-finder',
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(form);
  };

  const scoreColor = (score: number) =>
    score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <ToolPageLayout
      title="Skills Gap Finder"
      subtitle="Compare your resume against a job description to find skill gaps and get a learning plan."
      icon={GitCompareArrows}
      iconColor="text-neon-purple"
      gradient="from-neon-purple/20 to-neon-blue/20"
      glowColor="from-neon-purple/8"
      showUpgrade={showUpgrade}
      onCloseUpgrade={() => setShowUpgrade(false)}
      serviceName="Skills Gap Finder"
    >
      {/* ── Form ──────────────────────────────────── */}
      <form onSubmit={onSubmit} className="card space-y-5 mb-8">
        {/* Resume */}
        <div>
          <label htmlFor="resumeText" className="block text-xs text-white/40 mb-1.5 font-medium">
            Your Resume <span className="text-red-400">*</span>
          </label>
          <textarea
            id="resumeText"
            rows={8}
            required
            placeholder="Paste your resume text..."
            value={form.resumeText}
            onChange={(e) => setForm({ ...form, resumeText: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-purple/40 resize-none"
          />
        </div>

        {/* Job Description */}
        <div>
          <label htmlFor="jobDescription" className="block text-xs text-white/40 mb-1.5 font-medium">
            Job Description <span className="text-red-400">*</span>
          </label>
          <textarea
            id="jobDescription"
            rows={8}
            required
            placeholder="Paste the job description..."
            value={form.jobDescription}
            onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-purple/40 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !form.resumeText.trim() || !form.jobDescription.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <GitCompareArrows className="w-4 h-4" />
          )}
          {loading ? 'Analyzing...' : 'Find Skills Gap'}
        </button>
      </form>

      {/* ── Error ─────────────────────────────────── */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {/* ── Results ───────────────────────────────── */}
      {results && (
        <div className="space-y-6">
          {/* Match Score */}
          <div className="card text-center py-8">
            <div
              className="text-6xl font-extrabold mb-2"
              style={{ color: scoreColor(results.matchScore) }}
            >
              {results.matchScore}%
            </div>
            <p className="text-white/40 text-sm">Match Score</p>
          </div>

          {/* Matched vs Missing Skills */}
          <div className="grid md:grid-cols-2 gap-4">
            {results.matchedSkills && results.matchedSkills.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-neon-green/80 mb-3">
                  Matched Skills ({results.matchedSkills.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {results.matchedSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-xs border border-neon-green/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {results.missingSkills && results.missingSkills.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-red-400/80 mb-3">
                  Missing Skills ({results.missingSkills.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {results.missingSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs border border-red-500/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Partial Matches */}
          {results.partialMatches && results.partialMatches.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-neon-orange/80 mb-3">Partial Matches</h3>
              <div className="space-y-3">
                {results.partialMatches.map((pm, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5"
                  >
                    <span className="text-xs font-medium text-neon-orange shrink-0 min-w-[120px]">
                      {pm.skill}
                    </span>
                    <span className="text-xs text-white/50">{pm.gap}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority Learning Plan */}
          {results.priority && results.priority.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-white/60 mb-3">Priority Learning Plan</h3>
              <div className="space-y-3">
                {results.priority.map((p, i) => {
                  const badge = importanceBadge[p.importance] || importanceBadge['nice-to-have'];
                  return (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5"
                    >
                      <span className="text-xs font-medium text-white/80 shrink-0 min-w-[120px]">
                        {p.skill}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs border ${badge.bg} ${badge.text} ${badge.border} shrink-0`}
                      >
                        {p.importance}
                      </span>
                      <span className="text-xs text-white/40 ml-auto shrink-0">{p.timeToLearn}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-neon-purple/80 mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {results.recommendations.map((r, i) => (
                  <li key={i} className="text-xs text-white/60 flex gap-2">
                    <span className="text-neon-purple shrink-0">+</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </ToolPageLayout>
  );
}
