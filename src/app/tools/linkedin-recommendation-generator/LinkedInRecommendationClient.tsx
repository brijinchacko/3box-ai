'use client';

import { useState } from 'react';
import { Loader2, Award } from 'lucide-react';
import ToolPageLayout from '@/components/tools/ToolPageLayout';
import VariationsResult from '@/components/tools/VariationsResult';
import ResumeInput from '@/components/tools/ResumeInput';
import { useToolSubmit } from '@/hooks/useToolSubmit';

interface RecommendationResult {
  recommendations: { label: string; content: string; meta?: string }[];
}

export default function LinkedInRecommendationClient() {
  const [resumeText, setResumeText] = useState('');
  const [form, setForm] = useState({
    personName: '',
    relationship: '',
    skills: '',
    context: '',
  });

  const { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit } =
    useToolSubmit<RecommendationResult>({
      serviceKey: 'linkedin_recommendation',
      apiEndpoint: '/api/tools/linkedin-recommendation-generator',
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit({ ...form, resumeText });
  };

  return (
    <ToolPageLayout
      title="LinkedIn Recommendation Writer"
      subtitle="Generate genuine, specific LinkedIn recommendations that highlight skills, achievements, and professional qualities."
      icon={Award}
      iconColor="text-neon-pink"
      gradient="from-neon-pink/20 to-neon-purple/20"
      glowColor="from-neon-pink/8"
      showUpgrade={showUpgrade}
      onCloseUpgrade={() => setShowUpgrade(false)}
      serviceName="LinkedIn Recommendation Writer"
    >
      {/* ── Form ──────────────────────────────────── */}
      <form onSubmit={onSubmit} className="card space-y-5 mb-8">
        <ResumeInput resumeText={resumeText} onResumeChange={setResumeText} />

        {/* Person's Name */}
        <div>
          <label htmlFor="personName" className="block text-xs text-white/40 mb-1.5 font-medium">
            Person&apos;s Name <span className="text-red-400">*</span>
          </label>
          <input
            id="personName"
            type="text"
            required
            placeholder="e.g. Sarah Johnson"
            value={form.personName}
            onChange={(e) => setForm({ ...form, personName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        {/* Your Relationship */}
        <div>
          <label htmlFor="relationship" className="block text-xs text-white/40 mb-1.5 font-medium">
            Your Relationship <span className="text-red-400">*</span>
          </label>
          <select
            id="relationship"
            required
            value={form.relationship}
            onChange={(e) => setForm({ ...form, relationship: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          >
            <option value="" className="bg-surface">Select relationship</option>
            <option value="Manager" className="bg-surface">Manager</option>
            <option value="Colleague" className="bg-surface">Colleague</option>
            <option value="Direct Report" className="bg-surface">Direct Report</option>
            <option value="Client" className="bg-surface">Client</option>
            <option value="Mentor" className="bg-surface">Mentor</option>
            <option value="Classmate" className="bg-surface">Classmate</option>
          </select>
        </div>

        {/* Their Key Skills/Strengths */}
        <div>
          <label htmlFor="skills" className="block text-xs text-white/40 mb-1.5 font-medium">
            Their Key Skills/Strengths
          </label>
          <input
            id="skills"
            type="text"
            placeholder="e.g. Leadership, strategic thinking, data analysis"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        {/* Notable Projects or Achievements */}
        <div>
          <label htmlFor="context" className="block text-xs text-white/40 mb-1.5 font-medium">
            Notable Projects or Achievements
          </label>
          <textarea
            id="context"
            rows={3}
            placeholder="e.g. Led the migration to microservices, reducing deployment time by 60%..."
            value={form.context}
            onChange={(e) => setForm({ ...form, context: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (!resumeText.trim() && (!form.personName.trim() || !form.relationship))}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Award className="w-4 h-4" />
          )}
          {loading ? 'Generating...' : 'Generate Recommendations'}
        </button>
      </form>

      {/* ── Error ─────────────────────────────────── */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {/* ── Results ───────────────────────────────── */}
      {results?.recommendations && (
        <VariationsResult
          title="Your LinkedIn Recommendations"
          variations={results.recommendations}
        />
      )}
    </ToolPageLayout>
  );
}
