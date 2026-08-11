export default function SecuritySimulationsLoading() {
  return (
    <main aria-busy="true" aria-label="Loading SOC simulations" className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-36 animate-pulse rounded-2xl border border-violet-900 bg-slate-950/70" />
      {[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/70" />)}
    </main>
  );
}
