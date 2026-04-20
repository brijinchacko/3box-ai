export default function SettingsLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-8 w-32 bg-white/5 rounded-lg mb-2" />
        <div className="h-4 w-64 bg-white/5 rounded" />
      </div>

      {/* Tabs sidebar + content layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded-lg" />
          ))}
        </div>
        <div className="lg:col-span-3 rounded-2xl bg-white/[0.02] border border-white/5 p-6">
          <div className="h-5 w-40 bg-white/5 rounded mb-5" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 w-28 bg-white/5 rounded mb-2" />
                <div className="h-10 w-full bg-white/5 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
