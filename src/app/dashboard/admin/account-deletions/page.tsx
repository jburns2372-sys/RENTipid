import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function AdminAccountDeletionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');
  
  const userRole = (session.user as any).role;
  if (userRole !== 'Admin' && userRole !== 'Super Admin' && userRole !== 'Compliance Admin') {
    redirect('/dashboard');
  }

  const requests = await prisma.accountDeletionRequest.findMany({
    include: {
      user: {
        select: { full_name: true, email: true, role: true }
      }
    },
    orderBy: { requested_at: 'desc' }
  });

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Account Deletion Requests</h1>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Reason</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Requested At</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{req.user.full_name}</div>
                  <div className="text-gray-500">{req.user.email}</div>
                  <div className="text-xs text-gray-400">{req.user.role}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs truncate" title={req.reason}>{req.reason}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    req.status === 'Requested' ? 'bg-yellow-100 text-yellow-800' :
                    req.status === 'Blocked Due to Active Transaction' ? 'bg-red-100 text-red-800' :
                    req.status === 'Completed Placeholder' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {new Date(req.requested_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:underline">Review</button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No deletion requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
