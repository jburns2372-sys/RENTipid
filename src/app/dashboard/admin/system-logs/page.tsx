import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { Terminal, AlertTriangle, Info, XCircle } from 'lucide-react';

export default async function SystemLogsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const logs = await prisma.systemErrorLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 50
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Terminal size={24} className="text-gray-800" /> System Error Logs
          </h1>
          <p className="text-gray-500 mt-1">Monitor application health and captured exceptions.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Timestamp</th>
                <th className="px-4 py-3 font-medium text-gray-600">Severity</th>
                <th className="px-4 py-3 font-medium text-gray-600">Module</th>
                <th className="px-4 py-3 font-medium text-gray-600">Error Message</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No system errors recorded.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                        ${log.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                          log.severity === 'Error' ? 'bg-orange-100 text-orange-800' :
                          log.severity === 'Warning' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'}`}>
                        {log.severity === 'Critical' && <XCircle size={12} />}
                        {log.severity === 'Error' && <AlertTriangle size={12} />}
                        {log.severity === 'Info' && <Info size={12} />}
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{log.module}</td>
                    <td className="px-4 py-3 text-gray-700 truncate max-w-xs">{log.error_message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
