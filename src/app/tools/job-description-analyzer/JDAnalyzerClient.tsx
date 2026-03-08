'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import ToolPageLayout from '@/components/tools/ToolPageLayout';
import { useToolSubmit } from '@/hooks/useToolSubmit';
import ResumeInput from '@/components/tools/ResumeInput';

/* ── Result type ────────────────────────────────── */

interface JDAnalyzerResult {
  title: string;
  company: string;
  level: string;
  requirements: {
    mustHave: string[];
    niceToHave: string[];
  };
  skills: {
    technical: string[];
    soft: string[];
  };
  keywords: string[];
  redFlags: string[];
  hiddenExpectations: string[];
  salaryHints: string;
  cultureFit: string[];
  tips: string[];
}

/* ── Component ──────────────────────────────────── */

export default function JDAnalyzerClient() {
  const [form, setForm] = useState({
    jobDescription: '',
  });
  const [resumeText, setResumeText] = useState('');

  const { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit } =
    useToolSubmit<JDAnalyzerResult>({
      serviceKey: 'jd_analyzer',
      apiEndpoint: '/api/tools/job-description-analyzer',
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit({ ...form, resumeText });
  };

  return (
    <ToolPageLayout
      title="Job Description Analyzer"
      subtitle="Decode any job description with AI. Uncover requirements, red flags, and hidden expectations."
      icon={Search}
      iconColor="text-neon-green"
      gradient="from-neon-green/20 to-neon-orange/20"
      glowColor="from-neon-green/8"
      showUpgrade={showUpgrade}
      onCloseUpgrade={() => setShowUpgrade(false)}
      serviceName="Job Description Analyzer"
    >
      {/* ── Form ──────────────────────────────────── */}
      <form onSubmit={onSubmit} className="card space-y-5 mb-8">
        <ResumeInput resumeText={resumeText} onResumeChange={setResumeText} />

        {/* Job Description */}
        <div>
          <label htmlFor="jobDescription" className="block text-xs text-white/40 mb-1.5 font-medium">
            Job Description <span className="text-red-400">*</span>
          </label>
          <textarea
            id="jobDescription"
            rows={10}
            required
            placeholder="Paste the full job description here..."
            value={form.jobDescription}
            onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-green/40 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !form.jobDescription.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {loading ? 'Analyzing...' : 'Analyze Job Description'}
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
          {/* Header Card — Title, Company, Level */}
          <div className="card">
            {results.title && (
              <h2 className="text-lg font-bold text-white mb-1">{results.title}</h2>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
              {results.company && <span>{results.company}</span>}
              {results.level && (
                <span className="px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green border border-neon-green/20">
                  {results.level}
                </span>
              )}
            </div>
            {results.salaryHints && (
              <p className="text-xs text-white/40 mt-3">
                <span className="text-white/60 font-medium">Salary Hints:</span> {results.salaryHints}
              </p>
            )}
          </div>

          {/* Requirements */}
          {results.requirements && (
            <div className="card space-y-4">
              <h3 className="text-sm font-semibold text-white/60">Requirements</h3>
              {results.requirements.mustHave && results.requirements.mustHave.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 mb-2 font-medium">Must Have</p>
                  <ul className="space-y-1.5">
                    {results.requirements.mustHave.map((r, i) => (
                      <li key={i} className="text-xs text-white/60 flex gap-2">
                        <span className="text-red-400 shrink-0">*</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {results.requirements.niceToHave && results.requirements.niceToHave.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 mb-2 font-medium">Nice to Have</p>
                  <ul className="space-y-1.5">
                    {results.requirements.niceToHave.map((r, i) => (
                      <li key={i} className="text-xs text-white/60 flex gap-2">
                        <span className="text-neon-blue shrink-0">~</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          {results.skills && (
            <div className="grid md:grid-cols-2 gap-4">
              {results.skills.technical && results.skills.technical.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-neon-blue/80 mb-3">Technical Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {results.skills.technical.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-full bg-neon-blue/10 text-neon-blue text-xs border border-neon-blue/20"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {results.skills.soft && results.skills.soft.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-neon-purple/80 mb-3">Soft Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {results.skills.soft.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-full bg-neon-purple/10 text-neon-purple text-xs border border-neon-purple/20"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Keywords */}
          {results.keywords && results.keywords.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-white/60 mb-3">Important Keywords</h3>
              <div className="flex flex-wrap gap-1.5">
                {results.keywords.map((k) => (
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

          {/* Red Flags */}
          {results.redFlags && results.redFlags.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-red-400/80 mb-3">Red Flags</h3>
              <ul className="space-y-2">
                {results.redFlags.map((f, i) => (
                  <li key={i} className="text-xs text-white/60 flex gap-2">
                    <span className="text-red-400 shrink-0">!</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hidden Expectations */}
          {results.hiddenExpectations && results.hiddenExpectations.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-neon-orange/80 mb-3">Hidden Expectations</h3>
              <ul className="space-y-2">
                {results.hiddenExpectations.map((h, i) => (
                  <li key={i} className="text-xs text-white/60 flex gap-2">
                    <span className="text-neon-orange shrink-0">?</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Culture Fit */}
          {results.cultureFit && results.cultureFit.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-neon-purple/80 mb-3">Culture Fit Indicators</h3>
              <ul className="space-y-2">
                {results.cultureFit.map((c, i) => (
                  <li key={i} className="text-xs text-white/60 flex gap-2">
                    <span className="text-neon-purple shrink-0">~</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {results.tips && results.tips.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-neon-green/80 mb-3">Application Tips</h3>
              <ul className="space-y-2">
                {results.tips.map((t, i) => (
                  <li key={i} className="text-xs text-white/60 flex gap-2">
                    <span className="text-neon-green shrink-0">+</span>
                    {t}
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
