import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { LifeBuoy, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default async function SupportDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id }
  });

  if (!ticket) {
    return <div className="p-12 text-center text-gray-500">Support Ticket not found.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/admin/support" className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium mb-4">
          <ArrowLeft size={16} /> Back to Support Desk
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LifeBuoy size={24} className="text-blue-600" /> {ticket.subject}
            </h1>
            <p className="text-gray-500 mt-1">Ticket #{ticket.ticket_number} • Created {new Date(ticket.created_at).toLocaleString()}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 border text-gray-800">
            {ticket.status}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
            <p className="text-gray-900 font-medium">{ticket.category}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Priority</label>
            <p className="text-gray-900 font-medium">{ticket.priority}</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">User Message</label>
          <div className="bg-gray-50 border p-4 rounded-lg text-gray-800 text-sm whitespace-pre-wrap">
            {ticket.message}
          </div>
        </div>

        <div className="border-t pt-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reply to User</label>
          <textarea 
            rows={4} 
            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            placeholder="Type your response here..."
          />
          <div className="flex justify-between items-center mt-3">
            <select className="border rounded-lg p-2 outline-none text-sm bg-gray-50">
              <option value="Waiting for User">Change Status: Waiting for User</option>
              <option value="Resolved">Change Status: Resolved</option>
              <option value="Closed">Change Status: Closed</option>
            </select>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm">
              <Send size={16} /> Send Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
