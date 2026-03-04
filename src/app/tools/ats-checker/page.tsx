'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileSearch,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  ListOrdered,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface ATSResults {
  score: number;
  issues: { type: 'critical' | 'warning' | 'tip'; message: string }[];
  keywords: { found: string[]; missing: string[]; suggested: string[] };
  formatting: { score: number; issues: string[] };
  sections: { present: string[]; missing: string[] };
  atsParseability?: { canParse: boolean; risks: string[] };
  improvementPlan?: string[];
}

function ScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80
      ? 'text-neon-green'
      : score >= 60
      ? 'text-neon-blue'
      : score >= 40
      ? 'text-neon-orange'
      : 'text-red-400';

  const strokeColor =
    score >= 80
      ? '#00ff88'
      : score >= 60
      ? '#00d4ff'
      : score >= 40
      ? '#ff6b00'
      : '#f87171';

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-extrabold ${color}`}>{score}</span>
        <span className="text-xs text-white/40">/ 100</span>
      </div>
    </div>
  );
}

export default function ATSCheckerPage() {
  const [resumeText, setResumeText] = useState('');
  const [targetJob, setTargetJob] = useState('');
  const [inputMode, setInputMode] = useState<'title' | 'description'>('title');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ATSResults | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/tools/ats-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, targetJob: targetJob || undefined }),
      });

      if (!res.ok) {
        throw new Error('Failed to analyze resume');
      }

      const data = await res.json();
      setResults(data);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const criticalIssues = results?.issues.filter((i) => i.type === 'critical') || [];
  const warnings = results?.issues.filter((i) => i.type === 'warning') || [];
  const tips = results?.issues.filter((i) => i.type === 'tip') || [];

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-blue/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            All Tools
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center mx-auto mb-6">
              <FileSearch className="w-8 h-8 text-neon-blue" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
              Free ATS <span className="gradient-text">Resume Checker</span>
            </h1>
            <p className="text-white/40 max-w-lg mx-auto">
              Paste your resume text and get an instant ATS compatibility analysis with actionable suggestions.
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="card mb-8"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Paste your resume text
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste the full text of your resume here..."
                  rows={12}
                  className="input-field resize-y font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Target job {inputMode === 'title' ? 'title' : 'description'}{' '}
                  <span className="text-white/20">(optional)</span>
                </label>

                {/* Toggle between title and description */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setInputMode('title')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      inputMode === 'title'
                        ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Job Title
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('description')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      inputMode === 'description'
                        ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Full Job Description
                  </button>
                </div>

                {inputMode === 'title' ? (
                  <input
                    type="text"
                    value={targetJob}
                    onChange={(e) => setTargetJob(e.target.value)}
                    placeholder="e.g., Senior Frontend Developer"
                    className="input-field"
                  />
                ) : (
                  <textarea
                    value={targetJob}
                    onChange={(e) => setTargetJob(e.target.value)}
                    placeholder="Paste the full job description here for detailed keyword matching..."
                    rows={6}
                    className="input-field resize-y text-sm"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !resumeText.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileSearch className="w-4 h-4" />
                    Analyze Resume
                  </>
                )}
              </button>
            </div>
          </motion.form>

          {/* Error */}
          {error && (
            <div className="card border-red-400/20 bg-red-400/5 text-red-300 text-sm mb-8">
              {error}
            </div>
          )}

          {/* Results */}
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Overall Score */}
              <div className="card text-center">
                <h2 className="text-lg font-semibold mb-4">ATS Compatibility Score</h2>
                <ScoreCircle score={results.score} />
                <p className="text-white/40 text-sm mt-4">
                  {results.score >= 80
                    ? 'Great! Your resume is well-optimized for ATS systems.'
                    : results.score >= 60
                    ? 'Good start, but there are areas to improve.'
                    : results.score >= 40
                    ? 'Your resume needs significant improvements for ATS compatibility.'
                    : 'Your resume is likely to be rejected by most ATS systems.'}
                </p>
              </div>

              {/* ATS Parseability */}
              {results.atsParseability && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {results.atsParseability.canParse ? (
                      <ShieldCheck className="w-5 h-5 text-neon-green" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                    )}
                    ATS Parseability
                  </h2>

                  <div
                    className={`flex items-center gap-3 p-4 rounded-xl mb-4 ${
                      results.atsParseability.canParse
                        ? 'bg-neon-green/5 border border-neon-green/10'
                        : 'bg-red-400/5 border border-red-400/10'
                    }`}
                  >
                    {results.atsParseability.canParse ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-neon-green flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-neon-green">ATS Compatible</p>
                          <p className="text-xs text-white/40 mt-0.5">
                            Your resume format should be parseable by most ATS systems.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-400">ATS Parsing Risks Detected</p>
                          <p className="text-xs text-white/40 mt-0.5">
                            Your resume has formatting issues that may cause ATS systems to reject or misread it.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {results.atsParseability.risks.length > 0 && (
                    <ul className="space-y-2">
                      {results.atsParseability.risks.map((risk, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-white/60"
                        >
                          <AlertTriangle className="w-4 h-4 text-neon-orange flex-shrink-0 mt-0.5" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Issues */}
              {results.issues.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-4">Issues & Suggestions</h2>
                  <div className="space-y-3">
                    {criticalIssues.map((issue, idx) => (
                      <div
                        key={`critical-${idx}`}
                        className="flex items-start gap-3 p-3 rounded-xl bg-red-400/5 border border-red-400/10"
                      >
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-red-300">{issue.message}</span>
                      </div>
                    ))}
                    {warnings.map((issue, idx) => (
                      <div
                        key={`warning-${idx}`}
                        className="flex items-start gap-3 p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/10"
                      >
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-yellow-200">{issue.message}</span>
                      </div>
                    ))}
                    {tips.map((issue, idx) => (
                      <div
                        key={`tip-${idx}`}
                        className="flex items-start gap-3 p-3 rounded-xl bg-neon-blue/5 border border-neon-blue/10"
                      >
                        <Lightbulb className="w-5 h-5 text-neon-blue flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-neon-blue/80">{issue.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Plan */}
              {results.improvementPlan && results.improvementPlan.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-neon-purple" />
                    Improvement Plan
                  </h2>
                  <ol className="space-y-3">
                    {results.improvementPlan.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-neon-purple/5 border border-neon-purple/10"
                      >
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-neon-purple/20 text-neon-purple text-sm font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-white/70 pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Keywords */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Keywords Analysis</h2>
                <div className="space-y-4">
                  {results.keywords.found.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-neon-green mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        Found Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {results.keywords.found.map((kw) => (
                          <span
                            key={kw}
                            className="badge bg-neon-green/10 text-neon-green border border-neon-green/20 text-xs"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.keywords.missing.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" />
                        Missing Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {results.keywords.missing.map((kw) => (
                          <span
                            key={kw}
                            className="badge bg-red-400/10 text-red-400 border border-red-400/20 text-xs"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.keywords.suggested.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-neon-blue mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Suggested Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {results.keywords.suggested.map((kw) => (
                          <span
                            key={kw}
                            className="badge bg-neon-blue/10 text-neon-blue border border-neon-blue/20 text-xs"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sections Analysis */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Sections Analysis</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {results.sections.present.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-neon-green mb-2">Present Sections</h3>
                      <ul className="space-y-1.5">
                        {results.sections.present.map((s) => (
                          <li key={s} className="flex items-center gap-2 text-sm text-white/60">
                            <CheckCircle className="w-4 h-4 text-neon-green flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results.sections.missing.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-red-400 mb-2">Missing Sections</h3>
                      <ul className="space-y-1.5">
                        {results.sections.missing.map((s) => (
                          <li key={s} className="flex items-center gap-2 text-sm text-white/60">
                            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Formatting Score */}
              {results.formatting && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-4">Formatting Score</h2>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1 skill-bar">
                      <div
                        className="skill-bar-fill"
                        style={{
                          width: `${results.formatting.score}%`,
                          background:
                            results.formatting.score >= 80
                              ? '#00ff88'
                              : results.formatting.score >= 60
                              ? '#00d4ff'
                              : results.formatting.score >= 40
                              ? '#ff6b00'
                              : '#f87171',
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-white/70">
                      {results.formatting.score}/100
                    </span>
                  </div>
                  {results.formatting.issues.length > 0 && (
                    <ul className="space-y-2 mt-3">
                      {results.formatting.issues.map((issue, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-white/50"
                        >
                          <AlertTriangle className="w-4 h-4 text-neon-orange flex-shrink-0 mt-0.5" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                  {results.formatting.issues.length === 0 && (
                    <p className="text-sm text-white/40">No formatting issues detected.</p>
                  )}
                </div>
              )}

              {/* CTA */}
              <div className="card text-center bg-gradient-to-br from-neon-blue/5 to-neon-purple/5">
                <Sparkles className="w-8 h-8 text-neon-blue mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Build a perfect ATS resume with NXTED AI</h2>
                <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">
                  Our AI resume builder creates ATS-optimized resumes tailored to your target role.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/tools/resume-builder" className="btn-secondary inline-flex items-center gap-2">
                    Try Free Resume Builder <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/signup" className="btn-primary inline-flex items-center gap-2">
                    Get AI-Powered Resume <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
