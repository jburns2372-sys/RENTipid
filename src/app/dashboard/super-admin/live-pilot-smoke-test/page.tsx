import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';

export default async function LivePilotSmokeTestPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user as any).role !== 'Super Admin') redirect('/dashboard');

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-2">Live Pilot Smoke Test Tracker</h1>
      <p className="text-gray-600 mb-8">Phase 16 - Final Execution Validation Checklist</p>

      <div className="bg-white rounded-xl border p-6 shadow-sm mb-6">
        <h2 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">End-to-End Testing Matrix</h2>
        <ul className="list-none space-y-3 text-sm text-gray-700">
          <li className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Live pilot disabled by default on load</li>
          <li className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Live option explicitly hidden for non-pilot user</li>
          <li className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Live option hidden if amount above limit</li>
          <li className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Live checkout session creates in controlled mode</li>
          <li className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Live webhook validates live signature</li>
          <li className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Sandbox webhook fails if sent to live mode</li>
          <li className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Finance review correctly triggers for live transaction</li>
          <li className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Booking confirmation blocks until Finance approves</li>
          <li className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Emergency freeze instantly blocks all live checkouts</li>
        </ul>
        <p className="text-xs text-gray-500 mt-4 italic">Check these boxes manually during the final phase test before public release.</p>
      </div>
    </div>
  );
}
