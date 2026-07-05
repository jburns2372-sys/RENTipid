import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { LifeBuoy } from 'lucide-react';

export default async function AdminSupportPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LifeBuoy size={24} className="text-blue-600" /> User Support Desk
          </h1>
          <p className="text-gray-500 mt-1">Manage and resolve user support inquiries.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Ticket #</th>
                <th className="px-4 py-3 font-medium text-gray-600">Subject</th>
                <th className="px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No support tickets open.
                  </td>
                </tr>
              ) : (
                tickets.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.ticket_number}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{t.subject}</td>
                    <td className="px-4 py-3 text-gray-500">{t.category}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">Respond</button>
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
