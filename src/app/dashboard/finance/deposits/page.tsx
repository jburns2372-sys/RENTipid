import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function FinanceDepositsDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Finance Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const deposits = await prisma.depositAction.findMany({
    include: { booking: true },
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold">Deposit Holds & Releases</h1>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-sm">
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Booking ID</th>
              <th className="p-4 font-medium">Action Type</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Performed By</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {deposits.map(dep => (
              <tr key={dep.id} className="hover:bg-gray-50">
                <td className="p-4">{new Date(dep.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <Link href={`/dashboard/admin/bookings/${dep.booking_id}`} className="text-blue-600 hover:underline">{dep.booking_id}</Link>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${dep.action_type.includes('Release') ? 'bg-green-100 text-green-700' : 
                      dep.action_type.includes('Deduct') ? 'bg-red-100 text-red-700' : 
                      'bg-orange-100 text-orange-700'}`}>
                    {dep.action_type}
                  </span>
                </td>
                <td className="p-4 font-medium">₱{dep.amount.toFixed(2)}</td>
                <td className="p-4">{dep.performed_by}</td>
              </tr>
            ))}
            {deposits.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No deposit actions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
