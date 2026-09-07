import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import ListingEditForm from '@/components/listings/ListingEditForm';

const prisma = new PrismaClient();

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.status !== 'Verified') {
    redirect('/dashboard/provider/listings');
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
  });

  if (!listing || listing.provider_id !== user.id) {
    notFound();
  }

  // Only drafts and rejected listings can be edited
  if (listing.status !== 'Draft' && listing.status !== 'Rejected') {
    redirect(`/dashboard/provider/listings/${listing.id}`);
  }

  const categories = await prisma.category.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Listing Details</h1>
        <p className="text-sm text-gray-600 mt-1">
          Update your listing information, pricing, or category before submitting for review.
        </p>
      </div>

      <ListingEditForm
        listing={{
          id: listing.id,
          title: listing.title,
          description: listing.description,
          category_id: listing.category_id,
          location: listing.location || '',
          city: listing.city || '',
          province: listing.province || '',
          country: listing.country || 'Philippines',
          rental_type: listing.rental_type || 'Daily',
          condition: listing.condition || 'Good',
          daily_rate: listing.daily_rate !== null ? Number(listing.daily_rate) : null,
          security_deposit: listing.security_deposit !== null ? Number(listing.security_deposit) : null,
          replacement_value: listing.replacement_value !== null ? Number(listing.replacement_value) : null,
        }}
        categories={categories}
      />
    </div>
  );
}
