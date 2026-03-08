'use client';

import { useState } from 'react';
import { Loader2, BarChart } from 'lucide-react';
import ToolPageLayout from '@/components/tools/ToolPageLayout';
import { useToolSubmit } from '@/hooks/useToolSubmit';

/* ── Result type ────────────────────────────────── */

interface ScoreCategory {
  name: string;
  score: number;
  feedback: string;
}

interface ResumeScoreResult {
  overallScore: number;
  categories: ScoreCategory[];
  strengths: string[];
  improvements: string[];
  keywords: {
    found: string[];
    missing: string[];
  };
}

/* ── Component ──────────────────────────────────── */

export default function ResumeScoreClient() {
  const [form, setForm] = useState({
    resumeText: '',
    targetRole: '',
  });

  const { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit } =
    useToolSubmit<ResumeScoreResult>({
      serviceKey: 'resume_score',
      apiEndpoint: '/api/tools/resume-score',
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(form);
  };

  const scoreColor = (score: number) =>
    score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <ToolPageLayout
      title="Resume Score"
      subtitle="Get an AI-powered score for your resume with detailed feedback and keyword analysis."
      icon={BarChart}
      iconColor="text-neon-blue"
      gradient="from-neon-blue/20 to-neon-green/20"
      glowColor="from-neon-blue/8"
      showUpgrade={showUpgrade}
      onCloseUpgrade={() => setShowUpgrade(false)}
      serviceName="Resume Score"
    >
      {/* ── Form ──────────────────────────────────── */}
      <form onSubmit={onSubmit} className="card space-y-5 mb-8">
        {/* Resume Text */}
        <div>
          <label htmlFor="resumeText" className="block text-xs text-white/40 mb-1.5 font-medium">
            Resume Text <span className="text-red-400">*</span>
          </label>
          <textarea
            id="resumeText"
            rows={10}
            required
            placeholder="Paste your resume text here..."
            value={form.resumeText}
            onChange={(e) => setForm({ ...form, resumeText: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 resize-none"
          />
        </div>

        {/* Target Role */}
        <div>
          <label htmlFor="targetRole" className="block text-xs text-white/40 mb-1.5 font-medium">
            Target Role (optional)
          </label>
          <input
            id="targetRole"
            type="text"
            placeholder="e.g. Senior Software Engineer"
            value={form.targetRole}
            onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !form.resumeText.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BarChart className="w-4 h-4" />
          )}
          {loading ? 'Analyzing...' : 'Score My Resume'}
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
          {/* Overall Score */}
          <div className="card text-center py-8">
            <div
              className="text-6xl font-extrabold mb-2"
              style={{ color: scoreColor(results.overallScore) }}
            >
              {results.overallScore}
            </div>
            <p className="text-white/40 text-sm">out of 100</p>
          </div>

          {/* Categories */}
          {results.categories && results.categories.length > 0 && (
            <div className="card space-y-4">
              <h3 className="text-sm font-semibold text-white/60">Score Breakdown</h3>
              {results.categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/70">{cat.name}</span>
                    <span className="text-white/50">{cat.score}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-green transition-all"
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/40 mt-1">{cat.feedback}</p>
                </div>
              ))}
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid md:grid-cols-2 gap-4">
            {results.strengths && results.strengths.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-neon-green/80 mb-3">Strengths</h3>
                <ul className="space-y-2">
                  {results.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-white/60 flex gap-2">
                      <span className="text-neon-green shrink-0">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {results.improvements && results.improvements.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-neon-orange/80 mb-3">Improvements</h3>
                <ul className="space-y-2">
                  {results.improvements.map((s, i) => (
                    <li key={i} className="text-xs text-white/60 flex gap-2">
                      <span className="text-neon-orange shrink-0">!</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Keywords */}
          {results.keywords && (
            <div className="card">
              <h3 className="text-sm font-semibold text-white/60 mb-3">Keywords Analysis</h3>
              {results.keywords.found && results.keywords.found.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-white/40 mb-2">Found</p>
                  <div className="flex flex-wrap gap-1.5">
                    {results.keywords.found.map((k) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-xs border border-neon-green/20"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {results.keywords.missing && results.keywords.missing.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 mb-2">Missing</p>
                  <div className="flex flex-wrap gap-1.5">
                    {results.keywords.missing.map((k) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs border border-red-500/20"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </ToolPageLayout>
  );
}
