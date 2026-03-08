'use client';

import { useState } from 'react';
import { Loader2, Linkedin } from 'lucide-react';
import ToolPageLayout from '@/components/tools/ToolPageLayout';
import VariationsResult from '@/components/tools/VariationsResult';
import { useToolSubmit } from '@/hooks/useToolSubmit';
import ResumeInput from '@/components/tools/ResumeInput';

interface LinkedInHeadlineResult {
  headlines: { label: string; content: string }[];
}

export default function LinkedInHeadlineClient() {
  const [form, setForm] = useState({
    currentRole: '',
    skills: '',
    goal: '',
  });
  const [resumeText, setResumeText] = useState('');

  const { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit } =
    useToolSubmit<LinkedInHeadlineResult>({
      serviceKey: 'linkedin_headline',
      apiEndpoint: '/api/tools/linkedin-headline-generator',
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit({ ...form, resumeText });
  };

  return (
    <ToolPageLayout
      title="LinkedIn Headline Generator"
      subtitle="Craft attention-grabbing LinkedIn headlines that make recruiters and clients stop scrolling."
      icon={Linkedin}
      iconColor="text-sky-400"
      gradient="from-sky-500/20 to-sky-500/5"
      glowColor="from-sky-400/8"
      showUpgrade={showUpgrade}
      onCloseUpgrade={() => setShowUpgrade(false)}
      serviceName="LinkedIn Headline Generator"
    >
      {/* -- Form ---------------------------------------- */}
      <form onSubmit={onSubmit} className="card space-y-5 mb-8">
        <ResumeInput resumeText={resumeText} onResumeChange={setResumeText} />

        {/* Current Role */}
        <div>
          <label htmlFor="currentRole" className="block text-xs text-white/40 mb-1.5 font-medium">
            Current Role <span className="text-red-400">*</span>
          </label>
          <input
            id="currentRole"
            type="text"
            required
            placeholder="e.g. Product Manager at a fintech startup"
            value={form.currentRole}
            onChange={(e) => setForm({ ...form, currentRole: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        {/* Skills */}
        <div>
          <label htmlFor="skills" className="block text-xs text-white/40 mb-1.5 font-medium">
            Key Skills
          </label>
          <input
            id="skills"
            type="text"
            placeholder="e.g. Data Analysis, Agile, Growth Strategy"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        {/* Goal */}
        <div>
          <label htmlFor="goal" className="block text-xs text-white/40 mb-1.5 font-medium">
            Goal
          </label>
          <input
            id="goal"
            type="text"
            placeholder="e.g. Attract recruiters, find clients, build thought leadership"
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (!resumeText.trim() && !form.currentRole.trim())}
          className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Linkedin className="w-4 h-4" />
          )}
          {loading ? 'Generating...' : 'Generate Headlines'}
        </button>
      </form>

      {/* -- Error --------------------------------------- */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* -- Results ------------------------------------- */}
      {results?.headlines && (
        <VariationsResult
          title="Your LinkedIn Headlines"
          variations={results.headlines}
        />
      )}
    </ToolPageLayout>
  );
}
