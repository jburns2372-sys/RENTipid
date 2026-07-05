import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function AdminDisputesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.role !== 'Admin' && user?.role !== 'Super Admin' && user?.role !== 'Compliance Officer') {
    redirect('/unauthorized');
  }

  const disputes = await prisma.disputeCase.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      booking: {
        include: {
          listing: true,
          renter: true,
          provider: true
        }
      },
      damage_claim: true
    }
  });

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dispute Resolution Center</h1>
          <p className="text-gray-500">Manage escalated damage claims and deposit release disputes.</p>
        </div>
        <AIAssistantButton context="Admin Dispute Center" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Dispute ID</th>
              <th className="p-4 font-semibold text-gray-600">Type / Claim</th>
              <th className="p-4 font-semibold text-gray-600">Parties</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600">Date Opened</th>
              <th className="p-4 font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {disputes.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No disputes found.</td>
              </tr>
            ) : disputes.map(dispute => (
              <tr key={dispute.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-mono text-xs">{dispute.id.slice(-8).toUpperCase()}</td>
                <td className="p-4">
                  <div className="font-bold">{dispute.dispute_type}</div>
                  {dispute.damage_claim && (
                    <div className="text-xs text-gray-500">Claim: {dispute.damage_claim.claim_number}</div>
                  )}
                </td>
                <td className="p-4 text-xs">
                  <div><span className="font-bold text-gray-600">P:</span> {dispute.booking.provider.full_name}</div>
                  <div><span className="font-bold text-gray-600">R:</span> {dispute.booking.renter.full_name}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    dispute.dispute_status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                    dispute.dispute_status === 'Resolved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {dispute.dispute_status}
                  </span>
                </td>
                <td className="p-4 text-xs text-gray-500">{dispute.created_at.toLocaleDateString()}</td>
                <td className="p-4">
                  <Link href={`/dashboard/admin/disputes/${dispute.id}`} className="text-blue-600 font-bold hover:underline text-sm">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
