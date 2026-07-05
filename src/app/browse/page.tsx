import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function BrowsePage({ searchParams }: { searchParams: { category?: string } }) {
  const categoryFilter = searchParams.category;

  const whereClause: any = { status: 'Published' };
  if (categoryFilter) {
    whereClause.category = { slug: categoryFilter };
  }

  const listings = await prisma.listing.findMany({
    where: whereClause,
    include: { category: true, photos: { where: { is_cover: true } }, provider: true },
    orderBy: { published_at: 'desc' }
  });

  const categories = await prisma.category.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">Browse Rentals</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4">Categories</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/browse" className={`block py-1 hover:text-blue-600 ${!categoryFilter ? 'font-semibold text-blue-600' : 'text-gray-600'}`}>
                  All Categories
                </Link>
              </li>
              {categories.map(c => (
                <li key={c.id}>
                  <Link href={`/browse?category=${c.slug}`} className={`block py-1 hover:text-blue-600 ${categoryFilter === c.slug ? 'font-semibold text-blue-600' : 'text-gray-600'}`}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
              <Link href={`/listing/${listing.id}`} key={listing.id} className="group block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                <div className="h-48 bg-gray-200 relative">
                  {listing.photos?.[0] ? (
                    <img src={listing.photos[0].file_path} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-gray-800">
                    {listing.category.name}
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex justify-between">
                    <span>{listing.category.name}</span>
                    {listing.provider.status === 'Verified' && (
                      <span className="text-blue-600 flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Verified Provider</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 flex-1">{listing.title}</h3>
                  <p className="text-gray-500 text-sm mb-2 truncate">{listing.location}, {listing.city}</p>
                  <div className="flex items-end mt-4">
                    <span className="text-xl font-bold text-gray-900">₱{listing.daily_rate?.toLocaleString() || 'N/A'}</span>
                    <span className="text-gray-500 text-sm ml-1 mb-1">/ day</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {listings.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed">
              <p className="text-gray-500 text-lg">No rentals found matching your criteria.</p>
            </div>
          )}
        </main>
      </div>
      
      <AIAssistantButton context="Browse Marketplace" />
    </div>
  );
}
