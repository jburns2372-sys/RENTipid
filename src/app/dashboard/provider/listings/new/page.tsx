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
      <AIAssistantButton context="Listing Creation Wizard" />
    </div>
  );
}
