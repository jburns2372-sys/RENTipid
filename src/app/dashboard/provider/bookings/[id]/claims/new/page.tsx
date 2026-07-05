"use client";

import React, { useState, useEffect } from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewDamageClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(p => setBookingId(p.id));
  }, [params]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/claims`, {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        router.push(`/dashboard/provider/bookings/${bookingId}`);
      } else {
        const data = await res.json();
        alert(data.message || 'Error submitting claim');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
      setLoading(false);
    }
  };

  if (!bookingId) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href={`/dashboard/provider/bookings/${bookingId}`} className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Booking
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-red-600">File a Damage Claim</h1>
          <p className="text-gray-500">Report an issue to deduct from the renter's security deposit.</p>
        </div>
        <AIAssistantButton context="Damage Evidence Bot" />
      </div>

      <div className="bg-yellow-50 text-yellow-800 p-4 rounded border border-yellow-200 font-medium mb-8">
        Important: Submitting this claim will immediately hold the renter's deposit and put the booking in a "Disputed" state. The renter will have a chance to respond before an admin reviews it.
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Claim Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Claim Type *</label>
              <select name="claim_type" required className="w-full border p-2 rounded text-sm mb-4">
                <option value="Damage">Damage</option>
                <option value="Missing Item">Missing Item</option>
                <option value="Late Return">Late Return</option>
                <option value="Cleaning Fee">Cleaning Fee</option>
                <option value="Excess Usage">Excess Usage</option>
                <option value="Other">Other</option>
              </select>

              <label className="block text-sm font-bold text-gray-700 mb-1">Requested Deduction (₱) *</label>
              <input type="number" step="0.01" min="0" name="requested_deduction_amount" required placeholder="Amount to deduct from deposit" className="w-full border p-2 rounded text-sm mb-4" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Detailed Description *</label>
              <textarea name="claim_description" required placeholder="Describe what happened and why you are charging this amount..." className="w-full border p-3 rounded text-sm h-32"></textarea>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Evidence Photos</h2>
          <p className="text-xs text-gray-500 mb-4">Please upload clear evidence of the damage. We will automatically link your Pre-Rental and Post-Rental inspection photos for the admin's reference.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Evidence Photo 1 *</label>
              <input type="file" name="photo_1" accept="image/*" required className="w-full text-xs mb-2" />
              <input type="text" name="caption_1" placeholder="Caption (e.g. deep scratch)" className="w-full border p-1 rounded text-xs" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Evidence Photo 2 (Optional)</label>
              <input type="file" name="photo_2" accept="image/*" className="w-full text-xs mb-2" />
              <input type="text" name="caption_2" placeholder="Caption" className="w-full border p-1 rounded text-xs" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Evidence Photo 3 (Optional)</label>
              <input type="file" name="photo_3" accept="image/*" className="w-full text-xs mb-2" />
              <input type="text" name="caption_3" placeholder="Caption" className="w-full border p-1 rounded text-xs" />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Link href={`/dashboard/provider/bookings/${bookingId}`} className="bg-white border border-gray-300 text-gray-700 font-bold py-3 px-8 rounded-xl hover:bg-gray-50 transition">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="bg-red-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-700 transition disabled:opacity-50">
            {loading ? 'Submitting Claim...' : 'Submit Claim & Hold Deposit'}
          </button>
        </div>
      </form>
    </div>
  );
}
