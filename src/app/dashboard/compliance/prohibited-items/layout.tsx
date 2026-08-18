import React from 'react';
import Link from 'next/link';
import { requireSecurityPermission } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';

export default async function ProhibitedItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSecurityPermission(SECURITY_PERMISSIONS.PROHIBITED_ITEMS_REVIEW_LISTING);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prohibited Items Module</h1>
          <p className="text-sm text-gray-500">Compliance & Enforcement</p>
        </div>
        <nav className="flex space-x-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
          <Link href="/dashboard/compliance/prohibited-items" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white rounded-md transition-colors">
            Dashboard
          </Link>
          <Link href="/dashboard/compliance/prohibited-items/enforcement" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white rounded-md transition-colors">
            Enforcement Queue
          </Link>
          <Link href="/dashboard/compliance/prohibited-items/appeals" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white rounded-md transition-colors">
            Appeals
          </Link>
          <Link href="/dashboard/compliance/prohibited-items/policies" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white rounded-md transition-colors">
            Policy Catalogue
          </Link>
        </nav>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
