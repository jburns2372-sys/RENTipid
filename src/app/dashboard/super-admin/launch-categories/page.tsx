import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { Layers, ShieldAlert, ToggleLeft, ToggleRight } from 'lucide-react';

export default async function LaunchCategoriesPage() {
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
          <h1 className="text-2xl font-bold text-gray-800">Category Rollout Configuration</h1>
          <p className="text-gray-500 mt-1">Determine which asset categories are publicly available during V1.</p>
        </div>
      </div>

      <div className="bg-indigo-50 p-4 rounded-lg mb-8 flex items-start gap-3 border border-indigo-100">
        <ShieldAlert size={20} className="shrink-0 mt-0.5 text-indigo-600" />
        <div>
          <p className="font-semibold text-indigo-800">Progressive Expansion</p>
          <p className="text-sm mt-1 text-indigo-700">
            For V1 Launch, highly regulated categories (Cars, Trucks, Heavy Equipment) should remain disabled or restricted to "Internal Testing Only". Keep low-risk categories (Tools, Event Equipment) Active.
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
                  {cat.requires_admin_approval && <span className="text-xs text-gray-500">• Requires Approval</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                  <input type="checkbox" className="rounded text-indigo-600 border-gray-300" defaultChecked={cat.risk_level !== 'Regulated'} />
                  Public V1
                </label>
                <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-medium transition ${cat.is_active ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {cat.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
