import React from 'react';
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { hasPermission } from '@/lib/permissions';
import { redirect, notFound } from 'next/navigation';
import AdminProfileFormClient from '@/components/admin/AdminProfileFormClient';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export default async function AdminUserProfilePage({ params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !hasPermission(user.role, 'system_settings', 'read')) {
    redirect('/dashboard');
  }

  const hasEditPermission = hasPermission(user.role, 'system_settings', 'update');

  const targetUser = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      profile: true,
      businessProfile: true
    }
  });

  if (!targetUser) {
    notFound();
  }

  // Audit that this profile was viewed by admin
  await createAuditLog({
    actor_user_id: user.id,
    action: 'PROFILE_VIEWED_BY_ADMIN',
    module: 'system_settings',
    target_id: targetUser.id,
    details: 'Admin viewed user profile details.'
  });

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/admin/users" className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Users Directory
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin: User Details</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold
          ${targetUser.status === 'Active' ? 'bg-green-100 text-green-800' :
            targetUser.status === 'Suspended' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'}`}>
          {targetUser.status || 'Pending'}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">System ID</h3>
          <p className="font-mono text-sm text-gray-900">{targetUser.id}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
          <p className="font-medium text-gray-900">{targetUser.email}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Role</h3>
          <p className="font-medium text-gray-900">{targetUser.role}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Account Created</h3>
          <p className="font-medium text-gray-900">{new Date(targetUser.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <AdminProfileFormClient 
        targetUserId={targetUser.id}
        initialData={targetUser}
        hasEditPermission={hasEditPermission}
      />
    </div>
  );
}
