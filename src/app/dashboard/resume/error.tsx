'use client';

import { AlertTriangle } from 'lucide-react';

export default function ResumeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-white/80 mb-2">Failed to load resume</h2>
      <p className="text-sm text-white/40 mb-6 max-w-md">
        {error.message || 'We could not load your resume data. Please try again.'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition text-sm"
      >
        Try again
      </button>
    </div>
  );
}
