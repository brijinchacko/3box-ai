'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, Target, CheckCircle2, XCircle, AlertTriangle,
  Zap, FileText, Lightbulb, BarChart3, MapPin, Briefcase, Sparkles,
  ArrowRight, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchBreakdown {
  title: { score: number; max: number; matchedWords: string[]; targetRole: string };
  skills: { score: number; max: number; matched: string[]; total: number };
  location: { score: number; max: number; note: string };
  bonus: { score: number; max: number };
}

interface AnalysisResult {
  matchScore: number;
  breakdown: MatchBreakdown;
  missingKeywords: string[];
  matchedSkills: string[];
  suggestions: string[];
  hasResume: boolean;
  isFinalized: boolean;
  job: { title: string; company: string; location: string };
}

export default function ImproveScorePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const jobTitle = searchParams.get('title');
    const company = searchParams.get('company');
    const description = searchParams.get('description');
    const location = searchParams.get('location');
    const matchScore = searchParams.get('score');
    const salary = searchParams.get('salary');
    const remote = searchParams.get('remote');

    if (!jobTitle) {
      setError('No job data provided');
      setLoading(false);
      return;
    }

    fetch('/api/ai/match-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle,
        company: company || '',
        description: description || '',
        location: location || '',
        matchScore: matchScore ? parseInt(matchScore) : 0,
        salary: salary || null,
        remote: remote === 'true',
      }),
    })
      .then(r => r.ok ? r.json() : Promise.reject('Failed'))
      .then(data => setAnalysis(data))
      .catch(() => setError('Failed to analyze match. Please try again.'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const scoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 75) return 'text-green-400';
    if (pct >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const barColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 75) return 'bg-green-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon-purple animate-spin mb-4" />
        <p className="text-white/40 text-sm">Analyzing your match score...</p>
        <p className="text-white/20 text-xs mt-1">Comparing your resume with the job requirements</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-white/60">{error || 'Something went wrong'}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-neon-purple hover:underline">Go back</button>
      </div>
    );
  }

  const { breakdown, missingKeywords, matchedSkills, suggestions, job } = analysis;
  const totalScore = breakdown.title.score + breakdown.skills.score + breakdown.location.score + breakdown.bonus.score;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold',
            totalScore >= 70 ? 'bg-green-500/10 text-green-400' :
            totalScore >= 50 ? 'bg-amber-500/10 text-amber-400' :
            'bg-red-500/10 text-red-400',
          )}>
            {totalScore}%
          </div>
          <div>
            <h1 className="text-xl font-bold">{job.title}</h1>
            <p className="text-sm text-white/40">{job.company}{job.location ? ` — ${job.location}` : ''}</p>
          </div>
        </div>
        <p className="text-sm text-white/50">
          Here&apos;s a detailed breakdown of your match score and how to improve it.
        </p>
      </div>

      {/* Score Breakdown */}
      <div className="glass p-5 mb-6 space-y-5">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-white/40" /> Score Breakdown
        </h2>

        {/* Title Match */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-white/30" /> Title Match
            </span>
            <span className={cn('text-sm font-bold', scoreColor(breakdown.title.score, breakdown.title.max))}>
              {breakdown.title.score}/{breakdown.title.max}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', barColor(breakdown.title.score, breakdown.title.max))} style={{ width: `${(breakdown.title.score / breakdown.title.max) * 100}%` }} />
          </div>
          <p className="text-xs text-white/30 mt-1">
            {breakdown.title.matchedWords.length > 0
              ? `Matched keywords: ${breakdown.title.matchedWords.join(', ')}`
              : `Your target role "${breakdown.title.targetRole}" doesn't match well with "${job.title}"`}
          </p>
        </div>

        {/* Skills Match */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-white/30" /> Skills Match
            </span>
            <span className={cn('text-sm font-bold', scoreColor(breakdown.skills.score, breakdown.skills.max))}>
              {breakdown.skills.score}/{breakdown.skills.max}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', barColor(breakdown.skills.score, breakdown.skills.max))} style={{ width: `${(breakdown.skills.score / breakdown.skills.max) * 100}%` }} />
          </div>
          <p className="text-xs text-white/30 mt-1">
            {matchedSkills.length} of {breakdown.skills.total} skills matched
          </p>
        </div>

        {/* Location Match */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-white/30" /> Location
            </span>
            <span className={cn('text-sm font-bold', scoreColor(breakdown.location.score, breakdown.location.max))}>
              {breakdown.location.score}/{breakdown.location.max}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', barColor(breakdown.location.score, breakdown.location.max))} style={{ width: `${(breakdown.location.score / breakdown.location.max) * 100}%` }} />
          </div>
          <p className="text-xs text-white/30 mt-1">{breakdown.location.note}</p>
        </div>

        {/* Bonus */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-white/30" /> Bonus
            </span>
            <span className={cn('text-sm font-bold', scoreColor(breakdown.bonus.score, breakdown.bonus.max))}>
              {breakdown.bonus.score}/{breakdown.bonus.max}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', barColor(breakdown.bonus.score, breakdown.bonus.max))} style={{ width: `${(breakdown.bonus.score / breakdown.bonus.max) * 100}%` }} />
          </div>
          <p className="text-xs text-white/30 mt-1">Salary transparency, remote work, seniority alignment</p>
        </div>
      </div>

      {/* Skills Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Matched Skills */}
        <div className="glass p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-400" /> Matched Skills ({matchedSkills.length})
          </h3>
          {matchedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map(skill => (
                <span key={skill} className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/30">No matching skills found</p>
          )}
        </div>

        {/* Missing Keywords */}
        <div className="glass p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-red-400" /> Missing Keywords ({missingKeywords.length})
          </h3>
          {missingKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {missingKeywords.slice(0, 15).map(kw => (
                <span key={kw} className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                  {kw}
                </span>
              ))}
              {missingKeywords.length > 15 && (
                <span className="text-xs text-white/30">+{missingKeywords.length - 15} more</span>
              )}
            </div>
          ) : (
            <p className="text-xs text-green-400">All job keywords covered!</p>
          )}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="glass p-5 mb-6">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-amber-400" /> How to Improve Your Score
        </h2>
        <div className="space-y-3">
          {suggestions.map((suggestion, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-purple/10 text-neon-purple text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-white/70 leading-relaxed">{suggestion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="glass p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold mb-1">
            {analysis.hasResume ? 'Update your resume to improve this score' : 'Create a resume to start applying'}
          </h3>
          <p className="text-xs text-white/40">
            {analysis.hasResume
              ? 'Add the missing keywords and follow the suggestions above'
              : 'Build your resume with our AI-powered builder'}
          </p>
        </div>
        <Link
          href="/dashboard/resume"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue text-white text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <FileText className="w-4 h-4" />
          {analysis.hasResume ? 'Edit Resume' : 'Create Resume'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
