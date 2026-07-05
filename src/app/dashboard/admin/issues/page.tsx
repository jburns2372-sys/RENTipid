import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { Bug, Plus } from 'lucide-react';

export default async function AdminIssuesPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const issues = await prisma.issueTicket.findMany({
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bug size={24} className="text-red-600" /> Issue Tracker
          </h1>
          <p className="text-gray-500 mt-1">Internal UAT and Feedback issue tracking.</p>
        </div>
        <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm">
          <Plus size={18} /> Log Issue
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Issue</th>
                <th className="px-4 py-3 font-medium text-gray-600">Source</th>
                <th className="px-4 py-3 font-medium text-gray-600">Severity</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No issues logged.
                  </td>
                </tr>
              ) : (
                issues.map(issue => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{issue.issue_title}</p>
                      <p className="text-xs text-gray-500">{issue.module}</p>
                    </td>
                    <td className="px-4 py-3">{issue.source}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        ${issue.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">{issue.status}</td>
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
