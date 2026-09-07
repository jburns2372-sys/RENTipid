"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ListingEditFormProps {
  listing: {
    id: string;
    title: string;
    description: string | null;
    category_id: string;
    location: string;
    city: string;
    province: string;
    country: string;
    rental_type: string;
    condition: string;
    daily_rate: number | null;
    security_deposit: number | null;
    replacement_value: number | null;
  };
  categories: Array<{ id: string; name: string }>;
}

export default function ListingEditForm({ listing, categories }: ListingEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: listing.title || '',
    description: listing.description || '',
    category_id: listing.category_id || '',
    condition: listing.condition || 'Good',
    rental_type: listing.rental_type || 'Daily',
    daily_rate: listing.daily_rate !== null ? String(listing.daily_rate) : '',
    security_deposit: listing.security_deposit !== null ? String(listing.security_deposit) : '',
    replacement_value: listing.replacement_value !== null ? String(listing.replacement_value) : '',
    location: listing.location || '',
    city: listing.city || '',
    province: listing.province || '',
    country: listing.country || 'Philippines',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push(`/dashboard/provider/listings/${listing.id}`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({ message: 'Failed to update listing' }));
        setError(data.message || 'Failed to update listing');
      }
    } catch {
      setError('An unexpected error occurred while updating the listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Listing Title *</label>
        <input
          required
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Description *</label>
        <textarea
          required
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Category *</label>
          <select
            required
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
          >
            <option value="">Select Category...</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Condition</label>
          <select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
          >
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Used">Used</option>
          </select>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-base font-semibold mb-3 text-gray-900">Pricing & Rental Terms</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Daily Rate (₱) *</label>
            <input
              required
              type="number"
              name="daily_rate"
              value={formData.daily_rate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Security Deposit (₱)</label>
            <input
              type="number"
              name="security_deposit"
              value={formData.security_deposit}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Replacement Value (₱)</label>
            <input
              type="number"
              name="replacement_value"
              value={formData.replacement_value}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-base font-semibold mb-3 text-gray-900">Location</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Street / Pickup Location *</label>
            <input
              required
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">City *</label>
              <input
                required
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Province *</label>
              <input
                required
                name="province"
                value={formData.province}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t">
        <Link
          href={`/dashboard/provider/listings/${listing.id}`}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
