'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useToolSubmit } from '@/hooks/useToolSubmit';
import ToolPageLayout from '@/components/tools/ToolPageLayout';
import EmailResult from '@/components/tools/EmailResult';
import ResumeInput from '@/components/tools/ResumeInput';
import { getAgentForTool } from '@/lib/tools/toolsConfig';

interface ColdEmailResult {
  subject: string;
  body: string;
}

const purposeOptions = [
  'Job Inquiry',
  'Informational Interview',
  'Networking',
  'Referral Request',
];

export default function ColdEmailClient() {
  const agent = getAgentForTool('cold-email-generator');
  const [resumeText, setResumeText] = useState('');
  const [recipientRole, setRecipientRole] = useState('');
  const [yourBackground, setYourBackground] = useState('');
  const [purpose, setPurpose] = useState('Job Inquiry');
  const [company, setCompany] = useState('');
  const [connection, setConnection] = useState('');

  const { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit } =
    useToolSubmit<ColdEmailResult>({
      serviceKey: 'cold_email',
      apiEndpoint: '/api/tools/cold-email-generator',
    });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText.trim() && (!recipientRole.trim() || !yourBackground.trim() || !purpose)) return;

    handleSubmit({
      resumeText,
      recipientRole: recipientRole.trim(),
      yourBackground: yourBackground.trim(),
      purpose,
      company: company.trim() || undefined,
      connection: connection.trim() || undefined,
    });
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40';
  const labelClass = 'block text-xs text-white/40 mb-1.5 font-medium';

  return (
    <ToolPageLayout
      title="Cold Email Generator"
      subtitle="Write concise, compelling cold emails that actually get responses"
      icon={Send}
      iconColor="text-neon-blue"
      gradient="from-neon-blue/20 to-neon-pink/20"
      glowColor="from-neon-blue/8"
      showUpgrade={showUpgrade}
      onCloseUpgrade={() => setShowUpgrade(false)}
      serviceName="Cold Email Generator"
      agentName={agent?.displayName?.replace('Agent ', '') || ''}
      agentColor={agent?.color}
      agentGradient={agent?.gradient}
      loading={loading}
      toolSlug="cold-email-generator"
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

        {/* Recipient's Role / Title */}
        <div>
          <label className={labelClass}>Recipient&apos;s Role / Title *</label>
          <input
            type="text"
            value={recipientRole}
            onChange={(e) => setRecipientRole(e.target.value)}
            placeholder="e.g., Engineering Manager at Google"
            className={inputClass}
            required
          />
        </div>

        {/* Your Background */}
        <div>
          <label className={labelClass}>Your Background *</label>
          <textarea
            value={yourBackground}
            onChange={(e) => setYourBackground(e.target.value)}
            placeholder="Brief summary of your background and relevant experience"
            rows={3}
            className={`${inputClass} resize-none`}
            required
          />
        </div>

        {/* Email Purpose */}
        <div>
          <label className={labelClass}>Email Purpose *</label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className={inputClass}
            required
          >
            {purposeOptions.map((p) => (
              <option key={p} value={p} className="bg-surface">
                {p}
              </option>
            ))}
          </select>
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

        {/* Connection */}
        <div>
          <label className={labelClass}>How You&apos;re Connected (optional)</label>
          <input
            type="text"
            value={connection}
            onChange={(e) => setConnection(e.target.value)}
            placeholder="e.g., Met at a conference, mutual connection..."
            className={inputClass}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (!resumeText.trim() && (!recipientRole.trim() || !yourBackground.trim() || !purpose))}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Agent Archer is writing your cold email...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Generate Cold Email
            </>
          )}
        </button>
      </form>
    </ToolPageLayout>
  );
}
