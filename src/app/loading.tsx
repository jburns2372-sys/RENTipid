import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 text-blue-600">
        <Loader2 size={48} className="animate-spin" />
        <p className="font-medium text-gray-600 animate-pulse">Loading secure environment...</p>
      </div>
    </div>
  );
}
