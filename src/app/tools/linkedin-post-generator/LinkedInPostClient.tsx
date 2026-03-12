'use client';

import { useState } from 'react';
import { Loader2, Megaphone } from 'lucide-react';
import ToolPageLayout from '@/components/tools/ToolPageLayout';
import TextResultCard from '@/components/tools/TextResultCard';
import ResumeInput from '@/components/tools/ResumeInput';
import { useToolSubmit } from '@/hooks/useToolSubmit';
import { getAgentForTool } from '@/lib/tools/toolsConfig';

interface LinkedInPostResult {
  text: string;
}

export default function LinkedInPostClient() {
  const agent = getAgentForTool('linkedin-post-generator');
  const [resumeText, setResumeText] = useState('');
  const [form, setForm] = useState({
    topic: '',
    audience: '',
    tone: '',
    includeHashtags: false,
  });

  const { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit } =
    useToolSubmit<LinkedInPostResult>({
      serviceKey: 'linkedin_post',
      apiEndpoint: '/api/tools/linkedin-post-generator',
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit({ ...form, resumeText });
  };

  return (
    <ToolPageLayout
      title="LinkedIn Post Generator"
      subtitle="Create engaging LinkedIn posts with scroll-stopping hooks, compelling stories, and strong calls-to-action."
      icon={Megaphone}
      iconColor="text-neon-purple"
      gradient="from-neon-purple/20 to-neon-pink/20"
      glowColor="from-neon-purple/8"
      showUpgrade={showUpgrade}
      onCloseUpgrade={() => setShowUpgrade(false)}
      serviceName="LinkedIn Post Generator"
      agentName={agent?.displayName?.replace('Agent ', '') || ''}
      agentColor={agent?.color}
      agentGradient={agent?.gradient}
      loading={loading}
      toolSlug="linkedin-post-generator"
    >
      {/* ── Form ──────────────────────────────────── */}
      <form onSubmit={onSubmit} className="card space-y-5 mb-8">
        <ResumeInput resumeText={resumeText} onResumeChange={setResumeText} />

        {/* Post Topic */}
        <div>
          <label htmlFor="topic" className="block text-xs text-white/40 mb-1.5 font-medium">
            Post Topic <span className="text-red-400">*</span>
          </label>
          <input
            id="topic"
            type="text"
            required
            placeholder="e.g. Why I turned down a 6-figure offer to join a startup"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        {/* Target Audience */}
        <div>
          <label htmlFor="audience" className="block text-xs text-white/40 mb-1.5 font-medium">
            Target Audience
          </label>
          <select
            id="audience"
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          >
            <option value="" className="bg-surface">Select audience (optional)</option>
            <option value="General" className="bg-surface">General</option>
            <option value="Recruiters" className="bg-surface">Recruiters</option>
            <option value="Hiring Managers" className="bg-surface">Hiring Managers</option>
            <option value="Industry Peers" className="bg-surface">Industry Peers</option>
            <option value="Job Seekers" className="bg-surface">Job Seekers</option>
          </select>
        </div>

        {/* Tone */}
        <div>
          <label htmlFor="tone" className="block text-xs text-white/40 mb-1.5 font-medium">
            Tone
          </label>
          <select
            id="tone"
            value={form.tone}
            onChange={(e) => setForm({ ...form, tone: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          >
            <option value="" className="bg-surface">Select tone (optional)</option>
            <option value="Professional" className="bg-surface">Professional</option>
            <option value="Storytelling" className="bg-surface">Storytelling</option>
            <option value="Motivational" className="bg-surface">Motivational</option>
            <option value="Educational" className="bg-surface">Educational</option>
            <option value="Casual" className="bg-surface">Casual</option>
          </select>
        </div>

        {/* Include Hashtags */}
        <div className="flex items-center gap-2">
          <input
            id="includeHashtags"
            type="checkbox"
            checked={form.includeHashtags}
            onChange={(e) => setForm({ ...form, includeHashtags: e.target.checked })}
            className="w-4 h-4 rounded bg-white/[0.04] border border-white/10 text-neon-blue focus:ring-neon-blue/40"
          />
          <label htmlFor="includeHashtags" className="text-xs text-white/40 font-medium">
            Include relevant hashtags
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (!resumeText.trim() && !form.topic.trim())}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Megaphone className="w-4 h-4" />
          )}
          {loading ? 'Agent Cortex is crafting your post...' : 'Generate Post'}
        </button>
      </form>

      {/* ── Error ─────────────────────────────────── */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {/* ── Results ───────────────────────────────── */}
      {results?.text && (
        <TextResultCard
          label="Your LinkedIn Post"
          content={results.text}
          showWordCount
          showCharCount
        />
      )}
    </ToolPageLayout>
  );
}
