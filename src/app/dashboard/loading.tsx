/**
 * Default dashboard loading skeleton.
 *
 * Shown by Next.js while the page chunk is being downloaded / React is
 * hydrating. Used for all dashboard routes that don't define their own
 * loading.tsx — gives users an instant-feel "something is happening"
 * response instead of a blank screen.
 */
export default function DashboardLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-white/5 rounded-lg mb-3" />
        <div className="h-4 w-72 bg-white/5 rounded" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
            <div className="w-8 h-8 bg-white/5 rounded-lg mb-3" />
            <div className="h-7 w-16 bg-white/5 rounded mb-2" />
            <div className="h-3 w-24 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* Content block skeleton */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
        <div className="h-5 w-40 bg-white/5 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-white/5 rounded" />
          <div className="h-4 w-11/12 bg-white/5 rounded" />
          <div className="h-4 w-3/4 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}
