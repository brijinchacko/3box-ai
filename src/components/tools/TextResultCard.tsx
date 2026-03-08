'use client';

import CopyButton from './CopyButton';

interface TextResultCardProps {
  /** Optional label above the text */
  label?: string;
  /** The text content */
  content: string;
  /** Show word count */
  showWordCount?: boolean;
  /** Show character count */
  showCharCount?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export default function TextResultCard({
  label,
  content,
  showWordCount = false,
  showCharCount = false,
  className = '',
}: TextResultCardProps) {
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div className={`card ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white/60">{label}</h3>
          <CopyButton text={content} />
        </div>
      )}
      <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3 text-xs text-white/30">
          {showWordCount && <span>{wordCount} words</span>}
          {showCharCount && <span>{charCount} chars</span>}
        </div>
        {!label && <CopyButton text={content} />}
      </div>
    </div>
  );
}
