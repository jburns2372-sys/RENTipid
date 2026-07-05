import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { Layers, ShieldAlert, ToggleLeft, ToggleRight } from 'lucide-react';

export default async function BetaCategoriesPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3 border-b pb-4">
        <Layers size={32} className="text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Beta Category Controls</h1>
          <p className="text-gray-500 mt-1">Safely restrict highly regulated categories during Beta Launch.</p>
        </div>
      </div>

      <div className="bg-indigo-50 p-4 rounded-lg mb-8 flex items-start gap-3 border border-indigo-100">
        <ShieldAlert size={20} className="shrink-0 mt-0.5 text-indigo-600" />
        <div>
          <p className="font-semibold text-indigo-800">Controlled Category Rollout</p>
          <p className="text-sm mt-1 text-indigo-700">
            For Phase 10 Beta, it is recommended to ENABLE low-risk categories (Tools, Event Equipment) and DISABLE high-risk/regulated categories (Cars, Trucks, Heavy Equipment).
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="divide-y">
          {categories.map(cat => (
            <div key={cat.id} className="p-5 flex items-center justify-between hover:bg-gray-50">
              <div>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border
                    ${cat.risk_level === 'High' || cat.risk_level === 'Regulated' ? 'bg-red-50 text-red-700 border-red-200' : 
                      cat.risk_level === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                      'bg-green-50 text-green-700 border-green-200'}`}>
                    {cat.risk_level} Risk
                  </span>
                  {cat.requires_admin_approval && <span className="text-xs text-gray-500">• Requires Admin Approval</span>}
                </div>
              </div>
              <button className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition ${cat.is_active ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                {cat.is_active ? 'Active' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
