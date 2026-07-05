import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { ClipboardCheck, Play } from 'lucide-react';

export default async function UATPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const flows = await prisma.uATFlow.findMany({
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck size={24} className="text-blue-600" /> User Acceptance Testing
          </h1>
          <p className="text-gray-500 mt-1">Assign, track, and review manual UAT workflows for the Beta.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm">
          <Play size={18} /> New Test Run
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Test Flow</th>
                <th className="px-4 py-3 font-medium text-gray-600">Assigned To</th>
                <th className="px-4 py-3 font-medium text-gray-600">Role Tested</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Result</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {flows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No UAT flows assigned yet. Please initiate the standard 9 flows.
                  </td>
                </tr>
              ) : (
                flows.map(flow => (
                  <tr key={flow.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{flow.flow_name}</td>
                    <td className="px-4 py-3 text-gray-500">{flow.assigned_tester || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-gray-500">{flow.role}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {flow.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {flow.pass_fail_result === 'Passed' && <span className="text-green-600 font-medium text-xs">Passed</span>}
                      {flow.pass_fail_result === 'Failed' && <span className="text-red-600 font-medium text-xs">Failed</span>}
                      {!flow.pass_fail_result && <span className="text-gray-400 text-xs">Pending</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">Update</button>
                    </td>
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
