import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import RentipidLogo from '@/components/brand/RentipidLogo';

const prisma = new PrismaClient();

export default async function RenterReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== 'Renter') redirect('/login');

  const transaction = await prisma.gatewayTransaction.findUnique({
    where: { id },
    include: { booking: { include: { listing: true } } }
  });

  if (!transaction || transaction.booking.renter_id !== user.id) notFound();

  return (
    <div className="container mx-auto p-6 max-w-3xl py-12">
      <Link href="/dashboard/renter/bookings" className="text-blue-600 hover:underline text-sm mb-6 inline-block">&larr; Back to Bookings</Link>
      
      <div className="bg-white rounded-xl border p-8 shadow-sm">
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Receipt</h1>
            <p className="text-gray-500">Ref: {transaction.gateway_reference || transaction.id.substring(0,8).toUpperCase()}</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <RentipidLogo variant="full" size="sm" showText={false} className="mb-2" />
            <p className="text-sm text-gray-500">Manila, Philippines</p>
          </div>
        </div>

        <div className="bg-yellow-50 text-yellow-800 p-4 rounded text-sm mb-6 border border-yellow-200">
          <strong>NOTICE:</strong> For review / system record only unless official receipt issuance is formally enabled via Phase 17 compliance.
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-2">Billed To</h3>
          <p className="text-gray-600">{user.name}</p>
          <p className="text-gray-600">{user.email}</p>
        </div>

        <table className="w-full text-left mb-6">
          <thead>
            <tr className="border-b">
              <th className="pb-2 text-gray-800">Description</th>
              <th className="pb-2 text-gray-800 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3 text-gray-600">Booking: {transaction.booking.listing.title}</td>
              <td className="py-3 text-gray-900 text-right">₱ {transaction.amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end text-xl font-bold text-gray-900">
          <span>Total Paid: ₱ {transaction.amount.toLocaleString()}</span>
        </div>
        
        <div className="mt-8 text-sm text-gray-400 text-center">
          Payment Mode: {transaction.provider_mode} <br/>
          Date: {new Date(transaction.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
