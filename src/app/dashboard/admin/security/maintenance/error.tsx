"use client";

import { AlertTriangle } from "lucide-react";

export default function SecurityMaintenanceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div
        role="alert"
        className="rounded-2xl border border-red-900 bg-red-950/30 p-6"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-7 w-7 text-red-400" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-white">
            Maintenance health is unavailable
          </h1>
        </div>
        <p className="mt-3 text-sm text-slate-300">
          The health snapshot could not be loaded. No internal diagnostic details
          are shown here.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-lg border border-red-800 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-950"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
