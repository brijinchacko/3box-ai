'use client';

import { useState } from 'react';
import CopyButton from './CopyButton';

interface Variation {
  label: string;
  content: string;
  meta?: string; // e.g., "124 words • ~30 seconds"
}

interface VariationsResultProps {
  title?: string;
  variations: Variation[];
}

export default function VariationsResult({ title, variations }: VariationsResultProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  return (
    <div className="space-y-3">
      {title && <h3 className="text-lg font-bold mb-4">{title}</h3>}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {variations.map((v, i) => (
          <button
            key={i}
            onClick={() => setSelectedIdx(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedIdx === i
                ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                : 'bg-white/[0.04] text-white/40 hover:text-white/60 border border-white/5'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Selected variation */}
      {variations[selectedIdx] && (
        <div className="card">
          <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
            {variations[selectedIdx].content}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <span className="text-xs text-white/30">
              {variations[selectedIdx].meta ||
                `${variations[selectedIdx].content.split(/\s+/).filter(Boolean).length} words`}
            </span>
            <CopyButton text={variations[selectedIdx].content} />
          </div>
        </div>
      )}
    </div>
  );
}
