import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export default async function AppVersionPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');
  
  const userRole = (session.user as any).role;
  if (userRole !== 'Super Admin') {
    redirect('/dashboard');
  }

  const versions = await prisma.appReleaseVersion.findMany({
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">App Version Control</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm">
          Register New Build
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Version</th>
              <th className="px-6 py-3">Build Number</th>
              <th className="px-6 py-3">Platform</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created At</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((ver) => (
              <tr key={ver.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{ver.version_name}</td>
                <td className="px-6 py-4">{ver.build_number}</td>
                <td className="px-6 py-4">{ver.platform}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    ver.release_status === 'Production' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {ver.release_status}
                  </span>
                </td>
                <td className="px-6 py-4">{new Date(ver.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {versions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No release versions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
