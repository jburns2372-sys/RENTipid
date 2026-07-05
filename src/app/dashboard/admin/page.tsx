import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Platform Overview</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed">
          <span className="text-gray-400">Admin features pending Phase 3</span>
        </div>
      </div>
      
      <AIAssistantButton context="Admin Dashboard" />
    </div>
  );
}
