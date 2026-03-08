'use client';

import CopyButton from './CopyButton';

interface EmailResultProps {
  subject: string;
  body: string;
  label?: string;
}

export default function EmailResult({ subject, body, label }: EmailResultProps) {
  return (
    <div className="card space-y-4">
      {label && <h3 className="text-sm font-semibold text-white/60">{label}</h3>}

      {/* Subject line */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-white/40 font-medium">Subject</span>
          <CopyButton text={subject} label="Copy Subject" />
        </div>
        <div className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white/80">
          {subject}
        </div>
      </div>

      {/* Body */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-white/40 font-medium">Body</span>
          <CopyButton text={body} label="Copy Body" />
        </div>
        <div className="px-3 py-3 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
          {body}
        </div>
      </div>

      {/* Copy all */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-white/30">
          {body.split(/\s+/).filter(Boolean).length} words
        </span>
        <CopyButton text={`Subject: ${subject}\n\n${body}`} label="Copy All" />
      </div>
    </div>
  );
}
