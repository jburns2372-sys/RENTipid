import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { PrismaClient } from '@prisma/client';
import ListingWizard from '@/components/listings/ListingWizard';

const prisma = new PrismaClient();

export default async function NewListingPage() {
  const categories = await prisma.category.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Create New Listing</h1>
      <ListingWizard categories={categories} />
      
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
