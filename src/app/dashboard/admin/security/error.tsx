"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function SecurityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // We intentionally log to the console for internal telemetry
    // but DO NOT expose the stack trace to the client UI.
    console.error("SOC Protected Route Error Boundary Caught:", error.message);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-white tracking-tight">Security Context Unavailable</h2>
      <p className="text-gray-400 max-w-md">
        An internal failure occurred while establishing the protected security context. Access has been halted to fail closed.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors border border-gray-700"
      >
        Retry Security Context
      </button>
    </div>
  );
}
