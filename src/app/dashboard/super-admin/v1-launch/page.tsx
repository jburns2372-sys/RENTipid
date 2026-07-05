import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CheckSquare, AlertTriangle, PlayCircle } from 'lucide-react';
import Link from 'next/link';

export default async function V1LaunchChecklistPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const checklistSections = [
    {
      category: "Infrastructure Readiness",
      items: [
        { name: "Build Status (0 TS Errors)", status: "Passed", owner: "DevOps" },
        { name: "Database Intact & Backed Up", status: "Passed", owner: "DBA" },
        { name: "Storage Buckets Public/Private Verified", status: "Passed", owner: "CloudOps" }
      ]
    },
    {
      category: "Platform Guardrails",
      items: [
        { name: "Mock Payment Active", status: "Passed", owner: "Finance Admin" },
        { name: "Real Social Posting Disabled", status: "Passed", owner: "Marketing Admin" },
        { name: "AI Sandboxed to Level 3", status: "Passed", owner: "AI Operations" }
      ]
    },
    {
      category: "Workflows & Legal",
      items: [
        { name: "Support Desk Available", status: "Passed", owner: "Customer Support" },
        { name: "Terms & Legal Pages Linked", status: "Pending", owner: "Legal" },
        { name: "Incident Response Plan Ready", status: "Passed", owner: "Super Admin" }
      ]
    }
  ];

  const allPassed = checklistSections.every(s => s.items.every(i => i.status === "Passed"));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 border-b pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PlayCircle size={24} className="text-blue-600" /> V1 Production Launch Checklist
          </h1>
          <p className="text-gray-500 mt-1">Final Super Admin verification before enabling Public Registration.</p>
        </div>
        {!allPassed && (
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm opacity-50 cursor-not-allowed">
            Authorize V1 Launch (Locked)
          </button>
        )}
      </div>

      {!allPassed && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-8 flex items-center gap-3">
          <AlertTriangle size={24} className="text-amber-600" />
          <p className="text-amber-800 font-medium">Pending items must be completed before V1 Launch authorization unlocks.</p>
        </div>
      )}

      <div className="space-y-8">
        {checklistSections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gray-50 border-b px-6 py-3 font-bold text-gray-800">
              {section.category}
            </div>
            <div className="divide-y">
              {section.items.map((item, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">Assigned to: {item.owner} • Last Checked: Today</p>
                  </div>
                  <div>
                    {item.status === 'Passed' ? (
                      <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full text-sm border border-green-200">
                        <CheckSquare size={16} /> Passed
                      </span>
                    ) : (
                      <span className="text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-full text-sm border border-amber-200 cursor-pointer hover:bg-amber-100">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
