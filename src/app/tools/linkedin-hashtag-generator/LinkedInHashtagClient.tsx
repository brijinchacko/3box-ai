'use client';

import { useState } from 'react';
import { Loader2, Hash } from 'lucide-react';
import ToolPageLayout from '@/components/tools/ToolPageLayout';
import CopyButton from '@/components/tools/CopyButton';
import ResumeInput from '@/components/tools/ResumeInput';
import { useToolSubmit } from '@/hooks/useToolSubmit';
import { getAgentForTool } from '@/lib/tools/toolsConfig';

interface HashtagCategory {
  name: string;
  tags: string[];
}

interface LinkedInHashtagResult {
  hashtags: string[];
  categories?: HashtagCategory[];
}

export default function LinkedInHashtagClient() {
  const agent = getAgentForTool('linkedin-hashtag-generator');
  const [resumeText, setResumeText] = useState('');
  const [form, setForm] = useState({
    topic: '',
    count: '15',
  });

  const { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit } =
    useToolSubmit<LinkedInHashtagResult>({
      serviceKey: 'linkedin_hashtags',
      apiEndpoint: '/api/tools/linkedin-hashtag-generator',
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit({ ...form, resumeText });
  };

  return (
    <ToolPageLayout
      title="LinkedIn Hashtag Generator"
      subtitle="Generate trending, relevant hashtags to maximize your LinkedIn post reach and engagement."
      icon={Hash}
      iconColor="text-neon-blue"
      gradient="from-neon-blue/20 to-neon-purple/20"
      glowColor="from-neon-blue/8"
      showUpgrade={showUpgrade}
      onCloseUpgrade={() => setShowUpgrade(false)}
      serviceName="LinkedIn Hashtag Generator"
      agentName={agent?.displayName?.replace('Agent ', '') || ''}
      agentColor={agent?.color}
      agentGradient={agent?.gradient}
      loading={loading}
      toolSlug="linkedin-hashtag-generator"
    >
      {/* ── Form ──────────────────────────────────── */}
      <form onSubmit={onSubmit} className="card space-y-5 mb-8">
        <ResumeInput resumeText={resumeText} onResumeChange={setResumeText} />

        {/* Post Topic or Industry */}
        <div>
          <label htmlFor="topic" className="block text-xs text-white/40 mb-1.5 font-medium">
            Post Topic or Industry <span className="text-red-400">*</span>
          </label>
          <input
            id="topic"
            type="text"
            required
            placeholder="e.g. Artificial Intelligence, Product Management, Remote Work"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        {/* Number of Hashtags */}
        <div>
          <label htmlFor="count" className="block text-xs text-white/40 mb-1.5 font-medium">
            Number of Hashtags
          </label>
          <select
            id="count"
            value={form.count}
            onChange={(e) => setForm({ ...form, count: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          >
            <option value="10" className="bg-surface">10</option>
            <option value="15" className="bg-surface">15</option>
            <option value="20" className="bg-surface">20</option>
            <option value="30" className="bg-surface">30</option>
          </select>
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
            <Hash className="w-4 h-4" />
          )}
          {loading ? 'Agent Cortex is finding your hashtags...' : 'Generate Hashtags'}
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
          {/* All hashtags - copy all */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/60">All Hashtags</h3>
              <CopyButton text={results.hashtags.join(' ')} label="Copy All" />
            </div>
            <div className="flex flex-wrap gap-2">
              {results.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full bg-neon-blue/10 text-neon-blue text-xs font-medium border border-neon-blue/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Categories */}
          {results.categories?.map((cat) => (
            <div key={cat.name} className="card">
              <h4 className="text-xs text-white/40 font-medium mb-2">{cat.name}</h4>
              <div className="flex flex-wrap gap-2">
                {cat.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-white/[0.06] text-white/70 text-xs border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ToolPageLayout>
  );
}
