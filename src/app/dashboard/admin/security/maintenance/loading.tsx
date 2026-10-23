export default function SecurityMaintenanceLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading SOC maintenance health"
      className="space-y-6 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/70" />
      <div className="grid gap-6 xl:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/70"
          />
        ))}
      </div>
    </main>
  );
}
