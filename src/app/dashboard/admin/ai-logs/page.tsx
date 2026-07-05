import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/ai/ai-logger';
import { redirect } from 'next/navigation';
import { ShieldAlert, Activity, Filter, Search } from 'lucide-react';
import Link from 'next/link';

interface AILogsPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function AILogsPage(props: AILogsPageProps) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin' && role !== 'Admin' && role !== 'Compliance Admin') {
    redirect('/unauthorized');
  }

  // Build filter conditions
  const whereCondition: any = {};
  if (searchParams.bot) whereCondition.bot_name = searchParams.bot;
  if (searchParams.module) whereCondition.module = searchParams.module;
  if (searchParams.status) whereCondition.action_status = searchParams.status;
  if (searchParams.role) whereCondition.user = { role: searchParams.role };

  // Fetch logs directly (In production, use pagination)
  const logs = await prisma.aIBotLog.findMany({
    where: whereCondition,
    take: 50,
    orderBy: { created_at: 'desc' },
    include: { user: { select: { email: true, role: true } } }
  });

  const totalLogs = await prisma.aIBotLog.count({ where: whereCondition });
  const blockedLogs = await prisma.aIBotLog.count({ where: { ...whereCondition, action_status: 'Blocked' } });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">AI Monitoring Dashboard</h1>
          <p className="text-gray-500 text-sm">Review AI assistant interactions and system guardrail events.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Activity size={20} />
            <h3 className="font-semibold text-sm">Total Interactions</h3>
          </div>
          <p className="text-3xl font-bold">{totalLogs}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm border-red-100">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <ShieldAlert size={20} />
            <h3 className="font-semibold text-sm">Blocked Actions</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">{blockedLogs}</p>
        </div>
      </div>

      {/* Filters UI */}
      <div className="bg-white p-4 border rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-center text-sm">
        <div className="flex items-center gap-2 text-gray-500 font-medium">
          <Filter size={16} /> Filters:
        </div>
        <Link 
          href="/dashboard/admin/ai-logs" 
          className={`px-3 py-1.5 rounded-full border transition ${!searchParams.status && !searchParams.bot ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
        >
          All Logs
        </Link>
        <Link 
          href="?status=Blocked" 
          className={`px-3 py-1.5 rounded-full border transition ${searchParams.status === 'Blocked' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'}`}
        >
          Blocked Only
        </Link>
        <Link 
          href="?module=Booking" 
          className={`px-3 py-1.5 rounded-full border transition ${searchParams.module === 'Booking' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'}`}
        >
          Bookings
        </Link>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold">Recent AI Interactions {searchParams.status && `(${searchParams.status})`}</h2>
          <button className="text-sm bg-white border shadow-sm px-3 py-1.5 rounded-md hover:bg-gray-50 font-medium text-gray-700">
            Export Logs
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Bot & Module</th>
                <th className="px-6 py-3">Prompt</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {log.user ? (
                      <div>
                        <div className="font-medium">{log.user.email}</div>
                        <div className="text-xs text-gray-500">{log.user.role}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Guest</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-blue-600">{log.bot_name}</div>
                    <div className="text-xs text-gray-500">{log.module}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate" title={log.prompt || ''}>
                    {log.prompt}
                  </td>
                  <td className="px-6 py-4">
                    {log.action_status === 'Blocked' ? (
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-medium border border-red-100">
                        <ShieldAlert size={12} /> Blocked
                      </span>
                    ) : (
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-medium border border-green-100">
                        Success
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No AI interactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
