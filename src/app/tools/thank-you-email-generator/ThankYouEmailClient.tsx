'use client';

import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useToolSubmit } from '@/hooks/useToolSubmit';
import ToolPageLayout from '@/components/tools/ToolPageLayout';
import EmailResult from '@/components/tools/EmailResult';
import ResumeInput from '@/components/tools/ResumeInput';
import { getAgentForTool } from '@/lib/tools/toolsConfig';

interface ThankYouEmailResult {
  subject: string;
  body: string;
}

const toneOptions = ['Professional', 'Warm & Friendly', 'Enthusiastic', 'Formal'];

export default function ThankYouEmailClient() {
  const agent = getAgentForTool('thank-you-email-generator');
  const [interviewerName, setInterviewerName] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [interviewHighlights, setInterviewHighlights] = useState('');
  const [tone, setTone] = useState('Professional');
  const [resumeText, setResumeText] = useState('');

  const { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit } =
    useToolSubmit<ThankYouEmailResult>({
      serviceKey: 'thank_you_email',
      apiEndpoint: '/api/tools/thank-you-email-generator',
    });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText.trim() && (!interviewerName.trim() || !company.trim() || !position.trim())) return;

    handleSubmit({
      interviewerName: interviewerName.trim(),
      company: company.trim(),
      position: position.trim(),
      interviewHighlights: interviewHighlights.trim() || undefined,
      tone,
      resumeText,
    });
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40';
  const labelClass = 'block text-xs text-white/40 mb-1.5 font-medium';

  return (
    <ToolPageLayout
      title="Thank You Email Generator"
      subtitle="Send a genuine, memorable thank you email after your interview"
      icon={Heart}
      iconColor="text-neon-pink"
      gradient="from-neon-pink/20 to-neon-orange/20"
      glowColor="from-neon-pink/8"
      showUpgrade={showUpgrade}
      onCloseUpgrade={() => setShowUpgrade(false)}
      serviceName="Thank You Email Generator"
      agentName={agent?.displayName?.replace('Agent ', '') || ''}
      agentColor={agent?.color}
      agentGradient={agent?.gradient}
      loading={loading}
      toolSlug="thank-you-email-generator"
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
          <EmailResult subject={results.subject} body={results.body} />
        </div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} className="card space-y-4">
        <ResumeInput resumeText={resumeText} onResumeChange={setResumeText} />

        {/* Interviewer's Name */}
        <div>
          <label className={labelClass}>Interviewer&apos;s Name *</label>
          <input
            type="text"
            value={interviewerName}
            onChange={(e) => setInterviewerName(e.target.value)}
            placeholder="e.g., Sarah Johnson"
            className={inputClass}
            required
          />
        </div>

        {/* Company Name */}
        <div>
          <label className={labelClass}>Company Name *</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g., Google"
            className={inputClass}
            required
          />
        </div>

        {/* Position Applied For */}
        <div>
          <label className={labelClass}>Position Applied For *</label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            className={inputClass}
            required
          />
        </div>

        {/* Interview Highlights */}
        <div>
          <label className={labelClass}>Interview Highlights</label>
          <textarea
            value={interviewHighlights}
            onChange={(e) => setInterviewHighlights(e.target.value)}
            placeholder="Key topics discussed, projects mentioned, etc."
            rows={3}
            className={`${inputClass} resize-none`}
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
          disabled={loading || (!resumeText.trim() && (!interviewerName.trim() || !company.trim() || !position.trim()))}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Agent Archer is writing your thank you email...
            </>
          ) : (
            <>
              <Heart className="w-4 h-4" />
              Generate Thank You Email
            </>
          )}
        </button>
      </form>
    </ToolPageLayout>
  );
}
