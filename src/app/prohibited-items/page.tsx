import React from 'react';
import { PrismaClient } from '@prisma/client';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import ClientSearch from './ClientSearch';

const prisma = new PrismaClient();

export const metadata = {
  title: 'Prohibited and Restricted Items | RENTipid',
  description: 'Catalogue of prohibited, restricted, and unsupported items and services on RENTipid.',
};

export default async function Page() {
  const policies = await prisma.prohibitedItemPolicy.findMany({
    where: { isActive: true },
    select: {
      id: true,
      policyCode: true,
      name: true,
      classification: true,
      riskLevel: true,
      summary: true,
      examples: true,
      publicGuidance: true,
    },
    orderBy: { displayOrder: 'asc' }
  });

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Prohibited & Restricted Items</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          To ensure the safety and security of our community, RENTipid strictly prohibits or restricts the listing of certain items, assets, and services. Review our policies before publishing your listing.
        </p>
      </div>

      <ClientSearch policies={policies} />

      <div className="mt-12 text-center text-sm text-gray-500">
        <p>If you have questions about whether an item is allowed, please contact Support or use the AI Assistant below.</p>
      </div>

      <AIAssistantButton context="Prohibited Items Catalogue Search" />
    </div>
  );
}
