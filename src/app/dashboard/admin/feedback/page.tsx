import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { MessageSquare, Filter, AlertCircle } from 'lucide-react';

export default async function AdminFeedbackPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const feedbacks = await prisma.betaFeedback.findMany({
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare size={24} className="text-blue-600" /> Beta Feedback Review
          </h1>
          <p className="text-gray-500 mt-1">Review bug reports and suggestions submitted by beta users.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Type & Module</th>
                <th className="px-4 py-3 font-medium text-gray-600">Message</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No feedback received yet.
                  </td>
                </tr>
              ) : (
                feedbacks.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{f.feedback_type}</p>
                      <p className="text-xs text-gray-500">{f.module}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 truncate max-w-xs">{f.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(f.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                        Review
                      </button>
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
