import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Operations</h2>
        <Link href="/dashboard/admin/listings" className="mt-5 inline-flex h-10 items-center gap-2 bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">
          <ClipboardCheck size={17} aria-hidden="true" /> Listing Review Queue
        </Link>
      </div>
      
      <AIAssistantButton context="Admin Dashboard" />
    </div>
  );
}
