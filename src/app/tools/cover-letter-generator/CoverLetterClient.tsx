'use client';

import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { useToolSubmit } from '@/hooks/useToolSubmit';
import ToolPageLayout from '@/components/tools/ToolPageLayout';
import TextResultCard from '@/components/tools/TextResultCard';
import ResumeInput from '@/components/tools/ResumeInput';
import { getAgentForTool } from '@/lib/tools/toolsConfig';

interface CoverLetterResult {
  text: string;
}

const toneOptions = ['Professional', 'Enthusiastic', 'Confident', 'Conversational'];

export default function CoverLetterClient() {
  const agent = getAgentForTool('cover-letter-generator');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [experience, setExperience] = useState('');
  const [tone, setTone] = useState('Professional');
  const [resumeText, setResumeText] = useState('');

  const { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit } =
    useToolSubmit<CoverLetterResult>({
      serviceKey: 'cover_letter',
      apiEndpoint: '/api/tools/cover-letter-generator',
    });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText.trim() && (!jobTitle.trim() || !jobDescription.trim())) return;

    handleSubmit({
      jobTitle: jobTitle.trim(),
      company: company.trim() || undefined,
      jobDescription: jobDescription.trim(),
      experience: experience.trim() || undefined,
      tone,
      resumeText,
    });
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40';
  const labelClass = 'block text-xs text-white/40 mb-1.5 font-medium';

  return (
    <ToolPageLayout
      title="AI Cover Letter Generator"
      subtitle="Generate a personalized cover letter in seconds"
      icon={Mail}
      iconColor="text-neon-blue"
      gradient="from-neon-blue/20 to-neon-orange/20"
      glowColor="from-neon-blue/8"
      showUpgrade={showUpgrade}
      onCloseUpgrade={() => setShowUpgrade(false)}
      serviceName="Cover Letter Generator"
      agentName={agent?.displayName?.replace('Agent ', '') || ''}
      agentColor={agent?.color}
      agentGradient={agent?.gradient}
      loading={loading}
      toolSlug="cover-letter-generator"
    >
      {/* Error display */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Result */}
      {results && (
        <div className="mb-6">
          <TextResultCard
            label="Your Cover Letter"
            content={results.text}
            showWordCount
          />
        </div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} className="card space-y-4">
        <ResumeInput resumeText={resumeText} onResumeChange={setResumeText} />

        {/* Job Title */}
        <div>
          <label className={labelClass}>Target Job Title *</label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g., Senior Frontend Engineer"
            className={inputClass}
            required
          />
        </div>

        {/* Company Name */}
        <div>
          <label className={labelClass}>Company Name</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g., Google"
            className={inputClass}
          />
        </div>

        {/* Job Description */}
        <div>
          <label className={labelClass}>Job Description *</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={6}
            className={inputClass}
            required
          />
        </div>

        {/* Experience & Skills */}
        <div>
          <label className={labelClass}>Your Key Experience &amp; Skills</label>
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="e.g., 5 years React, led a team of 4, shipped 3 major products..."
            rows={3}
            className={inputClass}
          />
        </div>

        {/* Tone */}
        <div>
          <label className={labelClass}>Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className={inputClass}
          >
            {toneOptions.map((t) => (
              <option key={t} value={t} className="bg-surface">
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (!resumeText.trim() && (!jobTitle.trim() || !jobDescription.trim()))}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Agent Archer is writing your cover letter...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Generate Cover Letter
            </>
          )}
        </button>
      </form>
    </ToolPageLayout>
  );
}
