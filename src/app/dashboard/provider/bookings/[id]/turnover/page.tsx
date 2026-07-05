"use client";

import React, { useState, useEffect, Suspense } from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function TurnoverForm({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') || 'release'; // 'release' or 'return'
  
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(p => setBookingId(p.id));
  }, [params]);

  const isRelease = typeParam === 'release';
  const title = isRelease ? 'Confirm Item Release' : 'Confirm Item Return';
  const turnoverType = isRelease ? 'Release to Renter' : 'Return to Provider';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('turnover_type', turnoverType);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/turnover`, {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        router.push(`/dashboard/provider/bookings/${bookingId}`);
      } else {
        const data = await res.json();
        alert(data.message || 'Error processing turnover');
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
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <div className="mb-6">
        <Link href={`/dashboard/provider/bookings/${bookingId}`} className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Booking
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-gray-500">Record the exact time and location of the asset handover.</p>
        </div>
        <AIAssistantButton context="Turnover Verification Bot" />
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Method *</label>
            <select name="pickup_or_delivery" required className="w-full border p-2 rounded text-sm">
              <option value="Pickup">Pickup</option>
              <option value="Delivery">Delivery</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Location *</label>
            <input type="text" name="turnover_location" required placeholder="e.g. Main Lobby, 123 Main St" className="w-full border p-2 rounded text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{isRelease ? 'Handed Over By' : 'Received By'} *</label>
            <input type="text" name="person_name" required placeholder="e.g. John Doe (Provider)" className="w-full border p-2 rounded text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Confirmation Notes (Optional)</label>
          <textarea name="confirmation_notes" placeholder="Any final remarks about the handover..." className="w-full border p-3 rounded text-sm h-20"></textarea>
        </div>

        <div className="pt-4 border-t">
          <button type="submit" disabled={loading} className={`w-full text-white font-bold py-3 px-8 rounded-xl transition disabled:opacity-50 ${isRelease ? 'bg-purple-600 hover:bg-purple-700' : 'bg-teal-600 hover:bg-teal-700'}`}>
            {loading ? 'Processing...' : isRelease ? 'Confirm Release to Renter' : 'Confirm Return to Provider'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProviderTurnoverPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <TurnoverForm params={params} />
    </Suspense>
  );
}
