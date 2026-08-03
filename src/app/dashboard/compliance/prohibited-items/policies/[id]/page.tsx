import React from 'react';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { requireSecurityPermission } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function PolicyEditorPage({ params }: { params: { id: string } }) {
  await requireSecurityPermission(SECURITY_PERMISSIONS.PROHIBITED_ITEMS_MANAGE_POLICY);

  const isNew = params.id === 'new';
  let policy: any = null;

  if (!isNew) {
    policy = await prisma.prohibitedItemPolicy.findUnique({
      where: { id: params.id }
    });
    if (!policy) notFound();
  }

  // Next.js Server Action placeholder - to be implemented in Phase 6/7 for full form submission,
  // currently providing structural scaffolding.
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard/compliance/prohibited-items/policies" className="hover:text-blue-600">Policy Catalogue</Link>
        <span>&rsaquo;</span>
        <span className="font-medium text-gray-900">{isNew ? 'New Policy' : policy?.policyCode}</span>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{isNew ? 'Create Policy' : 'Edit Policy'}</h2>
      </div>

      <form className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Policy Code</label>
            <input type="text" defaultValue={policy?.policyCode} className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. PI-001" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Policy Name</label>
            <input type="text" defaultValue={policy?.name} className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Firearms & Ammunition" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Classification</label>
            <select defaultValue={policy?.classification || 'PROHIBITED'} className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500">
              <option value="PROHIBITED">PROHIBITED (Strict ban)</option>
              <option value="RESTRICTED">RESTRICTED (Allowed with limits)</option>
              <option value="UNSUPPORTED">UNSUPPORTED (Platform limitation)</option>
              <option value="ALLOWED">ALLOWED (Safe list)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Risk Level</label>
            <select defaultValue={policy?.riskLevel || 'CRITICAL'} className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500">
              <option value="CRITICAL">CRITICAL (Immediate Takedown & Ban)</option>
              <option value="HIGH">HIGH (Takedown & Warning)</option>
              <option value="MEDIUM">MEDIUM (Shadowban / Pending Review)</option>
              <option value="LOW">LOW (Informational)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">Summary</label>
          <textarea defaultValue={policy?.summary} rows={2} className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Brief description of the policy" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">Full Description</label>
          <textarea defaultValue={policy?.fullDescription} rows={4} className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Detailed policy guidelines..." />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">Examples</label>
          <textarea defaultValue={policy?.examples} rows={3} className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Handguns, rifles, bullets" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Prohibited Keywords (Comma separated)</label>
            <textarea defaultValue={policy?.prohibitedKeywords} rows={2} className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-sm font-mono text-xs focus:ring-blue-500 focus:border-blue-500" placeholder="pistol, gun, rifle" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Review Keywords (Comma separated)</label>
            <textarea defaultValue={policy?.reviewKeywords} rows={2} className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-sm font-mono text-xs focus:ring-blue-500 focus:border-blue-500" placeholder="weapon, tactical" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Exclusions</label>
            <textarea defaultValue={policy?.exclusions} rows={2} className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Toy guns clearly marked with orange tips" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Enforcement Action</label>
            <input type="text" defaultValue={policy?.enforcementAction} className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. TAKEDOWN" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Regulator (Optional)</label>
            <input type="text" defaultValue={policy?.regulator || ''} className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. PNP-FEO" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Legal Reference (Optional)</label>
            <input type="text" defaultValue={policy?.legalReference || ''} className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. RA 10591" />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 flex justify-end space-x-3">
          <Link href="/dashboard/compliance/prohibited-items/policies" className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm">
            Cancel
          </Link>
          <button type="button" className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            {isNew ? 'Create Policy' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
