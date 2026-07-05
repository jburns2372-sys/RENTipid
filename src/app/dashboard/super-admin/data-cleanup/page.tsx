import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default async function DataCleanupPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-red-700">
          <Trash2 size={24} /> Test Data Cleanup
        </h1>
        <p className="text-gray-500 mt-1">Super Admin utility to purge labeled test data before public launch.</p>
      </div>

      <div className="bg-red-50 p-6 rounded-xl mb-8 flex flex-col items-center justify-center text-center border border-red-200">
        <div className="bg-white p-4 rounded-full text-red-600 mb-4 shadow-sm">
          <AlertTriangle size={48} />
        </div>
        <h2 className="text-xl font-bold text-red-800 mb-2">Destructive Action Locked</h2>
        <p className="text-red-700 max-w-lg mb-6">
          Data deletion is strictly disabled during Phase 10 Beta Testing to preserve UAT and audit logs. This module will be unlocked in Phase 11 for final database preparation.
        </p>
        <button disabled className="bg-red-200 text-red-500 px-6 py-3 rounded-lg font-bold cursor-not-allowed flex items-center gap-2">
          <ShieldCheck size={20} /> Purge Test Data (Locked)
        </button>
      </div>
    </div>
  );
}
