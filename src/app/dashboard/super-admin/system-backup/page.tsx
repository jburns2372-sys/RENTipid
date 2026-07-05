import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ShieldAlert, Database, Download, CloudRain } from 'lucide-react';

export default async function SystemBackupPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Database size={24} className="text-blue-600" /> System Backup & Restore
          </h1>
          <p className="text-gray-500 mt-1">Super Admin utility for data durability operations.</p>
        </div>
      </div>

      <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-8 flex items-start gap-3 border border-red-100">
        <ShieldAlert size={20} className="shrink-0 mt-0.5 text-red-600" />
        <div>
          <p className="font-semibold text-red-700">Production Warning</p>
          <p className="text-sm mt-1">
            Restoring databases in production is destructive and will overwrite live transactions. Automated daily snapshots are handled by the cloud provider.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">Database State</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Active Provider</span>
              <span className="font-medium text-gray-900">SQLite (Local) / PostgreSQL (Prod)</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Last Automated Backup</span>
              <span className="font-medium text-green-600">Today, 02:00 AM (Placeholder)</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Retention Policy</span>
              <span className="font-medium text-gray-900">30 Days</span>
            </div>
          </div>
          <button className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50">
            <Download size={18} /> Export Development Data (Placeholder)
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">Cloud Storage State</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Active Provider</span>
              <span className="font-medium text-gray-900">Local Disk (Dev Default)</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Object Versioning</span>
              <span className="font-medium text-amber-600">Disabled</span>
            </div>
          </div>
          <button className="mt-6 w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition disabled:opacity-50">
            <CloudRain size={18} /> Sync Cloud Files (Placeholder)
          </button>
        </div>
      </div>
    </div>
  );
}
