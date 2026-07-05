import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { Ticket, Plus } from 'lucide-react';

export default async function BetaInvitationsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const invitations = await prisma.betaInvitation.findMany({
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket size={24} className="text-amber-600" /> Beta Invitations
          </h1>
          <p className="text-gray-500 mt-1">Manage invite codes for restricted beta registration.</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm">
          <Plus size={18} /> Generate Invite
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Invitee Email</th>
                <th className="px-4 py-3 font-medium text-gray-600">Intended Role</th>
                <th className="px-4 py-3 font-medium text-gray-600">Invite Code</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No beta invitations generated yet.
                  </td>
                </tr>
              ) : (
                invitations.map(invite => (
                  <tr key={invite.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{invite.email}</p>
                      {invite.invitee_name && <p className="text-xs text-gray-500">{invite.invitee_name}</p>}
                    </td>
                    <td className="px-4 py-3 font-medium">{invite.intended_role}</td>
                    <td className="px-4 py-3 font-mono text-xs">{invite.invitation_code}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        ${invite.invitation_status === 'Accepted' ? 'bg-green-100 text-green-800' :
                          invite.invitation_status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                          invite.invitation_status === 'Sent Placeholder' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'}`}>
                        {invite.invitation_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {invite.expiry_date ? new Date(invite.expiry_date).toLocaleDateString() : 'Never'}
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
