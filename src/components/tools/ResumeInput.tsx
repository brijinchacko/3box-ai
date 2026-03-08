'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, X } from 'lucide-react';

interface ResumeInputProps {
  resumeText: string;
  onResumeChange: (text: string) => void;
}

/**
 * Collapsible "Paste Your Resume" section for AI tools.
 * When resume text is provided, the AI uses it to auto-fill/enhance results.
 * Sits above the manual form fields.
 */
export default function ResumeInput({ resumeText, onResumeChange }: ResumeInputProps) {
  const [expanded, setExpanded] = useState(false);
  const hasResume = resumeText.trim().length > 0;
  const wordCount = hasResume ? resumeText.trim().split(/\s+/).length : 0;

  return (
    <div className="mb-4">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
          hasResume
            ? 'bg-neon-blue/[0.06] border-neon-blue/20 text-neon-blue'
            : 'bg-white/[0.02] border-white/10 text-white/50 hover:text-white/70 hover:border-white/15'
        }`}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {hasResume ? (
            <span>Resume loaded ({wordCount} words)</span>
          ) : (
            <span>Paste your resume (optional)</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {hasResume && !expanded && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onResumeChange(''); }}
              className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
              title="Clear resume"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable textarea */}
      {expanded && (
        <div className="mt-2 space-y-2">
          <textarea
            value={resumeText}
            onChange={(e) => onResumeChange(e.target.value)}
            placeholder="Paste your full resume text here... The AI will use it to generate more personalized results. All form fields below become optional when a resume is provided."
            rows={8}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 resize-none"
          />
          {hasResume && (
            <p className="text-xs text-neon-blue/60">
              Fields below are now optional — the AI will extract details from your resume.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
