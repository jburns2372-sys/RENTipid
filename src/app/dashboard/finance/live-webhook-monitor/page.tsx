import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { Activity, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function LiveWebhookMonitorPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Finance Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const recentWebhooks = await prisma.paymentWebhookLog.findMany({
    orderBy: { received_at: 'desc' },
    take: 20
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="text-blue-600" /> Live Webhook Monitor</h1>
          <p className="text-gray-500 mt-1">Real-time view of incoming payment webhooks from the gateway.</p>
        </div>
        <Link href="/dashboard/finance" className="text-blue-600 hover:underline">Back to Finance</Link>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-700">Timestamp</th>
              <th className="p-4 font-semibold text-gray-700">Event Type</th>
              <th className="p-4 font-semibold text-gray-700">Gateway Ref</th>
              <th className="p-4 font-semibold text-gray-700">Signature</th>
              <th className="p-4 font-semibold text-gray-700">Mode</th>
              <th className="p-4 font-semibold text-gray-700">Processing Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {recentWebhooks.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No webhooks logged yet.
                </td>
              </tr>
            ) : (
              recentWebhooks.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-600">{new Date(log.received_at).toLocaleString()}</td>
                  <td className="p-4 font-mono text-xs">{log.event_type}</td>
                  <td className="p-4 font-mono text-xs text-blue-600">{log.gateway_reference}</td>
                  <td className="p-4">
                    {log.verification_status === 'Verified' ? (
                      <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} /> Verified</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600"><XCircle size={14} /> {log.verification_status}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {/* Infer mode if available in payload, else use generic */}
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">Gateway Payload</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      log.processing_status === 'Processed' ? 'bg-green-100 text-green-700' :
                      log.processing_status === 'Duplicate' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {log.processing_status}
                    </span>
                    {log.error_message && (
                      <p className="text-red-500 text-xs mt-1 max-w-[200px] truncate" title={log.error_message}>{log.error_message}</p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
