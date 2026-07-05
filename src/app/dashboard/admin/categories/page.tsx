import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Category Rules Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          Add New Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="p-4 font-medium">Category Name</th>
                <th className="p-4 font-medium">Risk Level</th>
                <th className="p-4 font-medium">Requires Approval</th>
                <th className="p-4 font-medium">Requires Deposit</th>
                <th className="p-4 font-medium">Requires Permit</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{category.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${category.risk_level === 'Low' ? 'bg-green-100 text-green-800' : 
                        category.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                        category.risk_level === 'High' ? 'bg-orange-100 text-orange-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {category.risk_level}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {category.requires_admin_approval ? 'Yes' : 'No'}
                  </td>
                  <td className="p-4 text-gray-600">
                    {category.requires_deposit ? 'Yes' : 'No'}
                  </td>
                  <td className="p-4 text-gray-600">
                    {category.requires_permit ? 'Yes' : 'No'}
                  </td>
                  <td className="p-4">
                    <button className="text-blue-600 hover:underline font-medium">Edit Rules</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <AIAssistantButton context="Category Rules Management" />
    </div>
  );
}
