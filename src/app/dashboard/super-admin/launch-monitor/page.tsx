import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Activity, Users, AlertTriangle, ShieldCheck } from 'lucide-react';

export default async function LaunchMonitorPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  // Placeholder static data for Launch Monitor layout
  const stats = [
    { label: "Active Users (Live)", value: "142", trend: "+12%" },
    { label: "Pending KYC", value: "8", trend: "Needs Review" },
    { label: "Pending Listings", value: "3", trend: "Needs Review" },
    { label: "Open Bookings", value: "24", trend: "Stable" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity size={24} className="text-blue-600" /> V1 Launch Monitor
          </h1>
          <p className="text-gray-500 mt-1">Real-time incident response and operational health.</p>
        </div>
        <div className="flex gap-3">
          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Systems Operational
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="text-gray-500 text-sm font-medium mb-1">{stat.label}</div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-blue-600 mt-2 font-medium">{stat.trend}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gray-50 border-b px-5 py-3 font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Recent Errors & Anomalies
          </div>
          <div className="p-8 text-center text-gray-500 text-sm">
            No system anomalies detected in the last hour.
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-red-50 border-b border-red-100 px-5 py-3 font-bold text-red-800 flex items-center gap-2">
            <ShieldCheck size={18} /> Emergency Incident Actions
          </div>
          <div className="p-5 space-y-3">
            <button className="w-full text-left bg-white border border-gray-300 hover:bg-gray-50 px-4 py-3 rounded-lg text-sm font-medium transition flex justify-between items-center">
              Disable Public Registration <span className="text-gray-400">→</span>
            </button>
            <button className="w-full text-left bg-white border border-gray-300 hover:bg-gray-50 px-4 py-3 rounded-lg text-sm font-medium transition flex justify-between items-center">
              Freeze All New Bookings <span className="text-gray-400">→</span>
            </button>
            <button className="w-full text-left bg-red-100 border border-red-200 text-red-700 hover:bg-red-200 px-4 py-3 rounded-lg text-sm font-bold transition flex justify-between items-center">
              Enable Global Maintenance Mode <span className="text-red-500">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
