import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export default async function MobileAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');
  
  const userRole = (session.user as any).role;
  if (userRole !== 'Admin' && userRole !== 'Super Admin') {
    redirect('/dashboard');
  }

  const stats = await prisma.mobileAnalytics.groupBy({
    by: ['metric_name', 'platform'],
    _sum: { value: true },
  });

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-2">Mobile Analytics</h1>
      <p className="text-gray-500 mb-8">PWA & Capacitor native wrapper telemtry data.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-center items-center">
          <div className="text-sm font-medium text-gray-500 mb-1">Total PWA Installs</div>
          <div className="text-3xl font-bold text-blue-600">
            {stats.find(s => s.metric_name === 'PWA Install')?._sum.value || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-center items-center">
          <div className="text-sm font-medium text-gray-500 mb-1">Android Sessions</div>
          <div className="text-3xl font-bold text-green-600">
            {stats.filter(s => s.metric_name === 'App Session' && s.platform === 'Android').reduce((acc, curr) => acc + (curr._sum.value || 0), 0)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-center items-center">
          <div className="text-sm font-medium text-gray-500 mb-1">iOS Sessions</div>
          <div className="text-3xl font-bold text-gray-800">
            {stats.filter(s => s.metric_name === 'App Session' && s.platform === 'iOS').reduce((acc, curr) => acc + (curr._sum.value || 0), 0)}
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 text-blue-800 p-4 rounded text-sm mb-4">
        <strong>Note:</strong> Real analytics tracking is pending Phase 16 production release. These metrics are populated via mock events for UI validation.
      </div>
    </div>
  );
}
