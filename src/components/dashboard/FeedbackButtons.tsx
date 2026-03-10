'use client';

import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackButtonsProps {
  messageId: string;
  current: 'up' | 'down' | null;
  onFeedback: (id: string, fb: 'up' | 'down' | null) => void;
}

export default function FeedbackButtons({ messageId, current, onFeedback }: FeedbackButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onFeedback(messageId, current === 'up' ? null : 'up')}
        className={`p-1 rounded-md transition-colors ${
          current === 'up'
            ? 'text-neon-green bg-neon-green/10'
            : 'text-white/20 hover:text-white/40 hover:bg-white/5'
        }`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onFeedback(messageId, current === 'down' ? null : 'down')}
        className={`p-1 rounded-md transition-colors ${
          current === 'down'
            ? 'text-rose-400 bg-rose-400/10'
            : 'text-white/20 hover:text-white/40 hover:bg-white/5'
        }`}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
