'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, BookOpen } from 'lucide-react';
import Image from 'next/image';

interface PersonalizedStoryProps {
  userName?: string;
  userImage?: string | null;
  story?: string | null;       // Pass story directly (skips fetch)
  readOnly?: boolean;          // Hide "Rewrite" button (for portfolio)
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function PersonalizedStory({
  userName,
  userImage,
  story: externalStory,
  readOnly = false,
}: PersonalizedStoryProps) {
  const [story, setStory] = useState<string | null>(externalStory ?? null);
  const [loading, setLoading] = useState(!externalStory);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    // If story was passed as prop, skip fetching
    if (externalStory !== undefined && externalStory !== null) {
      setStory(externalStory);
      setLoading(false);
      return;
    }

    fetch('/api/user/story')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.story) setStory(data.story);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [externalStory]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch('/api/user/story', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.story) setStory(data.story);
      }
    } catch {}
    setRegenerating(false);
  };

  const displayTitle = userName ? `${userName}'s Story` : 'Your Story';

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-neon-blue/[0.03] to-neon-purple/[0.03] p-6">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/5" />
            <div className="h-4 bg-white/5 rounded w-32" />
          </div>
          <div className="h-3 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-5/6" />
          <div className="h-3 bg-white/5 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (!story) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative rounded-2xl border border-white/5 bg-gradient-to-br from-neon-blue/[0.03] via-transparent to-neon-purple/[0.03] overflow-hidden h-full"
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-neon-blue/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-5 sm:p-6">
        {/* Header with user picture */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* User profile picture */}
            {userImage ? (
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                <Image
                  src={userImage}
                  alt={userName || 'User'}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center flex-shrink-0 border border-white/10">
                <span className="text-xs font-bold text-white">
                  {getInitials(userName)}
                </span>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-white/60">{displayTitle}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <BookOpen className="w-3 h-3 text-neon-blue/60" />
                <span className="text-[9px] text-white/20">by Cortex</span>
              </div>
            </div>
          </div>

          {!readOnly && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5 transition-all disabled:opacity-30"
              title="Rewrite story"
            >
              <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
              Rewrite
            </button>
          )}
        </div>

        {/* Story text */}
        <div className="space-y-3">
          {story.split('\n\n').map((paragraph, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className={`text-sm leading-relaxed ${
                i === 0
                  ? 'text-white/50'
                  : i === story.split('\n\n').length - 1
                  ? 'text-white/70 font-medium'
                  : 'text-white/60'
              }`}
            >
              {paragraph}
            </motion.p>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
