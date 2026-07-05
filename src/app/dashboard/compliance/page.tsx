import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function ComplianceDashboard() {
  const pendingUsers = await prisma.user.count({ where: { status: 'Pending' } });
  const verifiedUsers = await prisma.user.count({ where: { status: 'Verified' } });
  const suspendedUsers = await prisma.user.count({ where: { status: 'Suspended' } });
  const blacklistedUsers = await prisma.user.count({ where: { status: 'Blacklisted' } });

  const recentUsers = await prisma.user.findMany({
    orderBy: { created_at: 'desc' },
    take: 10,
    select: { id: true, full_name: true, email: true, role: true, status: true, account_type: true }
  });

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Compliance & Verification</h1>
        <div className="flex space-x-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full uppercase">Admin View</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-200">
          <p className="text-sm font-medium text-gray-500 mb-1">Pending Verifications</p>
          <p className="text-3xl font-bold text-yellow-600">{pendingUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200">
          <p className="text-sm font-medium text-gray-500 mb-1">Verified Users</p>
          <p className="text-3xl font-bold text-green-600">{verifiedUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-200">
          <p className="text-sm font-medium text-gray-500 mb-1">Suspended</p>
          <p className="text-3xl font-bold text-orange-600">{suspendedUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
          <p className="text-sm font-medium text-gray-500 mb-1">Blacklisted</p>
          <p className="text-3xl font-bold text-red-600">{blacklistedUsers}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Recent Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(user => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{user.full_name}</td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4 text-gray-600">{user.role}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${user.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        user.status === 'Verified' ? 'bg-green-100 text-green-800' : 
                        user.status === 'Suspended' ? 'bg-orange-100 text-orange-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-blue-600 hover:underline font-medium">Review</button>
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <AIAssistantButton context="Compliance Admin" />
    </div>
  );
}
