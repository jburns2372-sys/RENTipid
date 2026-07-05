import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { MessageSquare, ArrowLeft, Bug } from 'lucide-react';
import Link from 'next/link';

export default async function FeedbackDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const feedback = await prisma.betaFeedback.findUnique({
    where: { id: params.id }
  });

  if (!feedback) {
    return <div className="p-12 text-center text-gray-500">Feedback not found.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/admin/feedback" className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium mb-4">
          <ArrowLeft size={16} /> Back to Feedback List
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare size={24} className="text-blue-600" /> Beta Feedback Review
            </h1>
            <p className="text-gray-500 mt-1">Submitted on {new Date(feedback.created_at).toLocaleString()}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 border text-gray-800">
            {feedback.status}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Feedback Type</label>
            <p className="text-gray-900 font-medium">{feedback.feedback_type}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Related Module</label>
            <p className="text-gray-900 font-medium">{feedback.module}</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">User Message</label>
          <div className="bg-gray-50 border p-4 rounded-lg text-gray-800 text-sm whitespace-pre-wrap">
            {feedback.message}
          </div>
        </div>

        <div className="border-t pt-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Admin Response</label>
          {feedback.admin_response ? (
            <p className="text-blue-800 bg-blue-50 p-4 rounded-lg text-sm">{feedback.admin_response}</p>
          ) : (
            <p className="text-gray-500 italic text-sm">No response yet.</p>
          )}
        </div>

        <div className="border-t pt-6 flex justify-end gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition shadow-sm">
            Respond to User
          </button>
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm">
            <Bug size={18} /> Convert to Issue Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
