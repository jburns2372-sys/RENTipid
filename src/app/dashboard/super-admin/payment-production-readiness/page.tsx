import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export default async function PaymentProductionReadinessPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');
  
  const userRole = (session.user as any).role;
  if (userRole !== 'Super Admin') redirect('/dashboard');

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-2">Payment Production Readiness</h1>
      <p className="text-gray-600 mb-8">Phase 16 - Limited Live Pilot Pre-flight Checklist</p>

      <div className="bg-white rounded-xl border p-6 shadow-sm mb-6">
        <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">PayMongo Production (Default)</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <label className="flex items-center gap-2"><input type="checkbox" disabled checked className="rounded text-blue-600" /> Business account approved by payment provider</label>
          <label className="flex items-center gap-2"><input type="checkbox" disabled checked className="rounded text-blue-600" /> Live API keys obtained</label>
          <label className="flex items-center gap-2"><input type="checkbox" disabled checked className="rounded text-blue-600" /> Webhook URL registered</label>
          <label className="flex items-center gap-2"><input type="checkbox" disabled checked className="rounded text-blue-600" /> Webhook signing secret configured</label>
          <label className="flex items-center gap-2"><input type="checkbox" disabled className="rounded text-blue-600" /> Settlement bank account verified</label>
          <label className="flex items-center gap-2"><input type="checkbox" disabled checked className="rounded text-blue-600" /> Refund process reviewed</label>
          <label className="flex items-center gap-2"><input type="checkbox" disabled checked className="rounded text-blue-600" /> Chargeback/dispute process reviewed</label>
        </div>
      </div>

      <div className="bg-red-50 text-red-800 p-4 rounded text-sm mb-4 border border-red-200">
        <strong>ACTION REQUIRED:</strong> Do not enable live mode via the Live Pilot Controls until all items above are checked and verified by Legal/Finance.
      </div>
    </div>
  );
}
