'use client';

import { useState } from 'react';
import { Loader2, FileText } from 'lucide-react';
import ToolPageLayout from '@/components/tools/ToolPageLayout';
import VariationsResult from '@/components/tools/VariationsResult';
import { useToolSubmit } from '@/hooks/useToolSubmit';
import ResumeInput from '@/components/tools/ResumeInput';

interface ResumeSummaryResult {
  summaries: { label: string; content: string }[];
}

export default function ResumeSummaryClient() {
  const [form, setForm] = useState({
    jobTitle: '',
    experience: '',
    targetRole: '',
  });
  const [resumeText, setResumeText] = useState('');

  const { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit } =
    useToolSubmit<ResumeSummaryResult>({
      serviceKey: 'resume_summary',
      apiEndpoint: '/api/tools/resume-summary-generator',
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit({ ...form, resumeText });
  };

  return (
    <ToolPageLayout
      title="Resume Summary Generator"
      subtitle="Create compelling professional summary paragraphs tailored to your career and target role."
      icon={FileText}
      iconColor="text-neon-blue"
      gradient="from-neon-blue/20 to-neon-blue/5"
      glowColor="from-neon-blue/8"
      showUpgrade={showUpgrade}
      onCloseUpgrade={() => setShowUpgrade(false)}
      serviceName="Resume Summary Generator"
    >
      {/* -- Form ---------------------------------------- */}
      <form onSubmit={onSubmit} className="card space-y-5 mb-8">
        <ResumeInput resumeText={resumeText} onResumeChange={setResumeText} />

        {/* Job Title */}
        <div>
          <label htmlFor="jobTitle" className="block text-xs text-white/40 mb-1.5 font-medium">
            Job Title <span className="text-red-400">*</span>
          </label>
          <input
            id="jobTitle"
            type="text"
            required
            placeholder="e.g. Senior Frontend Developer"
            value={form.jobTitle}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        {/* Experience */}
        <div>
          <label htmlFor="experience" className="block text-xs text-white/40 mb-1.5 font-medium">
            Experience
          </label>
          <textarea
            id="experience"
            rows={3}
            placeholder="e.g. 8 years in web development, led a team of 5, built a SaaS product from scratch..."
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 resize-none"
          />
        </div>

        {/* Target Role */}
        <div>
          <label htmlFor="targetRole" className="block text-xs text-white/40 mb-1.5 font-medium">
            Target Role
          </label>
          <input
            id="targetRole"
            type="text"
            placeholder="e.g. Engineering Manager at a tech startup"
            value={form.targetRole}
            onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (!resumeText.trim() && !form.jobTitle.trim())}
          className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          {loading ? 'Generating...' : 'Generate Summaries'}
        </button>
      </form>

      {/* -- Error --------------------------------------- */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* -- Results ------------------------------------- */}
      {results?.summaries && (
        <VariationsResult
          title="Your Resume Summaries"
          variations={results.summaries}
        />
      )}
    </ToolPageLayout>
  );
}
