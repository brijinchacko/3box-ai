'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BarChart3,
  Briefcase,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface SalaryResults {
  low: number;
  median: number;
  high: number;
  currency: string;
  factors: string[];
  marketTrend: 'growing' | 'stable' | 'declining';
  demandLevel: 'high' | 'medium' | 'low';
}

const experienceLevels = [
  { value: '0-1', label: '0-1 years (Entry Level)' },
  { value: '1-3', label: '1-3 years (Junior)' },
  { value: '3-5', label: '3-5 years (Mid-Level)' },
  { value: '5-10', label: '5-10 years (Senior)' },
  { value: '10+', label: '10+ years (Lead / Principal)' },
];

function formatSalary(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function SalaryBar({ low, median, high, currency }: { low: number; median: number; high: number; currency: string }) {
  const range = high - low;
  const medianPos = range > 0 ? ((median - low) / range) * 100 : 50;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/40">Low</span>
        <span className="text-white/40">High</span>
      </div>
      <div className="relative h-4 rounded-full bg-white/5 overflow-hidden">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-blue/30 via-neon-green/40 to-neon-purple/30" />
        <div
          className="absolute top-0 h-full w-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          style={{ left: `${medianPos}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-neon-blue">{formatSalary(low, currency)}</span>
        <div className="text-center">
          <span className="text-xs text-white/30">Median</span>
          <span className="block text-lg font-extrabold text-neon-green">{formatSalary(median, currency)}</span>
        </div>
        <span className="text-sm font-semibold text-neon-purple">{formatSalary(high, currency)}</span>
      </div>
    </div>
  );
}

export default function SalaryEstimatorPage() {
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SalaryResults | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role.trim() || !location.trim() || !experience) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const skillsList = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/tools/salary-estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          location,
          experience,
          skills: skillsList.length > 0 ? skillsList : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to estimate salary');
      }

      const data = await res.json();
      setResults(data);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const trendConfig = {
    growing: { icon: TrendingUp, label: 'Growing', color: 'text-neon-green', bg: 'bg-neon-green/10 border-neon-green/20' },
    stable: { icon: Minus, label: 'Stable', color: 'text-neon-blue', bg: 'bg-neon-blue/10 border-neon-blue/20' },
    declining: { icon: TrendingDown, label: 'Declining', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
  };

  const demandConfig = {
    high: { label: 'High Demand', color: 'text-neon-green', bg: 'bg-neon-green/10 border-neon-green/20' },
    medium: { label: 'Medium Demand', color: 'text-neon-blue', bg: 'bg-neon-blue/10 border-neon-blue/20' },
    low: { label: 'Low Demand', color: 'text-neon-orange', bg: 'bg-neon-orange/10 border-neon-orange/20' },
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-green/8 via-transparent to-transparent rounded-full blur-3xl" />

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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-blue/20 flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-8 h-8 text-neon-green" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
              AI <span className="gradient-text">Salary Estimator</span>
            </h1>
            <p className="text-white/40 max-w-lg mx-auto">
              Get AI-powered salary estimates based on your role, location, and experience level.
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
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Software Engineer"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Experience</label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="" disabled>
                    Select experience level
                  </option>
                  {experienceLevels.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Skills <span className="text-white/20">(optional, comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g., React, TypeScript, Node.js"
                  className="input-field"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !role.trim() || !location.trim() || !experience}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Estimating...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Estimate Salary
                </>
              )}
            </button>
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
              {/* Salary Range */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-6">Estimated Salary Range</h2>
                <SalaryBar
                  low={results.low}
                  median={results.median}
                  high={results.high}
                  currency={results.currency}
                />
              </div>

              {/* Market Trend & Demand */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-sm font-medium text-white/40 mb-3">Market Trend</h3>
                  {(() => {
                    const cfg = trendConfig[results.marketTrend] || trendConfig.stable;
                    const TrendIcon = cfg.icon;
                    return (
                      <div className={`inline-flex items-center gap-2 badge ${cfg.bg} border`}>
                        <TrendIcon className={`w-4 h-4 ${cfg.color}`} />
                        <span className={cfg.color}>{cfg.label}</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="card">
                  <h3 className="text-sm font-medium text-white/40 mb-3">Demand Level</h3>
                  {(() => {
                    const cfg = demandConfig[results.demandLevel] || demandConfig.medium;
                    return (
                      <div className={`inline-flex items-center gap-2 badge ${cfg.bg} border`}>
                        <Briefcase className={`w-4 h-4 ${cfg.color}`} />
                        <span className={cfg.color}>{cfg.label}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Factors */}
              {results.factors.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold mb-4">Factors Influencing Salary</h2>
                  <ul className="space-y-2">
                    {results.factors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-white/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-blue mt-1.5 flex-shrink-0" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              <div className="card text-center bg-gradient-to-br from-neon-green/5 to-neon-blue/5">
                <Sparkles className="w-8 h-8 text-neon-green mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Plan your career with AI</h2>
                <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">
                  Get a personalized career plan with salary growth projections, skill roadmaps, and job matching.
                </p>
                <Link href="/signup" className="btn-primary inline-flex items-center gap-2">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
