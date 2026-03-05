'use client';

import { motion } from 'framer-motion';

interface TemplatePreviewProps {
  template: 'modern' | 'classic' | 'minimal' | 'creative';
  selected: boolean;
  onClick: () => void;
}

/* ------------------------------------------------------------------ */
/*  Mini resume skeleton for each template style                      */
/* ------------------------------------------------------------------ */

function ModernPreview() {
  return (
    <div className="w-full h-full flex overflow-hidden rounded-sm">
      {/* Left sidebar accent */}
      <div className="w-[30%] bg-[#00d4ff]/20 p-2 flex flex-col gap-2">
        {/* Avatar circle */}
        <div className="w-6 h-6 mx-auto rounded-full bg-[#00d4ff]/40" />
        {/* Name placeholder */}
        <div className="h-1.5 w-10 mx-auto rounded-full bg-[#00d4ff]/50" />
        {/* Contact lines */}
        <div className="mt-1 space-y-1">
          <div className="h-1 w-full rounded-full bg-white/15" />
          <div className="h-1 w-3/4 rounded-full bg-white/15" />
          <div className="h-1 w-full rounded-full bg-white/15" />
        </div>
        {/* Skills section */}
        <div className="mt-2">
          <div className="h-1 w-8 rounded-full bg-[#00d4ff]/40 mb-1.5" />
          <div className="space-y-1">
            <div className="h-1 w-full rounded-full bg-white/10" />
            <div className="h-1 w-2/3 rounded-full bg-white/10" />
            <div className="h-1 w-4/5 rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      {/* Right content area */}
      <div className="w-[70%] bg-white/[0.03] p-2 flex flex-col gap-2">
        {/* Section heading */}
        <div className="h-1.5 w-12 rounded-full bg-[#00d4ff]/35" />
        {/* Experience block */}
        <div className="space-y-1">
          <div className="h-1 w-full rounded-full bg-white/20" />
          <div className="h-1 w-5/6 rounded-full bg-white/10" />
          <div className="h-1 w-full rounded-full bg-white/10" />
          <div className="h-1 w-3/4 rounded-full bg-white/10" />
        </div>
        {/* Second section heading */}
        <div className="h-1.5 w-10 rounded-full bg-[#00d4ff]/35 mt-1" />
        <div className="space-y-1">
          <div className="h-1 w-full rounded-full bg-white/20" />
          <div className="h-1 w-2/3 rounded-full bg-white/10" />
          <div className="h-1 w-4/5 rounded-full bg-white/10" />
        </div>
        {/* Third section */}
        <div className="h-1.5 w-8 rounded-full bg-[#00d4ff]/35 mt-1" />
        <div className="space-y-1">
          <div className="h-1 w-full rounded-full bg-white/10" />
          <div className="h-1 w-1/2 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function ClassicPreview() {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden rounded-sm bg-white/[0.03] p-3">
      {/* Centered header */}
      <div className="flex flex-col items-center mb-2">
        <div className="h-2 w-20 rounded-full bg-white/30 mb-1" />
        <div className="h-1 w-14 rounded-full bg-white/15" />
      </div>

      {/* Horizontal divider */}
      <div className="h-px w-full bg-white/20 mb-2" />

      {/* Contact row */}
      <div className="flex justify-center gap-2 mb-2">
        <div className="h-1 w-8 rounded-full bg-white/12" />
        <div className="h-1 w-1 rounded-full bg-white/20" />
        <div className="h-1 w-10 rounded-full bg-white/12" />
        <div className="h-1 w-1 rounded-full bg-white/20" />
        <div className="h-1 w-8 rounded-full bg-white/12" />
      </div>

      {/* Section: Experience */}
      <div className="h-1.5 w-14 rounded-full bg-white/25 mb-1.5" />
      <div className="h-px w-full bg-white/10 mb-1.5" />
      <div className="space-y-1 mb-2">
        <div className="flex justify-between">
          <div className="h-1 w-16 rounded-full bg-white/20" />
          <div className="h-1 w-8 rounded-full bg-white/10" />
        </div>
        <div className="h-1 w-full rounded-full bg-white/10" />
        <div className="h-1 w-5/6 rounded-full bg-white/10" />
        <div className="h-1 w-3/4 rounded-full bg-white/10" />
      </div>

      {/* Section: Education */}
      <div className="h-1.5 w-12 rounded-full bg-white/25 mb-1.5" />
      <div className="h-px w-full bg-white/10 mb-1.5" />
      <div className="space-y-1 mb-2">
        <div className="h-1 w-full rounded-full bg-white/20" />
        <div className="h-1 w-2/3 rounded-full bg-white/10" />
      </div>

      {/* Section: Skills */}
      <div className="h-1.5 w-8 rounded-full bg-white/25 mb-1.5" />
      <div className="h-px w-full bg-white/10 mb-1.5" />
      <div className="flex flex-wrap gap-1">
        <div className="h-2 w-6 rounded-sm bg-white/8" />
        <div className="h-2 w-8 rounded-sm bg-white/8" />
        <div className="h-2 w-5 rounded-sm bg-white/8" />
        <div className="h-2 w-7 rounded-sm bg-white/8" />
      </div>
    </div>
  );
}

function MinimalPreview() {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden rounded-sm bg-white/[0.02] px-5 py-4">
      {/* Name - large, clean */}
      <div className="h-2.5 w-24 rounded-full bg-white/20 mb-1" />
      {/* Title */}
      <div className="h-1 w-16 rounded-full bg-white/10 mb-3" />

      {/* Minimal contact */}
      <div className="flex gap-3 mb-4">
        <div className="h-1 w-10 rounded-full bg-white/8" />
        <div className="h-1 w-12 rounded-full bg-white/8" />
      </div>

      {/* Experience - clean spacing */}
      <div className="h-1 w-10 rounded-full bg-white/15 mb-2 tracking-widest" />
      <div className="space-y-1 mb-4">
        <div className="h-1 w-20 rounded-full bg-white/15" />
        <div className="h-1 w-full rounded-full bg-white/7" />
        <div className="h-1 w-5/6 rounded-full bg-white/7" />
      </div>

      {/* Education - clean spacing */}
      <div className="h-1 w-12 rounded-full bg-white/15 mb-2" />
      <div className="space-y-1 mb-4">
        <div className="h-1 w-16 rounded-full bg-white/15" />
        <div className="h-1 w-3/4 rounded-full bg-white/7" />
      </div>

      {/* Skills */}
      <div className="h-1 w-6 rounded-full bg-white/15 mb-2" />
      <div className="space-y-1">
        <div className="h-1 w-full rounded-full bg-white/7" />
        <div className="h-1 w-1/2 rounded-full bg-white/7" />
      </div>
    </div>
  );
}

function CreativePreview() {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden rounded-sm">
      {/* Bold gradient header */}
      <div className="h-16 w-full bg-gradient-to-r from-[#a855f7]/30 via-[#00d4ff]/25 to-[#00ff88]/20 p-2 flex flex-col justify-end">
        <div className="h-2.5 w-20 rounded-full bg-white/40 mb-0.5" />
        <div className="h-1 w-14 rounded-full bg-white/20" />
      </div>

      {/* Body with offset layout */}
      <div className="flex-1 bg-white/[0.03] p-2 flex flex-col gap-2">
        {/* Contact pills */}
        <div className="flex gap-1 flex-wrap">
          <div className="h-2 w-8 rounded-full bg-[#a855f7]/15 border border-[#a855f7]/20" />
          <div className="h-2 w-10 rounded-full bg-[#00d4ff]/15 border border-[#00d4ff]/20" />
          <div className="h-2 w-7 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/20" />
        </div>

        {/* About block with accent bar */}
        <div className="flex gap-1.5">
          <div className="w-0.5 rounded-full bg-gradient-to-b from-[#a855f7] to-[#00d4ff] flex-shrink-0" />
          <div className="space-y-1 flex-1">
            <div className="h-1 w-full rounded-full bg-white/12" />
            <div className="h-1 w-4/5 rounded-full bg-white/12" />
            <div className="h-1 w-2/3 rounded-full bg-white/12" />
          </div>
        </div>

        {/* Two-column skills + experience */}
        <div className="flex gap-2 mt-1">
          <div className="w-1/2 space-y-1">
            <div className="h-1.5 w-10 rounded-full bg-[#a855f7]/30 mb-1" />
            <div className="h-1 w-full rounded-full bg-white/10" />
            <div className="h-1 w-3/4 rounded-full bg-white/10" />
            <div className="h-1 w-full rounded-full bg-white/10" />
          </div>
          <div className="w-1/2 space-y-1">
            <div className="h-1.5 w-8 rounded-full bg-[#00d4ff]/30 mb-1" />
            <div className="h-1 w-full rounded-full bg-white/10" />
            <div className="h-1 w-5/6 rounded-full bg-white/10" />
            <div className="h-1 w-full rounded-full bg-white/10" />
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="mt-auto h-1 w-full rounded-full bg-gradient-to-r from-[#a855f7]/25 via-[#00d4ff]/25 to-[#00ff88]/25" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Template description map                                          */
/* ------------------------------------------------------------------ */

const templateMeta: Record<
  TemplatePreviewProps['template'],
  { label: string; desc: string }
> = {
  modern: { label: 'Modern', desc: 'Clean, ATS-optimized' },
  classic: { label: 'Classic', desc: 'Traditional & polished' },
  minimal: { label: 'Minimal', desc: 'Simple & elegant' },
  creative: { label: 'Creative', desc: 'Standout design' },
};

const templatePreviews: Record<TemplatePreviewProps['template'], React.FC> = {
  modern: ModernPreview,
  classic: ClassicPreview,
  minimal: MinimalPreview,
  creative: CreativePreview,
};

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export default function TemplatePreview({
  template,
  selected,
  onClick,
}: TemplatePreviewProps) {
  const Preview = templatePreviews[template];
  const meta = templateMeta[template];

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative flex flex-col items-center text-left transition-all duration-300 rounded-xl overflow-hidden ${
        selected
          ? 'ring-2 ring-neon-blue/70 shadow-[0_0_24px_rgba(0,212,255,0.25)]'
          : 'ring-1 ring-white/10 hover:ring-white/25'
      }`}
    >
      {/* Preview card */}
      <div
        className={`relative w-[200px] h-[280px] rounded-xl overflow-hidden transition-all duration-300 ${
          selected ? 'bg-white/[0.06]' : 'bg-white/[0.03] group-hover:bg-white/[0.05]'
        }`}
      >
        {/* Selected checkmark */}
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-neon-blue flex items-center justify-center"
          >
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}

        {/* Mini resume skeleton */}
        <Preview />
      </div>

      {/* Label */}
      <div className="w-full px-2 py-2.5 text-center">
        <div
          className={`text-sm font-semibold transition-colors ${
            selected ? 'text-neon-blue' : 'text-white/80 group-hover:text-white'
          }`}
        >
          {meta.label}
        </div>
        <div className="text-[11px] text-white/40 mt-0.5">{meta.desc}</div>
      </div>
    </motion.button>
  );
}
