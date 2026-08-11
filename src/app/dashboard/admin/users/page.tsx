import React from 'react';
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string, role?: string, status?: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !hasPermission(user.role, 'system_settings', 'read')) {
    redirect('/dashboard');
  }

  const { q, role, status } = searchParams;

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } }
    ];
  }
  if (role) where.role = role;
  if (status) where.status = status;

  const users = await prisma.user.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      profile: true,
      businessProfile: true
    },
    take: 50
  });

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">User Directory</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form className="mb-6 flex gap-4 flex-wrap">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search name or email..."
            className="px-4 py-2 border rounded-md"
          />
          <select name="role" defaultValue={role} className="px-4 py-2 border rounded-md">
            <option value="">All Roles</option>
            <option value="Renter">Renter</option>
            <option value="Individual Provider">Individual Provider</option>
            <option value="Business Provider">Business Provider</option>
            <option value="Admin">Admin</option>
          </select>
          <select name="status" defaultValue={status} className="px-4 py-2 border rounded-md">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
            Filter
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-4 font-medium text-gray-600">User</th>
                <th className="p-4 font-medium text-gray-600">Role</th>
                <th className="p-4 font-medium text-gray-600">Status</th>
                <th className="p-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{u.full_name || 'No Name'}</div>
                    <div className="text-gray-500 text-xs">{u.email}</div>
                  </td>
                  <td className="p-4">{u.role}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${u.status === 'Active' ? 'bg-green-100 text-green-800' :
                        u.status === 'Suspended' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {u.status || 'Pending'}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link href={`/dashboard/admin/users/${u.id}`} className="text-blue-600 hover:underline">
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
