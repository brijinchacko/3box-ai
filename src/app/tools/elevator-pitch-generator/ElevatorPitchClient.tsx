'use client';

import { useState } from 'react';
import { Loader2, Mic } from 'lucide-react';
import ToolPageLayout from '@/components/tools/ToolPageLayout';
import VariationsResult from '@/components/tools/VariationsResult';
import { useToolSubmit } from '@/hooks/useToolSubmit';
import ResumeInput from '@/components/tools/ResumeInput';
import { getAgentForTool } from '@/lib/tools/toolsConfig';

interface ElevatorPitchResult {
  pitches: { label: string; content: string; meta?: string }[];
}

const CONTEXT_OPTIONS = [
  'Networking Event',
  'Career Fair',
  'Interview',
  'Online Bio',
] as const;

export default function ElevatorPitchClient() {
  const agent = getAgentForTool('elevator-pitch-generator');
  const [form, setForm] = useState({
    name: '',
    currentRole: '',
    targetRole: '',
    keySkills: '',
    context: '',
  });
  const [resumeText, setResumeText] = useState('');

  const { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit } =
    useToolSubmit<ElevatorPitchResult>({
      serviceKey: 'elevator_pitch',
      apiEndpoint: '/api/tools/elevator-pitch-generator',
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit({ ...form, resumeText });
  };

  return (
    <ToolPageLayout
      title="Elevator Pitch Generator"
      subtitle="Craft a confident, memorable elevator pitch you can deliver in 30 or 60 seconds."
      icon={Mic}
      iconColor="text-amber-400"
      gradient="from-amber-500/20 to-amber-500/5"
      glowColor="from-amber-400/8"
      showUpgrade={showUpgrade}
      onCloseUpgrade={() => setShowUpgrade(false)}
      serviceName="Elevator Pitch Generator"
      agentName={agent?.displayName?.replace('Agent ', '') || ''}
      agentColor={agent?.color}
      agentGradient={agent?.gradient}
      loading={loading}
      toolSlug="elevator-pitch-generator"
    >
      {/* -- Form ---------------------------------------- */}
      <form onSubmit={onSubmit} className="card space-y-5 mb-8">
        <ResumeInput resumeText={resumeText} onResumeChange={setResumeText} />

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-xs text-white/40 mb-1.5 font-medium">
            Your Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Alex Johnson"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        {/* Current Role */}
        <div>
          <label htmlFor="currentRole" className="block text-xs text-white/40 mb-1.5 font-medium">
            Current Role <span className="text-red-400">*</span>
          </label>
          <input
            id="currentRole"
            type="text"
            required
            placeholder="e.g. Full-Stack Developer at a health-tech company"
            value={form.currentRole}
            onChange={(e) => setForm({ ...form, currentRole: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
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
            placeholder="e.g. Senior Engineer or CTO at a startup"
            value={form.targetRole}
            onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        {/* Key Skills */}
        <div>
          <label htmlFor="keySkills" className="block text-xs text-white/40 mb-1.5 font-medium">
            Key Skills
          </label>
          <input
            id="keySkills"
            type="text"
            placeholder="e.g. React, Node.js, Cloud Architecture, Team Leadership"
            value={form.keySkills}
            onChange={(e) => setForm({ ...form, keySkills: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          />
        </div>

        {/* Context */}
        <div>
          <label htmlFor="context" className="block text-xs text-white/40 mb-1.5 font-medium">
            Context
          </label>
          <select
            id="context"
            value={form.context}
            onChange={(e) => setForm({ ...form, context: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-neon-blue/40 appearance-none"
          >
            <option value="" className="bg-zinc-900 text-white/40">
              Select a context (optional)
            </option>
            {CONTEXT_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-zinc-900 text-white">
                {opt}
              </option>
            ))}
          </select>
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
            <Mic className="w-4 h-4" />
          )}
          {loading ? 'Agent Atlas is crafting your elevator pitch...' : 'Generate Pitches'}
        </button>
      </form>

      {/* -- Error --------------------------------------- */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* -- Results ------------------------------------- */}
      {results?.pitches && (
        <VariationsResult
          title="Your Elevator Pitches"
          variations={results.pitches}
        />
      )}
    </ToolPageLayout>
  );
}
