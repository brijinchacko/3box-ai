'use client';

import { useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useToolSubmit } from '@/hooks/useToolSubmit';
import ToolPageLayout from '@/components/tools/ToolPageLayout';
import ResumeInput from '@/components/tools/ResumeInput';

interface InterviewQuestion {
  id: number;
  type: string;
  question: string;
  tips: string;
  sampleAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface InterviewPrepResult {
  questions: InterviewQuestion[];
}

const typeOptions = ['General', 'Behavioral', 'Technical', 'System Design', 'Case Study'];
const levelOptions = ['Junior', 'Mid-Level', 'Senior', 'Lead/Staff', 'Executive'];

export default function InterviewPrepClient() {
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [type, setType] = useState('General');
  const [level, setLevel] = useState('Mid-Level');
  const [resumeText, setResumeText] = useState('');

  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());

  const { loading, error, results, showUpgrade, setShowUpgrade, handleSubmit, reset } =
    useToolSubmit<InterviewPrepResult>({
      serviceKey: 'interview_prep',
      apiEndpoint: '/api/tools/interview-question-prep',
    });

  const toggleAnswer = (id: number) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText.trim() && (!role.trim() || !type)) return;

    // Reset revealed answers for new results
    setRevealedAnswers(new Set());

    handleSubmit({
      role: role.trim(),
      company: company.trim() || undefined,
      type,
      level,
      resumeText,
    });
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40';
  const labelClass = 'block text-xs text-white/40 mb-1.5 font-medium';

  return (
    <ToolPageLayout
      title="AI Interview Question Prep"
      subtitle="Practice with AI-generated questions, tips, and sample answers for your next interview"
      icon={MessageSquare}
      iconColor="text-neon-green"
      gradient="from-neon-green/20 to-neon-blue/20"
      glowColor="from-neon-green/8"
      showUpgrade={showUpgrade}
      onCloseUpgrade={() => setShowUpgrade(false)}
      serviceName="Interview Question Prep"
    >
      {/* Error display */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Result */}
      {results?.questions && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">{results.questions.length} Questions</h3>
          </div>
          {results.questions.map((q, i) => (
            <div key={q.id || i} className="card">
              <div className="flex items-start gap-3">
                <span
                  className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    q.difficulty === 'easy'
                      ? 'bg-neon-green/20 text-neon-green'
                      : q.difficulty === 'medium'
                        ? 'bg-neon-orange/20 text-neon-orange'
                        : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
                      {q.type}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white/90 mb-2">{q.question}</p>

                  {/* Tips */}
                  <div className="px-3 py-2 rounded-lg bg-neon-blue/5 border border-neon-blue/10 mb-2">
                    <p className="text-xs text-neon-blue/80 font-medium mb-1">Tips</p>
                    <p className="text-xs text-white/50">{q.tips}</p>
                  </div>

                  {/* Toggle sample answer */}
                  <button
                    onClick={() => toggleAnswer(q.id || i)}
                    className="text-xs text-neon-green/70 hover:text-neon-green transition-colors"
                  >
                    {revealedAnswers.has(q.id || i) ? 'Hide Sample Answer' : 'Show Sample Answer'}
                  </button>

                  {revealedAnswers.has(q.id || i) && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <p className="text-xs text-white/60 leading-relaxed">{q.sampleAnswer}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} className="card space-y-4">
        <ResumeInput resumeText={resumeText} onResumeChange={setResumeText} />

        {/* Target Role */}
        <div>
          <label className={labelClass}>Target Role *</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            className={inputClass}
            required
          />
        </div>

        {/* Company */}
        <div>
          <label className={labelClass}>Company (optional)</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g., Google, Amazon"
            className={inputClass}
          />
        </div>

        {/* Interview Type & Level row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Interview Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={inputClass}
            >
              {typeOptions.map((t) => (
                <option key={t} value={t} className="bg-surface">
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Experience Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className={inputClass}
            >
              {levelOptions.map((l) => (
                <option key={l} value={l} className="bg-surface">
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (!resumeText.trim() && (!role.trim() || !type))}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Questions...
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              Generate Interview Questions
            </>
          )}
        </button>
      </form>
    </ToolPageLayout>
  );
}
