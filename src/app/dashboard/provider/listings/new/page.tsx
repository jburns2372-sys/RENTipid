import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { PrismaClient } from '@prisma/client';
import ListingWizard from '@/components/listings/ListingWizard';
import Link from 'next/link';
import { isListingBridgeEnabled } from '@/lib/listingbridge/connectors/feature-flags';

const prisma = new PrismaClient();

export default async function NewListingPage() {
  const categories = await prisma.category.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' },
  });

  const listingBridgeEnabled = isListingBridgeEnabled();

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl space-y-8">
      {/* Listing Creation Mode Banner */}
      {listingBridgeEnabled && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              New: RENTipid ListingBridge
            </span>
            <h2 className="text-lg font-bold text-gray-900">
              Have an existing listing on another platform?
            </h2>
            <p className="text-sm text-gray-600">
              Bring your details, descriptions, and photos into RENTipid with secure review and validation.
            </p>
          </div>
          <Link
            href="/dashboard/provider/listings/import"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition shrink-0"
          >
            Import Listing →
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Create New Listing</h1>
        <p className="text-sm text-gray-600 mb-6">
          Build your rental listing manually step-by-step using our listing wizard below.
        </p>
        <ListingWizard categories={categories} />
      </div>

      <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
        <div className="mt-0.5">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-blue-900">Legal & Compliance Requirements</h3>
          <p className="text-sm text-blue-800 mt-1">
            Depending on your jurisdiction and category, certain legal requirements or permits may apply to this listing.
          </p>
          <a href="/help/trust-safety-legal/global-legal-compliance" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700 hover:text-blue-900 underline mt-2 inline-block">
            View Global Legal Compliance Register
          </a>
        </div>
      </div>

      <AIAssistantButton context="Listing Creation Wizard" />
    </div>
  );
}
