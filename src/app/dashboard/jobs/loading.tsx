/**
 * Jobs page skeleton. Second-largest client bundle (~132KB).
 * Showing the real layout shape during load makes it feel much faster.
 */
export default function JobsLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="h-8 w-48 bg-white/5 rounded-lg mb-2" />
          <div className="h-4 w-72 bg-white/5 rounded" />
        </div>
        <div className="h-10 w-40 bg-white/5 rounded-lg" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <div className="h-9 w-32 bg-white/5 rounded-lg" />
        <div className="h-9 w-32 bg-white/5 rounded-lg" />
      </div>

      {/* Search profile cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-5 w-64 bg-white/5 rounded mb-2" />
                <div className="h-3 w-40 bg-white/5 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-white/5 rounded" />
                <div className="h-8 w-16 bg-white/5 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j}>
                  <div className="h-3 w-16 bg-white/5 rounded mb-1" />
                  <div className="h-5 w-8 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
