import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Bot, Shield, AlertTriangle } from 'lucide-react';
import { prisma } from '@/lib/ai/ai-logger';

export default async function AIV1CheckPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const blockedLogs = await prisma.aIBotLog.findMany({
    where: { 
      action_status: 'Blocked by Guardrail'
    },
    orderBy: { created_at: 'desc' },
    take: 5
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3 border-b pb-4">
        <Bot size={32} className="text-violet-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI Guardrail Monitor</h1>
          <p className="text-gray-500 mt-1">Ensure AI remains constrained to Level 3 permissions for V1 Launch.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border rounded-xl p-5 shadow-sm border-violet-200">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={20} className="text-violet-600" />
            <h2 className="font-bold text-gray-900">Current AI Profile</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Global AI Status</span>
              <span className="font-bold text-green-600">Enabled (Guidance Only)</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Max Permission Level</span>
              <span className="font-bold text-violet-700 bg-violet-100 px-2 rounded">Level 3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Direct Execution</span>
              <span className="font-bold text-red-600">Strictly Disabled</span>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border rounded-xl p-5 shadow-sm border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} className="text-red-600" />
            <h2 className="font-bold text-red-900">Restricted Actions</h2>
          </div>
          <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
            <li>Cannot Approve KYC</li>
            <li>Cannot Publish Listings</li>
            <li>Cannot Release Escrow Deposits</li>
            <li>Cannot Deduct Damage Claims</li>
            <li>Cannot Suspend Users</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-gray-50 border-b px-6 py-3 font-bold text-gray-800">
          Recent Guardrail Interventions
        </div>
        <div className="divide-y">
          {blockedLogs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No recent blocked attempts.</div>
          ) : (
            blockedLogs.map(log => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-900 text-sm">Action Blocked: {log.action_requested}</span>
                  <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">{log.response_summary}</p>
                <p className="text-xs text-gray-500 mt-2 truncate">Prompt: {log.prompt}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
