import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { Users, Filter, Tag, Settings } from 'lucide-react';

export default async function BetaUsersPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      full_name: true,
      email: true,
      role: true,
      status: true,
      created_at: true,
      is_test_data: true,
      beta_label: true
    }
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users size={24} className="text-purple-600" /> Beta User Management
          </h1>
          <p className="text-gray-500 mt-1">Label and track internal testers and beta participants.</p>
        </div>
        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm">
          Add Beta Tester
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">User</th>
                <th className="px-4 py-3 font-medium text-gray-600">Role & Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Beta Label</th>
                <th className="px-4 py-3 font-medium text-gray-600">Registered</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-gray-500 text-xs">{user.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{user.role}</p>
                    <p className="text-xs text-green-600 mt-0.5">{user.status}</p>
                  </td>
                  <td className="px-4 py-4">
                    {user.is_test_data ? (
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        <Tag size={12} /> {user.beta_label || 'Test Data'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Real User</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                      Manage Labels
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
