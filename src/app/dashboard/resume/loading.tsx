/**
 * Resume page skeleton. This page is the biggest client bundle (~191KB);
 * showing a skeleton instead of a spinner makes the delay feel much shorter.
 */
export default function ResumeLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="h-8 w-56 bg-white/5 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-white/5 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-white/5 rounded-lg" />
          <div className="h-10 w-32 bg-white/5 rounded-lg" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/5 pb-2">
        {['Resume', 'Editor', 'ATS Check', 'Cover Letter', 'LinkedIn'].map((t) => (
          <div key={t} className="h-8 w-24 bg-white/5 rounded-lg" />
        ))}
      </div>

      {/* Two-column layout: preview + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A4 preview placeholder */}
        <div className="lg:col-span-2">
          <div className="aspect-[210/297] bg-white/5 rounded-lg border border-white/5" />
        </div>
        {/* Sidebar placeholders */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
            <div className="h-4 w-24 bg-white/5 rounded mb-3" />
            <div className="h-10 w-full bg-white/5 rounded" />
          </div>
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
            <div className="h-4 w-20 bg-white/5 rounded mb-3" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
            <div className="h-4 w-28 bg-white/5 rounded mb-3" />
            <div className="h-2 w-full bg-white/5 rounded mb-2" />
            <div className="h-6 w-16 bg-white/5 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
