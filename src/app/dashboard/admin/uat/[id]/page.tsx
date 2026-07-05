import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { ClipboardCheck, ArrowLeft, Bug } from 'lucide-react';
import Link from 'next/link';

export default async function UATDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const flow = await prisma.uATFlow.findUnique({
    where: { id: params.id }
  });

  if (!flow) {
    return <div className="p-12 text-center text-gray-500">UAT Flow not found.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/admin/uat" className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium mb-4">
          <ArrowLeft size={16} /> Back to UAT Tracker
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck size={24} className="text-blue-600" /> {flow.flow_name}
            </h1>
            <p className="text-gray-500 mt-1">UAT Execution Record</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-bold border
            ${flow.pass_fail_result === 'Passed' ? 'bg-green-100 text-green-800 border-green-200' :
              flow.pass_fail_result === 'Failed' ? 'bg-red-100 text-red-800 border-red-200' :
              'bg-gray-100 text-gray-800 border-gray-200'}`}>
            {flow.pass_fail_result || 'Pending'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Assigned Tester</label>
            <p className="text-gray-900 font-medium">{flow.assigned_tester || 'Unassigned'}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Role Tested</label>
            <p className="text-gray-900 font-medium">{flow.role}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
            <p className="text-gray-900 font-medium">{flow.status}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Execution Dates</label>
            <p className="text-gray-900 text-sm">Started: {flow.start_date ? new Date(flow.start_date).toLocaleDateString() : 'N/A'}</p>
            <p className="text-gray-900 text-sm">Completed: {flow.completion_date ? new Date(flow.completion_date).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Issues Found during Testing</label>
          {flow.issues_found ? (
            <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-red-900 text-sm">
              {flow.issues_found}
            </div>
          ) : (
            <p className="text-gray-500 italic text-sm">No issues documented.</p>
          )}
        </div>

        <div className="border-t pt-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tester Notes</label>
          <p className="text-gray-800 text-sm whitespace-pre-wrap">{flow.notes || 'No additional notes provided.'}</p>
        </div>

        {flow.pass_fail_result === 'Failed' && (
          <div className="border-t pt-6 flex justify-end">
            <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm">
              <Bug size={18} /> Convert to Issue Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
